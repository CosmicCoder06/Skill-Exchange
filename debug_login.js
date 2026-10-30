const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });

  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('requestfailed', req => console.log('REQ FAILED:', req.url(), req.failure() ? req.failure().errorText : ''));
  page.on('response', res => {
    if (res.url().includes('/api/') || res.url().includes('login') || res.status() >= 400) {
      console.log('RES:', res.status(), res.url());
    }
  });

  await page.goto('https://skill-exchange-one-eta.vercel.app/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', '[email]');
  await page.fill('input[type="password"]', '[password]');

  console.log('Submitting login form...');
  await page.click('button[type="submit"]');

  await new Promise(r => setTimeout(r, 6000));
  
  const alertText = await page.evaluate(() => {
    const alerts = document.querySelectorAll('.alert, .error, [role="alert"], p, span');
    return Array.from(alerts).map(a => a.textContent).filter(t => t && (t.toLowerCase().includes('fail') || t.toLowerCase().includes('error') || t.toLowerCase().includes('invalid')));
  });
  console.log('Detected error/alerts:', alertText);

  await browser.close();
})();
