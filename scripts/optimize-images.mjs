/**
 * Resize and convert source images to WebP for the site.
 *
 * Reads originals from assets-original/<project>/, writes optimised WebP to
 * public/projects/<project>/. Originals stay untouched so a re-export at
 * different settings is always possible.
 *
 * Usage:
 *   node scripts/optimize-images.mjs           # convert everything
 *   node scripts/optimize-images.mjs rulaa     # just one project directory
 *
 * Quality is chosen per image by content, not globally: lossy WebP rings around
 * sharp edges, so anything carrying text or line art needs a higher setting than
 * a photograph does. See TEXT_LIKE below.
 */
import sharp from 'sharp';
import { readdirSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'assets-original';
const DEST = 'public/projects';

/** Max width in px. 2x the widest container (~770px) so retina stays sharp. */
const MAX_WIDTH = 1600;

/** Photographs compress cleanly this low. */
const Q_PHOTO = 82;

/** Screenshots, diagrams, charts — anything with text or hard edges. */
const Q_TEXT = 92;

/** Filename fragments that mark an image as text/line-art rather than photo. */
const TEXT_LIKE = ['diagram', 'sample', 'models', 'chart', 'graph', 'fit_functions', 'screenshot'];

const isTextLike = (name) => TEXT_LIKE.some((k) => name.toLowerCase().includes(k));
const kb = (n) => `${Math.round(n / 1e3)} KB`;

/**
 * Mean absolute error per channel, 0-255 — compression loss only.
 *
 * The original is resized with the same settings as the output before
 * comparing. Comparing against the full-size original instead would fold
 * resampling difference into the score and overstate the loss several times
 * over on detailed images.
 */
async function deviation(srcPath, outPath) {
  const meta = await sharp(outPath).metadata();
  const a = await sharp(srcPath)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .removeAlpha()
    .raw()
    .toBuffer();
  const b = await sharp(outPath).removeAlpha().raw().toBuffer();
  if (a.length !== b.length) return NaN; // dimensions diverged; skip rather than lie
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum / a.length;
}

if (!existsSync(SRC)) {
  console.error(`✗ ${SRC}/ not found. Put original images in ${SRC}/<project>/ first.`);
  process.exit(1);
}

const only = process.argv[2];
const dirs = readdirSync(SRC).filter((d) => statSync(join(SRC, d)).isDirectory() && (!only || d === only));

if (dirs.length === 0) {
  console.error(`✗ no matching directory in ${SRC}/${only ? ` for "${only}"` : ''}`);
  process.exit(1);
}

let totalBefore = 0;
let totalAfter = 0;
let warnings = 0;

for (const dir of dirs) {
  mkdirSync(join(DEST, dir), { recursive: true });
  for (const file of readdirSync(join(SRC, dir))) {
    if (!/\.(png|jpe?g|webp)$/i.test(file)) continue;

    const src = join(SRC, dir, file);
    const out = join(DEST, dir, file.replace(/\.[^.]+$/, '.webp'));
    const quality = isTextLike(file) ? Q_TEXT : Q_PHOTO;
    const before = statSync(src).size;

    const info = await sharp(src)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality, effort: 6 })
      .toFile(out);

    const mae = await deviation(src, out);
    // Above ~4 the loss starts being visible on text; re-check that image by eye.
    const flag = mae > 4 ? '  ⚠ high deviation — inspect' : '';
    if (mae > 4) warnings++;

    totalBefore += before;
    totalAfter += info.size;
    console.log(
      `${`${dir}/${file}`.padEnd(38)} q${quality}  ${kb(before).padStart(8)} → ${kb(info.size).padStart(7)}  ` +
      `${info.width}x${info.height}  MAE=${mae.toFixed(2)}${flag}`
    );
  }
}

const pct = totalBefore ? ((1 - totalAfter / totalBefore) * 100).toFixed(0) : 0;
console.log(`\n${(totalBefore / 1e6).toFixed(2)} MB → ${kb(totalAfter)}  (−${pct}%)`);
if (warnings) console.log(`${warnings} image(s) flagged — check them before shipping.`);
console.log('\nReference images as /projects/<project>/<name>.webp in markdown.');
