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
  await page.fill('input[type="email"]', 'learner.demo@gla.ac.in');
  await page.fill('input[type="password"]', 'Learner@123456');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);

  console.log('Current URL:', page.url());
  console.log('Navigating to Discover...');
  await page.goto(BASE_URL + '/discover', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('Clicking + AI Matcher button...');
  const aiBtn = await page.$('button:has-text("+ AI Matcher")') || await page.$('button:has-text("AI Matcher")');
  if (aiBtn) {
    await aiBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(__dirname, 'screenshots', '04b_ai_matcher.png') });
    console.log('Captured 04b_ai_matcher.png successfully!');
  } else {
    console.log('Could not find AI Matcher button');
  }

  // Also let's check Payment / Booking modal with payment breakdown
  console.log('Navigating to Mentor Profile to trigger Booking / Payment info...');
  await page.goto(BASE_URL + '/booking/6ae18ac07449ec1785847ad0', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(__dirname, 'screenshots', '07b_payment_escrow.png') });
  console.log('Captured 07b_payment_escrow.png successfully!');

  await browser.close();
  console.log('Done!');
})();
