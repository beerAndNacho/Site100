import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SITES, SECTORS } from '../src/catalog.js';

const root = resolve(process.cwd());
const dist = resolve(root, 'dist');
const baseUrl = 'https://beerandnacho.github.io/Site100';
const version = '2.0.0';
const buildDate = '2026-08-23';

const escapeXml = (value) => String(value).replace(/[<>&"']/g, (char) => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;'
})[char]);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);

rmSync(dist, { recursive: true, force: true });
mkdirSync(resolve(dist, 'assets'), { recursive: true });
mkdirSync(resolve(dist, 'previews'), { recursive: true });
for (const file of ['catalog.js', 'app.js', 'styles.css', 'enhance.js', 'v2.css']) {
  cpSync(resolve(root, 'src', file), resolve(dist, 'assets', file));
}

function previewSvg(site) {
  const { palette, layout, hero, geometry, medium } = site.design;
  const seed = site.id * 97;
  const stripes = Array.from({ length: 8 }, (_, index) => {
    const width = 54 + ((seed + index * 43) % 150);
    const height = 16 + ((seed + index * 29) % 62);
    const x = 36 + ((seed + index * 89) % 500);
    const y = 95 + ((seed + index * 61) % 360);
    const fill = index % 3 === 0 ? palette.accent : index % 3 === 1 ? palette.accent2 : palette.surface;
    const opacity = index % 3 === 2 ? '.72' : '.94';
    const rx = geometry === 'circle' || geometry === 'round' || geometry === 'organic' ? Math.min(width, height) / 2 : geometry === 'paper' ? 4 : 0;
    return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${rx}" fill="${escapeXml(fill)}" opacity="${opacity}"/>`;
  }).join('');
  const lines = Array.from({ length: 9 }, (_, index) => {
    const y = 122 + index * 42;
    const x2 = 720 - ((seed + index * 31) % 160);
    return `<line x1="${38 + (index % 2) * 34}" y1="${y}" x2="${x2}" y2="${y}" stroke="${escapeXml(palette.ink)}" stroke-opacity="${index % 2 ? '.18' : '.34'}" stroke-width="${index % 3 === 0 ? 3 : 1}"/>`;
  }).join('');
  const circleX = 560 + (seed % 90);
  const circleY = 142 + (seed % 180);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(site.name)} 디자인 미리보기</title>
  <desc id="desc">${escapeXml(layout)} 레이아웃, ${escapeXml(hero)} 히어로, ${escapeXml(site.kind)} 홈페이지 디자인.</desc>
  <rect width="800" height="500" fill="${escapeXml(palette.bg)}"/>
  <rect x="22" y="22" width="756" height="456" fill="${escapeXml(palette.surface)}" stroke="${escapeXml(palette.ink)}" stroke-width="3"/>
  <rect x="22" y="22" width="756" height="48" fill="${escapeXml(palette.ink)}"/>
  <circle cx="48" cy="46" r="7" fill="${escapeXml(palette.accent)}"/>
  <text x="70" y="52" fill="${escapeXml(palette.surface)}" font-family="system-ui,sans-serif" font-size="14" font-weight="800">WORLD ${String(site.id).padStart(3, '0')} · ${escapeXml(site.kind)}</text>
  ${lines}
  ${stripes}
  <circle cx="${circleX}" cy="${circleY}" r="78" fill="none" stroke="${escapeXml(palette.accent)}" stroke-width="18" opacity=".82"/>
  <circle cx="${circleX}" cy="${circleY}" r="43" fill="${escapeXml(palette.accent2)}" opacity=".84"/>
  <text x="55" y="435" fill="${escapeXml(palette.ink)}" font-family="system-ui,sans-serif" font-size="38" font-weight="900">${escapeXml(site.name)}</text>
  <text x="55" y="462" fill="${escapeXml(palette.ink)}" fill-opacity=".62" font-family="ui-monospace,monospace" font-size="12">${escapeXml(layout)} / ${escapeXml(hero)} / ${escapeXml(medium)}</text>
</svg>`;
}

function structuredData(value) {
  return `<script type="application/ld+json">${JSON.stringify(value).replace(/</g, '\\u003c')}</script>`;
}

function documentHead({ title, description, canonical, themeColor, image, schema, pageType = 'website' }) {
  return `<!doctype html><html lang="ko"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="index,follow,max-image-preview:large"><meta name="theme-color" content="${escapeHtml(themeColor)}"><meta name="color-scheme" content="light dark">
