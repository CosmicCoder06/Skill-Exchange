const { chromium } = require('playwright-core');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const BASE_URL = 'https://skill-exchange-one-eta.vercel.app';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  console.log('Logging in as Learner...');
  await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle' });
  await page.fill('#email', 'learner.demo@gla.ac.in');
  await page.fill('#password', 'Learner@123456');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  console.log('Opening chat...');
  await page.goto(BASE_URL + '/chat', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const item = await page.$('.chat-list-item');
  if (item) {
    console.log('Clicking chat list item...');
    await item.click();
    await page.waitForTimeout(2000);
  }

  // Type a message in input
  const input = await page.$('input[placeholder*="message" i], textarea[placeholder*="message" i]');
  if (input) {
    console.log('Typing message...');
    await input.fill("Hi Mentor Rahul, thanks for connecting! Looking forward to our session.");
    const sendBtn = await page.$('button[type="submit"], button.send-button, .message-input button, button:has-text("↑")');
    if (sendBtn) {
      await sendBtn.click();
      await page.waitForTimeout(2000);
    }
  }

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_chat.png') });
  console.log('Chat captured!');

  await browser.close();
})();
