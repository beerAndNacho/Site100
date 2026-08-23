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
const representatives = new Set(['gallery','salt-bakery','harbor-law','endpoint-api','compile-bootcamp','still-yoga','framework-film','dal-hanok-stay','table7-restaurant','open-hand-nonprofit','desktop-cv','100worlds-gallery']);
const representativeRoutes = allRoutes.filter((route) => representatives.has(route.name));
const profiles = [
  { name: 'compact-360', width: 360, height: 800, routes: allRoutes, mobile: true, touch: true },
  { name: 'desktop-1366', width: 1366, height: 900, routes: allRoutes, mobile: false, touch: false },
  { name: 'mobile-390', width: 390, height: 844, routes: representativeRoutes, mobile: true, touch: true },
  { name: 'phone-landscape', width: 844, height: 390, routes: representativeRoutes, mobile: true, touch: true },
  { name: 'tablet-768', width: 768, height: 1024, routes: representativeRoutes, mobile: false, touch: true },
  { name: 'tablet-landscape', width: 1024, height: 768, routes: representativeRoutes, mobile: false, touch: true },
  { name: 'wide-1536', width: 1536, height: 960, routes: representativeRoutes, mobile: false, touch: false }
];

const sanitize = (value) => value.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '');

async function inspect(page, profile, route) {
  return page.evaluate(({ width, routeName, representative }) => {
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

    const failures = [];
    const documentOverflow = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth;
    if (document.documentElement.dataset.responsiveVersion !== '4.0.0') failures.push(`runtime=${document.documentElement.dataset.responsiveVersion || 'missing'}`);
    if (documentOverflow > 3 || document.documentElement.dataset.v4DocumentOverflow === 'true') failures.push(`document-overflow=${Math.round(documentOverflow)}`);

    const critical = '.nav,.hero,.section,.demo,.contact form,.v2-world-explorer,.v3-footer-statement,.gintro,.gindex,.gcard-shell,.v2-gallery-toolbar,.v3-runway,.gallery>footer,.world>footer,.v2-dialog[open]';
    const out = [];
    document.querySelectorAll(critical).forEach((element) => {
      if (!visible(element) || hasScrollParent(element)) return;
      if (width > 980 && element.closest('.layout-horizontal main')) return;
      const rect = element.getBoundingClientRect();
      if (rect.width > innerWidth + 10 || rect.left < -10 || rect.right > innerWidth + 10) out.push(`${describe(element)}:${Math.round(rect.left)}..${Math.round(rect.right)}`);
    });
    if (out.length) failures.push(`bounds=${out.slice(0, 5).join(',')}`);

    const clipped = [];
    document.querySelectorAll('h1,h2,h3,h4,blockquote,.cards h3,.process h3,.gcard h2,.v2-dialog-head h2').forEach((element) => {
      if (!visible(element) || hasScrollParent(element)) return;
      const style = getComputedStyle(element);
      if (element.scrollWidth > element.clientWidth + 6 && ['hidden','clip'].includes(style.overflowX)) clipped.push(describe(element));
    });
    if (clipped.length) failures.push(`clipped=${clipped.slice(0, 5).join(',')}`);

    if (innerWidth <= 760) {
      const small = [];
      document.querySelectorAll('button,input,select,textarea,summary,.nav a,.gallery>header a').forEach((element) => {
        if (!visible(element) || element.matches('input[type="hidden"],input[type="checkbox"],input[type="radio"],input[type="range"],input[type="color"]')) return;
        const rect = element.getBoundingClientRect();
        if (rect.width < 39 || rect.height < 39) small.push(`${describe(element)}:${Math.round(rect.width)}x${Math.round(rect.height)}`);
      });
      if (small.length) failures.push(`touch=${small.slice(0, 6).join(',')}`);
    }

    const media = [];
    document.querySelectorAll('img,svg,video,canvas').forEach((element) => {
      if (!visible(element) || hasScrollParent(element)) return;
      const rect = element.getBoundingClientRect();
      const parent = element.parentElement?.getBoundingClientRect();
      if (parent && rect.width > parent.width + 9) media.push(describe(element));
    });
    if (media.length) failures.push(`media=${media.slice(0, 5).join(',')}`);

    const fixed = [...document.querySelectorAll('[data-v4-ui]')].filter(visible);
    const overlaps = [];
    fixed.forEach((first, index) => fixed.slice(index + 1).forEach((second) => {
      const a = first.getBoundingClientRect();
      const b = second.getBoundingClientRect();
      const overlapWidth = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
      const overlapHeight = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      if (overlapWidth * overlapHeight > 80) overlaps.push(`${describe(first)}~${describe(second)}`);
    }));
    if (overlaps.length) failures.push(`fixed=${overlaps.join(',')}`);

    const app = document.querySelector('.world,.gallery');
    if ((app?.getBoundingClientRect().width || 0) > width + 3 || document.body.getBoundingClientRect().width > width + 3) failures.push('root-width');

    if (width <= 980 && routeName !== 'gallery') {
      const toggle = document.querySelector('.v2-nav-toggle');
      if (visible(toggle)) {
        const rect = toggle.getBoundingClientRect();
        const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        if (!(top === toggle || toggle.contains(top))) failures.push(`toggle-obstructed-by=${top ? describe(top) : 'none'}`);
        toggle.click();
        if (!document.querySelector('.world')?.classList.contains('v2-nav-open') || !document.body.classList.contains('v4-scroll-locked')) failures.push('menu-open-state');
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        if (document.querySelector('.world')?.classList.contains('v2-nav-open') || document.body.classList.contains('v4-scroll-locked')) failures.push('menu-close-state');
      }
    }

    if (representative && routeName !== 'gallery' && ['mobile-390','desktop-1366'].includes(document.documentElement.dataset.__auditProfile || '')) {
      const customize = document.querySelector('[data-world-action="customize"]');
      if (visible(customize)) {
        customize.click();
        const dialog = document.querySelector('dialog.v2-customizer[open]');
        if (!dialog) failures.push('customizer-open');
        else {
          const rect = dialog.getBoundingClientRect();
          if (rect.left < -4 || rect.right > innerWidth + 4 || rect.top < -4 || rect.bottom > innerHeight + 4 || dialog.scrollWidth > dialog.clientWidth + 3) failures.push('customizer-bounds');
          dialog.close();
        }
      }
    }

    return { failures, breakpoint: document.documentElement.dataset.v4Breakpoint, orientation: document.documentElement.dataset.v4Orientation };
  }, { width: profile.width, routeName: route.name, representative: representatives.has(route.name) });
}