<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}">
<meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:type" content="${pageType}"><meta property="og:url" content="${escapeHtml(canonical)}"><meta property="og:image" content="${escapeHtml(image)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(title)}"><meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="${escapeHtml(image)}">
<link rel="canonical" href="${escapeHtml(canonical)}"><link rel="manifest" href="/Site100/site.webmanifest"><link rel="icon" href="/Site100/icon.svg" type="image/svg+xml">
<link rel="preload" href="/Site100/assets/styles.css" as="style"><link rel="stylesheet" href="/Site100/assets/styles.css"><link rel="stylesheet" href="/Site100/assets/v2.css">
${structuredData(schema)}</head><body><noscript><div style="padding:32px;font-family:system-ui">이 템플릿의 인터랙션을 보려면 JavaScript를 켜주세요.</div></noscript>`;
}

const scripts = `<script type="module" src="/Site100/assets/app.js"></script><script type="module" src="/Site100/assets/enhance.js"></script></body></html>`;

for (const site of SITES) {
  writeFileSync(resolve(dist, 'previews', `${site.slug}.svg`), previewSvg(site));
}

const galleryDescription = '업종의 실제 사물과 행동을 화면 구조로 옮긴 서로 다른 반응형 홈페이지 디자인 100개. 검색, 추천, 비교, 즐겨찾기와 맞춤 미리보기를 제공합니다.';
const gallerySchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: '100WORLDS · Site100',
  description: galleryDescription,
  url: `${baseUrl}/`,
  mainEntity: {
    '@type': 'ItemList',
    numberOfItems: SITES.length,
    itemListElement: SITES.map((site) => ({
      '@type': 'ListItem',
      position: site.id,
      url: `${baseUrl}/sites/${site.slug}/`,
      name: site.name
    }))
  }
};
writeFileSync(
  resolve(dist, 'index.html'),
  documentHead({
    title: '100WORLDS | 서로 다른 홈페이지 디자인 100개',
    description: galleryDescription,
    canonical: `${baseUrl}/`,
    themeColor: '#111715',
    image: `${baseUrl}/preview-gallery.svg`,
    schema: gallerySchema
  }) + scripts
);

const galleryPreview = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#111715"/><g opacity=".9">${SITES.slice(0, 12).map((site, index) => `<rect x="${40 + (index % 4) * 285}" y="${40 + Math.floor(index / 4) * 175}" width="250" height="145" fill="${escapeXml(site.design.palette.surface)}" stroke="${escapeXml(site.design.palette.accent)}" stroke-width="5"/><text x="${58 + (index % 4) * 285}" y="${78 + Math.floor(index / 4) * 175}" fill="${escapeXml(site.design.palette.ink)}" font-family="system-ui,sans-serif" font-size="18" font-weight="900">${String(site.id).padStart(3, '0')} ${escapeXml(site.kind)}</text>`).join('')}</g><text x="55" y="590" fill="#f0ece2" font-family="system-ui,sans-serif" font-size="58" font-weight="900">100WORLDS · 100 DISTINCT WEBSITES</text></svg>`;
writeFileSync(resolve(dist, 'preview-gallery.svg'), galleryPreview);

