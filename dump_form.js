const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });

  const page = await browser.newPage();
  await page.goto('https://skill-exchange-one-eta.vercel.app/login', { waitUntil: 'networkidle' });
  
  const formHtml = await page.evaluate(() => {
    const f = document.querySelector('form');
    return f ? f.outerHTML : document.body.innerHTML.substring(0, 2000);
  });
  console.log('FORM HTML:', formHtml);

  await browser.close();
})();
