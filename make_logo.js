const { chromium } = require('playwright-core');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="200" height="200">
    <polygon points="50,2 98,33 80,98 20,98 2,33" fill="#176b4e" stroke="#176b4e" stroke-width="2" stroke-linejoin="round"/>
    <text x="50" y="66" font-family="Arial, sans-serif" font-weight="900" font-size="40" fill="#ffffff" text-anchor="middle" letter-spacing="-2">SE</text>
  </svg>`;
  await page.setContent(`<div id="logo" style="display:inline-block;padding:0;background:transparent;">${svg}</div>`);
  const logoEl = await page.$('#logo');
  await logoEl.screenshot({ path: 'screenshots/logo.png', omitBackground: true });

  // Also a white polygon logo for dark green slides
  const svgWhite = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="200" height="200">
    <polygon points="50,2 98,33 80,98 20,98 2,33" fill="#ffffff" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
    <text x="50" y="66" font-family="Arial, sans-serif" font-weight="900" font-size="40" fill="#176b4e" text-anchor="middle" letter-spacing="-2">SE</text>
  </svg>`;
  await page.setContent(`<div id="logo-w" style="display:inline-block;padding:0;background:transparent;">${svgWhite}</div>`);
  const logoWEl = await page.$('#logo-w');
  await logoWEl.screenshot({ path: 'screenshots/logo_white.png', omitBackground: true });

  await browser.close();
  console.log('Logos saved to screenshots/logo.png and logo_white.png');
})();
