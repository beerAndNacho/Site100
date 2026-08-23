import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SITES } from '../src/catalog.js';
import { polishedSite } from '../src/copy.js';

const root = resolve(process.cwd());
const dist = resolve(root, 'dist');
const artDir = resolve(dist, 'artworks');
const DIRECTIONS = ['atelier','precision','interface','notebook','organic','studio','atlas','catalog','civic','experimental'];

if (!existsSync(dist)) throw new Error('dist/ not found. Run the base build first.');
mkdirSync(artDir, { recursive: true });
for (const file of ['art-direction.js', 'v3.css']) {
  const source = resolve(root, 'src', file);
  if (!existsSync(source)) throw new Error(`Missing v3 source asset: ${file}`);
  cpSync(source, resolve(dist, 'assets', file));
}

const xml = (value) => String(value).replace(/[<>&"']/g, (character) => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;'
})[character]);
const directionFor = (site) => DIRECTIONS[Math.min(9, Math.floor((site.id - 1) / 10))];
const hashNumber = (value) => parseInt(createHash('sha256').update(String(value)).digest('hex').slice(0, 8), 16) >>> 0;
const seeded = (site, index, max) => (hashNumber(`${site.slug}:${index}`) % max);

function defs(site) {
  const palette = site.design.palette;
  return `<defs>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${xml(palette.accent)}"/><stop offset="1" stop-color="${xml(palette.accent2)}"/></linearGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${xml(palette.surface)}" stop-opacity=".03"/><stop offset="1" stop-color="${xml(palette.ink)}" stop-opacity=".34"/></linearGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="18" dy="22" stdDeviation="18" flood-color="#000" flood-opacity=".28"/></filter>
    <filter id="grain" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".86" numOctaves="3" stitchTiles="stitch" result="noise"/><feColorMatrix in="noise" type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 .08"/></feComponentTransfer></filter>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="${xml(palette.surface)}" stroke-opacity=".14" stroke-width="1"/></pattern>
    <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2" fill="${xml(palette.surface)}" fill-opacity=".15"/></pattern>
  </defs>`;
}

function labels(site, dark = false) {
  const color = dark ? site.design.palette.surface : site.design.palette.ink;
  return `<g fill="${xml(color)}" font-family="system-ui, sans-serif">
    <text x="70" y="95" font-size="18" font-weight="900" letter-spacing="4">WORLD ${String(site.id).padStart(3, '0')}</text>
    <text x="70" y="760" font-size="62" font-weight="900" letter-spacing="-4">${xml(site.name)}</text>
    <text x="72" y="804" font-size="17" font-weight="700" opacity=".64">${xml(site.kind)} · ${xml(site.design.layout)} · ${xml(site.interaction)}</text>
  </g>`;
}

function atelier(site) {
  const p = site.design.palette;
  const cards = site.materials.map((material, index) => {
    const x = 120 + index * 215;
    const y = 210 + (index % 2) * 115;
    const rotate = [-5,4,-3,6][index];
    return `<g transform="translate(${x} ${y}) rotate(${rotate})" filter="url(#shadow)"><rect width="205" height="255" fill="${xml(p.surface)}" stroke="${xml(p.ink)}" stroke-width="3"/><rect x="18" y="18" width="169" height="130" fill="${index % 2 ? xml(p.accent2) : xml(p.accent)}" opacity=".82"/><path d="M25 180h155M25 203h118M25 226h145" stroke="${xml(p.ink)}" stroke-width="5"/><text x="22" y="168" fill="${xml(p.ink)}" font-family="system-ui" font-size="14" font-weight="900">0${index + 1} ${xml(material)}</text></g>`;
  }).join('');
  return `${defs(site)}<rect width="1200" height="900" fill="${xml(p.bg)}"/><path d="M0 135h1200M0 842h1200" stroke="${xml(p.surface)}" stroke-opacity=".32" stroke-dasharray="9 12"/>${cards}<circle cx="1035" cy="155" r="95" fill="none" stroke="${xml(p.accent)}" stroke-width="24"/><text x="972" y="167" fill="${xml(p.surface)}" font-family="serif" font-size="34" font-weight="900">MADE</text>${labels(site, true)}<rect width="1200" height="900" filter="url(#grain)" opacity=".8"/>`;
}

