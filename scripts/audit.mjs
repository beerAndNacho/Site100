import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { SITES } from '../src/catalog.js';

const dist = resolve(process.cwd(), 'dist');
if (!existsSync(dist)) throw new Error('dist/ not found. Run npm run build first.');
const requiredAssets = ['catalog.js','app.js','styles.css','enhance.js','v2.css'];
for (const file of requiredAssets) if (!existsSync(resolve(dist, 'assets', file))) throw new Error(`Missing asset ${file}`);

const routes = readdirSync(resolve(dist, 'sites')).filter((slug) => statSync(resolve(dist, 'sites', slug)).isDirectory());
if (routes.length !== 100) throw new Error(`Expected 100 route directories, got ${routes.length}`);
const previewHashes = new Set();
const titles = new Set();
const canonicals = new Set();

for (const site of SITES) {
  const pagePath = resolve(dist, 'sites', site.slug, 'index.html');
  const designPath = resolve(dist, 'sites', site.slug, 'design.json');
  const previewPath = resolve(dist, 'previews', `${site.slug}.svg`);
  for (const path of [pagePath, designPath, previewPath]) if (!existsSync(path)) throw new Error(`Missing generated file ${path}`);
  const html = readFileSync(pagePath, 'utf8');
  const checks = [
    ['lang', '<html lang="ko">'],
    ['viewport', 'name="viewport"'],
    ['description', 'name="description"'],
    ['canonical', 'rel="canonical"'],
    ['open graph image', 'property="og:image"'],
    ['twitter card', 'name="twitter:card"'],
    ['structured data', 'application/ld+json'],
    ['base stylesheet', '/Site100/assets/styles.css'],
    ['v2 stylesheet', '/Site100/assets/v2.css'],
    ['app module', '/Site100/assets/app.js'],
    ['enhancement module', '/Site100/assets/enhance.js'],
    ['manifest', '/Site100/site.webmanifest']
  ];
  for (const [label, token] of checks) if (!html.includes(token)) throw new Error(`Missing ${label} in ${site.slug}`);
  const title = (html.match(/<title>(.*?)<\/title>/) || [])[1];
  const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  if (!title || titles.has(title)) throw new Error(`Duplicate or missing title ${site.slug}`);
  if (!canonical || canonicals.has(canonical)) throw new Error(`Duplicate or missing canonical ${site.slug}`);
  titles.add(title); canonicals.add(canonical);
  const design = JSON.parse(readFileSync(designPath, 'utf8'));
  if (design.version !== '2.0.0') throw new Error(`Unexpected design version ${site.slug}`);
  if (design.contentSignature !== `${site.kind}|${site.interaction}|${site.materials.join('|')}`) throw new Error(`Content signature mismatch ${site.slug}`);
  const preview = readFileSync(previewPath);
  const hash = createHash('sha256').update(preview).digest('hex');
  if (previewHashes.has(hash)) throw new Error(`Duplicate generated preview ${site.slug}`);
  previewHashes.add(hash);
}

for (const file of ['index.html','sitemap.xml','robots.txt','manifest.json','site.webmanifest','404.html','offline.html','icon.svg','preview-gallery.svg']) {
  if (!existsSync(resolve(dist, file))) throw new Error(`Missing root output ${file}`);
}
const gallery = readFileSync(resolve(dist, 'index.html'), 'utf8');
for (const token of ['CollectionPage','/Site100/assets/enhance.js','/Site100/assets/v2.css','preview-gallery.svg']) if (!gallery.includes(token)) throw new Error(`Gallery missing ${token}`);
const manifest = JSON.parse(readFileSync(resolve(dist, 'manifest.json'), 'utf8'));
if (manifest.count !== 100 || manifest.version !== '2.0.0') throw new Error('Invalid manifest summary');
if (!manifest.features.includes('comparison') || !manifest.features.includes('template-customizer')) throw new Error('Manifest missing v2 features');
console.log(`Audited ${routes.length} routes, ${previewHashes.size} unique previews, SEO metadata, structured data and v2 assets.`);
