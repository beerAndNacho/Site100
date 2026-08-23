import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { SITES } from '../src/catalog.js';

const dist = resolve(process.cwd(), 'dist');
const reports = resolve(dist, 'reports');
const screenshots = resolve(reports, 'depth-failures');
mkdirSync(screenshots, { recursive: true });

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

const representativeSites = SITES.filter((site) => site.id % 10 === 1);
const broadRoutes = SITES.flatMap((site) => [
  { name: `${site.slug}-services`, path: `/sites/${site.slug}/services/`, type: 'services' },
  { name: `${site.slug}-contact`, path: `/sites/${site.slug}/contact/`, type: 'contact' }
]);
const representativeRoutes = representativeSites.flatMap((site) => [
  { name: `${site.slug}-about`, path: `/sites/${site.slug}/about/`, type: 'about' },
  { name: `${site.slug}-service`, path: `/sites/${site.slug}/services/service-01/`, type: 'service' },
  { name: `${site.slug}-case`, path: `/sites/${site.slug}/work/case-01/`, type: 'case' },
  { name: `${site.slug}-article`, path: `/sites/${site.slug}/journal/insight-01/`, type: 'article' }
]);
const profiles = [
  { name: 'compact-360', width: 360, height: 800, routes: broadRoutes, mobile: true, touch: true },
  { name: 'desktop-1366', width: 1366, height: 900, routes: broadRoutes, mobile: false, touch: false },
  { name: 'mobile-390', width: 390, height: 844, routes: representativeRoutes, mobile: true, touch: true },
  { name: 'tablet-768', width: 768, height: 1024, routes: representativeRoutes, mobile: false, touch: true },
  { name: 'wide-1536', width: 1536, height: 960, routes: representativeRoutes, mobile: false, touch: false }
];

const sanitize = (value) => value.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '');

