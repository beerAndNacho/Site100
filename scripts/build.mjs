
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SITES } from '../src/catalog.js';

const root=resolve(process.cwd()), dist=resolve(root,'dist');
rmSync(dist,{recursive:true,force:true}); mkdirSync(resolve(dist,'assets'),{recursive:true});
for(const file of ['catalog.js','app.js','styles.css']) cpSync(resolve(root,'src',file),resolve(dist,'assets',file));

const head=(title,description,canonical)=>`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="index,follow"><meta name="theme-color" content="#efece3"><title>${title}</title><meta name="description" content="${description}"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:type" content="website"><link rel="canonical" href="${canonical}"><link rel="stylesheet" href="/Site100/assets/styles.css"></head><body>`;
const foot=`<script type="module" src="/Site100/assets/app.js"></script></body></html>`;
writeFileSync(resolve(dist,'index.html'),head('100WORLDS | 홈페이지 디자인 100개','업종의 실제 소재와 행동을 화면 구조로 만든 서로 다른 홈페이지 디자인 100개.','https://beerandnacho.github.io/Site100/')+foot);

for(const site of SITES){
  const dir=resolve(dist,'sites',site.slug); mkdirSync(dir,{recursive:true});
  const description=`${site.tagline} ${site.kind} 홈페이지 디자인 템플릿.`;
  writeFileSync(resolve(dir,'index.html'),head(`${site.name} | 100WORLDS`,description,`https://beerandnacho.github.io/Site100/sites/${site.slug}/`)+`<script>window.SITE100_SLUG=${JSON.stringify(site.slug)}</script>`+foot);
  writeFileSync(resolve(dir,'design.json'),JSON.stringify({id:site.id,name:site.name,sector:site.sector,kind:site.kind,interaction:site.interaction,...site.design},null,2));
}
const urls=['https://beerandnacho.github.io/Site100/',...SITES.map(s=>`https://beerandnacho.github.io/Site100/sites/${s.slug}/`)];
writeFileSync(resolve(dist,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`<url><loc>${u}</loc><lastmod>2026-08-23</lastmod></url>`).join('\n')}\n</urlset>\n`);
writeFileSync(resolve(dist,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: https://beerandnacho.github.io/Site100/sitemap.xml\n');
writeFileSync(resolve(dist,'.nojekyll'),'');
writeFileSync(resolve(dist,'manifest.json'),JSON.stringify({count:SITES.length,sectors:[...new Set(SITES.map(s=>s.sector))],layouts:[...new Set(SITES.map(s=>s.design.layout))],heroes:[...new Set(SITES.map(s=>s.design.hero))],interactions:[...new Set(SITES.map(s=>s.interaction))]},null,2));
console.log(`Built gallery and ${SITES.length} site routes.`);
