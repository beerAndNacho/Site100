import { cpSync, existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SITES } from '../src/catalog.js';

const root = resolve(process.cwd());
const dist = resolve(root, 'dist');
const source = resolve(root, 'src', 'v5-depth-fixes.css');
const target = resolve(dist, 'assets', 'v5-depth-fixes.css');

if (!existsSync(dist) || !existsSync(source)) throw new Error('Missing dist directory or v5 depth fix source.');
cpSync(source, target);

function walk(directory) {
  for (const name of readdirSync(directory)) {
    const path = resolve(directory, name);
    if (statSync(path).isDirectory()) {
      walk(path);
      continue;
    }
    if (!name.endsWith('.html')) continue;
    let html = readFileSync(path, 'utf8');
    if (!html.includes('/Site100/assets/v5-depth-fixes.css')) {
      const depthTag = '<link rel="stylesheet" href="/Site100/assets/v5-depth.css">';
      if (!html.includes(depthTag)) throw new Error(`Missing v5 depth stylesheet in ${path}`);
      html = html.replace(depthTag, `${depthTag}<link rel="stylesheet" href="/Site100/assets/v5-depth-fixes.css">`);
      writeFileSync(path, html);
    }
  }
}
walk(dist);

for (const site of SITES) {
  const designPath = resolve(dist, 'sites', site.slug, 'design.json');
  const design = JSON.parse(readFileSync(designPath, 'utf8'));
  design.depthPatchVersion = '5.0.1';
  design.informationArchitecture.structuralPolicy = 'vertical-reading-pages';
  design.informationArchitecture.normalizedHomeOnlyLayouts = ['horizontal', 'poster', 'collage', 'archive', 'isometric'];
  writeFileSync(designPath, `${JSON.stringify(design, null, 2)}\n`);
}

const manifestPath = resolve(dist, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
manifest.depthPatchVersion = '5.0.1';
manifest.deepArchitecture.structuralPolicy = 'vertical-reading-pages';
manifest.deepArchitecture.fixedLayoutFamilies = ['horizontal', 'poster', 'collage', 'archive', 'isometric'];
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log('Applied Site100 v5.0.1 deep-page structural normalization.');
