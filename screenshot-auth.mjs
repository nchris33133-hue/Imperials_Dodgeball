import puppeteer from './node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url   = process.argv[2] || 'http://localhost:3000/dashboard.html';
const label = process.argv[3] || 'auth';
const screenshotDir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

let n = 1;
while (fs.existsSync(path.join(screenshotDir, `screenshot-${n}-${label}.png`))) n++;
const outPath = path.join(screenshotDir, `screenshot-${n}-${label}.png`);

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle2' });

// Inject auth session so login gate hides
await page.evaluate(() => sessionStorage.setItem('vi_admin_session', 'true'));
await page.reload({ waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 1000));

// Scroll to trigger any animations
const h = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y <= h; y += 630) {
  await page.evaluate(s => window.scrollTo(0, s), y);
  await new Promise(r => setTimeout(r, 150));
}
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise(r => setTimeout(r, 500));

await page.screenshot({ path: outPath, fullPage: true });
await browser.close();
console.log(`Saved: ${outPath}`);
