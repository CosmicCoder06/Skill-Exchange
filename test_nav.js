const { chromium } = require('playwright-core');

async function testPages() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  // Test 1: Home page logged out
  await page.goto('https://skill-exchange-one-eta.vercel.app/', { waitUntil: 'networkidle' });
  console.log('1. Home title:', await page.title());

  // Test 2: Login page
  await page.goto('https://skill-exchange-one-eta.vercel.app/login', { waitUntil: 'networkidle' });
  console.log('2. Login URL:', page.url());

  // Test 3: Register page
  await page.goto('https://skill-exchange-one-eta.vercel.app/register', { waitUntil: 'networkidle' });
  console.log('3. Register URL:', page.url());

  // Test 4: Log in as Learner
  console.log('4. Logging in as Learner...');
  await page.goto('https://skill-exchange-one-eta.vercel.app/login', { waitUntil: 'networkidle' });
  await page.fill('#email', 'learner.demo@gla.ac.in');
  await page.fill('#password', 'Learner@123456');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  console.log('Learner logged in URL:', page.url());

  // Check Discover
  await page.goto('https://skill-exchange-one-eta.vercel.app/discover', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const mentorCards = await page.$$eval('.mentor-card, .profile-card, .user-card, [class*="card"]', els => els.length);
  console.log('Discover cards count:', mentorCards);

  // Check Profile
  await page.goto('https://skill-exchange-one-eta.vercel.app/profile', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log('My Profile rendered. URL:', page.url());

  // Check Other User Profile
  await page.goto('https://skill-exchange-one-eta.vercel.app/profile/6ae18ac07449ec1785847ad0', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log('Other Profile rendered. Title/Name:', await page.textContent('h1, h2, .profile-name, .user-name').catch(() => 'n/a'));

  // Check Booking Page
  await page.goto('https://skill-exchange-one-eta.vercel.app/booking/6ae18ac07449ec1785847ad0', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log('Booking Page rendered.');

  // Check Learner Dashboard
  await page.goto('https://skill-exchange-one-eta.vercel.app/learner-dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log('Learner Dashboard rendered.');

  // Check Chat
  await page.goto('https://skill-exchange-one-eta.vercel.app/chat', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log('Chat page rendered.');

  await browser.close();
}

testPages().catch(console.error);