function precision(site) {
  const p = site.design.palette;
  const dimensionLines = Array.from({ length: 7 }, (_, index) => {
    const y = 170 + index * 82;
    const x2 = 950 - seeded(site, index, 220);
    return `<g><path d="M105 ${y}H${x2}" stroke="${xml(p.surface)}" stroke-opacity=".42" stroke-width="2"/><path d="M105 ${y - 9}v18M${x2} ${y - 9}v18" stroke="${xml(p.accent)}" stroke-width="3"/><text x="${x2 + 18}" y="${y + 6}" fill="${xml(p.surface)}" font-family="ui-monospace" font-size="15">${site.id * 7 + index * 11} mm</text></g>`;
  }).join('');
  return `${defs(site)}<rect width="1200" height="900" fill="${xml(p.bg)}"/><rect x="34" y="34" width="1132" height="832" fill="url(#grid)" stroke="${xml(p.accent)}" stroke-width="3"/>${dimensionLines}<g transform="translate(765 185)"><rect width="300" height="360" fill="none" stroke="${xml(p.accent2)}" stroke-width="5"/><circle cx="150" cy="180" r="118" fill="none" stroke="${xml(p.surface)}" stroke-width="2"/><circle cx="150" cy="180" r="57" fill="${xml(p.accent)}" opacity=".76"/><path d="M0 180h300M150 0v360" stroke="${xml(p.surface)}" stroke-opacity=".38"/></g>${labels(site, true)}`;
}

function interfaceArt(site) {
  const p = site.design.palette;
  const nodes = Array.from({ length: 16 }, (_, index) => {
    const x = 130 + seeded(site, index, 900);
    const y = 150 + seeded(site, index + 100, 560);
    const r = 6 + seeded(site, index + 200, 17);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${index % 3 ? xml(p.accent2) : xml(p.accent)}" opacity="${index % 2 ? '.72' : '.96'}"/>`;
  }).join('');
  const paths = Array.from({ length: 8 }, (_, index) => {
    const y = 190 + index * 65;
    const end = 730 + seeded(site, index + 300, 310);
    return `<path d="M105 ${y} C300 ${y - 90}, 430 ${y + 95}, ${end} ${y - 15}" fill="none" stroke="url(#accent)" stroke-width="${index % 3 + 2}" opacity=".6"/>`;
  }).join('');
  return `${defs(site)}<rect width="1200" height="900" fill="${xml(p.bg)}"/><rect width="1200" height="900" fill="url(#grid)"/><g filter="url(#shadow)"><rect x="72" y="120" width="720" height="560" rx="38" fill="${xml(p.surface)}" fill-opacity=".08" stroke="${xml(p.surface)}" stroke-opacity=".36"/><rect x="820" y="120" width="305" height="250" rx="28" fill="${xml(p.surface)}" fill-opacity=".1" stroke="${xml(p.accent)}" stroke-opacity=".7"/><rect x="820" y="400" width="305" height="280" rx="28" fill="${xml(p.surface)}" fill-opacity=".07" stroke="${xml(p.surface)}" stroke-opacity=".24"/></g>${paths}${nodes}<text x="860" y="205" fill="${xml(p.accent)}" font-family="ui-monospace" font-size="56" font-weight="900">${String(site.id).padStart(3, '0')}</text>${labels(site, true)}`;
}

