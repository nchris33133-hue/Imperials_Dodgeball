import puppeteer from './node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle2' });

// Inject admin session so rankings shows admin controls
await page.evaluate(() => sessionStorage.setItem('vi_admin_session', 'true'));
await page.reload({ waitUntil: 'networkidle2' });

// Scroll through entire page to trigger all reveal animations
const totalH = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y <= totalH; y += 400) {
  await page.evaluate(s => window.scrollTo(0, s), y);
  await new Promise(r => setTimeout(r, 80));
}
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise(r => setTimeout(r, 600));

const sections = [
  { id: 'hero',     label: '1-hero' },
  { id: 'about',    label: '2-about' },
  { id: 'how',      label: '3-how-it-works' },
  { id: 'league',   label: '4-league' },
  { id: 'why',      label: '5-why-join' },
  { id: 'rankings', label: '6-rankings' },
  { id: 'cta',      label: '7-cta' },
];

// Also capture footer separately
const footerSection = { tag: 'footer', label: '8-footer' };

for (const s of sections) {
  const rect = await page.evaluate(id => {
    const el = document.getElementById(id);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: 0, y: r.top + window.scrollY, width: 1440, height: r.height };
  }, s.id);

  if (!rect) { console.log(`Skipping ${s.id} – not found`); continue; }

  // Scroll section into view center so sticky nav doesn't block
  await page.evaluate(id => {
    document.getElementById(id).scrollIntoView({ behavior: 'instant', block: 'start' });
  }, s.id);
  await new Promise(r => setTimeout(r, 300));

  const outPath = path.join(screenshotDir, `${s.label}.png`);
  await page.screenshot({ path: outPath, clip: { x: rect.x, y: rect.y, width: rect.width, height: Math.ceil(rect.height) } });
  console.log(`Saved: ${s.label}.png`);
}

// Footer
const footerRect = await page.evaluate(() => {
  const el = document.querySelector('footer');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: 0, y: r.top + window.scrollY, width: 1440, height: r.height };
});
if (footerRect) {
  const outPath = path.join(screenshotDir, `${footerSection.label}.png`);
  await page.screenshot({ path: outPath, clip: { x: footerRect.x, y: footerRect.y, width: footerRect.width, height: Math.ceil(footerRect.height) } });
  console.log(`Saved: ${footerSection.label}.png`);
}

await browser.close();
console.log('All section screenshots done.');
