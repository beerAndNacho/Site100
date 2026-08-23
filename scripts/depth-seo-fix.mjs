import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SITES } from '../src/catalog.js';
import { deepRoutes } from '../src/depth-content.js';
import { withParticle } from '../src/copy.js';

const dist = resolve(process.cwd(), 'dist');
const origin = 'https://beerandnacho.github.io';
const siteBase = `${origin}/Site100`;
const duplicatePrefix = `${siteBase}/Site100/`;

if (!existsSync(resolve(dist, 'index.html'))) throw new Error('dist/ not found. Run the deep build first.');

const decodeHtml = (value) => String(value)
  .replaceAll('&amp;', '&')
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>')
  .replaceAll('&quot;', '"')
  .replaceAll('&#39;', "'");

function extractBreadcrumbs(html, canonical) {
  const nav = html.match(/<nav class="v5-breadcrumbs"[^>]*>(.*?)<\/nav>/s)?.[1] || '';
  const items = [
    { '@type': 'ListItem', position: 1, name: '100WORLDS', item: `${siteBase}/` }
  ];
  const matcher = /<a href="([^"]+)">([^<]+)<\/a>|<span aria-current="page">([^<]+)<\/span>/g;
  let match;
  while ((match = matcher.exec(nav))) {
    const href = match[1];
    const label = decodeHtml(match[2] || match[3] || '').trim();
    if (!label) continue;
    items.push({
      '@type': 'ListItem',
      position: items.length + 1,
      name: label,
      item: href ? `${origin}${href}` : canonical
    });
  }
  return items;
}

function patchStructuredData(html, canonical) {
  const scriptPattern = /<script type="application\/ld\+json">(.*?)<\/script>/s;
  const match = html.match(scriptPattern);
  if (!match) throw new Error(`Structured data missing for ${canonical}`);
  const data = JSON.parse(match[1]);
  const graph = Array.isArray(data['@graph']) ? data['@graph'] : [];
  const page = graph.find((entry) => entry['@type'] !== 'BreadcrumbList');
  const breadcrumbs = graph.find((entry) => entry['@type'] === 'BreadcrumbList');
  if (!page || !breadcrumbs) throw new Error(`Deep structured data graph is incomplete for ${canonical}`);
  page.url = canonical;
  if (page.isPartOf) page.isPartOf.url = canonical.split(/\/(?:about|services|work|journal|contact)\//)[0] + '/';
  breadcrumbs.itemListElement = extractBreadcrumbs(html, canonical);
  return html.replace(scriptPattern, `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`);
}

function patchPage(path, site, route) {
  let html = readFileSync(path, 'utf8');
  html = html.replaceAll(duplicatePrefix, `${siteBase}/`);
  const canonical = `${origin}${route.path}`;
  html = html
    .replace(/<meta property="og:url" content="[^"]+">/, `<meta property="og:url" content="${canonical}">`)
    .replace(/<link rel="canonical" href="[^"]+">/, `<link rel="canonical" href="${canonical}">`);

  if (route.type === 'about') {
    const subject = withParticle(site.name, '이', '가');
    const topic = withParticle(site.name, '은', '는');
    html = html
      .replace(`${site.name}이 만드는`, `${subject} 만드는`)
      .replace(`${site.name}은 ${site.kind}`, `${topic} ${site.kind}`);
  }

  html = patchStructuredData(html, canonical);
  writeFileSync(path, html);
}

for (const site of SITES) {
  for (const route of deepRoutes(site)) {
    if (route.type === 'home') continue;
    const relative = route.path.replace(/^\/Site100\//, '').replace(/\/$/, '');
    const path = resolve(dist, relative, 'index.html');
    if (!existsSync(path)) throw new Error(`Missing deep page for SEO patch: ${route.path}`);
    patchPage(path, site, route);
  }

  const designPath = resolve(dist, 'sites', site.slug, 'design.json');
  const design = JSON.parse(readFileSync(designPath, 'utf8'));
  design.depthSeoPatchVersion = '5.0.2';
  design.informationArchitecture.canonicalStrategy = 'origin-plus-route';
  design.informationArchitecture.breadcrumbStrategy = 'visible-navigation-derived';
  writeFileSync(designPath, `${JSON.stringify(design, null, 2)}\n`);
}

const sitemapPath = resolve(dist, 'sitemap.xml');
let sitemap = readFileSync(sitemapPath, 'utf8').replaceAll(duplicatePrefix, `${siteBase}/`);
writeFileSync(sitemapPath, sitemap);

const manifestPath = resolve(dist, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
manifest.depthSeoPatchVersion = '5.0.2';
manifest.deepArchitecture.canonicalStrategy = 'origin-plus-route';
manifest.deepArchitecture.breadcrumbStrategy = 'visible-navigation-derived';
manifest.deepArchitecture.seoFixes = ['duplicate-base-path', 'breadcrumb-graph', 'brand-subject-particle', 'brand-topic-particle'];
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log('Applied Site100 v5.0.2 canonical, breadcrumb and Korean copy fixes to 1300 deep pages.');
