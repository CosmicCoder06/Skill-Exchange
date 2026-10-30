const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });

  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER:', msg.type(), msg.text()));
  page.on('request', req => console.log('REQ:', req.method(), req.url()));

  await page.goto('https://skill-exchange-one-eta.vercel.app/login', { waitUntil: 'networkidle' });
  
  await page.click('#email');
  await page.keyboard.type('[email]', { delay: 50 });
  await page.click('#password');
  await page.keyboard.type('[password]', { delay: 50 });

  console.log('Inputs populated, clicking button...');
  await Promise.all([
    page.waitForResponse(res => res.url().includes('loginRoute') || res.url().includes('api'), { timeout: 15000 }).catch(e => console.log('Response wait timed out:', e.message)),
    page.click('button[type="submit"]')
  ]);

  await new Promise(r => setTimeout(r, 5000));
  console.log('Current URL after submit:', page.url());
  const token = await page.evaluate(() => localStorage.getItem('Token'));
  console.log('Token in storage:', token);

  await browser.close();
})();
