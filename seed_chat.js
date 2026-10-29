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
  const mLogin = await apiCall('/api/loginRoute/api', 'POST', { email: 'mentor.demo@gla.ac.in', password: 'Mentor@123456' });

  const lToken = lLogin.body.accessToken;
  const mToken = mLogin.body.accessToken;
  const mId = mLogin.body.user.id;
  const lId = lLogin.body.user.id;

  console.log('Learner ID:', lId, 'Mentor ID:', mId);

  // Create conversation from learner to mentor
  const convRes = await apiCall('/api/conversations', 'POST', { participantId: mId }, lToken);
  console.log('Conv created:', convRes.status, convRes.body);

  const convId = convRes.body?._id || convRes.body?.conversation?._id;
  if (convId) {
    // Learner message
    await apiCall(`/api/conversations/${convId}/messages`, 'POST', {
      text: "Hi Rahul! I saw your profile on Skill Exchange and I'd love guidance on React state management and full-stack system design."
    }, lToken);

    // Mentor message
    await apiCall(`/api/conversations/${convId}/messages`, 'POST', {
      text: "Hey! Glad to connect. I'd be happy to mentor you. Let's schedule a 1-on-1 session this weekend to review your architecture!"
    }, mToken);

    // Learner reply
    await apiCall(`/api/conversations/${convId}/messages`, 'POST', {
      text: "Sounds great! Just submitted a session request on your calendar. Looking forward to our discussion."
    }, lToken);

    console.log('Messages sent successfully!');
  }
})();
