import { cpSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SITES } from '../src/catalog.js';
import { polishedSite } from '../src/copy.js';

const root = resolve(process.cwd());
const dist = resolve(root, 'dist');
const assets = ['enhance-fix.js', 'copy.js', 'copy-bootstrap.js'];

if (!existsSync(dist)) throw new Error('Missing dist directory.');
for (const file of assets) {
  const source = resolve(root, 'src', file);
  const target = resolve(dist, 'assets', file);
  if (!existsSync(source)) throw new Error(`Missing postbuild source ${file}`);
  cpSync(source, target);
}

for (const site of SITES) {
  const polished = polishedSite(site);
  const pagePath = resolve(dist, 'sites', site.slug, 'index.html');
  const designPath = resolve(dist, 'sites', site.slug, 'design.json');
  if (!existsSync(pagePath) || !existsSync(designPath)) throw new Error(`Missing generated site ${site.slug}`);

  const html = readFileSync(pagePath, 'utf8').replaceAll(site.tagline, polished.tagline);
  writeFileSync(pagePath, html);

  const design = JSON.parse(readFileSync(designPath, 'utf8'));
  design.tagline = polished.tagline;
  design.services = polished.services;
  design.copyVersion = '2.1.0';
  writeFileSync(designPath, `${JSON.stringify(design, null, 2)}\n`);
}

function walk(directory) {
  for (const name of readdirSync(directory)) {
    const path = resolve(directory, name);
    if (statSync(path).isDirectory()) {
      walk(path);
      continue;
    }
    if (!name.endsWith('.html')) continue;

    let html = readFileSync(path, 'utf8');
    if (html.includes('/Site100/assets/app.js') && !html.includes('/Site100/assets/copy-bootstrap.js')) {
      html = html.replace(
        '<script type="module" src="/Site100/assets/app.js"></script>',
        '<script type="module" src="/Site100/assets/copy-bootstrap.js"></script><script type="module" src="/Site100/assets/app.js"></script>'
      );
    }
    if (html.includes('/Site100/assets/enhance.js') && !html.includes('/Site100/assets/enhance-fix.js')) {
      html = html.replace('</body>', '<script type="module" src="/Site100/assets/enhance-fix.js"></script></body>');
    }
    writeFileSync(path, html);
  }
}

walk(dist);
console.log('Applied natural Korean copy, runtime bootstrap and Site100 v2 compatibility layer.');
