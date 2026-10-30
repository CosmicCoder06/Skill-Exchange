const { chromium } = require('playwright-core');
const path = require('path');

const BASE_URL = 'https://skill-exchange-one-eta.vercel.app';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Logging in as Learner...');
  await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle' });
  await page.fill('#email', 'learner.demo@gla.ac.in');
  await page.fill('#password', 'Learner@123456');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  console.log('Going to Discover...');
  await page.goto(BASE_URL + '/discover', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('Clicking AI Matcher button...');
  const aiBtn = await page.$('button:has-text("AI Matcher")') || await page.$('button:has-text("+ AI Matcher")');
  if (aiBtn) {
    await aiBtn.click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(__dirname, 'screenshots', '04b_ai_matcher.png') });
    console.log('Captured 04b_ai_matcher.png successfully!');
  } else {
    console.log('AI button not found, listing buttons:');
    const btns = await page.$$eval('button', els => els.map(e => e.innerText));
    console.log(btns);
  }

  // Also let's capture the Booking Page payment & escrow section
  console.log('Navigating to Booking page for mentor...');
  await page.goto(BASE_URL + '/booking/6ae18ac07449ec1785847ad0', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  // Focus on the escrow and price calculation card
  await page.screenshot({ path: path.join(__dirname, 'screenshots', '07b_payment_escrow.png') });
  console.log('Captured 07b_payment_escrow.png successfully!');

  await browser.close();
  console.log('Done!');
})();
