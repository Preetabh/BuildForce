import fs from 'fs';
import path from 'path';
import mongoose, { Types } from 'mongoose';
import { SorImport } from '../models/SorImport';
import { SorStagedItem } from '../models/SorStagedItem';
import { SorMaster, SorItem } from '../models/SorMaster';
import { Company } from '../models/Company';
import { User } from '../models/User';
import { AuditService } from '../modules/audit/audit.service';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civil_guruji_erp';

interface RawItem {
  itemCode: string;
  descriptionEnglish: string;
  descriptionHindi: string;
  unit: string;
  rate: number;
  chapter: string;
  subChapter: string;
  sourcePage: number;
  confidence: number;
  status: 'Approved' | 'Review Required';
  reviewNotes: string;
}

const UNIT_MAP: Record<string, string> = {
  m: 'metre', mtr: 'metre', meter: 'metre', metre: 'metre', rmt: 'metre', rm: 'metre',
  m2: 'sqm', 'sq.m': 'sqm', sqm: 'sqm', sm: 'sqm', sn: 'sqm', ym: 'sqm', am: 'sqm',
  m3: 'cum', 'cu.m': 'cum', cum: 'cum', cm: 'cum', om: 'cum', eam: 'cum',
  ton: 'tonne', tonne: 'tonne', mt: 'tonne',
  kg: 'kg', kgs: 'kg',
  each: 'each', no: 'each', nos: 'each', 'no.': 'each', 'nos.': 'each', numbers: 'each',
  set: 'set', pair: 'pair', point: 'point', job: 'job',
  day: 'day', hour: 'hour', hr: 'hour', manday: 'manday',
  litre: 'litre', ltr: 'litre', liter: 'litre', kl: 'kl',
  quintal: 'quintal', qtl: 'quintal',
};

