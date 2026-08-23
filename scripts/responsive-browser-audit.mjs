import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { SITES } from '../src/catalog.js';

const root = resolve(process.cwd());
const dist = resolve(root, 'dist');
const reports = resolve(dist, 'reports');
const screenshots = resolve(reports, 'responsive-failures');
mkdirSync(screenshots, { recursive: true });

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

if (!existsSync(resolve(dist, 'index.html'))) throw new Error('dist/index.html not found. Run npm run build first.');

function startServer() {
  return new Promise((resolveServer, reject) => {
    const server = createServer((request, response) => {
      try {
        const url = new URL(request.url || '/', 'http://127.0.0.1');
        let pathname = decodeURIComponent(url.pathname).replace(/^\/Site100/, '') || '/';
        pathname = normalize(pathname).replace(/^([.][.][/\\])+/, '');
        let filePath = join(dist, pathname);
        if (existsSync(filePath) && statSync(filePath).isDirectory()) filePath = join(filePath, 'index.html');
        if (!existsSync(filePath)) {
          response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
          response.end('Not found');
          return;
        }
        response.writeHead(200, {
          'content-type': mime[extname(filePath)] || 'application/octet-stream',
          'cache-control': 'no-store'
        });
        response.end(readFileSync(filePath));
      } catch (error) {
        response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
        response.end(String(error));
      }
    });
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolveServer({ server, origin: `http://127.0.0.1:${address.port}/Site100` });
    });
  });
}

const allRoutes = [
  { name: 'gallery', path: '/' },
  ...SITES.map((site) => ({ name: site.slug, path: `/sites/${site.slug}/` }))
];
const representativeSlugs = new Set([
  'gallery',
  'salt-bakery',
  'harbor-law',
  'endpoint-api',
  'compile-bootcamp',
  'still-yoga',
  'framework-film',
  'dal-hanok-stay',
  'table7-restaurant',
  'open-hand-nonprofit',
  'desktop-cv',
  '100worlds-gallery'
]);
const representativeRoutes = allRoutes.filter((route) => representativeSlugs.has(route.name));

const profiles = [
  { name: 'compact-360', width: 360, height: 800, routes: allRoutes, mobile: true, touch: true },
  { name: 'desktop-1366', width: 1366, height: 900, routes: allRoutes, mobile: false, touch: false },
  { name: 'mobile-390', width: 390, height: 844, routes: representativeRoutes, mobile: true, touch: true },
  { name: 'phone-landscape', width: 844, height: 390, routes: representativeRoutes, mobile: true, touch: true },
  { name: 'tablet-768', width: 768, height: 1024, routes: representativeRoutes, mobile: false, touch: true },
  { name: 'tablet-landscape', width: 1024, height: 768, routes: representativeRoutes, mobile: false, touch: true },
  { name: 'wide-1536', width: 1536, height: 960, routes: representativeRoutes, mobile: false, touch: false }
];

function sanitize(value) {
  return value.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '');
}

