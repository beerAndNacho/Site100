
import { SITES, SECTORS } from './catalog.js';

const h = (v) => String(v).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = (n) => String(n).padStart(3,'0');
const $ = (s,r=document) => r.querySelector(s);
const $$ = (s,r=document) => [...r.querySelectorAll(s)];

function sequence(site){
  const pool=['services','story','process','showcase','proof','materials','journal','team','pricing','faq','impact','timeline','contact','location','manifesto','schedule'];
  let seed=(site.id*2654435761)>>>0;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  const chosen=[...pool].sort(()=>rand()-.5).slice(0,6);
  chosen.splice(1+(site.id%4),0,'experience');
  return chosen;
}
function art(site,count=8){
  const items=[...site.materials,...site.services];
  return Array.from({length:count},(_,i)=>`<span class="art a${i+1}"><i>${String.fromCharCode(65+i)}</i>${h(items[i%items.length])}</span>`).join('');
}
function nav(site){
  return `<header class="nav nav-${site.design.nav}"><a class="brand" href="/Site100/"><b>${pad(site.id)}</b><strong>${h(site.name)}</strong></a><nav><a href="#story">소개</a><a href="#services">서비스</a><a href="#showcase">작업</a><a href="#contact">문의</a></nav><button data-go="#experience">${h(site.cta)}</button></header>`;
}
function hero(site){
  const d=site.design, meta=`<div class="meta"><span>${h(site.sector)}</span><span>${h(site.kind)}</span><span>WORLD ${pad(site.id)}</span></div>`, actions=`<div class="actions"><button data-go="#experience">${h(site.cta)}</button><a href="#showcase">작업 보기</a></div>`, copy=`<h1>${h(site.name)}</h1><p>${h(site.tagline)}</p>${actions}`, A=`<div class="hero-art medium-${d.medium}">${art(site)}</div>`;
  const map={
    manifesto:`${meta}<div class="manifesto">${copy}</div>${A}`,
    split:`<div>${meta}${copy}</div>${A}`,
    poster:`${meta}<div class="poster-word"><em>${h(site.kind)}</em>${copy}</div>${A}`,
    map:`<div>${meta}${copy}</div><div class="mapboard">${A}<i></i><b>01</b><b>02</b><b>03</b></div>`,
    metrics:`${meta}${copy}<div class="metrics"><b>${site.id+18}<small>PROJECTS</small></b><b>${(site.id%7)+3}<small>SERVICES</small></b><b>${98-(site.id%8)}<small>INDEX</small></b></div>`,
    book:`<div class="spine">${pad(site.id)}</div><div class="page">${meta}${copy}</div>${A}`,
    terminal:`<div class="termbar">● ● ● <span>${h(site.slug)}.world</span></div><pre>&gt; open ${h(site.kind)}\n&gt; load ${h(site.materials[0])}\n&gt; status ready</pre>${copy}`,
    radial:`<div class="radialcore">${meta}${copy}</div><i class="orbit o1"></i><i class="orbit o2"></i>${A}`,
    shelf:`${meta}${copy}<div class="shelf">${site.services.map((x,i)=>`<article><span>0${i+1}</span><b>${h(x)}</b></article>`).join('')}</div>`,
    timeline:`<div>${meta}${copy}</div><ol class="hero-steps">${site.services.map((x,i)=>`<li><span>0${i+1}</span><b>${h(x)}</b></li>`).join('')}</ol>`,
    window:`<div class="window">${meta}${copy}</div><div class="windowstack">${A}</div>`,
    ticket:`<div class="stub">ADMIT ONE <b>${pad(site.id)}</b></div><div class="ticketbody">${meta}${copy}<i class="barcode"></i></div>`,
    headline:`<div class="edition">VOL.${pad(site.id)} · ${h(site.sector)}</div>${copy}<div class="columns"><p>${h(site.tagline)}</p><p>${h(site.services.join(' · '))}</p></div>`,
    mosaic:`<div>${meta}${copy}</div><div class="mosaic">${A}</div>`,
    monolith:`<div class="giant">${pad(site.id)}</div><div>${meta}${copy}</div>`,
    room:`<div>${meta}${copy}</div><div class="room">${A}<i></i></div>`,
    wave:`${meta}${copy}<svg viewBox="0 0 1200 260"><path d="M0 160 C170 20 330 300 520 130 S850 20 1200 170"/><path d="M0 210 C220 80 370 320 620 170 S940 70 1200 215"/></svg>`,
    notebook:`<div class="rings"></div><div class="note">${meta}<em>idea ${pad(site.id)}</em>${copy}</div>${A}`,
    drawer:`<div class="drawerlabel">ARCHIVE ${pad(site.id)}</div><div>${meta}${copy}</div><div class="drawers">${site.services.map((x,i)=>`<span><i>0${i+1}</i>${h(x)}</span>`).join('')}</div>`,
    cinema:`<div class="cinema">${A}</div><div><time>00:${pad(site.id)}:24</time>${meta}${copy}</div>`
  };
  return `<section class="hero hero-${d.hero}">${map[d.hero]}</section>`;
}
const head=(i,e,t,c)=>`<div class="heading"><span>${String(i).padStart(2,'0')} / ${e}</span><h2>${h(t)}</h2><p>${h(c)}</p></div>`;
function section(type,site,i){
  const s=site.services,m=site.materials;
  if(type==='services') return `<section id="services" class="section services">${head(i,'SERVICES',`${site.kind}의 세 가지 선택`,'범위와 결과를 명확하게 나눴습니다.')}<div class="cards">${s.map((x,k)=>`<article><span>0${k+1}</span><h3>${h(x)}</h3><p>${h(m[k])}을 중심으로 진행합니다.</p><a href="#experience">자세히</a></article>`).join('')}</div></section>`;
  if(type==='story') return `<section id="story" class="section story">${head(i,'ABOUT','업종의 행동을 화면 구조로',site.tagline)}<div><blockquote>${h(site.tagline)}</blockquote><p>${h(m.join(', '))} 같은 실제 소재가 장식이 아니라 탐색과 선택의 단서로 작동합니다.</p></div></section>`;
  if(type==='process') return `<section class="section process">${head(i,'PROCESS','처음부터 끝까지 보이는 흐름','문의 이후 진행을 네 단계로 안내합니다.')}<ol>${['상황 확인','범위 선택','진행 공유','결과 전달'].map((x,k)=>`<li><span>${k+1}</span><div><h3>${x}</h3><p>${h(m[k%4])} 기준으로 다음 단계를 설명합니다.</p></div></li>`).join('')}</ol></section>`;
  if(type==='showcase') return `<section id="showcase" class="section showcase">${head(i,'SELECTED WORK',`${site.name}의 장면`,'서비스와 소재를 서로 다른 프레임으로 보여줍니다.')}<div class="works">${[...s,...m].slice(0,6).map((x,k)=>`<figure><div class="visual v${k+1}"><span>${pad(site.id)}.${k+1}</span></div><figcaption>${h(x)}</figcaption></figure>`).join('')}</div></section>`;
  if(type==='proof') return `<section class="section proof">${head(i,'PROOF','말보다 과정과 기록','가상의 홈페이지 템플릿을 위한 지표 예시입니다.')}<div class="numbers"><b>${site.id+21}<small>PROJECT</small></b><b>${91+site.id%8}<small>PROCESS</small></b><b>${3+site.id%5}<small>STEPS</small></b></div></section>`;
  if(type==='materials') return `<section class="section materials">${head(i,'MATERIALS','브랜드를 구성하는 실제 소재','업종의 사물과 문서를 시각 언어로 사용합니다.')}<div>${[...m,...m].map((x,k)=>`<span><i>${String.fromCharCode(65+k%4)}</i>${h(x)}</span>`).join('')}</div></section>`;
  if(type==='journal') return `<section class="section journal">${head(i,'JOURNAL','최근 기록과 작은 발견','업무 경험을 짧은 읽을거리로 연결합니다.')}<div>${['첫 화면에서 보여줄 한 가지','선택 기준을 줄이는 법','다음 행동을 가깝게 만드는 법'].map((x,k)=>`<article><time>2026.${String((site.id+k)%12+1).padStart(2,'0')}</time><h3>${x}</h3><p>${h(site.kind)}의 맥락에 맞춘 기록입니다.</p></article>`).join('')}</div></section>`;
  if(type==='team') return `<section class="section team">${head(i,'PEOPLE','서비스 뒤에 있는 역할','가상의 팀 구성 예시입니다.')}<div>${['Director','Maker','Guide'].map((x,k)=>`<article><i class="portrait p${k}"></i><h3>${x} ${String.fromCharCode(65+k)}</h3><p>${h(s[k])}</p></article>`).join('')}</div></section>`;
  if(type==='pricing') return `<section class="section pricing">${head(i,'PACKAGES','필요한 만큼 선택하는 구성','실제 가격이 아닌 구성 예시입니다.')}<div>${s.map((x,k)=>`<article class="${k===1?'featured':''}"><span>PACKAGE ${k+1}</span><h3>${h(x)}</h3><b>${16+k*9+site.id%7}<small> unit</small></b><p>${h(m[k])} · 진행 체크 · 결과 정리</p><button data-go="#contact">선택</button></article>`).join('')}</div></section>`;
  if(type==='faq') return `<section class="section faq">${head(i,'FAQ','결정 전에 자주 묻는 질문','답변을 펼쳐볼 수 있습니다.')}<div>${s.map((x,k)=>`<details ${k===0?'open':''}><summary>${h(x)}는 어떻게 진행되나요?</summary><p>${h(m[k])}을 확인한 뒤 범위와 다음 단계를 안내합니다.</p></details>`).join('')}</div></section>`;
  if(type==='impact') return `<section class="section impact">${head(i,'IMPACT','행동 이후 달라지는 것','결과를 세 문장으로 정리합니다.')}<p>선택은 더 <strong>명확하게</strong></p><p>과정은 더 <strong>투명하게</strong></p><p>다음 행동은 더 <strong>가깝게</strong></p></section>`;
  if(type==='timeline') return `<section class="section timeline">${head(i,'TIMELINE','하루와 프로젝트의 시간','가로 레일을 따라 단계가 이어집니다.')}<div>${['START','CHECK','MAKE','SHARE','DONE'].map((x,k)=>`<article><time>${String(9+k*2).padStart(2,'0')}:00</time><b>${x}</b><span>${h(m[k%4])}</span></article>`).join('')}</div></section>`;
  if(type==='manifesto') return `<section class="section bigtype">${head(i,'MANIFESTO','한 문장보다 큰 태도','업종의 핵심 약속을 타이포그래피로 보여줍니다.')}<div><span>MAKE</span><strong>${h(site.kind)}</strong><em>FEEL CLEAR.</em></div></section>`;
  if(type==='schedule') return `<section class="section week">${head(i,'SCHEDULE','이번 주 가능한 시간','요일을 누르면 상태가 달라집니다.')}<div>${['MON','TUE','WED','THU','FRI'].map((x,k)=>`<button><b>${x}</b><span>${10+k}:00 · ${14+k}:00</span></button>`).join('')}</div></section>`;
  if(type==='location') return `<section class="section location">${head(i,'LOCATION','장소를 먼저 이해하는 화면','가상의 주소와 운영 정보입니다.')}<div class="minimap"><i></i><b>${pad(site.id)}</b></div><address>WORLD ${pad(site.id)} · DESIGN DISTRICT<br>평일 10:00—19:00</address></section>`;
  if(type==='contact') return `<section id="contact" class="section contact">${head(i,'CONTACT','다음 장면을 함께 만들까요?',site.tagline)}<form><label>이름<input required placeholder="이름"></label><label>문의<textarea required placeholder="필요한 내용을 적어주세요."></textarea></label><button>문의 초안 만들기</button><output>데모 폼이며 실제 전송되지 않습니다.</output></form></section>`;
  return experience(site,i);
}
function experience(site,i){
 const common=head(i,'INTERACTIVE',`${site.cta} 데모`,'입력 내용은 현재 브라우저에서만 작동합니다.');
 const s=site.services,m=site.materials,t=site.interaction;
 if(t==='booking') return `<section id="experience" class="section experience" data-mode="booking">${common}<div class="demo booking"><div>${['12','13','14','15','16'].map((x,k)=>`<button data-choice="${x}" class="${k===0?'active':''}">${x}</button>`).join('')}</div><div>${['10:00','13:30','16:00'].map(x=>`<button data-choice="${x}">${x}</button>`).join('')}</div><button class="submit">${h(site.cta)}</button><output>날짜와 시간을 선택하세요.</output></div></section>`;
 if(t==='quote') return `<section id="experience" class="section experience" data-mode="quote">${common}<div class="demo quote">${s.map((x,k)=>`<label><input type="checkbox" value="${(k+2)*12}" ${k===0?'checked':''}>${h(x)}<b>${(k+2)*12}</b></label>`).join('')}<output>예상 합계 · 24 unit</output></div></section>`;
 if(t==='mixer') return `<section id="experience" class="section experience" data-mode="mixer">${common}<div class="demo mixer"><div class="preview"><span></span><b>${h(m[0])}</b></div><div>${[...m,...s].slice(0,6).map((x,k)=>`<button data-mix="${k}">${h(x)}</button>`).join('')}</div><output>최대 세 가지를 선택하세요.</output></div></section>`;
 if(t==='status') return `<section id="experience" class="section experience" data-mode="status">${common}<div class="demo status">${s.map((x,k)=>`<button><i></i><b>${h(x)}</b><small>${k===1?'사용 중':'사용 가능'}</small></button>`).join('')}<output>상태 카드를 눌러보세요.</output></div></section>`;
 if(t==='compare') return `<section id="experience" class="section experience" data-mode="compare">${common}<div class="demo compare"><div class="stage"><div>BEFORE<br>${h(m[0])}</div><div>AFTER<br>${h(s[0])}</div></div><input type="range" min="10" max="90" value="50"><output>50% 비교</output></div></section>`;
 if(t==='map') return `<section id="experience" class="section experience" data-mode="map">${common}<div class="demo mapdemo"><div>${s.map((x,k)=>`<button style="--x:${18+k*31}%;--y:${25+k%2*42}%" data-place="${h(x)}">${k+1}</button>`).join('')}<i></i></div><output>지도 핀을 선택하세요.</output></div></section>`;
 if(t==='filter') return `<section id="experience" class="section experience" data-mode="filter">${common}<div class="demo filter"><nav><button data-filter="all" class="active">전체</button>${s.map((x,k)=>`<button data-filter="f${k}">${h(x)}</button>`).join('')}</nav><div>${[...m,...s].map((x,k)=>`<article data-group="f${k%3}">${h(x)}</article>`).join('')}</div></div></section>`;
 if(t==='schedule') return `<section id="experience" class="section experience" data-mode="schedule">${common}<div class="demo scheduledemo"><nav>${['월','화','수','목','금'].map((x,k)=>`<button data-day="${k}" class="${k===0?'active':''}">${x}</button>`).join('')}</nav><div class="slots"></div></div></section>`;
 if(t==='build') return `<section id="experience" class="section experience" data-mode="build">${common}<div class="demo build"><nav>${[...s,...m].slice(0,5).map((x,k)=>`<button data-block="${k}">+ ${h(x)}</button>`).join('')}</nav><div class="canvas"><p>블록을 눌러 추가하세요.</p></div><button class="reset">초기화</button><output></output></div></section>`;
 if(t==='command') return `<section id="experience" class="section experience" data-mode="command">${common}<div class="demo command"><pre>$ help\ncommands: services, status, contact, clear</pre><label>$ <input placeholder="help"></label><output>명령을 입력하고 Enter를 누르세요.</output></div></section>`;
 if(t==='timeline') return `<section id="experience" class="section experience" data-mode="timeline">${common}<div class="demo stepper"><i></i>${['준비','확인','진행','완료'].map((x,k)=>`<button data-step="${k}" class="${k===0?'active':''}"><span>${k+1}</span>${x}</button>`).join('')}<output>현재 단계 · 준비</output></div></section>`;
 if(t==='donation') return `<section id="experience" class="section experience" data-mode="donation">${common}<div class="demo donation"><div>${[10,30,50,100].map(x=>`<button data-amount="${x}">${x} unit</button>`).join('')}</div><div class="meter"><i></i></div><output>금액을 선택하세요.</output></div></section>`;
 if(t==='rsvp') return `<section id="experience" class="section experience" data-mode="rsvp">${common}<form class="demo rsvp"><label>성함<input name="name" required></label><label>참석 인원<input name="guests" type="number" min="1" max="5" value="1"></label><button>참석 전달</button><output>실제 전송되지 않습니다.</output></form></section>`;
 if(t==='archive') return `<section id="experience" class="section experience" data-mode="archive">${common}<div class="demo archive-demo"><input type="search" placeholder="자료 검색"><div>${[...m,...s].map((x,k)=>`<article data-search="${h(x)}"><span>${pad(site.id)}-${k+1}</span>${h(x)}</article>`).join('')}</div><output>키워드를 입력하세요.</output></div></section>`;
 if(t==='audio') return `<section id="experience" class="section experience" data-mode="audio">${common}<div class="demo audio"><button class="play">▶</button><div>${Array.from({length:36},(_,k)=>`<i style="--h:${20+(k*site.id)%75}%"></i>`).join('')}</div><output>00:00 / 02:48</output></div></section>`;
 if(t==='drag') return `<section id="experience" class="section experience" data-mode="drag">${common}<div class="demo drag"><div>${[...m,...s].slice(0,6).map((x,k)=>`<button draggable="true" style="--n:${k}">${h(x)}</button>`).join('')}</div><output>카드를 드래그하거나 눌러보세요.</output></div></section>`;
 if(t==='carousel') return `<section id="experience" class="section experience" data-mode="carousel">${common}<div class="demo carousel"><div>${[...s,...m].slice(0,5).map((x,k)=>`<article class="${k===0?'active':''}"><span>${pad(site.id)}.${k+1}</span><h3>${h(x)}</h3><p>${h(site.tagline)}</p></article>`).join('')}</div><nav><button data-car="prev">←</button><button data-car="next">→</button></nav><output>1 / 5</output></div></section>`;
 if(t==='switcher') return `<section id="experience" class="section experience" data-mode="switcher">${common}<div class="demo switcher"><nav>${['VIEW A','VIEW B','VIEW C'].map((x,k)=>`<button data-view="${k}" class="${k===0?'active':''}">${x}</button>`).join('')}</nav><div><h3>${h(s[0])}</h3><p>${h(m[0])}</p></div></div></section>`;
 if(t==='calculate') return `<section id="experience" class="section experience" data-mode="calculate">${common}<div class="demo calculate"><label>범위<input type="range" min="1" max="100" value="45"></label><label>강도<input type="range" min="1" max="10" value="6"></label><div><strong>270</strong><span>design units</span></div></div></section>`;
 if(t==='reveal') return `<section id="experience" class="section experience" data-mode="reveal">${common}<div class="demo reveal"><nav>${[...m,...s].slice(0,5).map((x,k)=>`<button data-layer="${k}" class="${k===0?'active':''}"><span>0${k+1}</span>${h(x)}</button>`).join('')}</nav><div><h3>${h(m[0])}</h3><p>${h(site.tagline)}</p></div></div></section>`;
 if(t==='configure') return `<section id="experience" class="section experience" data-mode="configure">${common}<div class="demo configure"><div class="product"><i></i><b>${h(site.name)}</b></div><nav>${['#e95b3f','#2f7f91','#e5bd47','#765a9c'].map(x=>`<button data-color="${x}" style="--c:${x}"></button>`).join('')}</nav><output>색상을 선택하세요.</output></div></section>`;
 if(t==='menu') return `<section id="experience" class="section experience" data-mode="menu">${common}<div class="demo menudemo">${[...s,...m].slice(0,6).map((x,k)=>`<button data-price="${8+k*3}"><span>${h(x)}</span><b>${8+k*3}</b></button>`).join('')}<output>선택 합계 · 0 unit</output></div></section>`;
 return `<section id="experience" class="section experience" data-mode="form">${common}<form class="demo formdemo"><label>관심 서비스<select>${s.map(x=>`<option>${h(x)}</option>`).join('')}</select></label><label>상황<textarea></textarea></label><button>상담 흐름 확인</button><output>실제 전송되지 않습니다.</output></form></section>`;
}
function sitePage(site){
 const d=site.design,vars=`--bg:${d.palette.bg};--surface:${d.palette.surface};--ink:${d.palette.ink};--accent:${d.palette.accent};--accent2:${d.palette.accent2}`;
 return `<div class="world layout-${d.layout} navspace-${d.nav} type-${d.type} geom-${d.geometry} density-${d.density}" style="${vars}" data-id="${site.id}" data-fingerprint="${h(d.fingerprint)}">${nav(site)}<main>${hero(site)}${sequence(site).map((x,i)=>section(x,site,i+1)).join('')}</main><footer><span>${pad(site.id)} / 100WORLDS</span><b>${h(site.name)}</b><a href="/Site100/">다른 세계 보기</a></footer></div>`;
}
function gallery(){
 const cards=SITES.map(site=>`<a class="gcard mini-${site.design.layout}" href="/Site100/sites/${site.slug}/" data-sector="${h(site.sector)}" data-search="${h((site.name+' '+site.kind+' '+site.design.layout+' '+site.design.mood).toLowerCase())}" style="--cb:${site.design.palette.bg};--cs:${site.design.palette.surface};--ca:${site.design.palette.accent}"><div class="preview"><i></i><i></i><b>${pad(site.id)}</b><em>${h(site.kind)}</em></div><div><span>${h(site.sector)} · ${h(site.design.layout)}</span><h2>${h(site.name)}</h2><p>${h(site.tagline)}</p><strong>OPEN WORLD →</strong></div></a>`).join('');
 document.body.innerHTML=`<div class="gallery"><header><a href="/Site100/"><i></i>100WORLDS</a><nav><a href="#index">100개 디자인</a><a href="#principles">제작 원칙</a><a href="https://github.com/beerAndNacho/Site100">GitHub</a></nav></header><main><section class="gintro"><div><span>100 INDUSTRIES · 100 DESIGN FINGERPRINTS</span><h1>같은 홈페이지를<br><em>100번</em> 만들지 않습니다.</h1><p>업종의 실제 사물과 행동을 화면 구조와 인터랙션으로 옮긴 홈페이지 디자인 100개입니다.</p></div><div><b>100</b><span>INDEPENDENT WORLDS</span></div></section><section id="principles" class="principles"><article><b>01</b><h2>업종에서 시작</h2><p>오븐 선반, 관제 지도, 책등처럼 제목의 소재가 구조가 됩니다.</p></article><article><b>02</b><h2>디자인 지문</h2><p>레이아웃·내비게이션·Hero·타입·형태·색 조합이 모두 다릅니다.</p></article><article><b>03</b><h2>실제 동작</h2><p>예약, 비교, 조합, 지도, 오디오 등 목적에 맞는 데모가 작동합니다.</p></article></section><section id="index" class="gindex"><div class="gtools"><div><span>FILTER THE WORLDS</span><h2>디자인 100개</h2></div><input id="search" type="search" placeholder="업종·브랜드·레이아웃 검색"><nav><button data-sector="all" class="active">전체</button>${SECTORS.map(x=>`<button data-sector="${h(x)}">${h(x)}</button>`).join('')}</nav></div><div class="ggrid">${cards}</div><p class="empty" hidden>검색 결과가 없습니다.</p></section></main><footer><span>Site100 · 100WORLDS</span><span>Static HTML · CSS · JavaScript</span><a href="#">TOP ↑</a></footer></div>`;
 initGallery();
}
function initGallery(){let sector='all',q='';const cards=$$('.gcard'),empty=$('.empty');const apply=()=>{let n=0;cards.forEach(c=>{c.hidden=!((sector==='all'||c.dataset.sector===sector)&&(!q||c.dataset.search.includes(q)));if(!c.hidden)n++});empty.hidden=n>0};$$('[data-sector]').forEach(b=>b.onclick=()=>{sector=b.dataset.sector;$$('[data-sector]').forEach(x=>x.classList.toggle('active',x===b));apply()});$('#search').oninput=e=>{q=e.target.value.trim().toLowerCase();apply()}}
function out(root,msg){const o=$('output',root);if(o)o.textContent=msg}
function init(){
 $$('[data-go]').forEach(b=>b.onclick=()=>$(b.dataset.go)?.scrollIntoView({behavior:'smooth'}));
 const root=$('[data-mode]');if(!root)return;const mode=root.dataset.mode;
 if(mode==='booking'){let a='',b='';$$('[data-choice]',root).forEach(x=>x.onclick=()=>{if(x.dataset.choice.includes(':'))b=x.dataset.choice;else a=x.dataset.choice;out(root,a&&b?`${a}일 ${b} 선택됨`:'날짜와 시간을 선택하세요.')});$('.submit',root).onclick=()=>out(root,a&&b?'예약 데모가 완성됐습니다.':'날짜와 시간을 먼저 선택하세요.')};
 if(mode==='quote'){const u=()=>out(root,`예상 합계 · ${$$('input:checked',root).reduce((s,x)=>s+Number(x.value),0)} unit`);$$('input',root).forEach(x=>x.onchange=u);u()}
 if(mode==='mixer'){$$('[data-mix]',root).forEach(x=>x.onclick=()=>{x.classList.toggle('active');const n=$$('[data-mix].active',root).slice(0,3);$$('[data-mix].active',root).slice(3).forEach(y=>y.classList.remove('active'));$('.preview b',root).textContent=n.map(y=>y.textContent).join(' + ')||'조합 미리보기';out(root,`${n.length}가지 선택`)})}
 if(mode==='status'){$$('button',root).forEach(x=>x.onclick=()=>{x.classList.toggle('busy');$('small',x).textContent=x.classList.contains('busy')?'사용 중':'사용 가능';out(root,`${$('b',x).textContent} · ${$('small',x).textContent}`)})}
 if(mode==='compare'){const r=$('input',root),a=$('.stage div:last-child',root);r.oninput=()=>{a.style.width=r.value+'%';out(root,r.value+'% 비교')};r.oninput()}
 if(mode==='map'){$$('[data-place]',root).forEach(x=>x.onclick=()=>out(root,x.dataset.place+' 선택됨'))}
 if(mode==='filter'){$$('[data-filter]',root).forEach(b=>b.onclick=()=>{const f=b.dataset.filter;$$('[data-filter]',root).forEach(x=>x.classList.toggle('active',x===b));$$('[data-group]',root).forEach(x=>x.hidden=f!=='all'&&x.dataset.group!==f)})}
 if(mode==='schedule'){const times=[['10:00','13:30','17:00'],['09:30','14:00','18:30'],['11:00','15:00','19:00'],['10:30','16:00','20:00'],['09:00','13:00','17:30']],show=i=>$('.slots',root).innerHTML=times[i].map(x=>`<span>${x}</span>`).join('');$$('[data-day]',root).forEach(b=>b.onclick=()=>{show(+b.dataset.day);$$('[data-day]',root).forEach(x=>x.classList.toggle('active',x===b))});show(0)}
 if(mode==='build'){$$('[data-block]',root).forEach(b=>b.onclick=()=>{$('.canvas p',root)?.remove();$('.canvas',root).insertAdjacentHTML('beforeend',`<article>${h(b.textContent.replace('+ ',''))}</article>`);out(root,$$('.canvas article',root).length+'개 블록 추가')});$('.reset',root).onclick=()=>$('.canvas',root).innerHTML='<p>블록을 눌러 추가하세요.</p>'}
 if(mode==='command'){const input=$('input',root),pre=$('pre',root),commands={help:'commands: services, status, contact, clear',services:'three service modules ready',status:'all sections online',contact:'opening #contact'};input.onkeydown=e=>{if(e.key!=='Enter')return;const c=input.value.trim().toLowerCase();if(c==='clear')pre.textContent='';else pre.textContent+=`\n$ ${c}\n${commands[c]||'unknown command'}`;if(c==='contact')$('#contact')?.scrollIntoView({behavior:'smooth'});input.value=''}}
 if(mode==='timeline'){$$('[data-step]',root).forEach(b=>b.onclick=()=>{const i=+b.dataset.step;$$('[data-step]',root).forEach((x,k)=>x.classList.toggle('active',k<=i));out(root,'현재 단계 · '+b.textContent.trim().replace(/^\d/,''))})}
 if(mode==='donation'){$$('[data-amount]',root).forEach(b=>b.onclick=()=>{$('.meter i',root).style.width=Math.min(100,+b.dataset.amount)+'%';out(root,b.dataset.amount+' unit 선택')})}
 if(mode==='rsvp'||mode==='form'){$('form',root).onsubmit=e=>{e.preventDefault();out(root,'데모 입력이 현재 브라우저에서 정리됐습니다.')}}
 if(mode==='archive'){const input=$('input',root),items=$$('[data-search]',root);input.oninput=()=>{const q=input.value.toLowerCase();let n=0;items.forEach(x=>{x.hidden=q&&!x.dataset.search.toLowerCase().includes(q);if(!x.hidden)n++});out(root,n+'개 자료 표시')}}
 if(mode==='audio'){let on=false,t=0,id=0;$('.play',root).onclick=()=>{on=!on;$('.play',root).textContent=on?'Ⅱ':'▶';root.classList.toggle('playing',on);clearInterval(id);if(on)id=setInterval(()=>{t++;out(root,`${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')} / 02:48`)},1000)}}
 if(mode==='drag'){$$('.drag button',root).forEach(b=>b.onclick=()=>{$('.drag>div',root).appendChild(b);out(root,b.textContent+' 카드를 앞으로 이동')})}
 if(mode==='carousel'){let i=0,slides=$$('.carousel article',root),show=()=>{slides.forEach((x,k)=>x.classList.toggle('active',k===i));out(root,`${i+1} / ${slides.length}`)};$$('[data-car]',root).forEach(b=>b.onclick=()=>{i=(i+(b.dataset.car==='next'?1:-1)+slides.length)%slides.length;show()});show()}
 if(mode==='switcher'){const titles=['집중 보기','비교 보기','기록 보기'];$$('[data-view]',root).forEach(b=>b.onclick=()=>{$$('[data-view]',root).forEach(x=>x.classList.toggle('active',x===b));$('.switcher h3',root).textContent=titles[+b.dataset.view]})}
 if(mode==='calculate'){const rs=$$('input',root),u=()=>$('.calculate strong',root).textContent=rs.reduce((v,x)=>v*+x.value,1);rs.forEach(x=>x.oninput=u);u()}
 if(mode==='reveal'){$$('[data-layer]',root).forEach(b=>b.onclick=()=>{$$('[data-layer]',root).forEach(x=>x.classList.toggle('active',x===b));$('.reveal h3',root).textContent=b.textContent.replace(/^\d+/, '').trim();$('.reveal>div',root).style.filter=`hue-rotate(${+b.dataset.layer*50}deg)`})}
 if(mode==='configure'){$$('[data-color]',root).forEach(b=>b.onclick=()=>{$('.product i',root).style.background=b.dataset.color;out(root,'색상 선택 완료')})}
 if(mode==='menu'){let total=0;$$('[data-price]',root).forEach(b=>b.onclick=()=>{b.classList.toggle('active');total+=b.classList.contains('active')?+b.dataset.price:-b.dataset.price;out(root,`선택 합계 · ${total} unit`)})}
 $$('form:not([data-mode])').forEach(f=>f.onsubmit=e=>{e.preventDefault();$('output',f).textContent='문의 초안이 작성됐습니다. 실제 전송되지 않습니다.'});
}
const path=location.pathname.replace(/\/+$/,'');
const slug=window.SITE100_SLUG||path.split('/').pop();
if(path.endsWith('/Site100')||path===''||path==='/'){gallery()}else{const site=SITES.find(x=>x.slug===slug);if(!site)document.body.innerHTML='<main style="padding:40px">사이트를 찾지 못했습니다.</main>';else{document.title=`${site.name} | 100WORLDS`;document.body.innerHTML=sitePage(site);init()}}