function notebook(site) {
  const p = site.design.palette;
  const notes = site.materials.map((material, index) => {
    const x = 100 + (index % 2) * 470;
    const y = 180 + Math.floor(index / 2) * 250;
    const colors = [p.accent, p.accent2, p.surface, p.accent];
    return `<g transform="translate(${x} ${y}) rotate(${[-2,3,2,-3][index]})"><rect width="420" height="195" rx="8" fill="${xml(colors[index])}" opacity="${index === 2 ? '.92' : '.82'}"/><path d="M30 68h330M30 103h280M30 138h350" stroke="${xml(p.ink)}" stroke-opacity=".55" stroke-width="4"/><text x="28" y="45" fill="${xml(p.ink)}" font-family="system-ui" font-size="17" font-weight="900">${xml(material)}</text></g>`;
  }).join('');
  return `${defs(site)}<rect width="1200" height="900" fill="${xml(p.surface)}"/><path d="M0 135h1200M0 175h1200M0 215h1200M0 255h1200M0 295h1200M0 335h1200M0 375h1200M0 415h1200M0 455h1200M0 495h1200M0 535h1200M0 575h1200M0 615h1200M0 655h1200M0 695h1200M0 735h1200M0 775h1200" stroke="${xml(p.ink)}" stroke-opacity=".09"/><path d="M66 0v900" stroke="${xml(p.accent2)}" stroke-width="4" opacity=".45"/>${notes}${labels(site, false)}<rect width="1200" height="900" filter="url(#grain)"/>`;
}

function organic(site) {
  const p = site.design.palette;
  const blobs = Array.from({ length: 8 }, (_, index) => {
    const x = 90 + seeded(site, index, 960);
    const y = 90 + seeded(site, index + 20, 650);
    const size = 100 + seeded(site, index + 40, 260);
    const fill = index % 2 ? p.accent2 : p.accent;
    return `<path d="M${x} ${y + size / 2} C${x - size * .45} ${y - size * .15},${x + size * .3} ${y - size * .55},${x + size * .65} ${y} C${x + size * 1.1} ${y + size * .45},${x + size * .45} ${y + size * 1.02},${x} ${y + size / 2}Z" fill="${xml(fill)}" opacity="${.14 + index * .055}"/>`;
  }).join('');
  return `${defs(site)}<rect width="1200" height="900" fill="${xml(p.bg)}"/>${blobs}<ellipse cx="635" cy="405" rx="360" ry="260" fill="${xml(p.surface)}" fill-opacity=".07" stroke="${xml(p.surface)}" stroke-opacity=".25" stroke-width="3"/><path d="M335 490 C470 180 790 680 990 315" fill="none" stroke="url(#accent)" stroke-width="34" stroke-linecap="round"/><circle cx="625" cy="405" r="90" fill="${xml(p.surface)}" fill-opacity=".16"/>${labels(site, true)}`;
}

function studio(site) {
  const p = site.design.palette;
  const frames = Array.from({ length: 5 }, (_, index) => {
    const x = 70 + index * 205;
    const y = 155 + (index % 2) * 180;
    const height = 320 + (index % 3) * 65;
    const fill = index % 2 ? p.accent2 : p.accent;
    return `<g transform="translate(${x} ${y}) rotate(${[-4,3,-1,5,-3][index]})"><rect width="188" height="${height}" fill="${xml(p.surface)}" stroke="${xml(p.ink)}" stroke-width="5"/><rect x="18" y="18" width="152" height="${height - 92}" fill="${xml(fill)}" opacity=".74"/><circle cx="94" cy="${90 + index * 17}" r="${38 + index * 7}" fill="none" stroke="${xml(p.ink)}" stroke-width="8"/><text x="18" y="${height - 28}" fill="${xml(p.ink)}" font-family="system-ui" font-size="14" font-weight="900">0${index + 1} / ${xml(site.materials[index % 4])}</text></g>`;
  }).join('');
  return `${defs(site)}<rect width="1200" height="900" fill="${xml(p.bg)}"/><path d="M0 0h1200v900H0z" fill="url(#dots)"/>${frames}<path d="M30 75h170M30 75v65M1170 825h-170M1170 825v-65" fill="none" stroke="${xml(p.accent)}" stroke-width="8"/>${labels(site, true)}`;
}