async function inspectPage(page, profile, route) {
  const result = await page.evaluate(({ width }) => {
    const visible = (element) => {
      if (!element || element.hidden) return false;
      const style = getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const scrollableAncestor = (element) => {
      let parent = element.parentElement;
      while (parent && parent !== document.body) {
        const style = getComputedStyle(parent);
        if (['auto', 'scroll'].includes(style.overflowX) || parent.classList.contains('v4-scroll-region')) return parent;
        parent = parent.parentElement;
      }
      return null;
    };
    const describe = (element) => {
      const id = element.id ? `#${element.id}` : '';
      const classes = [...element.classList].slice(0, 4).map((name) => `.${name}`).join('');
      return `${element.tagName.toLowerCase()}${id}${classes}`;
    };

    const documentOverflow = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth;
    const criticalSelectors = [
      '.nav', '.hero', '.section', '.demo', '.contact form', '.v2-world-explorer',
      '.v3-footer-statement', '.gintro', '.gindex', '.gcard-shell', '.v2-gallery-toolbar',
      '.v3-runway', '.gallery > footer', '.world > footer', '.v2-dialog[open]'
    ];
    const outOfBounds = [];
    document.querySelectorAll(criticalSelectors.join(',')).forEach((element) => {
      if (!visible(element)) return;
      if (width > 980 && element.closest('.layout-horizontal main')) return;
      if (scrollableAncestor(element)) return;
      const rect = element.getBoundingClientRect();
      if (rect.width > window.innerWidth + 10 || rect.left < -10 || rect.right > window.innerWidth + 10) {
        outOfBounds.push({ element: describe(element), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) });
      }
    });

    const textOverflow = [];
    document.querySelectorAll('h1,h2,h3,h4,p,blockquote,figcaption,label,summary,button,output').forEach((element) => {
      if (!visible(element) || scrollableAncestor(element)) return;
      const style = getComputedStyle(element);
      if (['auto', 'scroll'].includes(style.overflowX)) return;
      if (element.scrollWidth > element.clientWidth + 5) textOverflow.push({ element: describe(element), overflow: element.scrollWidth - element.clientWidth });
    });

    const smallTargets = [];
    if (window.innerWidth <= 760) {
      document.querySelectorAll('button,input,select,textarea,summary,.nav a,.gallery > header a').forEach((element) => {
        if (!visible(element)) return;
        if (element.matches('input[type="hidden"]')) return;
        const rect = element.getBoundingClientRect();
        if (rect.width < 39 || rect.height < 39) smallTargets.push({ element: describe(element), width: Math.round(rect.width), height: Math.round(rect.height) });
      });
    }

    const fixedUi = [...document.querySelectorAll('[data-v4-ui]')].filter(visible);
    const fixedOverlaps = [];
    for (let firstIndex = 0; firstIndex < fixedUi.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < fixedUi.length; secondIndex += 1) {
        const first = fixedUi[firstIndex].getBoundingClientRect();
        const second = fixedUi[secondIndex].getBoundingClientRect();
        const widthOverlap = Math.max(0, Math.min(first.right, second.right) - Math.max(first.left, second.left));
        const heightOverlap = Math.max(0, Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top));
        if (widthOverlap * heightOverlap > 80) fixedOverlaps.push(`${describe(fixedUi[firstIndex])} ↔ ${describe(fixedUi[secondIndex])}`);
      }
    }

    const mediaOverflow = [];
    document.querySelectorAll('img,svg,video,canvas').forEach((element) => {
      if (!visible(element)) return;
      const rect = element.getBoundingClientRect();
      const parentRect = element.parentElement?.getBoundingClientRect();
      if (parentRect && rect.width > parentRect.width + 8 && !scrollableAncestor(element)) mediaOverflow.push(describe(element));
    });

    return {
      runtime: document.documentElement.dataset.responsiveVersion || '',
      breakpoint: document.documentElement.dataset.v4Breakpoint || '',
      orientation: document.documentElement.dataset.v4Orientation || '',
      documentOverflow: Math.round(documentOverflow),
      outOfBounds: outOfBounds.slice(0, 20),
      textOverflow: textOverflow.slice(0, 20),
      smallTargets: smallTargets.slice(0, 20),
      fixedOverlaps,
      mediaOverflow: mediaOverflow.slice(0, 20),
      worldWidth: Math.round(document.querySelector('.world,.gallery')?.getBoundingClientRect().width || 0),
      bodyWidth: Math.round(document.body.getBoundingClientRect().width),
      hasHorizontalFlag: document.documentElement.dataset.v4DocumentOverflow === 'true'
    };
  }, { width: profile.width });

  const failures = [];
  if (result.runtime !== '4.0.0') failures.push(`responsive runtime missing (${result.runtime || 'none'})`);
  if (result.documentOverflow > 3) failures.push(`document overflow ${result.documentOverflow}px`);
  if (result.hasHorizontalFlag) failures.push('runtime horizontal overflow flag is true');
  if (result.outOfBounds.length) failures.push(`out-of-bounds: ${JSON.stringify(result.outOfBounds.slice(0, 5))}`);
  if (result.textOverflow.length) failures.push(`text overflow: ${JSON.stringify(result.textOverflow.slice(0, 5))}`);
  if (result.smallTargets.length) failures.push(`small touch targets: ${JSON.stringify(result.smallTargets.slice(0, 5))}`);
  if (result.fixedOverlaps.length) failures.push(`fixed UI overlap: ${result.fixedOverlaps.join(', ')}`);
  if (result.mediaOverflow.length) failures.push(`media overflow: ${result.mediaOverflow.slice(0, 5).join(', ')}`);
  if (result.worldWidth > profile.width + 3 || result.bodyWidth > profile.width + 3) failures.push(`root width exceeds viewport (${result.worldWidth}/${result.bodyWidth}/${profile.width})`);

  return { route: route.name, profile: profile.name, ...result, failures };
}

