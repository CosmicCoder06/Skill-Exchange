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
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(postData);
    req.end();
  });
}

async function login(email, password) {
  const res = await apiCall('/api/loginRoute/api', 'POST', { email, password });
  if (res.status === 200) {
    return res.body.accessToken;
  }
  throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
}

(async () => {
  try {
    const learnerToken = await login('learner.demo@gla.ac.in', 'Learner@123456');
    const lRes = await apiCall('/api/profile/update', 'PUT', {
      bio: "Final year B.Tech CSE student at GLA University. Passionate about full-stack development and looking to master System Design and Node.js microservices.",
      skillsToTeach: ["Python", "C++", "HTML/CSS"],
      skillsToLearn: ["Node.js", "System Design", "Docker"],
      availability: ["Weekdays 18:00-21:00", "Weekends 10:00-16:00"]
    }, learnerToken);
    console.log('Learner update result:', lRes.status, lRes.body.profileComplete);

    const mentorToken = await login('mentor.demo@gla.ac.in', 'Mentor@123456');
    const mRes = await apiCall('/api/profile/update', 'PUT', {
      bio: "Senior Frontend Engineer & Mentor. Helping students crack frontend interviews, master modern React, Vite, and clean UI architecture.",
      skillsToTeach: ["React", "JavaScript", "TypeScript", "Next.js"],
      skillsToLearn: ["Cloud Architecture", "System Design"],
      hourlyRate: 400,
      availability: ["Mon-Fri 19:00-22:00", "Saturday 11:00-17:00"]
    }, mentorToken);
    console.log('Mentor update result:', mRes.status, mRes.body.profileComplete);

  } catch (e) {
    console.error('Error:', e);
  }
})();