function atlas(site) {
  const p = site.design.palette;
  const contours = Array.from({ length: 13 }, (_, index) => {
    const inset = 45 + index * 24;
    const wobble = seeded(site, index, 90);
    return `<path d="M${inset} ${460 + wobble / 3} C${210 + wobble} ${90 + index * 18},${760 - wobble} ${100 + index * 22},${1200 - inset} ${420 - wobble / 4} C${1030 - wobble} ${760 - index * 10},${300 + wobble} ${760 - index * 15},${inset} ${460 + wobble / 3}Z" fill="none" stroke="${xml(index % 3 === 0 ? p.accent : p.surface)}" stroke-opacity="${index % 3 === 0 ? '.58' : '.18'}" stroke-width="${index % 3 === 0 ? 3 : 1}"/>`;
  }).join('');
  const stops = site.materials.map((material, index) => `<g transform="translate(${210 + index * 230} ${240 + (index % 2) * 290})"><circle r="28" fill="${xml(p.accent)}"/><circle r="10" fill="${xml(p.ink)}"/><text x="42" y="6" fill="${xml(p.surface)}" font-family="system-ui" font-size="16" font-weight="800">${xml(material)}</text></g>`).join('');
  return `${defs(site)}<rect width="1200" height="900" fill="${xml(p.bg)}"/>${contours}<path d="M160 620 C340 180 660 730 1040 245" fill="none" stroke="${xml(p.accent2)}" stroke-width="10" stroke-dasharray="17 18"/>${stops}${labels(site, true)}`;
}

function catalog(site) {
  const p = site.design.palette;
  const products = site.materials.map((material, index) => {
    const x = 90 + index * 270;
    const y = 180 + (index % 2) * 100;
    return `<g transform="translate(${x} ${y})"><rect width="235" height="430" rx="${18 + index * 8}" fill="${xml(p.surface)}" filter="url(#shadow)"/><rect x="22" y="22" width="191" height="240" rx="${14 + index * 4}" fill="${xml(index % 2 ? p.accent2 : p.accent)}" opacity=".84"/><ellipse cx="118" cy="280" rx="75" ry="16" fill="${xml(p.ink)}" opacity=".12"/><text x="24" y="330" fill="${xml(p.ink)}" font-family="system-ui" font-size="17" font-weight="900">${xml(material)}</text><text x="24" y="365" fill="${xml(p.ink)}" font-family="ui-monospace" font-size="13" opacity=".58">ITEM ${String(index + 1).padStart(2, '0')}</text><circle cx="42" cy="395" r="12" fill="${xml(p.accent)}"/><circle cx="74" cy="395" r="12" fill="${xml(p.accent2)}"/></g>`;
  }).join('');
  return `${defs(site)}<rect width="1200" height="900" fill="${xml(p.bg)}"/>${products}${labels(site, true)}`;
}

function civic(site) {
  const p = site.design.palette;
  const blocks = [
    [50,145,510,190,p.accent],
    [590,145,560,190,p.surface],
    [50,365,340,330,p.surface],
    [420,365,730,145,p.accent2],
    [420,540,730,155,p.accent]
  ].map(([x,y,w,h,fill], index) => `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${xml(fill)}" stroke="${xml(p.ink)}" stroke-width="8"/><text x="${x + 28}" y="${y + 52}" fill="${xml(p.ink)}" font-family="system-ui" font-size="${index === 2 ? 34 : 22}" font-weight="900">${xml((site.materials[index % 4] || site.kind).toUpperCase())}</text><text x="${x + 28}" y="${y + h - 28}" fill="${xml(p.ink)}" font-family="ui-monospace" font-size="16">0${index + 1} / OPEN ACCESS</text></g>`).join('');
  return `${defs(site)}<rect width="1200" height="900" fill="${xml(p.bg)}"/>${blocks}<path d="M44 104h1112" stroke="${xml(p.surface)}" stroke-width="10"/>${labels(site, true)}`;
}

