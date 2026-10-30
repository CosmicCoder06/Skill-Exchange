const https = require('https');

function apiCall(endpoint, method, data, token) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    const headers = {};
    if (data) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(postData);
    }
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    const req = https.request(`https://skill-exchange-o19g.onrender.com${endpoint}`, {
      method,
      headers
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(postData);
    req.end();
  });
}

(async () => {
  const lLogin = await apiCall('/api/loginRoute/api', 'POST', { email: 'learner.demo@gla.ac.in', password: 'Learner@123456' });
  const lToken = lLogin.body.accessToken;
  const mId = '6ae34e728f85ccbb95278392';

  // Tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

  console.log('Creating booking for date:', dateStr);
  const bookRes = await apiCall('/api/bookings', 'POST', {
    mentor: mId,
    date: dateStr,
    time: "18:00",
    duration: 60,
    message: "Discussion on React performance optimization and full-stack system architecture."
  }, lToken);

  console.log('Booking creation result:', bookRes.status, bookRes.body);
})();