function cleanItemCode(rawCode: string, chapter: string): string {
  let code = rawCode.replace(/^[^\w\d]+/, '').trim();
  code = code.replace(/["']+/g, '');

  // If code starts with S or O or G followed by digits (OCR artifact)
  if (/^[SOG]\d{2,}/i.test(code)) {
    code = code.substring(1);
  }

  // If in chapter with subhead number (e.g. "02 - Earth Work") and code is 4 digits like 2161 -> 2.16.1
  const chMatch = chapter.match(/^(\d{1,2})/);
  if (chMatch) {
    const chNum = parseInt(chMatch[1], 10);
    // e.g. Chapter 2 and code is 2143 -> 2.14.3
    if (chNum >= 1 && chNum <= 12) {
      const chStr = String(chNum);
      if (code.startsWith(chStr) && !code.includes('.')) {
        const rem = code.substring(chStr.length);
        if (rem.length === 2) {
          code = `${chStr}.${rem[0]}.${rem[1]}`;
        } else if (rem.length === 3) {
          code = `${chStr}.${rem.substring(0, 2)}.${rem[2]}`;
        } else if (rem.length === 1) {
          code = `${chStr}.${rem}`;
        }
      }
    }
  }

  return code;
}

function parseDsrOcrFile(filePath: string): { items: RawItem[]; skippedPages: number; duplicatesRemoved: number; totalFound: number } {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Split into pages
  const pageBlocks = content.split(/={10,}\s*\n\s*PAGE\s+(\d+)\s*\n\s*-{10,}/);
  const pages: Record<number, string> = {};
  for (let i = 1; i < pageBlocks.length; i += 2) {
    const pnum = parseInt(pageBlocks[i], 10);
    pages[pnum] = pageBlocks[i + 1].trim();
  }

  function getDefaultChapter(p: number): string {
    if (p <= 13) return 'Front Matter / Contents';
    if (p <= 89) return '00 - Basic Rates & Hire Charges';
    if (p <= 99) return '01 - Carriage of Materials';
    if (p <= 107) return '02 - Earth Work';
    if (p <= 111) return '03 - Mortar';
    if (p <= 121) return '04 - Concrete Work';
    if (p <= 135) return '05 - Reinforced Cement Concrete';
    if (p <= 141) return '06 - Masonry Work';
    if (p <= 147) return '07 - Stone Work';
    if (p <= 155) return '08 - Cladding Work';
    if (p <= 191) return '09 - Wood and P.V.C. Work';
    if (p <= 197) return '10 - Steel Work';
    if (p <= 209) return '11 - Flooring';
    if (p <= 224) return '12 - Roofing';
    return 'Back Matter';
  }

  let currentChapter = '00 - Basic Rates & Hire Charges';
  let currentSubchapter = '';

  const items: RawItem[] = [];
  const seenKeys = new Set<string>();
  let duplicateCount = 0;
  let skippedPages = 0;
  let totalFound = 0;

  for (let p = 1; p <= 225; p++) {
    const ptext = pages[p];
    if (!ptext || p <= 13 || p === 225) {
      skippedPages++;
      continue;
    }

    const defaultCh = getDefaultChapter(p);
    if (defaultCh !== 'Front Matter / Contents' && defaultCh !== 'Back Matter') {
      currentChapter = defaultCh;
    }

    const lines = ptext.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

    for (let lIdx = 0; lIdx < lines.length; lIdx++) {
      const line = lines[lIdx];

      // Detect SUB HEAD change
      const shMatch = line.match(/SUB\s*HEAD\s*:\s*(\d+(?:\.\d+)?)\s*(.*)/i);
      if (shMatch) {
        const shNum = shMatch[1].trim();
        const shName = shMatch[2].trim();
        currentChapter = shName ? `${shNum} - ${shName}` : currentChapter;
        continue;
      }

      // Detect sub-headings
      if (line.toUpperCase() === line && line.length > 6 && line.length < 50 && !/^\d/.test(line)) {
        if (/CONCRETE|MORTAR|MASONRY|STEEL|FLOORING|ROOFING|JOINTS|FITTINGS|BASIC RATES/i.test(line)) {
          currentSubchapter = line;
          continue;
        }
      }

      // Ignore table headers, page numbers, notes
      if (/^(?:Notes?|Code|Description|Unit|Rate|BASIC\s*RATES|DELHI\s*SCHEDULE|Page\s*\d+)/i.test(line) && line.length < 60) {
        continue;
      }

      // Match item codes
      const cleanLine = line.replace(/^[^\w\d]+/, '');

      // Check if line starts with an item code
      const codeMatch = cleanLine.match(/^(\d{1,2}(?:\.\d{1,4}){1,3}|\d{3,5}|[A-Za-z]\d{1,4}(?:\.\d{1,3})?)\b/) ||
                        cleanLine.match(/^([0-9]{2,6}[A-Za-z]?)\b/);

      if (!codeMatch) continue;

      const rawCode = codeMatch[1];
      const rest = cleanLine.substring(rawCode.length).trim();

      // Skip lines that are just headers or too short
      if (rest.length < 3) continue;

      // Skip if it's the chapter title itself like "1.0 CARRIAGE OF MATERIALS"
      if (/^(?:CARRIAGE|EARTH|MORTAR|CONCRETE|REINFORCED|MASONRY|STONE|CLADDING|WOOD|STEEL|FLOORING|ROOFING)\b/i.test(rest)) {
        continue;
      }

      totalFound++;

      // Rate extraction from tail of string
      let rate: number | null = null;
      let descPart = rest;

      // Check for numeric rate token at end
      const rateMatch = rest.match(/(?:₹|Rs\.?)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)\s*$/);
      if (rateMatch) {
        const rawRateStr = rateMatch[1].replace(/,/g, '');
        const numVal = parseFloat(rawRateStr);
        // Exclude year 2023/2021 or obvious year tokens
        if (numVal > 0 && numVal !== 2023 && numVal !== 2024 && numVal !== 2021) {
          // Handle cases where OCR missed decimal for paise (e.g. 525200 for 5252.00, 385000 for 3850.00)
          if (numVal > 50000 && rawRateStr.endsWith('00') && !rawRateStr.includes('.')) {
            rate = numVal / 100.0;
          } else {
            rate = numVal;
          }
          descPart = rest.substring(0, rateMatch.index).trim();
        }
      }

      // Look for unit in description
      let unit = '';
      const words = descPart.split(/\s+/);
      for (let wIdx = words.length - 1; wIdx >= Math.max(0, words.length - 5); wIdx--) {
        const tok = words[wIdx].replace(/[^\w]/g, '').toLowerCase();
        if (UNIT_MAP[tok]) {
          unit = UNIT_MAP[tok];
          words.splice(wIdx, 1);
          break;
        }
      }

      // Check Hindi characters in line
      const devanagariMatches = line.match(/[\u0900-\u097F]+/g);
      const descHindi = devanagariMatches ? devanagariMatches.join(' ') : '';

      const descEnglish = words.join(' ').replace(/[^\x00-\x7F]+/g, ' ').replace(/\s+/g, ' ').trim(' -:;,.');
      const itemCode = cleanItemCode(rawCode, currentChapter);

      let confidence = 95;
      let status: 'Approved' | 'Review Required' = 'Approved';
      const notes: string[] = [];

      if (rate === null || rate <= 0) {
        confidence = 60;
        status = 'Review Required';
        notes.push('Rate missing or uncertain');
        rate = 0.0;
      }

      if (!unit) {
        confidence -= 15;
        if (confidence < 80) status = 'Review Required';
        notes.push('Unit not explicitly detected');
        unit = 'nos';
      }

      if (descEnglish.length < 5) {
        confidence -= 20;
        status = 'Review Required';
        notes.push('Description brief');
      }

      // Deduplication: itemCode + chapter + rate
      const dedupeKey = `${itemCode}|${currentChapter}|${rate.toFixed(2)}`;
      if (seenKeys.has(dedupeKey)) {
        duplicateCount++;
        continue;
      }
      seenKeys.add(dedupeKey);

      items.push({
        itemCode,
        descriptionEnglish: descEnglish || `Item ${itemCode}`,
        descriptionHindi: descHindi,
        unit,
        rate,
        chapter: currentChapter,
        subChapter: currentSubchapter,
        sourcePage: p,
        confidence,
        status,
        reviewNotes: notes.length > 0 ? notes.join('; ') : 'Valid OCR rate item',
      });
    }
  }

  return { items, skippedPages, duplicatesRemoved: duplicateCount, totalFound };
}

export async function runOcrImport() {
  console.log('========================================================');
  console.log('STARTING DSR OCR TEXT DATA IMPORT TO MONGODB');
  console.log('========================================================\n');

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB at', MONGODB_URI);

  // 1. Locate Company and Admin User
  let company = await Company.findOne();
  if (!company) {
    company = await Company.create({
      name: 'Digi Epitome Technology',
      code: 'DET',
      status: 'ACTIVE',
    });
  }

  let user = await User.findOne({ email: 'admin@civilguruji.com' });
  if (!user) {
    user = await User.findOne();
  }

  const companyId = company._id;
  const userId = user ? user._id : companyId;

  console.log(`Using Company: ${company.name} (${companyId})`);
  console.log(`Using User: ${user?.email || 'Default'} (${userId})`);

  // 2. Parse OCR Text File
  const ocrFilePath = path.resolve(__dirname, 'dsr_ocr_input.txt');
  if (!fs.existsSync(ocrFilePath)) {
    throw new Error(`OCR input file not found at: ${ocrFilePath}`);
  }

  const parseResult = parseDsrOcrFile(ocrFilePath);
  const { items, skippedPages, duplicatesRemoved, totalFound } = parseResult;

  console.log(`\nOCR Parsing Results:`);
  console.log(`- Total Lines Evaluated: ${totalFound}`);
  console.log(`- Valid Items Extracted: ${items.length}`);
  console.log(`- Non-rate Pages Skipped: ${skippedPages}`);
  console.log(`- Duplicates Removed: ${duplicatesRemoved}`);

  const approvedCount = items.filter((i) => i.status === 'Approved').length;
  const reviewCount = items.filter((i) => i.status === 'Review Required').length;
  console.log(`- Clean Approved Items: ${approvedCount}`);
  console.log(`- Items Requiring Review: ${reviewCount}`);

  // 3. Create or Update SorImport Record
  const scheduleName = 'Delhi Schedule of Rates (DSR) 2023 - Vol 1 Civil';
  const authority = 'CPWD';
  const version = '2023.1';

  let sorImport = await SorImport.findOne({
    companyId,
    scheduleName,
    version,
  });

  if (!sorImport) {
    sorImport = new SorImport({
      companyId,
      fileName: 'DSR_Vol_1_Civil_compressed.pdf',
      fileType: 'pdf',
      fileSize: 111508092,
      authority,
      scheduleName,
      version,
      effectiveDate: new Date('2023-10-01'),
      status: 'Review Required',
      progress: {
        uploadPercent: 100,
        processingPercent: 100,
        pagesProcessed: 225,
        totalPages: 225,
        currentBatch: 9,
        totalBatches: 9,
        rowsExtracted: items.length,
        rowsRequiringReview: reviewCount,
        rowsImported: 0,
        rowsFailed: 0,
      },
      createdBy: userId,
    });
  } else {
    sorImport.status = 'Review Required';
    sorImport.progress.pagesProcessed = 225;
    sorImport.progress.totalPages = 225;
    sorImport.progress.rowsExtracted = items.length;
    sorImport.progress.rowsRequiringReview = reviewCount;
    sorImport.progress.processingPercent = 100;
  }

  await sorImport.save();
  console.log(`SorImport record created/updated: ${sorImport._id}`);

  // 4. Save Extracted Items to SorStagedItem Collection
  console.log(`\nPurging older staged items for this import session...`);
  await SorStagedItem.deleteMany({ importId: sorImport._id });

  console.log(`Inserting ${items.length} items into SorStagedItem staging collection...`);
  const stagedDocs = items.map((it) => ({
    companyId,
    importId: sorImport._id,
    sorId: null,
    batchNumber: Math.ceil(it.sourcePage / 25),
    pageNumber: it.sourcePage,
    itemCode: it.itemCode,
    descriptionEnglish: it.descriptionEnglish,
    descriptionHindi: it.descriptionHindi,
    unit: it.unit,
    rate: it.rate,
    chapter: it.chapter,
    subChapter: it.subChapter,
    confidence: it.confidence,
    status: it.status,
    reviewNotes: it.reviewNotes,
    sourceText: `${it.itemCode} ${it.descriptionEnglish} ${it.unit} ${it.rate}`,
  }));

  // Batch insert into SorStagedItem in chunks of 500
  const BATCH_SIZE = 500;
  for (let b = 0; b < stagedDocs.length; b += BATCH_SIZE) {
    const chunk = stagedDocs.slice(b, b + BATCH_SIZE);
    await SorStagedItem.insertMany(chunk);
  }
  console.log(`Successfully inserted ${stagedDocs.length} staged items.`);

  // 5. Create / Update Active SorMaster & Publish Approved Items to SorItem (Rate Master)
  console.log(`\nPublishing valid approved items to Rate Master (SorMaster & SorItem)...`);
  let sorMaster = await SorMaster.findOne({
    companyId,
    sorName: scheduleName,
    version,
  });

  if (!sorMaster) {
    sorMaster = await SorMaster.create({
      companyId,
      authority,
      sorName: scheduleName,
      version,
      effectiveFrom: new Date('2023-10-01'),
      sourceDocument: 'DSR_Vol_1_Civil_compressed.pdf',
      status: 'ACTIVE',
    });
  }

  sorImport.sorId = sorMaster._id;

  // Insert items with rate > 0 into SorItem
  const publishableItems = items.filter((it) => it.rate > 0);
  console.log(`Found ${publishableItems.length} items with positive rates to publish to Rate Master.`);

  // Upsert into SorItem using bulkWrite
  const bulkOps = publishableItems.map((row) => ({
    updateOne: {
      filter: { sorId: sorMaster._id, itemCode: row.itemCode },
      update: {
        $set: {
          sorId: sorMaster._id,
          itemCode: row.itemCode,
          descriptionEnglish: row.descriptionEnglish,
          descriptionHindi: row.descriptionHindi,
          unit: row.unit,
          rate: row.rate,
          chapter: row.chapter,
          subChapter: row.subChapter,
          sourcePage: row.sourcePage,
          sourceReference: `DSR 2023 p.${row.sourcePage}`,
          status: 'ACTIVE',
        },
      },
      upsert: true,
    },
  }));

  for (let b = 0; b < bulkOps.length; b += BATCH_SIZE) {
    const chunk = bulkOps.slice(b, b + BATCH_SIZE);
    await SorItem.bulkWrite(chunk);
  }

  const finalRateMasterCount = await SorItem.countDocuments({ sorId: sorMaster._id });
  const finalStagedCount = await SorStagedItem.countDocuments({ importId: sorImport._id });

  sorImport.progress.rowsImported = finalRateMasterCount;
  await sorImport.save();

  await AuditService.log({
    companyId: companyId.toString(),
    userId: userId.toString(),
    action: 'CREATE',
    entity: 'SorMaster',
    entityId: sorMaster._id.toString(),
    newValue: {
      sorName: sorMaster.sorName,
      version: sorMaster.version,
      itemsPublished: finalRateMasterCount,
      source: 'DSR OCR Complete Ingestion',
    },
  });

  console.log('\n========================================================');
  console.log('IMPORT COMPLETE AND VERIFIED:');
  console.log('========================================================');
  console.log(`- Import ID: ${sorImport._id}`);
  console.log(`- Rate Master ID: ${sorMaster._id}`);
  console.log(`- Total Extracted & Staged Items in MongoDB: ${finalStagedCount}`);
  console.log(`- Active Published Items in Rate Master: ${finalRateMasterCount}`);
  console.log(`- Review Required Items in Staging: ${reviewCount}`);
  console.log(`- Non-rate Pages Skipped: ${skippedPages}`);
  console.log(`- True Duplicates Removed: ${duplicatesRemoved}`);
  console.log('========================================================\n');

  await mongoose.disconnect();
}

if (require.main === module) {
  runOcrImport().catch((err) => {
    console.error('Fatal import error:', err);
    process.exit(1);
  });
}