for (const site of SITES) {
  const dir = resolve(dist, 'sites', site.slug);
  mkdirSync(dir, { recursive: true });
  const canonical = `${baseUrl}/sites/${site.slug}/`;
  const description = `${site.tagline} ${site.kind} 홈페이지 디자인 템플릿. ${site.design.layout} 레이아웃과 ${site.interaction} 인터랙션을 직접 체험할 수 있습니다.`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    description,
    url: canonical,
    image: `${baseUrl}/previews/${site.slug}.svg`,
    genre: [site.sector, site.kind, 'Website Template'],
    keywords: [site.kind, site.sector, site.design.layout, site.design.hero, site.design.mood, site.interaction, ...site.materials].join(', '),
    isPartOf: { '@type': 'CollectionPage', name: '100WORLDS', url: `${baseUrl}/` },
    potentialAction: { '@type': 'ViewAction', target: canonical }
  };
  writeFileSync(
    resolve(dir, 'index.html'),
    documentHead({
      title: `${site.name} | ${site.kind} 홈페이지 템플릿 · 100WORLDS`,
      description,
      canonical,
      themeColor: site.design.palette.bg,
      image: `${baseUrl}/previews/${site.slug}.svg`,
      schema
    }) + `<script>window.SITE100_SLUG=${JSON.stringify(site.slug)}</script>` + scripts
  );
  writeFileSync(resolve(dir, 'design.json'), JSON.stringify({
    version,
    id: site.id,
    name: site.name,
    slug: site.slug,
    sector: site.sector,
    kind: site.kind,
    tagline: site.tagline,
    cta: site.cta,
    interaction: site.interaction,
    services: site.services,
    materials: site.materials,
    contentSignature: `${site.kind}|${site.interaction}|${site.materials.join('|')}`,
    ...site.design
  }, null, 2));
}

const urls = [`${baseUrl}/`, ...SITES.map((site) => `${baseUrl}/sites/${site.slug}/`)];
writeFileSync(resolve(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `<url><loc>${url}</loc><lastmod>${buildDate}</lastmod></url>`).join('\n')}\n</urlset>\n`);
writeFileSync(resolve(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`);
writeFileSync(resolve(dist, '.nojekyll'), '');
writeFileSync(resolve(dist, '404.html'), documentHead({
  title: '페이지를 찾을 수 없습니다 | 100WORLDS',
  description: '요청한 디자인 세계를 찾을 수 없습니다.',
  canonical: `${baseUrl}/404.html`,
  themeColor: '#111715',
  image: `${baseUrl}/preview-gallery.svg`,
  schema: { '@context': 'https://schema.org', '@type': 'WebPage', name: '404' }
}) + `<main style="min-height:100vh;display:grid;place-items:center;padding:30px;text-align:center;font-family:system-ui"><div><p>404 · LOST WORLD</p><h1 style="font-size:clamp(48px,10vw,120px);margin:.2em 0">이 세계는 없습니다.</h1><a href="/Site100/">100개 세계로 돌아가기 →</a></div></main></body></html>`);
writeFileSync(resolve(dist, 'offline.html'), '<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>오프라인 | 100WORLDS</title><body style="font-family:system-ui;padding:32px"><h1>현재 오프라인입니다.</h1><p>연결이 복구되면 100WORLDS를 다시 열어주세요.</p><a href="/Site100/">다시 시도</a></body></html>');
writeFileSync(resolve(dist, 'site.webmanifest'), JSON.stringify({
  name: '100WORLDS · Site100',
  short_name: '100WORLDS',
  description: galleryDescription,
  start_url: '/Site100/',
  scope: '/Site100/',
  display: 'standalone',
  background_color: '#111715',
  theme_color: '#111715',
  icons: [{ src: '/Site100/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
}, null, 2));
writeFileSync(resolve(dist, 'icon.svg'), `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="96" fill="#111715"/><rect x="92" y="92" width="140" height="140" fill="#d9ff55"/><circle cx="340" cy="166" r="74" fill="#f0ece2"/><path d="M92 310h328v110H92z" fill="#e95b3f"/><text x="114" y="385" fill="#111715" font-family="system-ui,sans-serif" font-size="68" font-weight="900">100</text></svg>`);
writeFileSync(resolve(dist, 'manifest.json'), JSON.stringify({
  version,
  builtAt: `${buildDate}T00:00:00+09:00`,
  count: SITES.length,
  sectors: SECTORS,
  layouts: [...new Set(SITES.map((site) => site.design.layout))],
  heroes: [...new Set(SITES.map((site) => site.design.hero))],
  interactions: [...new Set(SITES.map((site) => site.interaction))],
  moods: [...new Set(SITES.map((site) => site.design.mood))],
  navigationPatterns: [...new Set(SITES.map((site) => site.design.nav))],
  features: ['search', 'multi-filter', 'recommendation', 'favorites', 'comparison', 'recently-viewed', 'template-customizer', 'device-preview', 'share', 'structured-data', 'generated-previews']
}, null, 2));
console.log(`Built Site100 v${version}: gallery, ${SITES.length} routes and ${SITES.length} generated previews.`);