function experimental(site) {
  const p = site.design.palette;
  const windows = Array.from({ length: 6 }, (_, index) => {
    const x = 80 + seeded(site, index, 780);
    const y = 120 + seeded(site, index + 20, 470);
    const w = 230 + seeded(site, index + 40, 260);
    const height = 150 + seeded(site, index + 60, 220);
    const fill = index % 2 ? p.accent2 : p.accent;
    const rotate = -8 + seeded(site, index + 80, 17);
    return `<g transform="translate(${x} ${y}) rotate(${rotate})" filter="url(#shadow)"><rect width="${w}" height="${height}" rx="${index % 3 ? 0 : 24}" fill="${xml(fill)}" fill-opacity=".76" stroke="${xml(p.surface)}" stroke-width="3"/><rect width="${w}" height="34" fill="${xml(p.ink)}" fill-opacity=".78"/><circle cx="18" cy="17" r="5" fill="${xml(p.surface)}"/><circle cx="36" cy="17" r="5" fill="${xml(p.surface)}" opacity=".5"/><text x="18" y="${height - 20}" fill="${xml(p.ink)}" font-family="ui-monospace" font-size="13" font-weight="900">${xml(site.materials[index % 4])}</text></g>`;
  }).join('');
  return `${defs(site)}<rect width="1200" height="900" fill="${xml(p.bg)}"/><circle cx="420" cy="430" r="330" fill="${xml(p.accent)}" opacity=".12"/><circle cx="760" cy="360" r="270" fill="${xml(p.accent2)}" opacity=".14"/>${windows}<path d="M60 760 C300 420 770 980 1130 420" fill="none" stroke="${xml(p.surface)}" stroke-width="7" stroke-dasharray="22 13"/>${labels(site, true)}`;
}

const renderers = { atelier, precision, interface: interfaceArt, notebook, organic, studio, atlas, catalog, civic, experimental };
const artHashes = new Set();
for (const rawSite of SITES) {
  const site = polishedSite(rawSite);
  const direction = directionFor(site);
  const body = renderers[direction](site);
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" role="img" aria-labelledby="title description"><title id="title">${xml(site.name)} 아트 디렉션</title><description id="description">${xml(site.kind)}의 ${xml(direction)} 시각 언어. ${xml(site.materials.join(', '))} 소재를 사용합니다.</description>${body}</svg>`;
  const hash = createHash('sha256').update(svg).digest('hex');
  if (artHashes.has(hash)) throw new Error(`Duplicate v3 artwork generated for ${site.slug}`);
  artHashes.add(hash);
  writeFileSync(resolve(artDir, `${site.slug}.svg`), svg);

  const designPath = resolve(dist, 'sites', site.slug, 'design.json');
  const design = JSON.parse(readFileSync(designPath, 'utf8'));
  design.visualVersion = '3.0.0';
  design.artDirection = direction;
  design.artwork = `/Site100/artworks/${site.slug}.svg`;
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
    if (!html.includes('/Site100/assets/v3.css')) {
      html = html.replace('</head>', '<link rel="stylesheet" href="/Site100/assets/v3.css"></head>');
    }
    if (!html.includes('/Site100/assets/art-direction.js')) {
      html = html.replace('</body>', '<script type="module" src="/Site100/assets/art-direction.js"></script></body>');
    }
    writeFileSync(path, html);
  }
}
walk(dist);

const manifestPath = resolve(dist, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
manifest.visualVersion = '3.0.0';
manifest.visualSystem = {
  directions: DIRECTIONS,
  artworkCount: artHashes.size,
  features: ['sector-art-direction','generated-hero-art','material-marquee','section-rhythm','pointer-parallax','reveal-motion','section-rail','premium-gallery-runway']
};
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated ${artHashes.size} unique Site100 v3 artworks across ${DIRECTIONS.length} art directions.`);
