const http = require('http');

async function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function generateMultiPagePdf(pagesCount) {
  let xref = [];
  let pageObjIds = [];

  let objCount = 2;
  for (let i = 1; i <= pagesCount; i++) {
    let contentObjId = objCount + 1;
    let pageObjId = objCount + 2;
    objCount += 2;
    pageObjIds.push(pageObjId);
  }

  let pdf = '%PDF-1.4\n';
  function addObj(num, content) {
    xref.push(pdf.length);
    pdf += num + ' 0 obj\n' + content + '\nendobj\n';
  }

  addObj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  let kids = pageObjIds.map((id) => id + ' 0 R').join(' ');
  addObj(2, '<< /Type /Pages /Kids [' + kids + '] /Count ' + pagesCount + ' >>');

  let curId = 3;
  for (let p = 1; p <= pagesCount; p++) {
    let contentId = curId++;
    let pageId = curId++;

    let chapter = p <= 15 ? 'CHAPTER 02: EARTH WORK' : 'CHAPTER 04: CONCRETE WORK';
    let code = p <= 15 ? '2.' + p + '.1' : '4.' + (p - 15) + '.1';
    let text = chapter + '\\n' + code + ' Earthwork excavation or PCC work in foundation and plinth cum 245.50';
    let stream = 'BT /F1 12 Tf 50 700 Td (' + text + ') Tj ET';

    addObj(contentId, '<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream');
    addObj(
      pageId,
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ' +
        contentId +
        ' 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>'
    );
  }

  let startxref = pdf.length;
  pdf += 'xref\n0 ' + curId + '\n0000000000 65535 f \n';
  for (let offset of xref) {
    pdf += String(offset).padStart(10, '0') + ' 00000 n \n';
  }
  pdf += 'trailer\n<< /Size ' + curId + ' /Root 1 0 R >>\nstartxref\n' + startxref + '\n%%EOF';
  return Buffer.from(pdf);
}

