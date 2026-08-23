import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SITES } from '../src/catalog.js';
import { buildDeepModel, deepRoutes } from '../src/depth-content.js';

const dist = resolve(process.cwd(), 'dist');
if (!existsSync(resolve(dist, 'depth-manifest.json'))) throw new Error('depth-manifest.json is missing. Run npm run build first.');

function walk(directory, predicate, output = []) {
  for (const name of readdirSync(directory)) {
    const path = resolve(directory, name);
    if (statSync(path).isDirectory()) walk(path, predicate, output);
    else if (predicate(path)) output.push(path);
  }
  return output;
}

const indexPages = walk(resolve(dist, 'sites'), (path) => path.endsWith('/index.html'));
if (indexPages.length !== 1400) throw new Error(`Expected 1400 site pages, got ${indexPages.length}`);

const routeSet = new Set();
for (const site of SITES) for (const route of deepRoutes(site)) routeSet.add(route.path);
if (routeSet.size !== 1400) throw new Error(`Expected 1400 unique routes, got ${routeSet.size}`);

const titles = new Set();
const canonicals = new Set();
const descriptions = new Set();
const brokenLinks = [];
const qualityFailures = [];
const typeCounts = new Map();

for (const rawSite of SITES) {
  const model = buildDeepModel(rawSite);
  const siteRoot = resolve(dist, 'sites', model.site.slug);
  const mapPath = resolve(siteRoot, 'site-map.json');
  if (!existsSync(mapPath)) throw new Error(`Missing site-map.json for ${model.site.slug}`);
  const siteMap = JSON.parse(readFileSync(mapPath, 'utf8'));
  if (siteMap.count !== 14 || siteMap.maxDepth !== 3 || siteMap.routes.length !== 14) throw new Error(`Invalid route map for ${model.site.slug}`);

  const requiredPaths = [
    'index.html',
    'about/index.html',
    'services/index.html',
    'services/service-01/index.html',
    'services/service-02/index.html',
    'services/service-03/index.html',
    'work/index.html',
    'work/case-01/index.html',
    'work/case-02/index.html',
    'work/case-03/index.html',
    'journal/index.html',
    'journal/insight-01/index.html',
    'journal/insight-02/index.html',
    'contact/index.html'
  ];
  for (const relative of requiredPaths) if (!existsSync(resolve(siteRoot, relative))) throw new Error(`Missing ${model.site.slug}/${relative}`);

  const design = JSON.parse(readFileSync(resolve(siteRoot, 'design.json'), 'utf8'));
  if (design.depthVersion !== '5.0.0') throw new Error(`depthVersion mismatch for ${model.site.slug}`);
  if (design.informationArchitecture?.pageCount !== 14 || design.informationArchitecture?.maxDepth !== 3) throw new Error(`informationArchitecture mismatch for ${model.site.slug}`);
  if (design.informationArchitecture?.detailCounts?.services !== 3 || design.informationArchitecture?.detailCounts?.cases !== 3 || design.informationArchitecture?.detailCounts?.articles !== 2) throw new Error(`detail counts mismatch for ${model.site.slug}`);
}

