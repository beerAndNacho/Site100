import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { SITES } from '../src/catalog.js';

const dist = resolve(process.cwd(), 'dist');
const reports = resolve(dist, 'reports');
const screenshots = resolve(reports, 'responsive-failures');
mkdirSync(screenshots, { recursive: true });
if (!existsSync(resolve(dist, 'index.html'))) throw new Error('dist/index.html not found. Run npm run build first.');

const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8'
};

function startServer() {
  return new Promise((resolveServer, reject) => {
    const server = createServer((request, response) => {
      try {
        const url = new URL(request.url || '/', 'http://127.0.0.1');
        const pathname = normalize(decodeURIComponent(url.pathname).replace(/^\/Site100/, '') || '/').replace(/^([.][.][/\\])+/, '');
        let filePath = join(dist, pathname);
        if (existsSync(filePath) && statSync(filePath).isDirectory()) filePath = join(filePath, 'index.html');
        if (!existsSync(filePath)) {
          response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
          response.end('Not found');
          return;
        }
        response.writeHead(200, { 'content-type': mime[extname(filePath)] || 'application/octet-stream', 'cache-control': 'no-store' });
        response.end(readFileSync(filePath));
      } catch (error) {
        response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
        response.end(String(error));
      }
    });
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolveServer({ server, origin: `http://127.0.0.1:${server.address().port}/Site100` }));
  });
}

const allRoutes = [{ name: 'gallery', path: '/' }, ...SITES.map((site) => ({ name: site.slug, path: `/sites/${site.slug}/` }))];
const representativeNames = new Set(['gallery','salt-bakery','harbor-law','endpoint-api','compile-bootcamp','still-yoga','framework-film','dal-hanok-stay','table7-restaurant','open-hand-nonprofit','desktop-cv','100worlds-gallery']);
const representativeRoutes = allRoutes.filter((route) => representativeNames.has(route.name));
const profiles = [
  { name: 'compact-360', width: 360, height: 800, routes: allRoutes, mobile: true, touch: true },
  { name: 'desktop-1366', width: 1366, height: 900, routes: allRoutes, mobile: false, touch: false },
  { name: 'mobile-390', width: 390, height: 844, routes: representativeRoutes, mobile: true, touch: true },
  { name: 'phone-landscape', width: 844, height: 390, routes: representativeRoutes, mobile: true, touch: true },
  { name: 'tablet-768', width: 768, height: 1024, routes: representativeRoutes, mobile: false, touch: true },
  { name: 'tablet-landscape', width: 1024, height: 768, routes: representativeRoutes, mobile: false, touch: true },
  { name: 'wide-1536', width: 1536, height: 960, routes: representativeRoutes, mobile: false, touch: false }
];

function sanitize(value) { return value.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, ''); }

