import { cpSync, existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SITES } from '../src/catalog.js';

const root = resolve(process.cwd());
const dist = resolve(root, 'dist');
const responsiveRuntime = resolve(root, 'src', 'responsive-v4.js');
const fixesSource = resolve(root, 'src', 'v4-fixes.css');
const responsiveOutput = resolve(dist, 'assets', 'responsive.js');

for (const path of [dist, responsiveRuntime, fixesSource]) {
  if (!existsSync(path)) throw new Error(`Missing responsive patch input: ${path}`);
}

cpSync(responsiveRuntime, responsiveOutput);
cpSync(fixesSource, resolve(dist, 'assets', 'v4-fixes.css'));

let runtimeSource = readFileSync(responsiveOutput, 'utf8');
const rawOverflowAssignment = '  ROOT.dataset.v4DocumentOverflow = String(Math.max(ROOT.scrollWidth, BODY.scrollWidth) > viewportWidth + 2);';
const clippedOverflowAssignment = `  const rawDocumentOverflow = Math.max(ROOT.scrollWidth, BODY.scrollWidth) - viewportWidth;\n  const rootClipsHorizontalOverflow = [ROOT, BODY].some((element) => {\n    const overflow = getComputedStyle(element).overflowX;\n    return overflow === 'hidden' || overflow === 'clip';\n  });\n  ROOT.dataset.v4ClippedDecorativeOverflow = String(rawDocumentOverflow > 2 && rootClipsHorizontalOverflow);\n  ROOT.dataset.v4DocumentOverflow = String(rawDocumentOverflow > 2 && !rootClipsHorizontalOverflow);`;
if (!runtimeSource.includes(rawOverflowAssignment)) {
  throw new Error('Unable to locate the responsive document overflow assignment.');
}
runtimeSource = runtimeSource.replace(rawOverflowAssignment, () => clippedOverflowAssignment);
writeFileSync(responsiveOutput, runtimeSource);

for (const site of SITES) {
  const designPath = resolve(dist, 'sites', site.slug, 'design.json');
  if (!existsSync(designPath)) throw new Error(`Missing design.json for ${site.slug}`);
  const design = JSON.parse(readFileSync(designPath, 'utf8'));
  design.responsiveVersion = '4.0.0';
  design.responsivePatchVersion = '4.0.1';
  design.responsive.patch = 'browser-audit-fixes';
  design.responsive.capabilities = [...new Set([
    ...(design.responsive.capabilities || []),
    'hero-navigation-layering',
    'normalized-touch-targets',
    'dialog-inline-containment',
    'forced-device-preview-widths',
    'clipped-decoration-overflow-policy'
  ])];
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
    if (!html.includes('/Site100/assets/v4-fixes.css')) {
      const previousFixTag = '<link rel="stylesheet" href="/Site100/assets/v4-responsive-fixes.css">';
      const baseTag = '<link rel="stylesheet" href="/Site100/assets/v4-responsive.css">';
      if (html.includes(previousFixTag)) {
        html = html.replace(previousFixTag, `${previousFixTag}<link rel="stylesheet" href="/Site100/assets/v4-fixes.css">`);
      } else {
        html = html.replace(baseTag, `${baseTag}<link rel="stylesheet" href="/Site100/assets/v4-fixes.css">`);
      }
    }
    writeFileSync(path, html);
  }
}
walk(dist);

const manifestPath = resolve(dist, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
manifest.responsiveVersion = '4.0.0';
manifest.responsivePatchVersion = '4.0.1';
manifest.responsiveSystem.patch = 'browser-audit-fixes';
manifest.responsiveSystem.fixedFailureClasses = [
  'gallery-null-root',
  'mobile-navigation-hit-layer',
  'touch-target-width',
  'dialog-inline-overflow',
  'radial-navigation-bounds',
  'simulated-device-preview-width',
  'clipped-decoration-overflow-flag'
];
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log('Applied Site100 responsive v4.0.1 browser-audit patch to the gallery and 100 routes.');
