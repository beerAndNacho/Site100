import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SITES } from '../src/catalog.js';
import { deepRoutes } from '../src/depth-content.js';
import { withParticle } from '../src/copy.js';

const dist = resolve(process.cwd(), 'dist');
const origin = 'https://beerandnacho.github.io';
const siteBase = `${origin}/Site100`;
const duplicatePrefix = `${siteBase}/Site100/`;
const failures = [];
let checked = 0;
let breadcrumbItems = 0;

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);

for (const site of SITES) {
  for (const route of deepRoutes(site)) {
    if (route.type === 'home') continue;
    const relative = route.path.replace(/^\/Site100\//, '').replace(/\/$/, '');
    const path = resolve(dist, relative, 'index.html');
    if (!existsSync(path)) {
      failures.push(`${route.path}: missing page`);
      continue;
    }
    checked += 1;
    const html = readFileSync(path, 'utf8');
    const expected = `${origin}${route.path}`;
    const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
    const ogUrl = html.match(/<meta property="og:url" content="([^"]+)">/)?.[1];
    if (canonical !== expected) failures.push(`${route.path}: canonical ${canonical} != ${expected}`);
    if (ogUrl !== expected) failures.push(`${route.path}: og:url ${ogUrl} != ${expected}`);
    if (html.includes(duplicatePrefix)) failures.push(`${route.path}: duplicate Site100 base path remains`);

    const script = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)?.[1];
    if (!script) {
      failures.push(`${route.path}: structured data missing`);
      continue;
    }
    let data;
    try { data = JSON.parse(script); } catch (error) {
      failures.push(`${route.path}: invalid structured data ${error.message}`);
      continue;
    }
    const graph = data['@graph'];
    const page = Array.isArray(graph) ? graph.find((entry) => entry['@type'] !== 'BreadcrumbList') : null;
    const breadcrumbs = Array.isArray(graph) ? graph.find((entry) => entry['@type'] === 'BreadcrumbList') : null;
    if (page?.url !== expected) failures.push(`${route.path}: schema page URL mismatch`);
    if (!breadcrumbs?.itemListElement?.length) {
      failures.push(`${route.path}: breadcrumb list missing`);
      continue;
    }
    const items = breadcrumbs.itemListElement;
    breadcrumbItems += items.length;
    if (items[0]?.item !== `${siteBase}/` || items[0]?.name !== '100WORLDS') failures.push(`${route.path}: breadcrumb root mismatch`);
    if (items.at(-1)?.item !== expected) failures.push(`${route.path}: breadcrumb current URL mismatch`);
    if (items.some((item, index) => item.position !== index + 1)) failures.push(`${route.path}: breadcrumb positions are not sequential`);
    if (items.some((item) => item.name === 'https:' || item.name === 'beerandnacho.github.io' || String(item.item).includes('/Site100/Site100/'))) failures.push(`${route.path}: malformed breadcrumb segment remains`);
    if (route.type === 'service' || route.type === 'case' || route.type === 'article') {
      if (items.length !== 4) failures.push(`${route.path}: expected 4 breadcrumb items, got ${items.length}`);
    } else if (items.length !== 3) {
      failures.push(`${route.path}: expected 3 breadcrumb items, got ${items.length}`);
    }

    if (route.type === 'about') {
      const escapedName = escapeHtml(site.name);
      const escapedKind = escapeHtml(site.kind);
      const subject = `${escapeHtml(withParticle(site.name, '이', '가'))} 만드는`;
      const topic = `${escapeHtml(withParticle(site.name, '은', '는'))} ${escapedKind}`;
      if (!html.includes(subject)) failures.push(`${route.path}: subject particle copy missing (${subject})`);
      if (!html.includes(topic)) failures.push(`${route.path}: topic particle copy missing (${topic})`);
      if (html.includes(`${escapedName}이 만드는`) && subject !== `${escapedName}이 만드는`) failures.push(`${route.path}: legacy subject particle remains`);
      if (html.includes(`${escapedName}은 ${escapedKind}`) && topic !== `${escapedName}은 ${escapedKind}`) failures.push(`${route.path}: legacy topic particle remains`);
    }
  }
}

const sitemap = readFileSync(resolve(dist, 'sitemap.xml'), 'utf8');
if (sitemap.includes(duplicatePrefix)) failures.push('sitemap: duplicate Site100 base path remains');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
if (urls.length !== 1401) failures.push(`sitemap: expected 1401 URLs, got ${urls.length}`);
if (new Set(urls).size !== urls.length) failures.push('sitemap: duplicate URLs found');
for (const site of SITES) {
  for (const route of deepRoutes(site)) {
    const expected = `${origin}${route.path}`;
    if (!urls.includes(expected)) failures.push(`sitemap: missing ${expected}`);
  }
}

const manifest = JSON.parse(readFileSync(resolve(dist, 'manifest.json'), 'utf8'));
if (manifest.depthSeoPatchVersion !== '5.0.2') failures.push('manifest: depthSeoPatchVersion mismatch');
if (manifest.deepArchitecture?.canonicalStrategy !== 'origin-plus-route') failures.push('manifest: canonical strategy mismatch');

if (failures.length) throw new Error(`Deep SEO audit failures (${failures.length}):\n${failures.slice(0, 50).join('\n')}`);
const report = {
  version: '5.0.2',
  checkedDeepPages: checked,
  sitemapUrls: urls.length,
  breadcrumbItems,
  duplicateBasePaths: 0,
  malformedBreadcrumbs: 0,
  KoreanParticleFailures: 0,
  failures: []
};
writeFileSync(resolve(dist, 'depth-seo-audit-report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Deep SEO audit passed: ${checked} pages, ${urls.length} sitemap URLs and ${breadcrumbItems} breadcrumb items.`);