async function inspect(page, profile, route) {
  return page.evaluate(({ width, type }) => {
    const visible = (element) => {
      if (!element || element.hidden) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const describe = (element) => `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${[...element.classList].slice(0, 3).map((name) => `.${name}`).join('')}`;
    const rootOverflow = [document.documentElement, document.body].map((element) => getComputedStyle(element).overflowX);
    const rawOverflow = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth;
    const scrollableOverflow = rawOverflow > 3 && !rootOverflow.some((value) => value === 'hidden' || value === 'clip');
    const failures = [];

    if (document.documentElement.dataset.depthVersion !== '5.0.0') failures.push(`depth-runtime=${document.documentElement.dataset.depthVersion || 'missing'}`);
    if (document.documentElement.dataset.responsiveVersion !== '4.0.0') failures.push(`responsive-runtime=${document.documentElement.dataset.responsiveVersion || 'missing'}`);
    if (!document.querySelector('.v5-page-main,.world[data-v5-page]')) failures.push('missing-v5-page-root');
    if (!document.querySelector('.v5-primary-nav')) failures.push('missing-deep-nav');
    if (!document.querySelector('.v5-breadcrumbs')) failures.push('missing-breadcrumbs');
    if (scrollableOverflow || document.documentElement.dataset.v4DocumentOverflow === 'true') failures.push(`document-overflow=${Math.round(rawOverflow)}`);

    const out = [];
    document.querySelectorAll('.nav,.v5-page-hero,.v5-section,.v5-wizard,.v5-card,.v5-case-card,.v5-article-card,.v5-article-layout,.v5-plan-dock').forEach((element) => {
      if (!visible(element)) return;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      if (['auto', 'scroll', 'hidden', 'clip'].includes(style.overflowX)) return;
      if (rect.left < -8 || rect.right > innerWidth + 8 || rect.width > innerWidth + 12) out.push(describe(element));
    });
    if (out.length) failures.push(`bounds=${out.slice(0, 6).join(',')}`);

    const clipped = [];
    document.querySelectorAll('.v5-page-hero h1,.v5-section-head h2,.v5-card h3,.v5-case-card h3,.v5-article-card h3,.v5-wizard legend').forEach((element) => {
      if (!visible(element)) return;
      const style = getComputedStyle(element);
      if (element.scrollWidth > element.clientWidth + 5 && ['hidden', 'clip'].includes(style.overflowX)) clipped.push(describe(element));
    });
    if (clipped.length) failures.push(`clipped=${clipped.slice(0, 6).join(',')}`);

    if (width <= 760) {
      const small = [];
      document.querySelectorAll('button,input,select,textarea,summary,.v5-primary-nav a,.v5-page-actions a').forEach((element) => {
        if (!visible(element) || element.matches('input[type="hidden"],input[type="checkbox"],input[type="radio"],input[type="range"],input[type="color"]')) return;
        const rect = element.getBoundingClientRect();
        if (rect.width < 39 || rect.height < 39) small.push(`${describe(element)}:${Math.round(rect.width)}x${Math.round(rect.height)}`);
      });
      if (small.length) failures.push(`touch=${small.slice(0, 8).join(',')}`);
    }

    const expected = { services: '.v5-service-list .v5-card', contact: '[data-v5-wizard]', about: '.v5-principles', service: '[data-v5-add-service]', case: '.v5-metrics', article: '[data-v5-article]' }[type];
    if (expected && !document.querySelector(expected)) failures.push(`missing-type-component=${expected}`);
    if (type === 'services' && document.querySelectorAll('.v5-service-list .v5-card').length !== 3) failures.push('service-card-count');
    if (type === 'case' && document.querySelectorAll('.v5-metrics article').length !== 3) failures.push('case-metric-count');
    if (type === 'article' && document.querySelectorAll('.v5-article-toc a').length !== 4) failures.push('article-toc-count');
    if (type === 'contact' && document.querySelectorAll('[data-v5-step]').length !== 3) failures.push('wizard-step-count');

    return { failures, rawOverflow: Math.round(rawOverflow), breakpoint: document.documentElement.dataset.v4Breakpoint, pageType: document.querySelector('.world')?.dataset.v5Page };
  }, { width: profile.width, type: route.type });
}

async function testInteractions(page, profile, route, result) {
  if (!route.name.includes(representativeSites.find((site) => route.name.startsWith(site.slug))?.slug || '__none__')) return;
  if (route.type === 'service') {
    const button = page.locator('[data-v5-add-service]').first();
    await button.click();
    const state = await page.evaluate(() => ({ selected: document.querySelector('[data-v5-add-service]')?.getAttribute('aria-pressed'), dock: Boolean(document.querySelector('.v5-plan-dock')) }));
    if (state.selected !== 'true' || !state.dock) result.failures.push(`planner=${JSON.stringify(state)}`);
  }
  if (route.type === 'article') {
    const button = page.locator('[data-v5-bookmark]').first();
    await button.click();
    if (await button.getAttribute('aria-pressed') !== 'true') result.failures.push('bookmark-toggle');
  }
  if (route.type === 'contact' && ['compact-360', 'desktop-1366'].includes(profile.name)) {
    await page.selectOption('[name="goal"]', { index: 1 });
    await page.fill('[name="context"]', '현재 서비스 선택과 문의 흐름을 더 명확하게 만들고 싶습니다.');
    await page.click('[data-v5-next]');
    const secondVisible = await page.locator('[data-v5-step]').nth(1).isVisible();
    if (!secondVisible) result.failures.push('wizard-next-step');
  }
}

const { server, origin } = await startServer();
const browser = await chromium.launch({ headless: true });
const report = { version: '5.0.0', checks: 0, startedAt: new Date().toISOString(), profiles: [], failures: [] };
let screenshotBudget = 10;

try {
  for (const profile of profiles) {
    const context = await browser.newContext({ viewport: { width: profile.width, height: profile.height }, isMobile: profile.mobile, hasTouch: profile.touch, deviceScaleFactor: profile.mobile ? 2 : 1 });
    const page = await context.newPage();
    page.setDefaultTimeout(3000);
    let errors = [];
    page.on('console', (message) => {
      if (message.type() === 'error' && !/ResizeObserver loop/i.test(message.text())) errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    const profileReport = { name: profile.name, width: profile.width, height: profile.height, routes: profile.routes.length, failures: 0 };

    for (const route of profile.routes) {
      errors = [];
      let result;
      try {
        const response = await page.goto(`${origin}${route.path}?depthAudit=1`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        if (!response?.ok()) throw new Error(`HTTP ${response?.status() || 'unknown'}`);
        await page.waitForFunction(() => document.documentElement.dataset.depthVersion === '5.0.0', null, { timeout: 5000 });
        await page.waitForTimeout(80);
        result = await inspect(page, profile, route);
        await testInteractions(page, profile, route, result);
        if (errors.length) result.failures.push(`console=${errors.slice(0, 4).join('|')}`);
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
  writeFileSync(resolve(reports, 'depth-browser-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  await browser.close();
  await new Promise((close) => server.close(close));
}

if (report.failures.length) {
  throw new Error(`Deep browser audit failed in ${report.failures.length}/${report.checks} checks:\n${report.failures.slice(0, 30).map((failure) => `${failure.profile}/${failure.route}: ${failure.failures.join('; ')}`).join('\n')}`);
}
console.log(`Deep browser audit passed: ${report.checks} route-profile checks across ${profiles.length} viewport profiles.`);