async function auditLayout(page, profile) {
  return page.evaluate(({ profileWidth }) => {
    const visible = (element) => {
      if (!element || element.hidden) return false;
      const style = getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const describe = (element) => `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${[...element.classList].slice(0, 3).map((name) => `.${name}`).join('')}`;
    const hasScrollParent = (element) => {
      let parent = element.parentElement;
      while (parent && parent !== document.body) {
        const style = getComputedStyle(parent);
        if (['auto','scroll'].includes(style.overflowX) || parent.classList.contains('v4-scroll-region')) return true;
        parent = parent.parentElement;
      }
      return false;
    };

    const documentOverflow = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth;
    const bounds = [];
    document.querySelectorAll('.nav,.hero,.section,.demo,.contact form,.v2-world-explorer,.v3-footer-statement,.gintro,.gindex,.gcard-shell,.v2-gallery-toolbar,.v3-runway,.gallery>footer,.world>footer,.v2-dialog[open]').forEach((element) => {
      if (!visible(element) || hasScrollParent(element)) return;
      if (profileWidth > 980 && element.closest('.layout-horizontal main')) return;
      const rect = element.getBoundingClientRect();
      if (rect.width > window.innerWidth + 10 || rect.left < -10 || rect.right > window.innerWidth + 10) bounds.push({ element: describe(element), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) });
    });

    const clippedText = [];
    document.querySelectorAll('h1,h2,h3,h4,blockquote,.cards h3,.process h3,.gcard h2,.v2-dialog-head h2').forEach((element) => {
      if (!visible(element) || hasScrollParent(element)) return;
      const style = getComputedStyle(element);
      const clipped = element.scrollWidth > element.clientWidth + 6 && ['hidden','clip'].includes(style.overflowX);
      if (clipped) clippedText.push({ element: describe(element), overflow: element.scrollWidth - element.clientWidth });
    });

    const smallTargets = [];
    if (window.innerWidth <= 760) {
      document.querySelectorAll('button,input,select,textarea,summary,.nav a,.gallery>header a').forEach((element) => {
        if (!visible(element) || element.matches('input[type="hidden"],input[type="checkbox"],input[type="radio"],input[type="range"],input[type="color"]')) return;
        const rect = element.getBoundingClientRect();
        if (rect.width < 39 || rect.height < 39) smallTargets.push({ element: describe(element), width: Math.round(rect.width), height: Math.round(rect.height) });
      });
    }

    const mediaOverflow = [];
    document.querySelectorAll('img,svg,video,canvas').forEach((element) => {
      if (!visible(element) || hasScrollParent(element)) return;
      const rect = element.getBoundingClientRect();
      const parent = element.parentElement?.getBoundingClientRect();
      if (parent && rect.width > parent.width + 9) mediaOverflow.push(describe(element));
    });

    const fixed = [...document.querySelectorAll('[data-v4-ui]')].filter(visible);
    const fixedOverlaps = [];
    fixed.forEach((first, firstIndex) => fixed.slice(firstIndex + 1).forEach((second) => {
      const a = first.getBoundingClientRect();
      const b = second.getBoundingClientRect();
      const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
      const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      if (width * height > 80) fixedOverlaps.push(`${describe(first)} ↔ ${describe(second)}`);
    }));

    const app = document.querySelector('.world,.gallery');
    return {
      runtime: document.documentElement.dataset.responsiveVersion || '',
      breakpoint: document.documentElement.dataset.v4Breakpoint || '',
      orientation: document.documentElement.dataset.v4Orientation || '',
      documentOverflow: Math.round(documentOverflow),
      overflowFlag: document.documentElement.dataset.v4DocumentOverflow === 'true',
      bounds: bounds.slice(0, 12),
      clippedText: clippedText.slice(0, 12),
      smallTargets: smallTargets.slice(0, 12),
      mediaOverflow: mediaOverflow.slice(0, 12),
      fixedOverlaps,
      appWidth: Math.round(app?.getBoundingClientRect().width || 0),
      bodyWidth: Math.round(document.body.getBoundingClientRect().width)
    };
  }, { profileWidth: profile.width });
}

async function exerciseMobileMenu(page, profile, route, failures) {
  if (profile.width > 980 || route.name === 'gallery') return;
  const toggle = page.locator('.v2-nav-toggle');
  if (!(await toggle.count()) || !(await toggle.first().isVisible())) return;
  await toggle.first().click();
  await page.waitForTimeout(25);
  const opened = await page.evaluate(() => ({
    open: document.querySelector('.world')?.classList.contains('v2-nav-open'),
    locked: document.body.classList.contains('v4-scroll-locked'),
    links: [...document.querySelectorAll('.nav>nav a')].filter((element) => element.getClientRects().length > 0).length
  }));
  if (!opened.open || !opened.locked || opened.links === 0) failures.push(`mobile menu open failed ${JSON.stringify(opened)}`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(20);
  if (!(await page.evaluate(() => !document.querySelector('.world')?.classList.contains('v2-nav-open') && !document.body.classList.contains('v4-scroll-locked')))) failures.push('mobile menu Escape close failed');
}

async function exerciseCustomizer(page, profile, route, failures) {
  if (!representativeNames.has(route.name) || route.name === 'gallery' || !['mobile-390','desktop-1366'].includes(profile.name)) return;
  const button = page.locator('[data-world-action="customize"]');
  if (!(await button.count()) || !(await button.first().isVisible())) return;
  await button.first().click();
  const dialog = page.locator('dialog.v2-customizer[open]');
  if (!(await dialog.count())) return failures.push('customizer did not open');
  const bounds = await dialog.first().evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, overflow: element.scrollWidth - element.clientWidth };
  });
  if (bounds.left < -4 || bounds.right > profile.width + 4 || bounds.top < -4 || bounds.bottom > profile.height + 4 || bounds.overflow > 3) failures.push(`customizer bounds ${JSON.stringify(bounds)}`);
  await page.keyboard.press('Escape');
}

