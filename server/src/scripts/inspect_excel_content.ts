import * as XLSX from 'xlsx';
import path from 'path';

async function inspectExcel() {
  const filePath = path.resolve(__dirname, '../../uploads/sor_temp/sor_79f4423c-f97a-4f6a-b96f-415b067f35eb.xlsx');
  console.log('Inspecting Excel file:', filePath);

  const workbook = XLSX.readFile(filePath);
  console.log('Sheet Names in Workbook:', workbook.SheetNames);

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    console.log(`\n--- Sheet: "${sheetName}" (Total rows: ${data.length}) ---`);
    console.log('First 15 rows:');
    for (let i = 0; i < Math.min(15, data.length); i++) {
      console.log(`Row ${i + 1}:`, JSON.stringify(data[i]));
    }
  }

  process.exit(0);
}

inspectExcel().catch((e) => {
  console.error(e);
  process.exit(1);
});
