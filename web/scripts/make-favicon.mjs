// Generates web/app/favicon.ico from the pre-sized favicon PNGs in /logo.
// Emits a multi-size ICO (16 + 32) using PNG-compressed entries (universally
// supported by every browser). Zero dependencies — Node Buffer only.
//
//   node web/scripts/make-favicon.mjs
//
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, '..');
const logoDir = join(webRoot, '..', 'logo');

const sources = [
  { size: 16, file: join(logoDir, 'Favicon (Ikon di Tab Browser) 16.png') },
  { size: 32, file: join(logoDir, 'Favicon (Ikon di Tab Browser) 32.png') },
];

const images = sources.map((s) => ({ size: s.size, data: readFileSync(s.file) }));

const dirBytes = 6 + images.length * 16;
let offset = dirBytes;
const records = images.map((im) => {
  const rec = { size: im.size, data: im.data, offset };
  offset += im.data.length;
  return rec;
});

const buf = Buffer.alloc(offset);
let p = 0;
buf.writeUInt16LE(0, p); p += 2; // reserved
buf.writeUInt16LE(1, p); p += 2; // type = 1 (icon)
buf.writeUInt16LE(images.length, p); p += 2; // image count

for (const rec of records) {
  const dim = rec.size >= 256 ? 0 : rec.size;
  buf.writeUInt8(dim, p); p += 1; // width
  buf.writeUInt8(dim, p); p += 1; // height
  buf.writeUInt8(0, p); p += 1; // color count (0 = ≥256)
  buf.writeUInt8(0, p); p += 1; // reserved
  buf.writeUInt16LE(1, p); p += 2; // color planes
  buf.writeUInt16LE(32, p); p += 2; // bits per pixel
  buf.writeUInt32LE(rec.data.length, p); p += 4; // image size
  buf.writeUInt32LE(rec.offset, p); p += 4; // image offset
}

for (const rec of records) rec.data.copy(buf, rec.offset);

const out = join(webRoot, 'app', 'favicon.ico');
writeFileSync(out, buf);
console.log(`Wrote ${out} (${buf.length} bytes, sizes: ${images.map((i) => i.size).join(', ')})`);
