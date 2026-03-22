import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const logo = join(root, 'logo.webp');

async function generate() {
  // apple-touch-icon.png (180x180)
  await sharp(logo)
    .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(join(root, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png (180x180)');

  // favicon-32x32.png
  await sharp(logo)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(join(root, 'favicon-32x32.png'));
  console.log('Created favicon-32x32.png (32x32)');

  // favicon-16x16.png
  await sharp(logo)
    .resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(join(root, 'favicon-16x16.png'));
  console.log('Created favicon-16x16.png (16x16)');

  // favicon.ico — use the 32x32 PNG buffer wrapped in ICO format
  // ICO is just a simple container; we'll generate a 32x32 PNG and wrap it
  const png32 = await sharp(logo)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // Build a minimal ICO file containing one 32x32 PNG image
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0);      // reserved
  icoHeader.writeUInt16LE(1, 2);      // type: 1 = ICO
  icoHeader.writeUInt16LE(1, 4);      // number of images

  const icoEntry = Buffer.alloc(16);
  icoEntry.writeUInt8(32, 0);         // width
  icoEntry.writeUInt8(32, 1);         // height
  icoEntry.writeUInt8(0, 2);          // color palette
  icoEntry.writeUInt8(0, 3);          // reserved
  icoEntry.writeUInt16LE(1, 4);       // color planes
  icoEntry.writeUInt16LE(32, 6);      // bits per pixel
  icoEntry.writeUInt32LE(png32.length, 8);  // image size
  icoEntry.writeUInt32LE(22, 12);     // offset (6 header + 16 entry = 22)

  const ico = Buffer.concat([icoHeader, icoEntry, png32]);
  writeFileSync(join(root, 'favicon.ico'), ico);
  console.log('Created favicon.ico (32x32)');

  console.log('Done!');
}

generate().catch(err => { console.error(err); process.exit(1); });
