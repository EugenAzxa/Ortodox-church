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

function flagMap(prefix, clamp) {
  return new Map(
    process.argv.slice(2)
      .filter(a => a.startsWith(prefix))
      .map(a => a.slice(prefix.length).split(':'))
      .filter(p => p.length === 2)
      .map(([id, value]) => [id, clamp(Number(value))])
  );
}

const tops = flagMap('--top=', v => Math.max(0, Math.min(100, v)) / 100);

/* Photographs are framed very differently. A studio portrait leaves half the
   frame empty above the head while a phone snap fills it, and side by side on
   the wall that reads as a mistake. --zoom=<id>:<percent> tightens one crop so
   every head lands at roughly the same scale. */
const zooms = flagMap('--zoom=', v => Math.max(20, Math.min(100, v)) / 100);

if (!existsSync(portraitDir)) {
  mkdirSync(portraitDir, { recursive: true });
  console.log(`Created ${portraitDir}`);
}

const sharp = loadSharp();
const data = JSON.parse(readFileSync(dataFile, 'utf8'));
const byId = new Map(data.entries.map(e => [e.id, e]));

/* One source per person. The tool writes <id>.webp into the same folder it
   reads from, so after one run a .webp output sits alongside the original and
   would otherwise be picked up as a second source for the same person. Where
   both exist the original wins, since re-cropping a crop loses quality. */
const allFiles = readdirSync(portraitDir).filter(f => ACCEPT.has(extname(f).toLowerCase()));
const byPerson = new Map();
for (const file of allFiles) {
  const id = basename(file, extname(file));
  const isOutput = extname(file).toLowerCase() === '.webp';
  const held = byPerson.get(id);
  if (!held || (extname(held).toLowerCase() === '.webp' && !isOutput)) byPerson.set(id, file);
}
const files = [...byPerson.values()].sort();

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
    // Take the widest 3:4 box we can, anchored high for the face, then tighten
    // it if this one was given a zoom.
    const zoom = zooms.has(id) ? zooms.get(id) : 1;
    // Fit the largest 3:4 box inside the image, then apply the zoom, then clamp
    // back inside the bounds. Without the final clamp a source that is already
    // 3:4 produces a crop one pixel taller than itself and a negative offset.
    let cropW = Math.round(Math.min(width, height * 0.75) * zoom);
    let cropH = Math.round(cropW / 0.75);
    if (cropH > height) { cropH = height; cropW = Math.round(cropH * 0.75); }
    if (cropW > width)  { cropW = width;  cropH = Math.round(cropW / 0.75); }

    const left = Math.max(0, Math.min(Math.round((width - cropW) / 2), width - cropW));
    const top  = Math.max(0, Math.min(Math.round((height - cropH) * gravityTop), height - cropH));

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
