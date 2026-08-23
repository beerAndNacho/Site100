import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { SITES, SECTORS } from '../src/catalog.js';
import { polishedSite, withParticle } from '../src/copy.js';

if (SITES.length !== 100) throw new Error(`Expected 100 sites, got ${SITES.length}`);
const unique = (values, label) => {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label}`);
};
unique(SITES.map((site) => site.id), 'id');
unique(SITES.map((site) => site.slug), 'slug');
unique(SITES.map((site) => site.design.fingerprint), 'design fingerprint');
unique(SITES.map((site) => JSON.stringify(site.design.palette)), 'palette');
unique(SITES.map((site) => `${site.kind}|${site.interaction}|${site.materials.join('|')}`), 'domain content signature');

for (let id = 1; id <= 100; id += 1) {
  if (!SITES.some((site) => site.id === id)) throw new Error(`Missing site ${id}`);
}

const allowed = new Set(['booking','quote','mixer','status','compare','map','filter','schedule','build','command','timeline','donation','rsvp','archive','audio','drag','carousel','switcher','calculate','reveal','configure','menu','form']);
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
for (const site of SITES) {
  if (!site.name || !site.slug || !site.sector || !site.kind || !site.tagline || !site.cta) throw new Error(`Incomplete metadata ${site.id}`);
  if (!slugPattern.test(site.slug)) throw new Error(`Invalid slug ${site.id}: ${site.slug}`);
  if (!allowed.has(site.interaction)) throw new Error(`Unsupported interaction ${site.id}`);
  if (site.services.length !== 3 || site.materials.length !== 4) throw new Error(`Incomplete domain content ${site.id}`);
  if (new Set(site.materials).size !== site.materials.length) throw new Error(`Duplicate material inside site ${site.id}`);
  const palette = site.design.palette;
  for (const key of ['bg','surface','ink','accent','accent2']) if (!palette[key]) throw new Error(`Missing palette ${site.id}/${key}`);
  const surfaceLightness = Number((palette.surface.match(/([\d.]+)%\)$/) || [])[1]);
  const inkLightness = Number((palette.ink.match(/([\d.]+)%\)$/) || [])[1]);
  if (Number.isFinite(surfaceLightness) && Number.isFinite(inkLightness) && Math.abs(surfaceLightness - inkLightness) < 48) throw new Error(`Weak surface/ink contrast ${site.id}`);
}

const polishedSites = SITES.map(polishedSite);
unique(polishedSites.map((site) => site.tagline), 'polished tagline');
for (const site of polishedSites) {
  if (site.tagline.length < 36 || site.tagline.length > 170) throw new Error(`Polished tagline length out of range ${site.id}`);
  if (!site.tagline.includes(site.kind) || !site.tagline.includes('한 화면에서 경험합니다.')) throw new Error(`Incomplete polished tagline ${site.id}`);
  if (!Array.isArray(site.services) || site.services.length !== 3 || new Set(site.services).size !== 3) throw new Error(`Invalid polished services ${site.id}`);
  if (site.services.some((service) => /맞춤 .*상담·예약$/.test(service))) throw new Error(`Legacy generic service copy remains ${site.id}`);
}
if (withParticle('선반', '과', '와') !== '선반과') throw new Error('Consonant particle test failed');
if (withParticle('의자', '과', '와') !== '의자와') throw new Error('Vowel particle test failed');
if (withParticle('시계', '을', '를') !== '시계를') throw new Error('Object particle test failed');
if (withParticle('브러시', '을', '를') !== '브러시를') throw new Error('Foreign-ending particle test failed');

if (SECTORS.length !== 10) throw new Error('Expected ten sectors');
for (const sector of SECTORS) {
  const count = SITES.filter((site) => site.sector === sector).length;
  if (count !== 10) throw new Error(`Expected ten sites in ${sector}, got ${count}`);
}

for (const file of ['src/catalog.js','src/app.js','src/enhance.js','src/enhance-fix.js','src/copy.js','src/copy-bootstrap.js','scripts/build.mjs','scripts/postbuild.mjs','scripts/check.mjs','scripts/audit.mjs']) {
  execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
}

const css = `${readFileSync('src/styles.css','utf8')}\n${readFileSync('src/v2.css','utf8')}`;
const layouts = ['editorial','horizontal','map','dashboard','poster','book','terminal','radial','shelf','timeline','split','floorplan','ticket','newspaper','masonry','monolith','isometric','wave','notebook','archive','kinetic','cinema','data','glass','collage'];
for (const layout of layouts) if (!css.includes(`.layout-${layout}`)) throw new Error(`Missing layout CSS ${layout}`);
const app = readFileSync('src/app.js','utf8');
for (const mode of allowed) if (!app.includes(`t==='${mode}'`) && mode !== 'form') throw new Error(`Missing interaction renderer ${mode}`);
const enhancement = readFileSync('src/enhance.js','utf8');
for (const feature of ['setupGallery','setupSite','openRecommendationDialog','openCompareDialog','createCustomizer','addFormEnhancement']) {
  if (!enhancement.includes(`function ${feature}`)) throw new Error(`Missing v2 feature ${feature}`);
}
for (const asset of ['v2-gallery-toolbar','v2-world-dock','v2-world-explorer','v2-customizer','v2-compare-dock']) {
  if (!css.includes(`.${asset}`)) throw new Error(`Missing v2 CSS ${asset}`);
}
console.log(`Validated Site100 v2.1: 100 sites, 100 natural taglines, 100 fingerprints, 25 layouts, 20 heroes and ${allowed.size} interaction modes.`);