async function testSimulatedPreview(page, profile, route, failures) {
  if (profile.name !== 'desktop-1366' || route.name === 'gallery' || !representatives.has(route.name)) return;
  await page.evaluate(() => document.querySelector('[data-device="mobile"]')?.click());
  await page.waitForTimeout(70);
  const state = await page.evaluate(() => {
    const world = document.querySelector('.world');
    const cards = document.querySelector('.cards');
    return {
      device: document.body.dataset.previewDevice,
      width: Math.round(world?.getBoundingClientRect().width || 0),
      overflow: world ? world.scrollWidth - world.clientWidth : 0,
      columns: cards ? getComputedStyle(cards).gridTemplateColumns.split(' ').length : 0
    };
  });
  if (state.device !== 'mobile' || state.width > 405 || state.overflow > 3 || state.columns > 1) failures.push(`preview=${JSON.stringify(state)}`);
  await page.evaluate(() => document.querySelector('[data-device="desktop"]')?.click());
}

const { server, origin } = await startServer();
const browser = await chromium.launch({ headless: true });
const report = { version: '4.0.0', startedAt: new Date().toISOString(), checks: 0, profiles: [], failures: [] };
let screenshotBudget = 12;

try {
  for (const profile of profiles) {
    const context = await browser.newContext({ viewport: { width: profile.width, height: profile.height }, isMobile: profile.mobile, hasTouch: profile.touch, deviceScaleFactor: profile.mobile ? 2 : 1 });
    const page = await context.newPage();
    page.setDefaultTimeout(2500);
    let consoleErrors = [];
    page.on('console', (message) => {
      if (message.type() !== 'error' || /ResizeObserver loop/i.test(message.text())) return;
      const location = message.location();
      consoleErrors.push(`${message.text()}${location.url ? ` @ ${location.url}:${location.lineNumber || 0}` : ''}`);
    });
    page.on('pageerror', (error) => consoleErrors.push(error.stack || error.message));
    const profileReport = { name: profile.name, width: profile.width, height: profile.height, routes: profile.routes.length, failures: 0 };

    for (const route of profile.routes) {
      consoleErrors = [];
      let result;
      try {
        const response = await page.goto(`${origin}${route.path}?responsiveAudit=2`, { waitUntil: 'domcontentloaded', timeout: 12000 });
        if (!response?.ok()) throw new Error(`HTTP ${response?.status() || 'unknown'}`);
        await page.evaluate((profileName) => { document.documentElement.dataset.__auditProfile = profileName; }, profile.name);
        await page.waitForFunction(() => document.documentElement.dataset.responsiveVersion === '4.0.0', null, { timeout: 4500 });
        await page.waitForTimeout(70);
        result = await inspect(page, profile, route);
        if (consoleErrors.length) result.failures.push(`console=${consoleErrors.slice(0, 4).join('|')}`);
        await testSimulatedPreview(page, profile, route, result.failures);
      } catch (error) {
        result = { failures: [`audit=${error.message}`] };
      }
      report.checks += 1;
      if (result.failures.length) {
        profileReport.failures += 1;
        report.failures.push({ profile: profile.name, route: route.name, ...result });
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
  await new Promise((close) => server.close(close));
}

if (report.failures.length) {
  throw new Error(`Responsive browser audit failed in ${report.failures.length}/${report.checks} checks:\n${report.failures.slice(0, 30).map((failure) => `${failure.profile}/${failure.route}: ${failure.failures.join('; ')}`).join('\n')}`);
}
console.log(`Responsive browser audit passed: ${report.checks} route-profile checks across ${profiles.length} viewport profiles.`);
