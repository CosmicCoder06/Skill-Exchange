const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Logging in as Mentor...');
  await page.goto('https://skill-exchange-one-eta.vercel.app/login', { waitUntil: 'networkidle' });
  await page.fill('#email', 'mentor.demo@gla.ac.in');
  await page.fill('#password', 'Mentor@123456');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  console.log('Mentor landed URL:', page.url());
  const title = await page.textContent('h1, h2, .dashboard-title, .mentor-dashboard-title').catch(() => 'none');
  console.log('Mentor page header:', title);

  const sidebarLinks = await page.$$eval('.app-sidebar a, .sidebar a, nav a, .dashboard-nav button, .nav-item', els => els.map(e => e.textContent.trim()));
  console.log('Mentor sidebar/nav links:', sidebarLinks);

  await browser.close();
})();
