import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { SITES } from '../src/catalog.js';

const dist = resolve(process.cwd(), 'dist');
const DIRECTIONS = ['atelier','precision','interface','notebook','organic','studio','atlas','catalog','civic','experimental'];
const directionFor = (site) => DIRECTIONS[Math.min(9, Math.floor((site.id - 1) / 10))];

for (const path of [
  resolve(dist, 'assets', 'art-direction.js'),
  resolve(dist, 'assets', 'v3.css'),
  resolve(dist, 'artworks')
]) {
  if (!existsSync(path)) throw new Error(`Missing Site100 v3 output: ${path}`);
}

const artworks = readdirSync(resolve(dist, 'artworks')).filter((name) => name.endsWith('.svg'));
if (artworks.length !== 100) throw new Error(`Expected 100 v3 artworks, got ${artworks.length}`);
const hashes = new Set();
const directionCounts = new Map(DIRECTIONS.map((direction) => [direction, 0]));

for (const site of SITES) {
  const direction = directionFor(site);
  directionCounts.set(direction, directionCounts.get(direction) + 1);
  const artPath = resolve(dist, 'artworks', `${site.slug}.svg`);
  const pagePath = resolve(dist, 'sites', site.slug, 'index.html');
  const designPath = resolve(dist, 'sites', site.slug, 'design.json');
  if (!existsSync(artPath)) throw new Error(`Missing artwork for ${site.slug}`);
  const svg = readFileSync(artPath, 'utf8');
  for (const token of ['<svg', site.name, site.kind, site.materials[0], 'aria-labelledby']) {
    if (!svg.includes(token)) throw new Error(`Artwork ${site.slug} missing ${token}`);
  }
  const hash = createHash('sha256').update(svg).digest('hex');
  if (hashes.has(hash)) throw new Error(`Duplicate v3 artwork: ${site.slug}`);
  hashes.add(hash);

  const html = readFileSync(pagePath, 'utf8');
  if (!html.includes('/Site100/assets/v3.css')) throw new Error(`Missing v3.css in ${site.slug}`);
  if (!html.includes('/Site100/assets/art-direction.js')) throw new Error(`Missing art-direction.js in ${site.slug}`);

  const design = JSON.parse(readFileSync(designPath, 'utf8'));
  if (design.visualVersion !== '3.0.0') throw new Error(`Visual version mismatch: ${site.slug}`);
  if (design.artDirection !== direction) throw new Error(`Art direction mismatch: ${site.slug}`);
  if (design.artwork !== `/Site100/artworks/${site.slug}.svg`) throw new Error(`Artwork path mismatch: ${site.slug}`);
}

for (const [direction, count] of directionCounts) {
  if (count !== 10) throw new Error(`Expected 10 sites in art direction ${direction}, got ${count}`);
}

const gallery = readFileSync(resolve(dist, 'index.html'), 'utf8');
for (const token of ['/Site100/assets/v3.css','/Site100/assets/art-direction.js']) {
  if (!gallery.includes(token)) throw new Error(`Gallery missing ${token}`);
}
const manifest = JSON.parse(readFileSync(resolve(dist, 'manifest.json'), 'utf8'));
if (manifest.visualVersion !== '3.0.0') throw new Error('Manifest missing visualVersion 3.0.0');
if (manifest.visualSystem?.artworkCount !== 100) throw new Error('Manifest artwork count mismatch');
if (JSON.stringify(manifest.visualSystem?.directions) !== JSON.stringify(DIRECTIONS)) throw new Error('Manifest art direction mismatch');

const css = readFileSync(resolve(dist, 'assets', 'v3.css'), 'utf8');
const runtime = readFileSync(resolve(dist, 'assets', 'art-direction.js'), 'utf8');
for (const direction of DIRECTIONS) {
  if (!css.includes(`[data-v3-direction="${direction}"]`)) throw new Error(`Missing CSS art direction ${direction}`);
  if (!runtime.includes(`'${direction}'`)) throw new Error(`Missing runtime art direction ${direction}`);
}
for (const feature of ['v3-hero-stage','v3-material-marquee','v3-section-rail','v3-runway','v3-footer-statement','v3-card-art']) {
  if (!css.includes(`.${feature}`) || !runtime.includes(feature)) throw new Error(`Missing visual feature ${feature}`);
}
console.log(`Audited Site100 v3: ${hashes.size} unique artworks, 10 art directions and all visual runtime features.`);
