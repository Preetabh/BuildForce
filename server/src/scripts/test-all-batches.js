const { execFile } = require('child_process');
const path = require('path');

const script = path.resolve(__dirname, 'pdf_engine.py');
const file = 'C:/Users/Vishu/Downloads/DSR_Vol_1_Civil_compressed.pdf';

(async () => {
  let totalExtracted = 0;
  for (let b = 1; b <= 9; b++) {
    const start = (b - 1) * 25 + 1;
    const end = Math.min(b * 25, 225);
    const out = await new Promise((res, rej) => {
      execFile('python', [script, '--file', file, '--start', String(start), '--end', String(end), '--batch', String(b)], (err, stdout) => {
        if (err) rej(err);
        else res(JSON.parse(stdout));
      });
    });
    totalExtracted += out.extractedRowCount;
    const chapters = [...new Set(out.rows.map((r) => r.chapter))].join(', ');
    console.log(`[Batch ${b}] Pages ${start}-${end} | Extracted: ${out.extractedRowCount} | Cumulative: ${totalExtracted} | Chapters: ${chapters}`);
  }
  console.log('\n--- VERIFICATION COMPLETED: All 9 batches executed successfully! Total items:', totalExtracted);
})();
