const https = require('https');

https.get('https://skill-exchange-one-eta.vercel.app/assets/index-ChuhHUw1.js', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Bundle length:', data.length);
    const apiMatches = data.match(/https?:\/\/[a-zA-Z0-9.\-_:]+/g);
    console.log('Unique URLs in bundle:', [...new Set(apiMatches)]);
    
    // find where loginRoute is used
    const idx = data.indexOf('/loginRoute/api');
    console.log('loginRoute idx:', idx);
    if (idx !== -1) {
      console.log('Snippet around loginRoute:', data.substring(idx - 100, idx + 100));
    } else {
      console.log('loginRoute string not found directly, searching loginRoute:');
      const idx2 = data.indexOf('loginRoute');
      if (idx2 !== -1) {
        console.log('Snippet around loginRoute:', data.substring(idx2 - 100, idx2 + 100));
      }
    }
  });
});
