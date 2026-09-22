import { Types } from 'mongoose';
import * as XLSX from 'xlsx';
import path from 'path';
import { Material } from '../../models/Material';
import { LabourType } from '../../models/Labour';
import { MachineryType } from '../../models/Machinery';
import { Formula } from '../../models/Formula';
import { RateList } from '../../models/RateList';
import { SorImport } from '../../models/SorImport';
import { AppError } from '../../middleware/error.middleware';

export type MasterType = 'materials' | 'manpower' | 'machinery' | 'formulas' | 'rate-lists';

export class QuantityMasterPdfService {
  /**
   * Universal file parser for PDF, Excel (.xlsx, .xls), and CSV (.csv)
   */
  public static async parseMasterFile(
    buffer: Buffer,
    fileName: string,
    type: MasterType
  ): Promise<{
    type: MasterType;
    totalDetected: number;
    validCount: number;
    items: any[];
    rawTextPreview?: string;
  }> {
    const ext = path.extname(fileName || '').toLowerCase();
    if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') {
      return this.parseExcelOrCsv(buffer, type);
    }
    return this.parsePdfMaster(buffer, type);
  }

  /**
   * Parse structured Excel or CSV workbook
   */
  public static parseExcelOrCsv(
    buffer: Buffer,
    type: MasterType
  ): {
    type: MasterType;
    totalDetected: number;
    validCount: number;
    items: any[];
    rawTextPreview?: string;
  } {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new AppError('The Excel workbook contains no sheets.', 400);
      }
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (!rawRows || rawRows.length === 0) {
        throw new AppError('The Excel sheet contains no rows or data.', 400);
      }

      let parsedItems: any[] = [];

      switch (type) {
        case 'materials':
          parsedItems = this.mapExcelMaterials(rawRows);
          break;
        case 'manpower':
          parsedItems = this.mapExcelManpower(rawRows);
          break;
        case 'machinery':
          parsedItems = this.mapExcelMachinery(rawRows);
          break;
        case 'formulas':
          parsedItems = this.mapExcelFormulas(rawRows);
          break;
        case 'rate-lists':
          parsedItems = this.mapExcelRateLists(rawRows);
          break;
        default:
          throw new AppError(`Unsupported catalog type: ${type}`, 400);
      }

      const validCount = parsedItems.filter((i) => i.isValid !== false).length;

      return {
        type,
        totalDetected: parsedItems.length,
        validCount,
        items: parsedItems,
        rawTextPreview: `Excel / CSV (${rawRows.length} rows processed)`,
      };
    } catch (err: any) {
      console.error('[QuantityMasterPdfService] Excel extraction failed:', err);
      throw new AppError(`Failed to parse Excel/CSV document: ${err.message}`, 400);
    }
  }

  /**
   * Helper: Robust multi-key field finder for Excel row objects
   */
  private static findField(row: Record<string, any>, candidates: string[]): any {
    const keys = Object.keys(row);
    for (const cand of candidates) {
      const cleanCand = cand.toLowerCase().replace(/[^a-z0-9]/g, '');
      const foundKey = keys.find(
        (k) => k.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === cleanCand
      );
      if (foundKey && row[foundKey] !== undefined && row[foundKey] !== '') {
        return row[foundKey];
      }
    }
    for (const cand of candidates) {
      const lowerCand = cand.toLowerCase();
      const foundKey = keys.find((k) => k.trim().toLowerCase().includes(lowerCand));
      if (foundKey && row[foundKey] !== undefined && row[foundKey] !== '') {
        return row[foundKey];
      }
    }
    return '';
  }

  /**
   * Map Excel rows to Materials
   */
  private static mapExcelMaterials(rows: Record<string, any>[]): any[] {
    const items: any[] = [];

    for (const row of rows) {
      const name = String(
        this.findField(row, ['material name', 'material', 'item name', 'name', 'description'])
      ).trim();
      if (!name || name.length < 2) continue;

      const category = String(this.findField(row, ['category', 'group', 'head', 'sub-head']) || 'General').trim();
      const subcategory = String(this.findField(row, ['subcategory', 'sub category', 'sub-category'])).trim();
      let code = String(this.findField(row, ['code', 'item code', 'material code', 'sr no'])).trim();
      const unit = String(this.findField(row, ['unit', 'uom', 'measurement unit']) || 'NOS').trim().toUpperCase();
      const rateRaw = this.findField(row, ['standard rate', 'rate', 'rate (₹)', 'price', 'amount']);
      const rate = typeof rateRaw === 'number' ? rateRaw : parseFloat(String(rateRaw).replace(/[₹,]/g, '')) || 0;
      const statusRaw = String(this.findField(row, ['status']) || 'ACTIVE').trim().toUpperCase();
      const status = statusRaw === 'INACTIVE' || statusRaw === 'ARCHIVED' ? statusRaw : 'ACTIVE';
      const specification = String(this.findField(row, ['specification', 'specs', 'notes'])).trim();

      if (!code) {
        const prefix = category.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'MAT');
        code = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      items.push({
        name,
        category,
        subcategory,
        code: code.toUpperCase(),
        unit,
        standardRate: rate,
        status,
        specification,
        isValid: Boolean(name && rate >= 0),
      });
    }

    return items;
  }

  /**
   * Map Excel rows to Manpower
   */
  private static mapExcelManpower(rows: Record<string, any>[]): any[] {
    const items: any[] = [];
    const validSkills = ['Skilled', 'Semi-Skilled', 'Unskilled', 'Supervisory', 'Specialist'];

    for (const row of rows) {
      const name = String(
        this.findField(row, ['role', 'designation', 'trade', 'trade / role name', 'name', 'labour'])
      ).trim();
      if (!name || name.length < 2) continue;

      const category = String(this.findField(row, ['category', 'department', 'trade']) || 'Civil Work').trim();
      const rawSkill = String(this.findField(row, ['skill level', 'skill', 'skill type', 'level'])).trim();
      const matchedSkill = validSkills.find((s) => s.toLowerCase() === rawSkill.toLowerCase());
      const skillType = matchedSkill || (name.toLowerCase().includes('helper') ? 'Unskilled' : 'Skilled');

      let code = String(this.findField(row, ['code', 'trade code', 'sr no'])).trim();
      const unit = String(this.findField(row, ['unit', 'basis']) || 'Day').trim();
      const rateRaw = this.findField(row, ['daily rate', 'rate', 'daily rate (₹)', 'wage', 'price']);
      const standardDailyRate = typeof rateRaw === 'number' ? rateRaw : parseFloat(String(rateRaw).replace(/[₹,]/g, '')) || 0;
      const statusRaw = String(this.findField(row, ['status']) || 'ACTIVE').trim().toUpperCase();
      const status = statusRaw === 'INACTIVE' || statusRaw === 'ARCHIVED' ? statusRaw : 'ACTIVE';

      if (!code) {
        code = `LAB-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      items.push({
        name,
        category,
        skillType,
        code: code.toUpperCase(),
        unit,
        standardDailyRate,
        status,
        isValid: Boolean(name && standardDailyRate >= 0),
      });
    }

    return items;
  }

  /**
   * Map Excel rows to Machinery
   */
  private static mapExcelMachinery(rows: Record<string, any>[]): any[] {
    const items: any[] = [];
    const validBasis = ['Hourly', 'Daily', 'Shift', 'Trip'];

    for (const row of rows) {
      const name = String(
        this.findField(row, ['equipment name', 'equipment', 'machinery', 'plant', 'name'])
      ).trim();
      if (!name || name.length < 2) continue;

      const category = String(this.findField(row, ['category', 'type', 'plant type']) || 'General Plant').trim();
      let code = String(this.findField(row, ['code', 'equipment code', 'sr no'])).trim();
      const unit = String(this.findField(row, ['unit']) || 'Hour').trim();
      const rawBasis = String(this.findField(row, ['billing basis', 'rate type', 'basis'])).trim();
      const matchedBasis = validBasis.find((b) => b.toLowerCase() === rawBasis.toLowerCase());
      const rateType = matchedBasis || 'Hourly';

      const rateRaw = this.findField(row, ['hourly rate', 'rate', 'rate (₹)', 'price', 'hire rate']);
      const standardHourlyRate = typeof rateRaw === 'number' ? rateRaw : parseFloat(String(rateRaw).replace(/[₹,]/g, '')) || 0;
      const statusRaw = String(this.findField(row, ['status']) || 'ACTIVE').trim().toUpperCase();
      const status = statusRaw === 'INACTIVE' || statusRaw === 'ARCHIVED' ? statusRaw : 'ACTIVE';

      if (!code) {
        code = `MAC-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      items.push({
        name,
        category,
        code: code.toUpperCase(),
        unit,
        standardHourlyRate,
        rateType,
        status,
        isValid: Boolean(name && standardHourlyRate >= 0),
      });
    }

    return items;
  }

  /**
   * Map Excel rows to Formulas
   */
  private static mapExcelFormulas(rows: Record<string, any>[]): any[] {
    const items: any[] = [];

    for (const row of rows) {
      const name = String(
        this.findField(row, ['formula name', 'work item', 'formula', 'name', 'description'])
      ).trim();
      if (!name || name.length < 2) continue;

      const category = String(this.findField(row, ['category']) || 'Civil Work').trim();
      let code = String(this.findField(row, ['code', 'formula code'])).trim();
      const unit = String(this.findField(row, ['unit']) || 'CUM').trim().toUpperCase();
      const description = String(this.findField(row, ['description', 'specification'])).trim();

      if (!code) {
        code = `FORM-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      const materialFactors: any[] = [];
      const labourFactors: any[] = [];
      const machineryFactors: any[] = [];

      // Check if text columns specify factors or default standard factors
      if (name.toLowerCase().includes('concrete') || name.toLowerCase().includes('rcc')) {
        materialFactors.push(
          { materialCode: 'MAT-CEM-001', name: 'Cement (PPC/OPC)', unit: 'BAG', factor: 8.2, wastePercent: 2 },
          { materialCode: 'MAT-SND-001', name: 'River Sand / Fine Aggregate', unit: 'CUM', factor: 0.42, wastePercent: 3 },
          { materialCode: 'MAT-AGG-001', name: 'Coarse Aggregate (20mm)', unit: 'CUM', factor: 0.84, wastePercent: 3 }
        );
        labourFactors.push(
          { labourCode: 'LAB-MAS-001', name: 'Mason (Grade 1)', unit: 'Day', factor: 0.25 },
          { labourCode: 'LAB-HLP-001', name: 'Beldar / Mazdoor', unit: 'Day', factor: 1.5 }
        );
        machineryFactors.push(
          { machineryCode: 'MAC-MIX-001', name: 'Concrete Mixer 10/7', unit: 'Hour', factor: 0.15 }
        );
      } else if (name.toLowerCase().includes('plaster')) {
        materialFactors.push(
          { materialCode: 'MAT-CEM-001', name: 'Cement', unit: 'BAG', factor: 0.12, wastePercent: 5 },
          { materialCode: 'MAT-SND-001', name: 'Fine Sand', unit: 'CUM', factor: 0.02, wastePercent: 5 }
        );
        labourFactors.push(
          { labourCode: 'LAB-MAS-001', name: 'Plaster Mason', unit: 'Day', factor: 0.08 }
        );
      }

      items.push({
        name,
        code: code.toUpperCase(),
        category,
        unit,
        description,
        materialFactors,
        labourFactors,
        machineryFactors,
        isStandard: true,
        isValid: Boolean(name && code),
      });
    }

    return items;
  }

  /**
   * Map Excel rows to Rate Lists
   */
  private static mapExcelRateLists(rows: Record<string, any>[]): any[] {
    const items: any[] = [];
    let currentListName = 'Excel Imported Rate Schedule';
    let currentListCode = `RL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const materialRates: any[] = [];
    const labourRates: any[] = [];
    const machineryRates: any[] = [];

    for (const row of rows) {
      const code = String(this.findField(row, ['item code', 'code'])).trim();
      const name = String(this.findField(row, ['item description', 'name', 'item', 'description'])).trim();
      if (!name && !code) continue;

      const unit = String(this.findField(row, ['unit']) || 'NOS').trim();
      const rateRaw = this.findField(row, ['override rate', 'rate', 'price', 'amount']);
      const rate = typeof rateRaw === 'number' ? rateRaw : parseFloat(String(rateRaw).replace(/[₹,]/g, '')) || 0;
      const typeRaw = String(this.findField(row, ['resource type', 'type'])).toLowerCase();

      const override = {
        itemId: new Types.ObjectId(),
        itemCode: code || `ITM-${Math.floor(1000 + Math.random() * 9000)}`,
        itemName: name || code,
        unit,
        rate,
      };

      if (typeRaw.includes('labour') || typeRaw.includes('manpower') || code.toLowerCase().startsWith('lab')) {
        labourRates.push(override);
      } else if (typeRaw.includes('machinery') || typeRaw.includes('plant') || code.toLowerCase().startsWith('mac')) {
        machineryRates.push(override);
      } else {
        materialRates.push(override);
      }
    }

    if (materialRates.length > 0 || labourRates.length > 0 || machineryRates.length > 0) {
      items.push({
        name: currentListName,
        code: currentListCode,
        description: `Imported from Excel with ${materialRates.length} materials, ${labourRates.length} manpower, and ${machineryRates.length} machinery rate overrides.`,
        isDefault: false,
        materialRates,
        labourRates,
        machineryRates,
        isValid: true,
      });
    }

    return items;
  }

  /**
   * Safely extract full text from a PDF Buffer
   */
  public static async extractPdfText(buffer: Buffer): Promise<string> {
    try {
      const pdfParseModule = require('pdf-parse');
      if (typeof pdfParseModule === 'function') {
        const result = await pdfParseModule(buffer);
        return result.text || '';
      }
      const PDFParseClass = pdfParseModule.PDFParse || pdfParseModule;
      const parser = new PDFParseClass({ data: buffer });
      const result = await parser.getText();
      if (typeof result === 'string') return result;
      if (result && typeof result.text === 'string') return result.text;
      if (result && Array.isArray(result.pages)) {
        return result.pages.map((p: any) => p.text || '').join('\n');
      }
      return '';
    } catch (err: any) {
      console.error('[QuantityMasterPdfService] PDF extraction failed:', err);
      throw new AppError(`Failed to extract text from PDF: ${err.message}`, 400);
    }
  }

  /**
   * Parse PDF text content according to master catalog type
   */
  public static async parsePdfMaster(
    buffer: Buffer,
    type: MasterType
  ): Promise<{
    type: MasterType;
    totalDetected: number;
    validCount: number;
    items: any[];
    rawTextPreview?: string;
  }> {
    const rawText = await this.extractPdfText(buffer);
    if (!rawText.trim()) {
      throw new AppError('The uploaded PDF does not contain extractable text or is a scanned image without OCR.', 400);
    }

    const lines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    let parsedItems: any[] = [];

    switch (type) {
      case 'materials':
        parsedItems = this.parseMaterials(lines);
        break;
      case 'manpower':
        parsedItems = this.parseManpower(lines);
        break;
      case 'machinery':
        parsedItems = this.parseMachinery(lines);
        break;
      case 'formulas':
        parsedItems = this.parseFormulas(lines);
        break;
      case 'rate-lists':
        parsedItems = this.parseRateLists(lines);
        break;
      default:
        throw new AppError(`Unsupported catalog type: ${type}`, 400);
    }

    const validCount = parsedItems.filter((i) => i.isValid !== false).length;

    return {
      type,
      totalDetected: parsedItems.length,
      validCount,
      items: parsedItems,
      rawTextPreview: rawText.slice(0, 500),
    };
  }

  /**
   * Helper: Parse Materials from lines
   */
  private static parseMaterials(lines: string[]): any[] {
    const items: any[] = [];
    const headerKeywords = ['material', 'category', 'code', 'unit', 'rate', 'price', 'specification', '#'];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip table header lines or title lines
      const lower = line.toLowerCase();
      if (headerKeywords.filter((k) => lower.includes(k)).length >= 3) {
        continue;
      }
      if (lower.startsWith('buildforce') || lower.startsWith('page ') || lower.startsWith('quantity master')) {
        continue;
      }

      // Check if line is pipe-separated, tab-separated, or comma-separated
      let parts: string[] = [];
      if (line.includes('|')) {
        parts = line.split('|').map((p) => p.trim()).filter(Boolean);
      } else if (line.includes('\t')) {
        parts = line.split('\t').map((p) => p.trim()).filter(Boolean);
      } else {
        // Multi-space separated (minimum 2 spaces)
        parts = line.split(/\s{2,}/).map((p) => p.trim()).filter(Boolean);
      }

      // If line has multiple parts
      if (parts.length >= 3) {
        // Strip leading SR number if first part is digits
        if (/^\d+$/.test(parts[0])) {
          parts.shift();
        }

        const name = parts[0] || '';
        if (!name || name.length < 2) continue;

        let category = 'Civil Work';
        let code = '';
        let unit = 'NOS';
        let rate = 0;
        let status = 'ACTIVE';

        // Search for rate (number with optional decimal)
        for (let j = parts.length - 1; j >= 1; j--) {
          const cleanVal = parts[j].replace(/[₹,]/g, '').trim();
          const parsed = parseFloat(cleanVal);
          if (!isNaN(parsed) && parsed >= 0) {
            rate = parsed;
            parts.splice(j, 1);
            break;
          }
        }

        // Search for status (ACTIVE/INACTIVE)
        for (let j = parts.length - 1; j >= 1; j--) {
          const upperVal = parts[j].toUpperCase();
          if (upperVal === 'ACTIVE' || upperVal === 'INACTIVE' || upperVal === 'ARCHIVED') {
            status = upperVal;
            parts.splice(j, 1);
            break;
          }
        }

        // Search for unit
        const commonUnits = ['cum', 'sqm', 'rmt', 'bag', 'kg', 'nos', 'tonne', 'ltr', 'bundle', 'box', 'set', 'meter', 'brass', 'sqft', 'cft'];
        for (let j = parts.length - 1; j >= 1; j--) {
          const cleanU = parts[j].toLowerCase().replace(/[^a-z]/g, '');
          if (commonUnits.includes(cleanU)) {
            unit = cleanU.toUpperCase();
            parts.splice(j, 1);
            break;
          }
        }

        // Remaining parts: category, code
        if (parts.length > 2) {
          category = parts[1];
          code = parts[2].toUpperCase().replace(/\s+/g, '-');
        } else if (parts.length === 2) {
          category = parts[1];
        }

        if (!code) {
          const prefix = category.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'MAT');
          code = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
        }

        items.push({
          name,
          category,
          subcategory: '',
          code,
          unit,
          standardRate: rate,
          status,
          specification: '',
          isValid: Boolean(name && rate >= 0),
        });
      } else {
        // Line didn't have multi-space or pipe separators, try regex pattern
        // Pattern: [Code] [Name...] [Unit] [Rate]
        const rateMatch = line.match(/(?:₹\s*)?([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)\s*$/);
        if (rateMatch && rateMatch.index && rateMatch.index > 5) {
          const rateVal = parseFloat(rateMatch[1].replace(/,/g, ''));
          const beforeRate = line.slice(0, rateMatch.index).trim();
          const words = beforeRate.split(/\s+/);
          if (words.length >= 2) {
            let unitVal = 'NOS';
            const lastWord = words[words.length - 1].toLowerCase().replace(/[^a-z]/g, '');
            const commonUnits = ['cum', 'sqm', 'rmt', 'bag', 'kg', 'nos', 'tonne', 'ltr', 'meter', 'sqft', 'cft'];
            if (commonUnits.includes(lastWord)) {
              unitVal = lastWord.toUpperCase();
              words.pop();
            }

            // Check if first word looks like a code (e.g. MAT-01 or 1.1 or M01)
            let codeVal = '';
            if (/^[A-Z0-9_-]{2,10}$/i.test(words[0])) {
              codeVal = words.shift()!.toUpperCase();
            }

            const nameVal = words.join(' ');
            if (nameVal.length >= 3) {
              if (!codeVal) {
                codeVal = `MAT-${Math.floor(1000 + Math.random() * 9000)}`;
              }
              items.push({
                name: nameVal,
                category: 'General Materials',
                subcategory: '',
                code: codeVal,
                unit: unitVal,
                standardRate: rateVal,
                status: 'ACTIVE',
                specification: '',
                isValid: true,
              });
            }
          }
        }
      }
    }

    return items;
  }

  /**
   * Helper: Parse Manpower from lines
   */
  private static parseManpower(lines: string[]): any[] {
    const items: any[] = [];
    const headerKeywords = ['manpower', 'labour', 'labor', 'role', 'designation', 'skill', 'rate', 'daily'];

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (headerKeywords.filter((k) => lower.includes(k)).length >= 3) continue;
      if (lower.startsWith('buildforce') || lower.startsWith('page ') || lower.startsWith('quantity master')) continue;

      let parts: string[] = [];
      if (line.includes('|')) {
        parts = line.split('|').map((p) => p.trim()).filter(Boolean);
      } else if (line.includes('\t')) {
        parts = line.split('\t').map((p) => p.trim()).filter(Boolean);
      } else {
        parts = line.split(/\s{2,}/).map((p) => p.trim()).filter(Boolean);
      }

      if (parts.length >= 3) {
        if (/^\d+$/.test(parts[0])) parts.shift();

        const name = parts[0] || '';
        if (!name || name.length < 2) continue;

        let category = 'Civil Work';
        let skillType: 'Skilled' | 'Semi-Skilled' | 'Unskilled' | 'Supervisory' | 'Specialist' = 'Skilled';
        let code = '';
        let standardDailyRate = 0;
        let unit = 'Day';
        let status = 'ACTIVE';

        // Extract rate
        for (let j = parts.length - 1; j >= 1; j--) {
          const cleanVal = parts[j].replace(/[₹,]/g, '').trim();
          const parsed = parseFloat(cleanVal);
          if (!isNaN(parsed) && parsed >= 0) {
            standardDailyRate = parsed;
            parts.splice(j, 1);
            break;
          }
        }

        // Extract skill type
        const skills: ('Skilled' | 'Semi-Skilled' | 'Unskilled' | 'Supervisory' | 'Specialist')[] = [
          'Skilled',
          'Semi-Skilled',
          'Unskilled',
          'Supervisory',
          'Specialist',
        ];
        for (let j = parts.length - 1; j >= 1; j--) {
          const matched = skills.find((s) => s.toLowerCase() === parts[j].toLowerCase());
          if (matched) {
            skillType = matched;
            parts.splice(j, 1);
            break;
          }
        }

        // Remaining parts: category, code
        if (parts.length > 2) {
          category = parts[1];
          code = parts[2].toUpperCase().replace(/\s+/g, '-');
        } else if (parts.length === 2) {
          category = parts[1];
        }

        if (!code) {
          code = `LAB-${Math.floor(1000 + Math.random() * 9000)}`;
        }

        items.push({
          name,
          category,
          skillType,
          code,
          unit,
          standardDailyRate,
          status,
          isValid: Boolean(name && standardDailyRate >= 0),
        });
      } else {
        // Fallback regex pattern
        const rateMatch = line.match(/(?:₹\s*)?([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)\s*$/);
        if (rateMatch && rateMatch.index && rateMatch.index > 4) {
          const rateVal = parseFloat(rateMatch[1].replace(/,/g, ''));
          const textBefore = line.slice(0, rateMatch.index).trim();
          const words = textBefore.split(/\s+/);
          if (words.length >= 1) {
            const roleName = words.join(' ');
            items.push({
              name: roleName,
              category: 'General Labour',
              skillType: roleName.toLowerCase().includes('helper') ? 'Unskilled' : 'Skilled',
              code: `LAB-${Math.floor(1000 + Math.random() * 9000)}`,
              unit: 'Day',
              standardDailyRate: rateVal,
              status: 'ACTIVE',
              isValid: true,
            });
          }
        }
      }
    }

    return items;
  }

  /**
   * Helper: Parse Machinery from lines
   */
  private static parseMachinery(lines: string[]): any[] {
    const items: any[] = [];
    const headerKeywords = ['machinery', 'equipment', 'plant', 'hourly', 'rate', 'capacity', 'type'];

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (headerKeywords.filter((k) => lower.includes(k)).length >= 3) continue;
      if (lower.startsWith('buildforce') || lower.startsWith('page ') || lower.startsWith('quantity master')) continue;

      let parts: string[] = [];
      if (line.includes('|')) {
        parts = line.split('|').map((p) => p.trim()).filter(Boolean);
      } else if (line.includes('\t')) {
        parts = line.split('\t').map((p) => p.trim()).filter(Boolean);
      } else {
        parts = line.split(/\s{2,}/).map((p) => p.trim()).filter(Boolean);
      }

      if (parts.length >= 3) {
        if (/^\d+$/.test(parts[0])) parts.shift();

        const name = parts[0] || '';
        if (!name || name.length < 2) continue;

        let category = 'General Plant';
        let code = '';
        let standardHourlyRate = 0;
        let rateType: 'Hourly' | 'Daily' | 'Shift' | 'Trip' = 'Hourly';
        let unit = 'Hour';
        let status = 'ACTIVE';

        // Extract rate
        for (let j = parts.length - 1; j >= 1; j--) {
          const cleanVal = parts[j].replace(/[₹,]/g, '').trim();
          const parsed = parseFloat(cleanVal);
          if (!isNaN(parsed) && parsed >= 0) {
            standardHourlyRate = parsed;
            parts.splice(j, 1);
            break;
          }
        }

        // Extract rateType
        const rateTypes: ('Hourly' | 'Daily' | 'Shift' | 'Trip')[] = ['Hourly', 'Daily', 'Shift', 'Trip'];
        for (let j = parts.length - 1; j >= 1; j--) {
          const matched = rateTypes.find((r) => r.toLowerCase() === parts[j].toLowerCase());
          if (matched) {
            rateType = matched;
            parts.splice(j, 1);
            break;
          }
        }

        if (parts.length > 2) {
          category = parts[1];
          code = parts[2].toUpperCase().replace(/\s+/g, '-');
        } else if (parts.length === 2) {
          category = parts[1];
        }

        if (!code) {
          code = `MAC-${Math.floor(1000 + Math.random() * 9000)}`;
        }

        items.push({
          name,
          category,
          code,
          unit,
          standardHourlyRate,
          rateType,
          status,
          isValid: Boolean(name && standardHourlyRate >= 0),
        });
      } else {
        const rateMatch = line.match(/(?:₹\s*)?([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)\s*$/);
        if (rateMatch && rateMatch.index && rateMatch.index > 4) {
          const rateVal = parseFloat(rateMatch[1].replace(/,/g, ''));
          const equipName = line.slice(0, rateMatch.index).trim();
          items.push({
            name: equipName,
            category: 'Construction Plant',
            code: `MAC-${Math.floor(1000 + Math.random() * 9000)}`,
            unit: 'Hour',
            standardHourlyRate: rateVal,
            rateType: 'Hourly',
            status: 'ACTIVE',
            isValid: true,
          });
        }
      }
    }

    return items;
  }

  /**
   * Helper: Parse Formulas from lines
   */
  private static parseFormulas(lines: string[]): any[] {
    const items: any[] = [];
    const headerKeywords = ['formula', 'coefficient', 'work', 'specification', 'factor'];

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (headerKeywords.filter((k) => lower.includes(k)).length >= 3) continue;
      if (lower.startsWith('buildforce') || lower.startsWith('page ') || lower.startsWith('quantity master')) continue;

      let parts: string[] = [];
      if (line.includes('|')) {
        parts = line.split('|').map((p) => p.trim()).filter(Boolean);
      } else if (line.includes('\t')) {
        parts = line.split('\t').map((p) => p.trim()).filter(Boolean);
      } else {
        parts = line.split(/\s{2,}/).map((p) => p.trim()).filter(Boolean);
      }

      if (parts.length >= 2) {
        if (/^\d+$/.test(parts[0])) parts.shift();

        const name = parts[0] || '';
        if (!name || name.length < 3) continue;

        let category = 'Civil Work';
        let code = '';
        let unit = 'CUM';
        let description = '';

        if (parts.length >= 3) {
          code = parts[1].toUpperCase().replace(/\s+/g, '-');
          unit = parts[2].toUpperCase();
          if (parts[3]) category = parts[3];
          if (parts[4]) description = parts[4];
        } else if (parts.length === 2) {
          code = `FORM-${Math.floor(1000 + Math.random() * 9000)}`;
          unit = parts[1].toUpperCase();
        }

        if (!code) {
          code = `FORM-${Math.floor(1000 + Math.random() * 9000)}`;
        }

        // Auto-detect common factors if description or name contains mix details
        const materialFactors: any[] = [];
        const labourFactors: any[] = [];
        const machineryFactors: any[] = [];

        if (name.toLowerCase().includes('concrete') || name.toLowerCase().includes('rcc')) {
          materialFactors.push(
            { materialCode: 'MAT-CEM-001', name: 'Cement (PPC/OPC)', unit: 'BAG', factor: 8.2, wastePercent: 2 },
            { materialCode: 'MAT-SND-001', name: 'River Sand / Fine Aggregate', unit: 'CUM', factor: 0.42, wastePercent: 3 },
            { materialCode: 'MAT-AGG-001', name: 'Coarse Aggregate (20mm)', unit: 'CUM', factor: 0.84, wastePercent: 3 }
          );
          labourFactors.push(
            { labourCode: 'LAB-MAS-001', name: 'Mason (Grade 1)', unit: 'Day', factor: 0.25 },
            { labourCode: 'LAB-HLP-001', name: 'Beldar / Mazdoor', unit: 'Day', factor: 1.5 }
          );
          machineryFactors.push(
            { machineryCode: 'MAC-MIX-001', name: 'Concrete Mixer 10/7', unit: 'Hour', factor: 0.15 }
          );
        } else if (name.toLowerCase().includes('plaster')) {
          materialFactors.push(
            { materialCode: 'MAT-CEM-001', name: 'Cement', unit: 'BAG', factor: 0.12, wastePercent: 5 },
            { materialCode: 'MAT-SND-001', name: 'Fine Sand', unit: 'CUM', factor: 0.02, wastePercent: 5 }
          );
          labourFactors.push(
            { labourCode: 'LAB-MAS-001', name: 'Plaster Mason', unit: 'Day', factor: 0.08 }
          );
        }

        items.push({
          name,
          code,
          category,
          unit,
          description,
          referenceStandard: 'CPWD / IS Code Specifications',
          materialFactors,
          labourFactors,
          machineryFactors,
          isStandard: true,
          isValid: Boolean(name && code),
        });
      }
    }

    return items;
  }

  /**
   * Helper: Parse Rate Lists from lines
   */
  private static parseRateLists(lines: string[]): any[] {
    const items: any[] = [];
    let currentListName = 'Imported Custom Rate Schedule';
    let currentListCode = `RL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const materialRates: any[] = [];
    const labourRates: any[] = [];
    const machineryRates: any[] = [];

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.startsWith('rate list:') || lower.startsWith('schedule:')) {
        currentListName = line.split(':')[1]?.trim() || currentListName;
        continue;
      }
      if (lower.includes('rate list') || lower.includes('coverage') || lower.startsWith('buildforce')) continue;

      let parts: string[] = [];
      if (line.includes('|')) {
        parts = line.split('|').map((p) => p.trim()).filter(Boolean);
      } else if (line.includes('\t')) {
        parts = line.split('\t').map((p) => p.trim()).filter(Boolean);
      } else {
        parts = line.split(/\s{2,}/).map((p) => p.trim()).filter(Boolean);
      }

      if (parts.length >= 3) {
        if (/^\d+$/.test(parts[0])) parts.shift();

        let code = parts[0];
        let name = parts[1];
        let rate = 0;
        let unit = 'NOS';
        let itemType = 'material';

        // Check for rate
        for (let j = parts.length - 1; j >= 1; j--) {
          const cleanVal = parts[j].replace(/[₹,]/g, '').trim();
          const parsed = parseFloat(cleanVal);
          if (!isNaN(parsed) && parsed >= 0) {
            rate = parsed;
            parts.splice(j, 1);
            break;
          }
        }

        if (code.toLowerCase().startsWith('lab') || name.toLowerCase().includes('mason') || name.toLowerCase().includes('labour')) {
          itemType = 'labour';
          unit = 'Day';
        } else if (code.toLowerCase().startsWith('mac') || name.toLowerCase().includes('mixer') || name.toLowerCase().includes('jcb')) {
          itemType = 'machinery';
          unit = 'Hour';
        }

        const override = {
          itemId: new Types.ObjectId(),
          itemCode: code,
          itemName: name,
          unit,
          rate,
        };

        if (itemType === 'labour') labourRates.push(override);
        else if (itemType === 'machinery') machineryRates.push(override);
        else materialRates.push(override);
      }
    }

    if (materialRates.length > 0 || labourRates.length > 0 || machineryRates.length > 0) {
      items.push({
        name: currentListName,
        code: currentListCode,
        description: `Imported from PDF with ${materialRates.length} materials, ${labourRates.length} manpower, and ${machineryRates.length} machinery rate overrides.`,
        isDefault: false,
        materialRates,
        labourRates,
        machineryRates,
        isValid: true,
      });
    }

    return items;
  }

  /**
   * Commit parsed items in bulk into MongoDB
   */
  public static async bulkCommitMaster(
    companyId: string,
    userId: string,
    type: MasterType,
    items: any[],
    fileName?: string
  ): Promise<{
    success: boolean;
    insertedCount: number;
    updatedCount: number;
    totalCommitted: number;
    message: string;
  }> {
    const compObjectId = new Types.ObjectId(companyId);
    let insertedCount = 0;
    let updatedCount = 0;

    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError('No items provided for bulk commit', 400);
    }

    switch (type) {
      case 'materials': {
        for (const item of items) {
          if (!item.name || !item.code) continue;

          const existing = await Material.findOne({
            companyId: compObjectId,
            code: item.code.trim().toUpperCase(),
          });

          if (existing) {
            existing.name = item.name.trim();
            existing.category = item.category || existing.category;
            existing.unit = item.unit || existing.unit;
            existing.standardRate = Number(item.standardRate) || existing.standardRate;
            existing.status = item.status || existing.status;
            await existing.save();
            updatedCount++;
          } else {
            await Material.create({
              companyId: compObjectId,
              code: item.code.trim().toUpperCase(),
              name: item.name.trim(),
              category: item.category || 'General',
              subcategory: item.subcategory || '',
              unit: item.unit || 'NOS',
              standardRate: Number(item.standardRate) || 0,
              status: item.status || 'ACTIVE',
              specification: item.specification || '',
            });
            insertedCount++;
          }
        }
        break;
      }

      case 'manpower': {
        for (const item of items) {
          if (!item.name || !item.code) continue;

          const existing = await LabourType.findOne({
            companyId: compObjectId,
            code: item.code.trim().toUpperCase(),
          });

          if (existing) {
            existing.name = item.name.trim();
            existing.category = item.category || existing.category;
            existing.skillType = item.skillType || existing.skillType;
            existing.standardDailyRate = Number(item.standardDailyRate) || existing.standardDailyRate;
            existing.unit = item.unit || existing.unit;
            existing.status = item.status || existing.status;
            await existing.save();
            updatedCount++;
          } else {
            await LabourType.create({
              companyId: compObjectId,
              code: item.code.trim().toUpperCase(),
              name: item.name.trim(),
              category: item.category || 'Civil Work',
              skillType: item.skillType || 'Skilled',
              standardDailyRate: Number(item.standardDailyRate) || 0,
              unit: item.unit || 'Day',
              status: item.status || 'ACTIVE',
            });
            insertedCount++;
          }
        }
        break;
      }

      case 'machinery': {
        for (const item of items) {
          if (!item.name || !item.code) continue;

          const existing = await MachineryType.findOne({
            companyId: compObjectId,
            code: item.code.trim().toUpperCase(),
          });

          if (existing) {
            existing.name = item.name.trim();
            existing.category = item.category || existing.category;
            existing.standardHourlyRate = Number(item.standardHourlyRate) || existing.standardHourlyRate;
            existing.rateType = item.rateType || existing.rateType;
            existing.unit = item.unit || existing.unit;
            existing.status = item.status || existing.status;
            await existing.save();
            updatedCount++;
          } else {
            await MachineryType.create({
              companyId: compObjectId,
              code: item.code.trim().toUpperCase(),
              name: item.name.trim(),
              category: item.category || 'General Plant',
              standardHourlyRate: Number(item.standardHourlyRate) || 0,
              rateType: item.rateType || 'Hourly',
              unit: item.unit || 'Hour',
              status: item.status || 'ACTIVE',
            });
            insertedCount++;
          }
        }
        break;
      }

      case 'formulas': {
        for (const item of items) {
          if (!item.name || !item.code) continue;

          const existing = await Formula.findOne({
            companyId: compObjectId,
            code: item.code.trim().toUpperCase(),
          });

          if (existing) {
            existing.name = item.name.trim();
            existing.category = item.category || existing.category;
            existing.unit = item.unit || existing.unit;
            existing.description = item.description || existing.description;
            if (Array.isArray(item.materialFactors)) existing.materialFactors = item.materialFactors;
            if (Array.isArray(item.labourFactors)) existing.labourFactors = item.labourFactors;
            if (Array.isArray(item.machineryFactors)) existing.machineryFactors = item.machineryFactors;
            await existing.save();
            updatedCount++;
          } else {
            await Formula.create({
              companyId: compObjectId,
              code: item.code.trim().toUpperCase(),
              name: item.name.trim(),
              category: item.category || 'Civil Work',
              unit: item.unit || 'CUM',
              description: item.description || '',
              materialFactors: item.materialFactors || [],
              labourFactors: item.labourFactors || [],
              machineryFactors: item.machineryFactors || [],
              isStandard: item.isStandard !== false,
            });
            insertedCount++;
          }
        }
        break;
      }

      case 'rate-lists': {
        for (const item of items) {
          if (!item.name) continue;
          const code = item.code || `RL-${Math.floor(1000 + Math.random() * 9000)}`;

          const existing = await RateList.findOne({
            companyId: compObjectId,
            code: code.trim().toUpperCase(),
          });

          if (existing) {
            existing.name = item.name.trim();
            existing.description = item.description || existing.description;
            if (Array.isArray(item.materialRates)) existing.materialRates = item.materialRates;
            if (Array.isArray(item.labourRates)) existing.labourRates = item.labourRates;
            if (Array.isArray(item.machineryRates)) existing.machineryRates = item.machineryRates;
            await existing.save();
            updatedCount++;
          } else {
            await RateList.create({
              companyId: compObjectId,
              name: item.name.trim(),
              code: code.trim().toUpperCase(),
              description: item.description || '',
              isDefault: Boolean(item.isDefault),
              materialRates: item.materialRates || [],
              labourRates: item.labourRates || [],
              machineryRates: item.machineryRates || [],
            });
            insertedCount++;
          }
        }
        break;
      }
    }

    const totalCommitted = insertedCount + updatedCount;

    // Record an entry in SorImport history so it appears in Tab 6 ("Import History")
    try {
      await SorImport.create({
        companyId: compObjectId,
        fileName: fileName || `${type}_bulk_pdf_import.pdf`,
        fileType: 'pdf',
        fileSize: 1024 * (totalCommitted || 1),
        fileHash: `pdf-import-${Date.now()}`,
        authority: 'Custom Upload',
        scheduleName: `Quantity Master - ${type.toUpperCase()}`,
        version: new Date().getFullYear().toString(),
        effectiveDate: new Date(),
        status: 'Published',
        progress: {
          uploadPercent: 100,
          processingPercent: 100,
          pagesProcessed: 1,
          totalPages: 1,
          currentBatch: 1,
          totalBatches: 1,
          rowsExtracted: totalCommitted,
          rowsRequiringReview: 0,
          rowsImported: totalCommitted,
          rowsFailed: 0,
        },
        batches: [],
        extractedRows: [],
        importErrors: [],
        createdBy: new Types.ObjectId(userId),
      });
    } catch (logErr) {
      console.warn('[QuantityMasterPdfService] Could not log import history:', logErr);
    }

    return {
      success: true,
      insertedCount,
      updatedCount,
      totalCommitted,
      message: `Successfully processed ${totalCommitted} items (${insertedCount} new created, ${updatedCount} existing updated) in ${type}.`,
    };
  }
}