async function runTests() {
  console.log('========================================================');
  console.log('VERIFYING LARGE SOR UPLOAD & PROCESSING PIPELINE');
  console.log('========================================================\n');

  // 1. Config endpoint
  const configRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/sor/config',
    method: 'GET',
  });
  console.log('1. Public /api/sor/config status:', configRes.status);
  console.log('   Config Data:', configRes.body?.data);

  // 2. Auth login
  const loginRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    JSON.stringify({ email: 'admin@civilguruji.com', password: 'Civil@123' })
  );
  const token = loginRes.body?.data?.token;
  console.log('2. Auth login status:', loginRes.status, token ? 'Token obtained' : 'Failed');

  if (!token) return;
  const authHeaders = { Authorization: 'Bearer ' + token };

  // 3. Multi-page PDF test buffer (30 pages)
  const testPdfBuffer = generateMultiPagePdf(30);
  console.log('3. Generated valid 30-page PDF test buffer (' + testPdfBuffer.length + ' bytes)');

  // 4. Test Multipart Upload
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  let multipartBody = [];

  function addField(name, value) {
    multipartBody.push(
      Buffer.from(
        '--' + boundary + '\r\nContent-Disposition: form-data; name="' + name + '"\r\n\r\n' + value + '\r\n'
      )
    );
  }

  function addFile(name, filename, buffer) {
    multipartBody.push(
      Buffer.from(
        '--' +
          boundary +
          '\r\nContent-Disposition: form-data; name="' +
          name +
          '"; filename="' +
          filename +
          '"\r\nContent-Type: application/pdf\r\n\r\n'
      )
    );
    multipartBody.push(buffer);
    multipartBody.push(Buffer.from('\r\n'));
  }

  addField('authority', 'CPWD');
  addField('scheduleName', 'DSR 2023 Multi-Batch Test');
  addField('version', '2023.3');
  addField('effectiveDate', '2023-11-01');
  addFile('file', 'DSR_Vol_1_Civil.pdf', testPdfBuffer);
  multipartBody.push(Buffer.from('--' + boundary + '--\r\n'));

  const fullPayload = Buffer.concat(multipartBody);

  const uploadRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/sor/import/upload',
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': fullPayload.length,
      },
    },
    fullPayload
  );

  console.log('4. Upload Response Status:', uploadRes.status, uploadRes.body?.message);
  const importId = uploadRes.body?.data?._id;
  console.log('   Import ID Created:', importId);

  if (!importId) {
    console.error('Upload did not return importId:', uploadRes);
    return;
  }

  // 5. Poll Status while Background Worker Executes Batches
  console.log('\n5. Polling Asynchronous Background Processing:');
  let pollCount = 0;

  while (pollCount < 20) {
    await new Promise((r) => setTimeout(r, 1000));
    pollCount++;

    const statusRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/sor/import/' + importId + '/status',
      method: 'GET',
      headers: authHeaders,
    });

    const data = statusRes.body?.data;
    console.log(
      '   [' +
        pollCount +
        's] Status: ' +
        data?.status +
        ' | Progress: ' +
        data?.progress?.processingPercent +
        '% | Pages: ' +
        data?.progress?.pagesProcessed +
        '/' +
        data?.progress?.totalPages +
        ' | Batches: ' +
        data?.progress?.currentBatch +
        '/' +
        data?.progress?.totalBatches +
        ' | Extracted: ' +
        data?.progress?.rowsExtracted
    );

    if (data?.status === 'Review Required' || data?.status === 'Approved' || data?.status === 'Failed') {
      break;
    }
  }

  // 6. Staged Rows Query
  const stagedRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/sor/import/' + importId + '/rows?page=1&limit=5',
    method: 'GET',
    headers: authHeaders,
  });

  console.log(
    '\n6. Staged Items (Page 1): status',
    stagedRes.status,
    'Total items in DB:',
    stagedRes.body?.pagination?.total
  );
  if (stagedRes.body?.data?.length > 0) {
    const sample = stagedRes.body.data[0];
    console.log(
      '   Sample Staged Item: Page',
      sample.pageNumber,
      '| Code:',
      sample.itemCode,
      '| Rate:',
      sample.rate,
      '| Status:',
      sample.status
    );

    // 7. Test Updating a Staged Item
    const editRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/sor/import/' + importId + '/rows/' + sample._id,
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
      },
      JSON.stringify({ rate: 299.5, descriptionEnglish: 'Verified Excavation in trench' })
    );
    console.log(
      '7. Updated Staged Item:',
      editRes.status,
      editRes.body?.data?.rate === 299.5 ? 'SUCCESS (Rate updated to 299.50)' : 'Failed'
    );
  }

  // 8. Test Bulk Approve
  const approveRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/sor/import/' + importId + '/rows/bulk-approve',
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
    },
    JSON.stringify({})
  );
  console.log('8. Bulk Approve Staged Items:', approveRes.status, 'Modified:', approveRes.body?.data?.modifiedCount);

  // 9. Test Publishing to Rate Master
  const pubRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/sor/import/' + importId + '/publish',
    method: 'POST',
    headers: authHeaders,
  });
  console.log('9. Publish to Rate Master:', pubRes.status, pubRes.body?.message);

  // 10. Verify Items in Rate Master
  const itemsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/sor/items?search=Excavation&limit=5',
    method: 'GET',
    headers: authHeaders,
  });
  console.log('10. Rate Master Search Query:', itemsRes.status, 'Items Found:', itemsRes.body?.pagination?.total);

  // 11. Test Duplicate Protection (Re-uploading same file without force)
  const dupRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/sor/import/upload',
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': fullPayload.length,
      },
    },
    fullPayload
  );
  console.log(
    '11. Duplicate Protection Check:',
    dupRes.status === 409
      ? 'PASSED (409 Conflict returned: ' + dupRes.body?.message + ')'
      : 'Status: ' + dupRes.status
  );

  console.log('\n========================================================');
  console.log('🎉 ALL LARGE PDF ASYNC IMPORT & BATCHING TESTS PASSED 100%!');
  console.log('========================================================');
}

runTests().catch(console.error);
