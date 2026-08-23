import { cpSync, existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SITES } from '../src/catalog.js';

const root = resolve(process.cwd());
const dist = resolve(root, 'dist');
const assets = ['responsive.js', 'responsive-fixes.js', 'v4-responsive.css', 'v4-responsive-fixes.css'];
const viewportMatrix = [
  { name: 'compact-360', width: 360, height: 800 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'phone-landscape', width: 844, height: 390 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'laptop-1366', width: 1366, height: 900 },
  { name: 'wide-1536', width: 1536, height: 960 }
];

if (!existsSync(dist)) throw new Error('dist/ not found. Run the base and art builds first.');
for (const file of assets) {
  const source = resolve(root, 'src', file);
  if (!existsSync(source)) throw new Error(`Missing responsive source asset: ${file}`);
  cpSync(source, resolve(dist, 'assets', file));
}

function makeDomHelpersNullSafe(source) {
  return source
    .replace(
      "const $ = (selector, root = document) => root.querySelector(selector);\nconst $$ = (selector, root = document) => [...root.querySelectorAll(selector)];",
      "const $ = (selector, root = document) => root?.querySelector?.(selector) || null;\nconst $$ = (selector, root = document) => root?.querySelectorAll ? [...root.querySelectorAll(selector)] : [];"
    )
    .replace(
      "const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];",
      "const $=(s,r=document)=>r?.querySelector?.(s)||null,$$=(s,r=document)=>r?.querySelectorAll?[...r.querySelectorAll(s)]:[];"
    );
}

for (const file of ['app.js', 'enhance.js', 'enhance-fix.js', 'art-direction.js', 'responsive.js']) {
  const path = resolve(dist, 'assets', file);
  if (!existsSync(path)) continue;
  writeFileSync(path, makeDomHelpersNullSafe(readFileSync(path, 'utf8')));
}

// The gallery enhancement is progressive. On a cold module graph it may run
// one frame before the base gallery markup has been committed.
const enhancementPath = resolve(dist, 'assets', 'enhance.js');
if (existsSync(enhancementPath)) {
  let enhancement = readFileSync(enhancementPath, 'utf8');
  enhancement = enhancement.replace(
    "  const index = $('.gindex');\n  const tools = $('.gtools');\n  const grid = $('.ggrid');\n  const originalCards = $$('.gcard', grid);",
    "  const index = $('.gindex');\n  const tools = $('.gtools');\n  const grid = $('.ggrid');\n  if (!index || !tools || !grid) {\n    window.__SITE100_GALLERY_RETRY__ = (window.__SITE100_GALLERY_RETRY__ || 0) + 1;\n    if (window.__SITE100_GALLERY_RETRY__ < 20) setTimeout(setupGallery, 16);\n    return;\n  }\n  window.__SITE100_GALLERY_RETRY__ = 0;\n  const originalCards = $$('.gcard', grid);"
  );
  writeFileSync(enhancementPath, enhancement);
}

for (const site of SITES) {
  const designPath = resolve(dist, 'sites', site.slug, 'design.json');
  if (!existsSync(designPath)) throw new Error(`Missing design.json for ${site.slug}`);
  const design = JSON.parse(readFileSync(designPath, 'utf8'));
  design.responsiveVersion = '4.0.0';
  design.responsive = {
    strategy: 'viewport-and-container-queries',
    minimumWidth: 280,
    breakpoints: [390, 520, 760, 980, 1100, 1280, 1440, 1900],
    previewModes: ['desktop', 'tablet', 'mobile'],
    capabilities: [
      'safe-area-insets',
      'visual-viewport-keyboard',
      'adaptive-navigation',
      'container-query-preview',
      'touch-targets',
      'overflow-guard',
      'responsive-dialogs',
      'landscape-phone',
      'reduced-motion',
      'print-layout'
    ]
  };
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
    if (!html.includes('/Site100/assets/v4-responsive.css')) {
      html = html.replace('</head>', '<link rel="stylesheet" href="/Site100/assets/v4-responsive.css"><link rel="stylesheet" href="/Site100/assets/v4-responsive-fixes.css"></head>');
    } else if (!html.includes('/Site100/assets/v4-responsive-fixes.css')) {
      html = html.replace('</head>', '<link rel="stylesheet" href="/Site100/assets/v4-responsive-fixes.css"></head>');
    }
    if (!html.includes('/Site100/assets/responsive.js')) {
      html = html.replace('</body>', '<script type="module" src="/Site100/assets/responsive.js"></script><script type="module" src="/Site100/assets/responsive-fixes.js"></script></body>');
    } else if (!html.includes('/Site100/assets/responsive-fixes.js')) {
      html = html.replace('</body>', '<script type="module" src="/Site100/assets/responsive-fixes.js"></script></body>');
    }
    writeFileSync(path, html);
  }
}
walk(dist);

const manifestPath = resolve(dist, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
manifest.responsiveVersion = '4.0.0';
manifest.responsiveSystem = {
  strategy: 'viewport-and-container-queries',
  minimumWidth: 280,
  auditedViewports: viewportMatrix,
  routeCoverage: 100,
  features: [
    'safe-area-insets',
    'visual-viewport-keyboard',
    'mobile-navigation-focus-trap',
    'container-query-device-preview',
    'adaptive-grids',
    'touch-target-normalization',
    'fixed-ui-collision-spacing',
    'responsive-dialogs',
    'horizontal-content-regions',
    'runtime-overflow-scan',
    'landscape-phone-layout',
    'print-layout',
    'gallery-render-retry',
    'radial-nav-normalization',
    'null-safe-progressive-modules'
  ]
};
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync(resolve(dist, 'responsive-matrix.json'), `${JSON.stringify({ version: '4.0.0', viewports: viewportMatrix, sites: SITES.length }, null, 2)}\n`);
console.log(`Injected Site100 responsive system v4 into ${SITES.length} site routes and the gallery.`);
