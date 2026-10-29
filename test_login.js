const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });

  async function testLogin(role, email, pass) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 }
    });
    try {
      await page.goto('https://skill-exchange-one-eta.vercel.app/login', { waitUntil: 'networkidle' });
      await new Promise(r => setTimeout(r, 1000));
      
      console.log(`\n--- Testing login for ${role} (${email}) ---`);
      const inputs = await page.$$eval('input', els => els.map(e => ({ name: e.name, type: e.type, placeholder: e.placeholder, id: e.id })));
      console.log('Inputs found:', JSON.stringify(inputs));

      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', pass);
      
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
      } else {
        console.log('Submit button not found');
      }

      await new Promise(r => setTimeout(r, 4000));
      const url = page.url();
      const token = await page.evaluate(() => localStorage.getItem('Token') || localStorage.getItem('token'));
      const user = await page.evaluate(() => localStorage.getItem('User') || localStorage.getItem('user'));
      console.log(`${role} final URL: ${url}`);
      console.log(`${role} Token present: ${!!token}, User: ${user}`);
    } catch (e) {
      console.error(`${role} error:`, e.message);
    } finally {
      await page.close();
    }
  }

  await testLogin('Learner', '[email]', '[password]');
  await testLogin('Mentor', '[email]', '[password]');
  await testLogin('Admin', '[email]', '[password]');

  await browser.close();
})();
