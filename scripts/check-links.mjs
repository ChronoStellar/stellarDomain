/**
 * Fail the build when a page references a local asset that isn't in the export.
 *
 * A wrong asset path is just a string: the build succeeds, the page returns 200,
 * and only the image 404s. That shipped twice — once when paths pointed into
 * content/ (never served), once when they missed the GitHub Pages basePath.
 *
 * Checks src/href targets in out/ against files on disk. Skips external URLs,
 * anchors, and data: URIs. Route links resolve via their .html file.
 */
import { readdirSync, existsSync, readFileSync, statSync } from 'node:fs';
import { join, posix } from 'node:path';

const OUT = 'out';
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '/stellarDomain';

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return htmlFiles(p);
    return e.name.endsWith('.html') ? [p] : [];
  });
}

function resolves(url) {
  const clean = url.split(/[?#]/)[0];
  if (!clean || clean === '/') return true;
  let rel = clean;
  if (BASE && (rel === BASE || rel.startsWith(`${BASE}/`))) rel = rel.slice(BASE.length) || '/';
  const disk = join(OUT, rel);
  // A route can be a plain file, a sibling .html (next export writes
  // projects.html beside the projects/ directory), or a directory index — so
  // check all three rather than letting the directory case short-circuit.
  if (existsSync(disk) && !statSync(disk).isDirectory()) return true;
  if (existsSync(`${disk}.html`)) return true;
  return existsSync(join(disk, 'index.html'));
}

if (!existsSync(OUT)) {
  console.error(`✗ ${OUT}/ not found — run \`next build\` first.`);
  process.exit(1);
}

const broken = new Map();
for (const file of htmlFiles(OUT)) {
  const html = readFileSync(file, 'utf8');
  for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const url = m[1];
    if (!url.startsWith('/') || url.startsWith('//')) continue; // external / protocol-relative
    if (resolves(url)) continue;
    if (!broken.has(url)) broken.set(url, new Set());
    broken.get(url).add(file);
  }
}

if (broken.size === 0) {
  console.log('✓ all local asset paths resolve');
  process.exit(0);
}

console.error(`✗ ${broken.size} broken local path(s):\n`);
for (const [url, pages] of [...broken].sort()) {
  console.error(`  ${url}`);
  for (const p of [...pages].sort().slice(0, 3)) console.error(`      ← ${p}`);
}
console.error('');
process.exit(1);
