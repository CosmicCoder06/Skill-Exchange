const https = require('https');

function testApi(email, password) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ email, password });
    const req = https.request('https://skill-exchange-o19g.onrender.com/api/loginRoute/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 60000
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        console.log(`Status: ${res.statusCode} for ${email}`);
        console.log(`Body: ${body.substring(0, 300)}`);
        resolve({ status: res.statusCode, body });
      });
    });

    req.on('error', (e) => {
      console.error(`Error for ${email}:`, e.message);
      resolve({ error: e.message });
    });

    req.on('timeout', () => {
      console.log(`Timeout for ${email}`);
      req.destroy();
      resolve({ error: 'timeout' });
    });

    req.write(postData);
    req.end();
  });
}

(async () => {
  console.log('Sending wake up request to Render...');
  await testApi('[email]', '[password]');
  console.log('\nTesting mentor...');
  await testApi('[email]', '[password]');
  console.log('\nTesting admin...');
  await testApi('[email]', '[password]');
})();