for (const path of indexPages) {
  const html = readFileSync(path, 'utf8');
  const relative = path.slice(resolve(dist).length).replaceAll('\\', '/');
  const isRoot = /^\/sites\/[^/]+\/index\.html$/.test(relative);
  const checks = [
    ['depth css', '/Site100/assets/v5-depth.css'],
    ['depth runtime', '/Site100/assets/depth.js'],
    ['responsive css', '/Site100/assets/v4-responsive.css'],
    ['responsive runtime', '/Site100/assets/responsive.js'],
    ['art direction', '/Site100/assets/art-direction.js']
  ];
  for (const [label, token] of checks) if (!html.includes(token)) qualityFailures.push(`${relative}: missing ${label}`);

  const title = (html.match(/<title>(.*?)<\/title>/s) || [])[1];
  const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  const description = (html.match(/<meta name="description" content="([^"]+)"/) || [])[1];
  if (!title || titles.has(title)) qualityFailures.push(`${relative}: duplicate or missing title`); else titles.add(title);
  if (!canonical || canonicals.has(canonical)) qualityFailures.push(`${relative}: duplicate or missing canonical`); else canonicals.add(canonical);
  if (!description || descriptions.has(description)) qualityFailures.push(`${relative}: duplicate or missing description`); else descriptions.add(description);

  if (!isRoot) {
    for (const token of ['v5-page-main', 'v5-breadcrumbs', 'application/ld+json', 'window.SITE100_PAGE', 'v5-primary-nav']) {
      if (!html.includes(token)) qualityFailures.push(`${relative}: missing ${token}`);
    }
    if (html.length < 5500) qualityFailures.push(`${relative}: shallow HTML ${html.length} bytes`);
    const type = (html.match(/window\.SITE100_PAGE=\{"type":"([^"]+)"/) || [])[1];
    if (!type) qualityFailures.push(`${relative}: missing page type`);
    else typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
  } else {
    typeCounts.set('home', (typeCounts.get('home') || 0) + 1);
  }

  const hrefs = [...html.matchAll(/href="(\/Site100\/sites\/[^"?#]+\/?)(?:[?#][^"]*)?"/g)].map((match) => match[1]);
  for (let href of hrefs) {
    if (!href.endsWith('/')) href += '/';
    if (!routeSet.has(href)) brokenLinks.push(`${relative} -> ${href}`);
  }

  if (/lorem ipsum|placeholder text|전용 소재 \d+/i.test(html)) qualityFailures.push(`${relative}: placeholder content found`);
}

const expectedTypes = {
  home: 100,
  about: 100,
  services: 100,
  service: 300,
  work: 100,
  case: 300,
  journal: 100,
  article: 200,
  contact: 100
};
for (const [type, expected] of Object.entries(expectedTypes)) {
  const actual = typeCounts.get(type) || 0;
  if (actual !== expected) qualityFailures.push(`page type ${type}: expected ${expected}, got ${actual}`);
}

const detailChecks = [
  ['services/service-01/index.html', ['data-v5-add-service', 'v5-outcome-grid', 'v5-deliverables', 'v5-faq']],
  ['work/case-01/index.html', ['v5-metrics', 'v5-case-story', 'v5-process']],
  ['journal/insight-01/index.html', ['data-v5-article', 'v5-article-toc', 'data-v5-bookmark']],
  ['contact/index.html', ['data-v5-wizard', 'data-v5-step', 'data-v5-wizard-result']]
];
for (const site of SITES) {
  for (const [relative, tokens] of detailChecks) {
    const html = readFileSync(resolve(dist, 'sites', site.slug, relative), 'utf8');
    for (const token of tokens) if (!html.includes(token)) qualityFailures.push(`${site.slug}/${relative}: missing ${token}`);
  }
}

if (brokenLinks.length) throw new Error(`Broken deep links (${brokenLinks.length}):\n${brokenLinks.slice(0, 30).join('\n')}`);
if (qualityFailures.length) throw new Error(`Deep architecture quality failures (${qualityFailures.length}):\n${qualityFailures.slice(0, 40).join('\n')}`);

const sitemap = readFileSync(resolve(dist, 'sitemap.xml'), 'utf8');
const sitemapCount = (sitemap.match(/<url>/g) || []).length;
if (sitemapCount !== 1401) throw new Error(`Expected 1401 sitemap URLs, got ${sitemapCount}`);

const depthManifest = JSON.parse(readFileSync(resolve(dist, 'depth-manifest.json'), 'utf8'));
if (depthManifest.sitePageCount !== 1400 || depthManifest.pagesPerSite !== 14 || depthManifest.maximumDepth !== 3) throw new Error('Invalid depth manifest summary');
const manifest = JSON.parse(readFileSync(resolve(dist, 'manifest.json'), 'utf8'));
if (manifest.depthVersion !== '5.0.0' || manifest.deepArchitecture?.sitePageCount !== 1400) throw new Error('Root manifest deep architecture mismatch');

const report = {
  version: '5.0.0',
  sites: 100,
  pagesPerSite: 14,
  sitePages: 1400,
  indexedPages: 1401,
  maximumDepth: 3,
  uniqueTitles: titles.size,
  uniqueCanonicals: canonicals.size,
  uniqueDescriptions: descriptions.size,
  pageTypes: Object.fromEntries([...typeCounts].sort()),
  brokenLinks: 0,
  failures: []
};
writeFileSync(resolve(dist, 'depth-audit-report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Deep architecture audit passed: ${report.sitePages} pages, ${report.uniqueTitles} unique titles and ${report.brokenLinks} broken links.`);
