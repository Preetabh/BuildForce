const http = require('http');
const fs = require('fs');

async function req(options, body) {
  return new Promise((resolve, reject) => {
    const r = http.request(options, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        try {
          resolve({ s: res.statusCode, b: JSON.parse(d) });
        } catch (e) {
          resolve({ s: res.statusCode, t: d });
        }
      });
    });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}

async function uploadFile() {
  const filePath = 'C:\\Users\\Vishu\\Downloads\\DSR_Vol_1_Civil_compressed.pdf';
  console.log('Uploading real CPWD file from disk:', filePath);

  // 1. Auth login
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
  const token = login.b?.data?.token;
  console.log('Login status:', login.s, token ? 'Token OK' : login.b);

  if (!token) return;

  // 2. Build multipart stream
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const fileStat = fs.statSync(filePath);
  console.log('File size:', (fileStat.size / (1024 * 1024)).toFixed(2), 'MB');

  const fileStream = fs.createReadStream(filePath);

  const headerParts = [
    '--' + boundary + '\r\nContent-Disposition: form-data; name="authority"\r\n\r\nCPWD\r\n',
    '--' + boundary + '\r\nContent-Disposition: form-data; name="scheduleName"\r\n\r\nDelhi Schedule of Rates (DSR) 2023 - Vol 1 Civil\r\n',
    '--' + boundary + '\r\nContent-Disposition: form-data; name="version"\r\n\r\n2023.1\r\n',
    '--' + boundary + '\r\nContent-Disposition: form-data; name="effectiveDate"\r\n\r\n2023-10-01\r\n',
    '--' + boundary + '\r\nContent-Disposition: form-data; name="forceReimport"\r\n\r\ntrue\r\n',
    '--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="DSR_Vol_1_Civil_compressed.pdf"\r\nContent-Type: application/pdf\r\n\r\n',
  ].join('');

  const footer = '\r\n--' + boundary + '--\r\n';
  const totalLength = Buffer.byteLength(headerParts) + fileStat.size + Buffer.byteLength(footer);

  console.log('Streaming 106.34 MB to http://localhost:5000/api/sor/import/upload ...');

  const uploadReq = http.request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/sor/import/upload',
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': totalLength,
      },
    },
    (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', async () => {
        console.log('Upload HTTP response code:', res.statusCode);
        let respData;
        try {
          respData = JSON.parse(d);
          console.log('Response body:', respData);
        } catch (e) {
          console.log('Response text:', d);
          return;
        }

        const importId = respData.data?._id;
        if (!importId) return;

        console.log('\n--- Started Background Polling for Import ID:', importId, '---');
        let done = false;
        let pCount = 0;
        while (!done && pCount < 60) {
          await new Promise((r) => setTimeout(r, 1500));
          pCount++;
          const statusRes = await req({
            hostname: 'localhost',
            port: 5000,
            path: '/api/sor/import/' + importId + '/status',
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
          });

          const st = statusRes.b?.data;
          console.log(
            `[Poll ${pCount}] Status: ${st?.status} | Progress: ${st?.progress?.processingPercent}% | Pages: ${st?.progress?.pagesProcessed}/${st?.progress?.totalPages} | Batches: ${st?.progress?.currentBatch}/${st?.progress?.totalBatches} | Extracted: ${st?.progress?.rowsExtracted}`
          );

          if (
            st?.status === 'Review Required' ||
            st?.status === 'Approved' ||
            st?.status === 'OCR_REQUIRED' ||
            st?.status === 'Failed'
          ) {
            done = true;
            console.log('\n🎉 Final Processing State Reached:', st?.status);
            if (st?.isOcrRequired) {
              console.log('OCR Flagged: Scanned/Image-only PDF detected. Staging preserved.');
            }
          }
        }
      });
    }
  );

  uploadReq.on('error', (err) => {
    console.error('Upload request error:', err);
  });

  uploadReq.write(Buffer.from(headerParts));

  fileStream.on('data', (chunk) => {
    uploadReq.write(chunk);
  });

  fileStream.on('end', () => {
    uploadReq.write(Buffer.from(footer));
    uploadReq.end();
    console.log('Finished streaming 106.34 MB payload to server!');
  });
}

uploadFile().catch(console.error);
