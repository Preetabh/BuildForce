const http = require('http');

async function req(options, body) {
  return new Promise((resolve, reject) => {
    const r = http.request(options, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => resolve(JSON.parse(d)));
    });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}

(async () => {
  const login = await req(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    JSON.stringify({ email: 'admin@civilguruji.com', password: 'Civil@123' })
  );
  const token = login.data.token;

  const importsRes = await req({
    hostname: 'localhost',
    port: 5000,
    path: '/api/sor/imports',
    method: 'GET',
    headers: { Authorization: 'Bearer ' + token },
  });

  console.log('==================================================');
  console.log('TOTAL IMPORTS RECORDED IN SYSTEM:', importsRes.data.length);
  console.log('==================================================');
  for (const imp of importsRes.data) {
    console.log({
      id: imp._id,
      fileName: imp.fileName,
      sizeMB: (imp.fileSize / (1024 * 1024)).toFixed(2) + ' MB',
      status: imp.status,
      pages: `${imp.progress.pagesProcessed} / ${imp.progress.totalPages}`,
      batches: `${imp.progress.currentBatch} / ${imp.progress.totalBatches}`,
      extractedRows: imp.progress.rowsExtracted,
      scheduleName: imp.scheduleName,
      authority: imp.authority,
    });
  }

  const itemsRes = await req({
    hostname: 'localhost',
    port: 5000,
    path: '/api/sor/items?limit=5',
    method: 'GET',
    headers: { Authorization: 'Bearer ' + token },
  });

  console.log('\n==================================================');
  console.log('ACTIVE RATE MASTER ITEMS:', itemsRes.pagination.total);
  console.log('==================================================');
  for (const item of itemsRes.data) {
    console.log(`- [${item.itemCode}] ${item.descriptionEnglish.substring(0, 50)}... | Unit: ${item.unit} | Rate: ₹${item.rate} | Chapter: ${item.chapter}`);
  }
})();
