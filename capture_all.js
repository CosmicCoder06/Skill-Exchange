const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const BASE_URL = 'https://skill-exchange-one-eta.vercel.app';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function waitClean(page, delay = 2000) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await new Promise(r => setTimeout(r, delay));
}

(async () => {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true
  });

  console.log('=== STEP 1: Desktop Screenshots (1440x900) ===');
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });

  const page = await desktopContext.newPage();

  // 1. Home / Landing page
  console.log('Capturing Home...');
  await page.goto(BASE_URL + '/', { waitUntil: 'networkidle' });
  await waitClean(page, 2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_home.png') });
  
  // Home scrolled
  console.log('Capturing Home scrolled...');
  await page.evaluate(() => window.scrollTo(0, 950));
  await waitClean(page, 1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01b_home_scrolled.png') });

  // 2. Login Page
  console.log('Capturing Login...');
  await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle' });
  await waitClean(page, 1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02a_login.png') });

  // 2b. Signup Page
  console.log('Capturing Signup...');
  await page.goto(BASE_URL + '/register', { waitUntil: 'networkidle' });
  await waitClean(page, 1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02b_signup.png') });

  // 3. Log in as Learner
  console.log('Logging in as Learner...');
  await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle' });
  await page.fill('#email', 'learner.demo@gla.ac.in');
  await page.fill('#password', 'Learner@123456');
  await page.click('button[type="submit"]');
  await waitClean(page, 3000);

  // 4. Learner Dashboard
  console.log('Capturing Learner Dashboard...');
  await page.goto(BASE_URL + '/learner-dashboard', { waitUntil: 'networkidle' });
  await waitClean(page, 2500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_learner_dashboard.png') });

  // 5. Discover Page
  console.log('Capturing Discover Page...');
  await page.goto(BASE_URL + '/discover', { waitUntil: 'networkidle' });
  await waitClean(page, 2500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_discover.png') });

  // 6. My Profile Page
  console.log('Capturing My Profile...');
  await page.goto(BASE_URL + '/profile', { waitUntil: 'networkidle' });
  await waitClean(page, 2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03a_my_profile.png') });

  // 7. Other User Profile (Demo Mentor)
  console.log('Capturing Other User Profile...');
  await page.goto(BASE_URL + '/profile/6ae18ac07449ec1785847ad0', { waitUntil: 'networkidle' });
  await waitClean(page, 2500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03b_other_user_profile.png') });

  // 8. Booking Flow Page
  console.log('Capturing Booking Flow...');
  await page.goto(BASE_URL + '/booking/6ae18ac07449ec1785847ad0', { waitUntil: 'networkidle' });
  await waitClean(page, 2500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_booking_flow.png') });

  // 9. Chat Page
  console.log('Capturing Chat Page...');
  await page.goto(BASE_URL + '/chat', { waitUntil: 'networkidle' });
  await waitClean(page, 2500);
  // Click on the conversation if present in the sidebar
  const convItem = await page.$('.conversation-item, .chat-list-item, .chat-user-item');
  if (convItem) {
    await convItem.click();
    await waitClean(page, 1500);
  }
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_chat.png') });

  // 10. Ratings & Reviews
  console.log('Capturing Ratings / Reviews...');
  // The mentor profile contains full reviews section
  await page.goto(BASE_URL + '/profile/6ae18ac07449ec1785847ad0', { waitUntil: 'networkidle' });
  await waitClean(page, 2000);
  // Scroll down to reviews section
  await page.evaluate(() => {
    const reviewsEl = document.querySelector('.reviews-section, .rating-card, .profile-reviews, .reviews-container');
    if (reviewsEl) {
      reviewsEl.scrollIntoView();
    } else {
      window.scrollTo(0, 450);
    }
  });
  await waitClean(page, 1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_ratings_reviews.png') });

  // 11. Mentor Dashboard
  console.log('Switching to Mentor Context...');
  const mentorContext = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const mentorPage = await mentorContext.newPage();
  await mentorPage.goto(BASE_URL + '/login', { waitUntil: 'networkidle' });
  await mentorPage.fill('#email', 'mentor.demo@gla.ac.in');
  await mentorPage.fill('#password', 'Mentor@123456');
  await mentorPage.click('button[type="submit"]');
  await waitClean(mentorPage, 3000);

  console.log('Capturing Mentor Dashboard...');
  await mentorPage.goto(BASE_URL + '/mentor-dashboard', { waitUntil: 'networkidle' });
  await waitClean(mentorPage, 2500);
  await mentorPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_mentor_dashboard.png') });

  // Mentor Earnings Tab
  console.log('Capturing Mentor Earnings Tab...');
  const earningsTab = await mentorPage.$('button:has-text("Earnings"), .tab:has-text("Earnings")');
  if (earningsTab) {
    await earningsTab.click();
    await waitClean(mentorPage, 1500);
    await mentorPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '06b_mentor_earnings.png') });
  }

  // 12. Admin Dashboard
  console.log('Switching to Admin Context...');
  const adminContext = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const adminPage = await adminContext.newPage();
  await adminPage.goto(BASE_URL + '/login', { waitUntil: 'networkidle' });
  await adminPage.fill('#email', 'admin-avhi@skillexchange.local');
  await adminPage.fill('#password', 'Admin@123456');
  await adminPage.click('button[type="submit"]');
  await waitClean(adminPage, 3000);

  console.log('Capturing Admin Overview...');
  await adminPage.goto(BASE_URL + '/admin', { waitUntil: 'networkidle' });
  await waitClean(adminPage, 2500);
  await adminPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '10_admin_dashboard.png') });

  // Admin Members / Users Tab
  console.log('Capturing Admin Members / Users...');
  const membersTab = await adminPage.$('button:has-text("Members")');
  if (membersTab) {
    await membersTab.click();
    await waitClean(adminPage, 1500);
    await adminPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '10b_admin_members.png') });
  }

  // 13. Dark Theme Versions
  console.log('Capturing Dark Theme...');
  await page.goto(BASE_URL + '/', { waitUntil: 'networkidle' });
  await waitClean(page, 1500);
  const themeToggle = await page.$('.theme-toggle');
  if (themeToggle) {
    await themeToggle.click();
    await waitClean(page, 1000);
  } else {
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    });
  }
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11a_dark_home.png') });

  // Dark Discover
  await page.goto(BASE_URL + '/discover', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
  });
  await waitClean(page, 1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11b_dark_discover.png') });

  // 14. Mobile View (390x844)
  console.log('Capturing Mobile Views (390x844)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true
  });
  const mobilePage = await mobileContext.newPage();

  // Mobile Home
  await mobilePage.goto(BASE_URL + '/', { waitUntil: 'networkidle' });
  await waitClean(mobilePage, 1500);
  await mobilePage.screenshot({ path: path.join(SCREENSHOTS_DIR, '12a_mobile_home.png') });

  // Mobile Login / Discover
  await mobilePage.goto(BASE_URL + '/discover', { waitUntil: 'networkidle' });
  await waitClean(mobilePage, 1500);
  await mobilePage.screenshot({ path: path.join(SCREENSHOTS_DIR, '12b_mobile_discover.png') });

  await browser.close();
  console.log('=== All screenshots captured successfully! ===');
})();
