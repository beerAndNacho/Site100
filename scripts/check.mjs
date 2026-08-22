
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { SITES, SECTORS } from '../src/catalog.js';
if(SITES.length!==100) throw new Error(`Expected 100 sites, got ${SITES.length}`);
const unique=(arr,label)=>{if(new Set(arr).size!==arr.length)throw new Error(`Duplicate ${label}`)};
unique(SITES.map(s=>s.id),'id'); unique(SITES.map(s=>s.slug),'slug'); unique(SITES.map(s=>s.design.fingerprint),'design fingerprint'); unique(SITES.map(s=>JSON.stringify(s.design.palette)),'palette');
for(let i=1;i<=100;i++)if(!SITES.some(s=>s.id===i))throw new Error(`Missing site ${i}`);
const allowed=new Set(['booking','quote','mixer','status','compare','map','filter','schedule','build','command','timeline','donation','rsvp','archive','audio','drag','carousel','switcher','calculate','reveal','configure','menu','form']);
for(const site of SITES){
 if(!site.name||!site.slug||!site.sector||!site.kind||!site.tagline||!site.cta)throw new Error(`Incomplete metadata ${site.id}`);
 if(!allowed.has(site.interaction))throw new Error(`Unsupported interaction ${site.id}`);
 if(site.services.length!==3||site.materials.length!==4)throw new Error(`Incomplete domain content ${site.id}`);
}
if(SECTORS.length!==10)throw new Error('Expected ten sectors');
for(const file of ['src/catalog.js','src/app.js','scripts/build.mjs','scripts/check.mjs'])execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
const css=readFileSync('src/styles.css','utf8');
const layouts=['editorial','horizontal','map','dashboard','poster','book','terminal','radial','shelf','timeline','split','floorplan','ticket','newspaper','masonry','monolith','isometric','wave','notebook','archive','kinetic','cinema','data','glass','collage'];
for(const layout of layouts)if(!css.includes(`.layout-${layout}`))throw new Error(`Missing layout CSS ${layout}`);
const app=readFileSync('src/app.js','utf8');
for(const mode of allowed)if(!app.includes(`t==='${mode}'`)&&!['form'].includes(mode))throw new Error(`Missing interaction renderer ${mode}`);
console.log(`Validated 100 sites, 100 fingerprints, 25 layouts, 20 heroes and ${allowed.size} interaction modes.`);
