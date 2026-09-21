const fs = require('fs');
const path = require('path');
const pdfParseModule = require('pdf-parse');
const PDFParseClass = pdfParseModule.PDFParse || pdfParseModule;

async function diagnose() {
  const filePath = 'C:\\Users\\Vishu\\Downloads\\DSR_Vol_1_Civil_compressed.pdf';
  if (!fs.existsSync(filePath)) {
    console.log('File does not exist at:', filePath);
    return;
  }

  const stat = fs.statSync(filePath);
  console.log('File size:', (stat.size / (1024 * 1024)).toFixed(2), 'MB');

  const buffer = fs.readFileSync(filePath);
  console.log('Loaded buffer, extracting info...');
  const parser = new PDFParseClass({ data: buffer });
  const info = await parser.getInfo();
  console.log('Total pages reported by info:', info.total);

  // Sample pages across the document: e.g. 1, 5, 10, 15, 20, 25, 50, 100, 150, 200
  const pagesResult = await parser.getText({ first: 1, last: 30 });
  console.log('Result total pages in range:', pagesResult?.pages?.length);
  for (const p of pagesResult?.pages || []) {
    const txt = (p.text || '').trim();
    console.log(`Page ${p.num}: length = ${txt.length} chars | Preview: ${txt.slice(0, 80).replace(/\n/g, ' ')}`);
  }

  // Also check middle pages e.g. 35 to 50
  const middleResult = await parser.getText({ first: 35, last: 50 });
  console.log('\n--- Middle pages 35-50 ---');
  for (const p of middleResult?.pages || []) {
    const txt = (p.text || '').trim();
    console.log(`Page ${p.num}: length = ${txt.length} chars | Preview: ${txt.slice(0, 120).replace(/\n/g, ' ')}`);
  }
}

diagnose().catch(console.error);