async function testNavigation(page, profile, route, failures) {
  if (profile.width > 980 || route.name === 'gallery') return;
  const toggle = page.locator('.v2-nav-toggle');
  if (!(await toggle.count()) || !(await toggle.first().isVisible())) return;
  await toggle.first().click();
  await page.waitForTimeout(40);
  const state = await page.evaluate(() => ({
    open: document.querySelector('.world')?.classList.contains('v2-nav-open'),
    locked: document.body.classList.contains('v4-scroll-locked'),
    visibleLinks: [...document.querySelectorAll('.nav > nav a')].filter((link) => link.getClientRects().length > 0).length
  }));
  if (!state.open || !state.locked || state.visibleLinks === 0) failures.push(`mobile navigation failed ${JSON.stringify(state)}`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(30);
  const closed = await page.evaluate(() => !document.querySelector('.world')?.classList.contains('v2-nav-open') && !document.body.classList.contains('v4-scroll-locked'));
  if (!closed) failures.push('mobile navigation did not close with Escape');
}

async function testCustomizer(page, profile, route, failures) {
  if (!representativeSlugs.has(route.name) || route.name === 'gallery') return;
  const button = page.locator('[data-world-action="customize"]');
  if (!(await button.count()) || !(await button.first().isVisible())) return;
  await button.first().click();
  const dialog = page.locator('dialog.v2-customizer[open]');
  if (!(await dialog.count())) {
    failures.push('customizer dialog did not open');
    return;
  }
  const bounds = await dialog.first().evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight
    };
  });
  if (bounds.left < -4 || bounds.right > profile.width + 4 || bounds.top < -4 || bounds.bottom > profile.height + 4 || bounds.scrollWidth > bounds.clientWidth + 3) {
    failures.push(`customizer bounds invalid ${JSON.stringify(bounds)}`);
  }
  await page.keyboard.press('Escape');
}

async function testSimulatedPreview(page, profile, route, failures) {
  if (profile.name !== 'desktop-1366' || !representativeSlugs.has(route.name) || route.name === 'gallery') return;
  const mobileButton = page.locator('[data-device="mobile"]');
  if (!(await mobileButton.count()) || !(await mobileButton.first().isVisible())) return;
  await mobileButton.first().click();
  await page.waitForTimeout(120);
  const preview = await page.evaluate(() => {
    const world = document.querySelector('.world');
    return {
      width: Math.round(world?.getBoundingClientRect().width || 0),
      overflow: world ? world.scrollWidth - world.clientWidth : 0,
      cardColumns: document.querySelector('.cards') ? getComputedStyle(document.querySelector('.cards')).gridTemplateColumns.split(' ').length : 0
    };
  });
  if (preview.width > 405 || preview.overflow > 3 || preview.cardColumns > 1) failures.push(`simulated mobile preview failed ${JSON.stringify(preview)}`);
  await page.locator('[data-device="desktop"]').first().click();
}

const { server, origin } = await startServer();
const browser = await chromium.launch({ headless: true });
const report = {
  version: '4.0.0',
  startedAt: new Date().toISOString(),
  profiles: [],
  checks: 0,
  failures: []
};

try {
  for (const profile of profiles) {
    const context = await browser.newContext({
      viewport: { width: profile.width, height: profile.height },
      isMobile: profile.mobile,
      hasTouch: profile.touch,
      deviceScaleFactor: profile.mobile ? 2 : 1,
      reducedMotion: 'no-preference'
    });
    const page = await context.newPage();
    let consoleErrors = [];
    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      const text = message.text();
      if (/ResizeObserver loop/i.test(text)) return;
      consoleErrors.push(text);
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    const profileResult = { name: profile.name, width: profile.width, height: profile.height, routes: profile.routes.length, failures: 0 };
    for (const route of profile.routes) {
      consoleErrors = [];
      const url = `${origin}${route.path}?responsiveAudit=1`;
      let inspection;
      try {
        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        if (!response?.ok()) throw new Error(`HTTP ${response?.status() || 'unknown'}`);
        await page.waitForFunction(() => document.documentElement.dataset.responsiveVersion === '4.0.0', null, { timeout: 8000 });
        await page.waitForTimeout(180);
        inspection = await inspectPage(page, profile, route);
        if (consoleErrors.length) inspection.failures.push(`console errors: ${consoleErrors.slice(0, 4).join(' | ')}`);
        await testNavigation(page, profile, route, inspection.failures);
        await testCustomizer(page, profile, route, inspection.failures);
        await testSimulatedPreview(page, profile, route, inspection.failures);
      } catch (error) {
        inspection = { route: route.name, profile: profile.name, failures: [`navigation/audit error: ${error.message}`] };
      }

      report.checks += 1;
      if (inspection.failures.length) {
        profileResult.failures += 1;
        report.failures.push(inspection);
        const screenshotPath = resolve(screenshots, `${sanitize(profile.name)}--${sanitize(route.name)}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
      }
    }
    report.profiles.push(profileResult);
    await context.close();
  }
} finally {
  report.finishedAt = new Date().toISOString();
  writeFileSync(resolve(reports, 'responsive-browser-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  await browser.close();
  await new Promise((resolveClose) => server.close(resolveClose));
}

if (report.failures.length) {
  const summary = report.failures.slice(0, 20).map((failure) => `${failure.profile}/${failure.route}: ${failure.failures.join('; ')}`).join('\n');
  throw new Error(`Responsive browser audit failed in ${report.failures.length}/${report.checks} route-profile checks:\n${summary}`);
}

console.log(`Responsive browser audit passed: ${report.checks} route-profile checks across ${profiles.length} viewport profiles.`);
