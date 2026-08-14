#!/usr/bin/env node
/**
 * Generate the QR codes that connect the church building to this memorial.
 *
 *   node tools/qr.mjs --base https://your-deployment.example
 *
 * Writes scannable SVGs into assets/qr/:
 *
 *   memorial.svg   the wall, for a card standing by the candles
 *   parastos.svg   the Parastos request, for the parish notice board
 *   prayers.svg    the prayers, for the pew
 *   <id>.svg       one per person, for a 40-day notice or a grave marker
 *
 * The per-person codes point at #<id>, which the site resolves to that
 * person's Memory Page, so scanning a card by a grave opens their page.
 *
 * SVG rather than PNG because these get printed, sometimes quite large, and a
 * QR that has been resampled is a QR that does not scan.
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'assets', 'qr');
const dataFile = join(root, 'data', 'memorials.json');

function loadQRCode() {
  const require = createRequire(import.meta.url);
  try { return require('qrcode'); } catch { /* look in the npx cache */ }
  const cache = join(process.env.LOCALAPPDATA || process.env.HOME || '', 'npm-cache', '_npx');
  if (existsSync(cache)) {
    const { readdirSync } = require('node:fs');
    for (const dir of readdirSync(cache)) {
      const guess = join(cache, dir, 'node_modules', 'qrcode');
      if (existsSync(guess)) { try { return require(guess); } catch { /* keep looking */ } }
    }
  }
  return null;
}

const args = process.argv.slice(2);
const baseArg = args.find(a => a.startsWith('--base='))
  || (args.includes('--base') ? '--base=' + args[args.indexOf('--base') + 1] : null);

// No trailing slash, so joining a hash never produces a double slash.
const BASE = (baseArg ? baseArg.slice(7) : 'https://ortodox-church.vercel.app').replace(/\/+$/, '');

const QRCode = loadQRCode();
if (!QRCode) {
  console.error('The qrcode package is missing. Install it with:\n\n  npm i qrcode\n');
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
const data = JSON.parse(readFileSync(dataFile, 'utf8'));

const targets = [
  ['memorial', '#wall'],
  ['parastos', '#parastos'],
  ['prayers',  '#prayers'],
  ...data.entries.map(e => [e.id, '#' + e.id]),
];

// Quiet zone and high error correction: these are printed on paper that will
// live in a church, get thumbed, and be scanned in poor light.
const options = {
  type: 'svg',
  errorCorrectionLevel: 'H',
  margin: 2,
  color: { dark: '#140609', light: '#00000000' },   // ink on transparent
};

let n = 0;
for (const [name, hash] of targets) {
  const url = BASE + '/' + hash;
  const svg = await QRCode.toString(url, options);
  writeFileSync(join(outDir, `${name}.svg`), svg);
  console.log(`${name.padEnd(14)} ${url}`);
  n++;
}

console.log(`\n${n} codes written to assets/qr/ for ${BASE}`);
console.log('Re-run with --base to point them at a different deployment.');
