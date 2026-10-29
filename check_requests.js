const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });

  const page = await browser.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('request', req => console.log('REQ:', req.method(), req.url()));
  page.on('response', res => console.log('RES:', res.status(), res.url()));
  page.on('requestfailed', req => console.log('FAIL:', req.url(), req.failure()?.errorText));

  await page.goto('https://skill-exchange-one-eta.vercel.app/login', { waitUntil: 'networkidle' });
  
  // Look at button and form
  console.log('Filling form...');
  await page.fill('input[name="email"]', '[email]');
  await page.fill('input[name="password"]', '[password]');

  console.log('Clicking button...');
  await page.click('button[type="submit"]');

  await new Promise(r => setTimeout(r, 10000));
  
  console.log('Error banner text:');
  const errorText = await page.evaluate(() => {
    const el = document.querySelector('.error-banner, .login-error, .error');
    return el ? el.textContent : 'none';
  });
  console.log('Error banner:', errorText);

  await browser.close();
})();
