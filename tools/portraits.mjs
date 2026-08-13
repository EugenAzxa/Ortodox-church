#!/usr/bin/env node
/**
 * Wire real portraits into the memorial wall.
 *
 * Drop one photograph per person into assets/portraits/, named after that
 * person's id in data/memorials.json:
 *
 *   assets/portraits/milica-p.jpg
 *   assets/portraits/dragoljub-j.png
 *   assets/portraits/jelena-m.heic   <- convert this one yourself first
 *
 * Then run:
 *
 *   node tools/portraits.mjs
 *
 * It crops each photograph to the 3:4 the arches use, converts to webp, and
 * writes the path into the entry's "portrait" field. Anyone without a file
 * keeps the gold monogram, which is the honest state for a family that has no
 * usable photograph.
 *
 * Faces sit high in a portrait crop, so the crop is anchored at 30% from the
 * top rather than the centre. Override per person with --top=<id>:<0-100>.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const portraitDir = join(root, 'assets', 'portraits');
const dataFile = join(root, 'data', 'memorials.json');
const ACCEPT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff']);

// sharp is only needed by this tool, never by the site.
function loadSharp() {
  const require = createRequire(import.meta.url);
  try { return require('sharp'); } catch { /* fall through */ }
  const cache = join(process.env.LOCALAPPDATA || process.env.HOME || '', 'npm-cache', '_npx');
  if (existsSync(cache)) {
    for (const dir of readdirSync(cache)) {
      const guess = join(cache, dir, 'node_modules', 'sharp');
      if (existsSync(guess)) { try { return require(guess); } catch { /* keep looking */ } }
    }
  }
  return null;
}

const tops = new Map(
  process.argv.slice(2)
    .filter(a => a.startsWith('--top='))
    .map(a => a.slice(6).split(':'))
    .filter(p => p.length === 2)
    .map(([id, pct]) => [id, Math.max(0, Math.min(100, Number(pct))) / 100])
);

if (!existsSync(portraitDir)) {
  mkdirSync(portraitDir, { recursive: true });
  console.log(`Created ${portraitDir}`);
}

const sharp = loadSharp();
const data = JSON.parse(readFileSync(dataFile, 'utf8'));
const byId = new Map(data.entries.map(e => [e.id, e]));

const files = readdirSync(portraitDir).filter(f => ACCEPT.has(extname(f).toLowerCase()));
if (!files.length) {
  console.log(`No photographs in assets/portraits/.\n`);
  console.log('Expected one file per person, named after their id:');
  for (const e of data.entries) console.log(`  ${e.id.padEnd(14)} ${e.name}`);
  process.exit(0);
}

let wired = 0, skipped = 0;

for (const file of files) {
  const id = basename(file, extname(file));
  const entry = byId.get(id);
  if (!entry) {
    console.warn(`skip  ${file} – no entry with id "${id}"`);
    skipped++;
    continue;
  }

  const out = `assets/portraits/${id}.webp`;
  const alreadyWebp = extname(file).toLowerCase() === '.webp';

  if (sharp) {
    const gravityTop = tops.has(id) ? tops.get(id) : 0.3;
    // Read into memory first. A .webp input writes to the same path it was read
    // from, and on Windows the still-open source cannot be replaced.
    const img = sharp(readFileSync(join(portraitDir, file)));
    const { width, height } = await img.metadata();
    // Take the widest 3:4 box we can, anchored high for the face.
    const cropW = Math.min(width, Math.round(height * 0.75));
    const cropH = Math.min(height, Math.round(cropW / 0.75));
    const left = Math.round((width - cropW) / 2);
    const top = Math.round(Math.min(Math.max(0, (height - cropH) * gravityTop), height - cropH));

    const webp = await img
      .extract({ left, top, width: cropW, height: cropH })
      .resize(700, 933, { fit: 'cover' })
      .webp({ quality: 84 })
      .toBuffer();

    writeFileSync(join(root, out), webp);
    console.log(`ok    ${entry.name.padEnd(22)} ${file} -> ${out}`);
  } else if (alreadyWebp) {
    console.log(`ok    ${entry.name.padEnd(22)} ${file} (used as-is, sharp not installed)`);
  } else {
    console.warn(`skip  ${file} – needs sharp to convert. Run: npm i sharp`);
    skipped++;
    continue;
  }

  entry.portrait = out;
  wired++;
}

writeFileSync(dataFile, JSON.stringify(data, null, 2) + '\n');

console.log(`\n${wired} portrait${wired === 1 ? '' : 's'} wired, ${skipped} skipped.`);
const missing = data.entries.filter(e => !e.portrait);
if (missing.length) {
  console.log(`Still on a monogram: ${missing.map(e => e.id).join(', ')}`);
}
