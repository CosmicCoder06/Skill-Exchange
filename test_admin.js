const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Logging in as Admin...');
  await page.goto('https://skill-exchange-one-eta.vercel.app/login', { waitUntil: 'networkidle' });
  await page.fill('#email', 'admin-avhi@skillexchange.local');
  await page.fill('#password', 'Admin@123456');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  console.log('Admin landed URL:', page.url());
  const title = await page.textContent('h1, h2, .admin-title, .overview-title').catch(() => 'none');
  console.log('Admin page header:', title);

  const tabs = await page.$$eval('.admin-sidebar button, .sidebar-nav button, nav button', els => els.map(e => e.textContent.trim()));
  console.log('Admin tabs:', tabs);

  await browser.close();
})();