async function exerciseSimulatedMobile(page, profile, route, failures) {
  if (profile.name !== 'desktop-1366' || route.name === 'gallery' || !representativeNames.has(route.name)) return;
  const button = page.locator('[data-device="mobile"]');
  if (!(await button.count()) || !(await button.first().isVisible())) return;
  await button.first().click();
  await page.waitForTimeout(80);
  const preview = await page.evaluate(() => {
    const world = document.querySelector('.world');
    const cards = document.querySelector('.cards');
    return {
      width: Math.round(world?.getBoundingClientRect().width || 0),
      overflow: world ? world.scrollWidth - world.clientWidth : 0,
      columns: cards ? getComputedStyle(cards).gridTemplateColumns.split(' ').length : 0
    };
  });
  if (preview.width > 405 || preview.overflow > 3 || preview.columns > 1) failures.push(`simulated mobile preview ${JSON.stringify(preview)}`);
  await page.locator('[data-device="desktop"]').first().click();
}

const { server, origin } = await startServer();
const browser = await chromium.launch({ headless: true });
const report = { version: '4.0.0', startedAt: new Date().toISOString(), profiles: [], checks: 0, failures: [] };
let screenshotBudget = 12;

try {
  for (const profile of profiles) {
    const context = await browser.newContext({
      viewport: { width: profile.width, height: profile.height },
      isMobile: profile.mobile,
      hasTouch: profile.touch,
      deviceScaleFactor: profile.mobile ? 2 : 1
    });
    const page = await context.newPage();
    let errors = [];
    page.on('console', (message) => {
      if (message.type() === 'error' && !/ResizeObserver loop/i.test(message.text())) errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    const profileReport = { name: profile.name, width: profile.width, height: profile.height, routes: profile.routes.length, failures: 0 };

    for (const route of profile.routes) {
      errors = [];
      let inspection;
      try {
        const response = await page.goto(`${origin}${route.path}?responsiveAudit=1`, { waitUntil: 'domcontentloaded', timeout: 18000 });
        if (!response?.ok()) throw new Error(`HTTP ${response?.status() || 'unknown'}`);
        await page.waitForFunction(() => document.documentElement.dataset.responsiveVersion === '4.0.0', null, { timeout: 6000 });
        await page.waitForTimeout(85);
        const layout = await auditLayout(page, profile);
        const failures = [];
        if (layout.runtime !== '4.0.0') failures.push(`runtime ${layout.runtime || 'missing'}`);
        if (layout.documentOverflow > 3 || layout.overflowFlag) failures.push(`document overflow ${layout.documentOverflow}px flag=${layout.overflowFlag}`);
        if (layout.bounds.length) failures.push(`bounds ${JSON.stringify(layout.bounds.slice(0, 4))}`);
        if (layout.clippedText.length) failures.push(`clipped text ${JSON.stringify(layout.clippedText.slice(0, 4))}`);
        if (layout.smallTargets.length) failures.push(`touch targets ${JSON.stringify(layout.smallTargets.slice(0, 4))}`);
        if (layout.mediaOverflow.length) failures.push(`media ${layout.mediaOverflow.slice(0, 4).join(',')}`);
        if (layout.fixedOverlaps.length) failures.push(`fixed overlap ${layout.fixedOverlaps.join(',')}`);
        if (layout.appWidth > profile.width + 3 || layout.bodyWidth > profile.width + 3) failures.push(`root width ${layout.appWidth}/${layout.bodyWidth}/${profile.width}`);
        if (errors.length) failures.push(`console ${errors.slice(0, 3).join(' | ')}`);
        await exerciseMobileMenu(page, profile, route, failures);
        await exerciseCustomizer(page, profile, route, failures);
        await exerciseSimulatedMobile(page, profile, route, failures);
        inspection = { route: route.name, profile: profile.name, ...layout, failures };
      } catch (error) {
        inspection = { route: route.name, profile: profile.name, failures: [`audit error ${error.message}`] };
      }

      report.checks += 1;
      if (inspection.failures.length) {
        profileReport.failures += 1;
        report.failures.push(inspection);
        if (screenshotBudget > 0) {
          screenshotBudget -= 1;
          await page.screenshot({ path: resolve(screenshots, `${sanitize(profile.name)}--${sanitize(route.name)}.png`), fullPage: false }).catch(() => {});
        }
      }
    }
    report.profiles.push(profileReport);
    await context.close();
  }
} finally {
  report.finishedAt = new Date().toISOString();
  writeFileSync(resolve(reports, 'responsive-browser-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  await browser.close();
  await new Promise((resolveClose) => server.close(resolveClose));
}

if (report.failures.length) {
  throw new Error(`Responsive browser audit failed in ${report.failures.length}/${report.checks} checks:\n${report.failures.slice(0, 24).map((failure) => `${failure.profile}/${failure.route}: ${failure.failures.join('; ')}`).join('\n')}`);
}
console.log(`Responsive browser audit passed: ${report.checks} checks across ${profiles.length} viewport profiles.`);
