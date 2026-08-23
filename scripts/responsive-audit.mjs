import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SITES } from '../src/catalog.js';

const dist = resolve(process.cwd(), 'dist');
const cssPath = resolve(dist, 'assets', 'v4-responsive.css');
const fixesCssPath = resolve(dist, 'assets', 'v4-responsive-fixes.css');
const runtimePath = resolve(dist, 'assets', 'responsive.js');
const fixesRuntimePath = resolve(dist, 'assets', 'responsive-fixes.js');
const reportPath = resolve(dist, 'responsive-static-report.json');

for (const path of [dist, cssPath, fixesCssPath, runtimePath, fixesRuntimePath, resolve(dist, 'responsive-matrix.json')]) {
  if (!existsSync(path)) throw new Error(`Missing responsive build output: ${path}`);
}

const css = `${readFileSync(cssPath, 'utf8')}\n${readFileSync(fixesCssPath, 'utf8')}`;
const runtime = `${readFileSync(runtimePath, 'utf8')}\n${readFileSync(fixesRuntimePath, 'utf8')}`;
const requiredCssTokens = [
  'env(safe-area-inset-top',
  'env(safe-area-inset-bottom',
  '@container world (max-width: 980px)',
  '@container world (max-width: 760px)',
  '@container world (max-width: 520px)',
  '@media (max-width: 390px)',
  '@media (max-height: 520px) and (orientation: landscape)',
  '@media (min-width: 1440px)',
  '@media print',
  'html[data-v4-keyboard-open="true"]',
  '.v4-dialog-fit',
  '.v4-drag-canvas',
  '.v4-scroll-region',
  '.v2-world-dock',
  '.v2-compare-dock',
  '.v2-compare-dock[hidden]',
  '.nav.nav-radial',
  'body[data-preview-device="mobile"] .world',
  '.world .v2-nav-toggle',
  'min-inline-size: 44px'
];
for (const token of requiredCssTokens) if (!css.includes(token)) throw new Error(`Responsive CSS missing ${token}`);

const layouts = ['editorial','horizontal','map','dashboard','poster','book','terminal','radial','shelf','timeline','split','floorplan','ticket','newspaper','masonry','monolith','isometric','wave','notebook','archive','kinetic','cinema','data','glass','collage'];
for (const layout of layouts) {
  if (!css.includes(`.layout-${layout}`) && !readFileSync(resolve(dist, 'assets', 'styles.css'), 'utf8').includes(`.layout-${layout}`)) {
    throw new Error(`Responsive layout coverage missing ${layout}`);
  }
}

const runtimeFeatures = [
  'viewportMetrics',
  'markScrollRegions',
  'markAdaptiveComponents',
  'setupMobileNavigation',
  'setupFixedAppUi',
  'setupFocusVisibility',
  'setupDialogs',
  'setupInteractiveDemos',
  'scanOverflow',
  'visualViewport',
  'ResizeObserver',
  'v4KeyboardOpen',
  'applyDevicePreview',
  'bindDeviceControls',
  'normalizeHiddenPanels'
];
for (const feature of runtimeFeatures) if (!runtime.includes(feature)) throw new Error(`Responsive runtime missing ${feature}`);

const enhancedSource = readFileSync(resolve(dist, 'assets', 'enhance.js'), 'utf8');
if (!enhancedSource.includes('root?.querySelector?.(selector) || null')) throw new Error('Gallery enhancement helper was not made null-safe');
if (!enhancedSource.includes('__SITE100_GALLERY_RETRY__')) throw new Error('Gallery enhancement retry guard missing');

const routes = readdirSync(resolve(dist, 'sites'));
if (routes.length !== 100) throw new Error(`Expected 100 site routes, got ${routes.length}`);
const failures = [];
for (const site of SITES) {
  const htmlPath = resolve(dist, 'sites', site.slug, 'index.html');
  const designPath = resolve(dist, 'sites', site.slug, 'design.json');
  if (!existsSync(htmlPath) || !existsSync(designPath)) {
    failures.push(`${site.slug}: missing generated files`);
    continue;
  }
  const html = readFileSync(htmlPath, 'utf8');
  const design = JSON.parse(readFileSync(designPath, 'utf8'));
  for (const asset of ['/Site100/assets/v4-responsive.css','/Site100/assets/v4-responsive-fixes.css','/Site100/assets/responsive.js','/Site100/assets/responsive-fixes.js']) {
    if (!html.includes(asset)) failures.push(`${site.slug}: missing ${asset}`);
  }
  if (design.responsiveVersion !== '4.0.0') failures.push(`${site.slug}: responsiveVersion mismatch`);
  if (design.responsive?.strategy !== 'viewport-and-container-queries') failures.push(`${site.slug}: responsive strategy mismatch`);
  if (!design.responsive?.capabilities?.includes('visual-viewport-keyboard')) failures.push(`${site.slug}: missing keyboard capability`);
  if (!design.responsive?.capabilities?.includes('container-query-preview')) failures.push(`${site.slug}: missing preview capability`);
}
if (failures.length) throw new Error(`Responsive route failures:\n${failures.slice(0, 30).join('\n')}`);

const gallery = readFileSync(resolve(dist, 'index.html'), 'utf8');
for (const token of ['/Site100/assets/v4-responsive.css','/Site100/assets/v4-responsive-fixes.css','/Site100/assets/responsive.js','/Site100/assets/responsive-fixes.js']) {
  if (!gallery.includes(token)) throw new Error(`Gallery missing ${token}`);
}
const manifest = JSON.parse(readFileSync(resolve(dist, 'manifest.json'), 'utf8'));
if (manifest.responsiveVersion !== '4.0.0') throw new Error('Manifest responsiveVersion mismatch');
if (manifest.responsiveSystem?.routeCoverage !== 100) throw new Error('Manifest responsive route coverage mismatch');
if (manifest.responsiveSystem?.auditedViewports?.length !== 7) throw new Error('Manifest responsive viewport matrix mismatch');
if (!manifest.responsiveSystem?.features?.includes('gallery-render-retry')) throw new Error('Manifest gallery retry feature missing');
if (!manifest.responsiveSystem?.features?.includes('radial-nav-normalization')) throw new Error('Manifest radial navigation feature missing');

const report = {
  version: '4.0.0',
  routes: 100,
  layouts: layouts.length,
  viewportMatrix: manifest.responsiveSystem.auditedViewports,
  cssChecks: requiredCssTokens.length,
  runtimeChecks: runtimeFeatures.length,
  fixes: ['gallery-render-retry','hidden-panel-priority','mobile-nav-layer','44px-touch-target','radial-nav-normalization','device-preview-binding'],
  failures: []
};
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Static responsive audit passed: ${report.routes} routes, ${report.layouts} layouts and ${report.viewportMatrix.length} viewport profiles.`);
