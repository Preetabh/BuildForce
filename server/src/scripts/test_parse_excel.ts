import * as XLSX from 'xlsx';
import path from 'path';

const filePath = 'G:/civil_guruji/server/uploads/sor_temp/sor_79f4423c-f97a-4f6a-b96f-415b067f35eb.xlsx';
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets['CPWD SOR 2023 (2)'];
const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });

console.log('Total raw rows in sheet:', rows.length);

// Find header row
let headerIdx = -1;
for (let i = 0; i < 15 && i < rows.length; i++) {
  const r = rows[i];
  if (r && r.some((c: any) => String(c).includes('SR No') || String(c).includes('Description'))) {
    headerIdx = i;
    console.log(`Found header at row ${i + 1}:`, r);
    break;
  }
}

const dataRows: any[] = [];
const seenCodes = new Map<string, number>();
const duplicates: any[] = [];

for (let i = headerIdx + 1; i < rows.length; i++) {
  const r = rows[i];
  if (!r || r.length === 0) continue;
  
  const sNo = r[0];
  const srNo = r[1] !== undefined && r[1] !== null ? String(r[1]).trim() : '';
  const desc = r[2] !== undefined && r[2] !== null ? String(r[2]).trim() : '';
  const unit = r[3] !== undefined && r[3] !== null ? String(r[3]).trim() : '';
  const rateRaw = r[4];
  const type = r[5] !== undefined && r[5] !== null ? String(r[5]).trim() : '';

  // Check if it's a valid data row (must have srNo or desc or sNo)
  if (!srNo && !desc && !sNo) continue;
  // Skip if it's a header repetition
  if (String(sNo).toLowerCase() === 's.no' || srNo.toLowerCase() === 'sr no.' || srNo.toLowerCase() === 'sr no') continue;

  let rate = 0;
  if (typeof rateRaw === 'number') {
    rate = rateRaw;
  } else if (rateRaw !== undefined && rateRaw !== null && String(rateRaw).trim() !== '') {
    const parsed = parseFloat(String(rateRaw).replace(/,/g, '').trim());
    if (!isNaN(parsed)) rate = parsed;
  }

  const itemObj = {
    srNoSeq: sNo,
    itemCode: srNo,
    description: desc,
    unit,
    rate,
    type,
    rowNum: i + 1,
  };

  dataRows.push(itemObj);

  if (srNo) {
    if (seenCodes.has(srNo)) {
      duplicates.push({ srNo, prevRow: seenCodes.get(srNo), currRow: i + 1, desc: desc.slice(0, 30) });
    } else {
      seenCodes.set(srNo, i + 1);
    }
  }
}

console.log('Total valid data rows parsed:', dataRows.length);
console.log('Duplicates in SR No.:', duplicates.length);
if (duplicates.length > 0) {
  console.log('Sample duplicates:', duplicates.slice(0, 10));
}

console.log('\nFirst 5 parsed items:');
console.log(dataRows.slice(0, 5));

console.log('\nLast 5 parsed items:');
console.log(dataRows.slice(-5));

// Check specific test items 2.1.1 and 2.2.1
const item211 = dataRows.find((d) => d.itemCode === '2.1.1');
console.log('\nSearch 2.1.1:', item211);
const item221 = dataRows.find((d) => d.itemCode === '2.2.1');
console.log('Search 2.2.1:', item221);
