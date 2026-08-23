import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SITES } from '../src/catalog.js';
import { buildDeepModel, deepRoutes } from '../src/depth-content.js';

const root = resolve(process.cwd());
const dist = resolve(root, 'dist');
const baseUrl = 'https://beerandnacho.github.io/Site100';
const version = '5.0.0';
const buildDate = '2026-08-23';

if (!existsSync(resolve(dist, 'index.html'))) throw new Error('dist/ is missing. Run the v4 build first.');
for (const file of ['depth-content.js', 'depth.js', 'v5-depth.css']) {
  const source = resolve(root, 'src', file);
  if (!existsSync(source)) throw new Error(`Missing v5 source asset: ${file}`);
  cpSync(source, resolve(dist, 'assets', file));
}

const h = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);
const xml = (value) => String(value).replace(/[<>&"']/g, (character) => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;'
})[character]);
const pad = (value) => String(value).padStart(3, '0');

function routeDirectory(pathname) {
  const relative = pathname.replace(/^\/Site100\//, '').replace(/\/$/, '');
  return resolve(dist, relative);
}

function worldClasses(site) {
  const design = site.design;
  return `world v5-page layout-${design.layout} navspace-${design.nav} shape-${design.geometry} medium-${design.medium} density-${design.density} mood-${design.mood} variant-${design.variant}`;
}

function styleVariables(site) {
  const palette = site.design.palette;
  return `--bg:${palette.bg};--surface:${palette.surface};--ink:${palette.ink};--accent:${palette.accent};--accent2:${palette.accent2}`;
}

function staticNav(model, currentType) {
  const site = model.site;
  const base = `/Site100/sites/${site.slug}`;
  const active = (type) => currentType === type || (type === 'services' && currentType === 'service') || (type === 'work' && currentType === 'case') || (type === 'journal' && currentType === 'article');
  return `<header class="nav nav-${site.design.nav}">
    <a class="brand" href="${base}/"><b>${pad(site.id)}</b><strong>${h(site.name)}</strong></a>
    <nav class="v5-primary-nav" aria-label="${h(site.name)} 주요 페이지">
      <a href="${base}/" ${active('home') ? 'aria-current="page"' : ''}>홈</a>
      <a href="${base}/about/" ${active('about') ? 'aria-current="page"' : ''}>소개</a>
      <a href="${base}/services/" ${active('services') ? 'aria-current="page"' : ''}>서비스</a>
      <a href="${base}/work/" ${active('work') ? 'aria-current="page"' : ''}>사례</a>
      <a href="${base}/journal/" ${active('journal') ? 'aria-current="page"' : ''}>저널</a>
      <a href="${base}/contact/" ${active('contact') ? 'aria-current="page"' : ''}>문의</a>
    </nav>
    <a class="v5-nav-cta" href="${base}/contact/">프로젝트 문의</a>
  </header>`;
}

function breadcrumbs(model, items) {
  const base = `/Site100/sites/${model.site.slug}`;
  const entries = [{ label: model.site.name, path: `${base}/` }, ...items];
  return `<nav class="v5-breadcrumbs" aria-label="현재 위치">${entries.map((entry, index) => {
    const last = index === entries.length - 1;
    return `${index ? '<i aria-hidden="true">/</i>' : ''}${last ? `<span aria-current="page">${h(entry.label)}</span>` : `<a href="${entry.path}">${h(entry.label)}</a>`}`;
  }).join('')}</nav>`;
}

function pageHero(model, route, options) {
  const site = model.site;
  const base = `/Site100/sites/${site.slug}`;
  return `<section class="hero v5-page-hero">
    <div>
      ${breadcrumbs(model, options.breadcrumbs)}
      <span class="v5-eyebrow">${h(options.eyebrow)}</span>
      <h1>${h(options.title)}</h1>
      <p class="v5-lead">${h(options.lead)}</p>
      <div class="v5-page-actions">${options.actions || `<a class="primary" href="${base}/contact/">프로젝트 문의</a><a href="${base}/services/">서비스 보기</a>`}</div>
    </div>
    <aside>
      <dl>
        <div><dt>분야</dt><dd>${h(site.sector)}</dd></div>
        <div><dt>업종</dt><dd>${h(site.kind)}</dd></div>
        <div><dt>페이지</dt><dd>${h(route.type)} · DEPTH ${route.depth}</dd></div>
        <div><dt>시각 방향</dt><dd>${h(site.design.layout)} · ${h(site.design.mood)}</dd></div>
      </dl>
    </aside>
  </section>`;
}

function sectionHead(kicker, title, body) {
  return `<div class="v5-section-head"><div><span class="v5-section-kicker">${h(kicker)}</span><h2>${h(title)}</h2></div><p>${h(body)}</p></div>`;
}

function relatedLinks(model, entries) {
  return `<div class="v5-related-links">${entries.map((entry, index) => `<a href="${entry.path}"><span>${String(index + 1).padStart(2, '0')}</span><b>${h(entry.title)}</b></a>`).join('')}</div>`;
}

function aboutPage(model, route) {
  const site = model.site;
  const base = `/Site100/sites/${site.slug}`;
  return `${pageHero(model, route, {
    breadcrumbs: [{ label: '소개', path: `${base}/about/` }],
    eyebrow: 'ABOUT · PRINCIPLES · PEOPLE',
    title: `${site.name}이 만드는 ${site.kind}의 기준`,
    lead: `${site.materials[0]}에서 시작해 ${site.materials[3]}까지 이어지는 운영 원칙과 역할을 소개합니다.`,
    actions: `<a class="primary" href="#origin">시작 배경</a><a href="${base}/services/">서비스 구조</a>`
  })}
  <section id="origin" class="v5-section" data-v5-label="시작 배경"><div class="v5-section-inner">
    ${sectionHead('01 · ORIGIN', '업종의 사물을 장식이 아닌 구조로', site.tagline)}
    <div class="v5-story-layout"><blockquote>${h(site.tagline)}</blockquote><div><p>${h(site.name)}은 ${h(site.kind)} 이용자가 처음 마주하는 질문을 화면 구조의 출발점으로 삼습니다. 보기 좋은 설명을 더하기 전에 사용자가 무엇을 확인하고, 어디에서 망설이고, 어떤 결과를 기대하는지 관찰합니다.</p><p>${h(site.materials.join(', '))} 같은 실제 소재는 분위기를 만드는 배경에 머물지 않습니다. 각 소재는 정보의 분류, 선택 기준, 진행 상태와 다음 행동을 알려주는 인터페이스가 됩니다.</p><p>이 템플릿은 가상의 브랜드를 위한 디자인이지만, 실제 프로젝트에서 콘텐츠를 확장하고 운영할 수 있도록 소개·서비스·사례·저널·문의 구조를 분리했습니다.</p></div></div>
  </div></section>
  <section id="principles" class="v5-section" data-v5-label="운영 원칙"><div class="v5-section-inner">
    ${sectionHead('02 · PRINCIPLES', '결정하기 쉬운 경험을 만드는 세 가지 약속', '정보량을 줄이기보다 사용자가 판단하는 순서를 명확하게 만드는 데 집중합니다.')}
    <div class="v5-principles">${model.principles.map((principle, index) => `<article><span>${String(index + 1).padStart(2, '0')}</span><h3>${h(principle.title)}</h3><p>${h(principle.body)}</p></article>`).join('')}</div>
  </div></section>
  <section id="timeline" class="v5-section" data-v5-label="변화 과정"><div class="v5-section-inner">
    ${sectionHead('03 · TIMELINE', '문제를 발견하고 운영 기준으로 남기는 과정', '한 번의 화면 제작으로 끝내지 않고 관찰·구조·검증·기록의 순환을 만듭니다.')}
    <div class="v5-timeline">${model.timeline.map((item) => `<article><span>${h(item.year)}</span><h3>${h(item.title)}</h3><p>${h(item.body)}</p></article>`).join('')}</div>
  </div></section>
  <section id="people" class="v5-section" data-v5-label="역할"><div class="v5-section-inner">
    ${sectionHead('04 · PEOPLE', '각 단계의 기준을 책임지는 역할', '가상의 팀 구성이지만 프로젝트 안에서 누가 무엇을 결정해야 하는지 구분했습니다.')}
    <div class="v5-role-grid">${model.roles.map((role, index) => `<article><i aria-hidden="true"></i><span>ROLE ${String(index + 1).padStart(2, '0')}</span><h3>${h(role.title)}</h3><b>${h(role.name)}</b><p>${h(role.body)}</p></article>`).join('')}</div>
  </div></section>
  <section id="next" class="v5-section" data-v5-label="다음 단계"><div class="v5-section-inner">
    ${sectionHead('05 · NEXT', '브랜드 이야기 다음에는 구체적인 선택이 필요합니다', '세 가지 서비스의 범위와 결과를 비교하거나, 실제 사례를 통해 접근 방식을 확인하세요.')}
    ${relatedLinks(model, [
      { path: `${base}/services/`, title: '서비스 비교하기' },
      { path: `${base}/work/`, title: '사례와 결과 보기' },
      { path: `${base}/contact/`, title: '프로젝트 문의서 작성' }
    ])}
  </div></section>`;
}

function servicesPage(model, route) {
  const site = model.site;
  const base = `/Site100/sites/${site.slug}`;
  return `${pageHero(model, route, {
    breadcrumbs: [{ label: '서비스', path: `${base}/services/` }],
    eyebrow: 'SERVICE DIRECTORY',
    title: `${site.kind}의 선택을 세 가지 흐름으로`,
    lead: '서비스 이름만 나열하지 않고, 누구에게 필요한지·어떤 결과가 남는지·어떻게 진행되는지를 비교할 수 있습니다.',
    actions: `<a class="primary" href="#service-list">서비스 비교</a><a href="${base}/work/">적용 사례</a>`
  })}
  <section id="service-list" class="v5-section v5-service-list" data-v5-label="서비스 목록"><div class="v5-section-inner">
    ${sectionHead('01 · SERVICES', '세 가지 서비스와 각기 다른 결과', `${site.materials[0]}, ${site.materials[1]}, ${site.materials[2]}를 기준으로 범위를 나눴습니다.`)}
    <div class="v5-card-grid">${model.services.map((service) => `<article class="v5-card"><span class="v5-card-index">${h(service.eyebrow)}</span><h3>${h(service.title)}</h3><p>${h(service.summary)}</p><ul>${service.outcomes.map((outcome) => `<li>${h(outcome)}</li>`).join('')}</ul><div class="v5-card-footer"><span>${h(service.deliverables.length)} DELIVERABLES</span><span>DETAIL →</span></div><a class="v5-card-link" href="${base}/services/${service.slug}/"><span class="sr-only">${h(service.title)} 상세 보기</span></a></article>`).join('')}</div>
  </div></section>
  <section id="compare" class="v5-section" data-v5-label="비교"><div class="v5-section-inner">
    ${sectionHead('02 · COMPARE', '한눈에 비교하는 선택 기준', '서비스마다 시작 질문, 핵심 결과, 권장 상황과 진행 단위가 다릅니다.')}
    <table class="v5-comparison"><thead><tr><th>기준</th>${model.services.map((service) => `<th>${h(service.title)}</th>`).join('')}</tr></thead><tbody>
      <tr><td>시작 질문</td>${model.services.map((service, index) => `<td>${h(site.materials[index])} 관련 상황은 무엇인가요?</td>`).join('')}</tr>
      <tr><td>핵심 결과</td>${model.services.map((service) => `<td>${h(service.outcomes[0])}</td>`).join('')}</tr>
      <tr><td>대표 산출물</td>${model.services.map((service) => `<td>${h(service.deliverables[0])}</td>`).join('')}</tr>
      <tr><td>권장 상황</td>${model.services.map((service, index) => `<td>${index === 0 ? '처음 구조를 잡을 때' : index === 1 ? '선택 과정이 복잡할 때' : '운영 흐름을 연결할 때'}</td>`).join('')}</tr>
    </tbody></table>
  </div></section>
  <section id="process" class="v5-section" data-v5-label="공통 과정"><div class="v5-section-inner">
    ${sectionHead('03 · SHARED PROCESS', '서비스가 달라도 유지되는 네 단계', '상황 확인부터 결과 인계까지 같은 기준으로 기록합니다.')}
    <div class="v5-process">${model.services[0].process.map((step) => `<article><h3>${h(step.title)}</h3><p>${h(step.body)}</p></article>`).join('')}</div>
  </div></section>
  <section id="decision" class="v5-section" data-v5-label="선택 도움"><div class="v5-section-inner">
    ${sectionHead('04 · DECISION', '아직 하나를 고르기 어렵다면', '서비스 상세 페이지에서 관심 항목을 프로젝트 플랜에 담으면 문의 페이지에서 선택 내용이 유지됩니다.')}
    ${relatedLinks(model, model.services.map((service) => ({ path: `${base}/services/${service.slug}/`, title: `${service.title} 상세` })))}
  </div></section>`;
}

function servicePage(model, route) {
  const site = model.site;
  const service = route.item;
  const base = `/Site100/sites/${site.slug}`;
  const related = model.services.filter((item) => item.slug !== service.slug).map((item) => ({ path: `${base}/services/${item.slug}/`, title: item.title }));
  return `${pageHero(model, route, {
    breadcrumbs: [{ label: '서비스', path: `${base}/services/` }, { label: service.title, path: `${base}/services/${service.slug}/` }],
    eyebrow: service.eyebrow,
    title: service.title,
    lead: service.summary,
    actions: `<button class="primary" type="button" data-v5-add-service="${service.slug}">프로젝트에 담기</button><a href="#outcomes">기대 결과</a>`
  })}
  <section id="outcomes" class="v5-section" data-v5-label="기대 결과"><div class="v5-section-inner">
    ${sectionHead('01 · OUTCOMES', '이 서비스를 마친 뒤 달라지는 것', service.promise)}
    <div class="v5-outcome-grid">${service.outcomes.map((outcome, index) => `<article><span class="v5-card-index">RESULT ${String(index + 1).padStart(2, '0')}</span><h3>${h(outcome)}</h3></article>`).join('')}</div>
  </div></section>
  <section id="deliverables" class="v5-section" data-v5-label="산출물"><div class="v5-section-inner">
    ${sectionHead('02 · DELIVERABLES', '운영에 다시 사용할 수 있는 결과물', '화면 한 장보다 결정 기준과 실행 문서가 함께 남아야 다음 운영에서 다시 사용할 수 있습니다.')}
    <ol class="v5-deliverables">${service.deliverables.map((item, index) => `<li><span>${String(index + 1).padStart(2, '0')} / FILE</span>${h(item)}</li>`).join('')}</ol>
  </div></section>
  <section id="process" class="v5-section" data-v5-label="진행 과정"><div class="v5-section-inner">
    ${sectionHead('03 · PROCESS', '네 단계로 확인하는 진행 과정', '각 단계에서 무엇을 결정하고 어떤 기록을 남기는지 확인할 수 있습니다.')}
    <div class="v5-process">${service.process.map((step) => `<article><h3>${h(step.title)}</h3><p>${h(step.body)}</p></article>`).join('')}</div>
  </div></section>
  <section id="faq" class="v5-section" data-v5-label="질문"><div class="v5-section-inner">
    ${sectionHead('04 · FAQ', '시작하기 전에 확인할 질문', '서비스 범위와 준비 자료, 결과 형태를 먼저 확인하세요.')}
    <div class="v5-faq">${service.faq.map((item, index) => `<details ${index === 0 ? 'open' : ''}><summary>${h(item.q)}</summary><p>${h(item.a)}</p></details>`).join('')}</div>
  </div></section>
  <section id="related" class="v5-section" data-v5-label="관련 서비스"><div class="v5-section-inner">
    ${sectionHead('05 · RELATED', '다른 서비스와 사례로 이어 보기', '현재 서비스를 프로젝트 플랜에 담거나 관련 서비스와 적용 사례를 더 확인할 수 있습니다.')}
    ${relatedLinks(model, [...related, { path: `${base}/work/`, title: '전체 적용 사례 보기' }])}
  </div></section>`;
}

function workPage(model, route) {
  const site = model.site;
  const base = `/Site100/sites/${site.slug}`;
  const categories = [...new Set(model.cases.map((item) => item.category))];
  return `${pageHero(model, route, {
    breadcrumbs: [{ label: '사례', path: `${base}/work/` }],
    eyebrow: 'SELECTED WORK · CASE STUDIES',
    title: '문제와 선택, 결과가 연결된 세 가지 사례',
    lead: `${site.kind} 화면을 꾸미는 데서 끝내지 않고 실제 행동 순서와 운영 결과를 함께 기록했습니다.`,
    actions: `<a class="primary" href="#cases">사례 살펴보기</a><a href="${base}/services/">서비스 비교</a>`
  })}
  <section id="cases" class="v5-section" data-v5-label="사례 목록"><div class="v5-section-inner">
    ${sectionHead('01 · CASE INDEX', '문제 유형에 따라 골라 보는 사례', '경험 설계, 운영 개선, 콘텐츠 구조로 나눠 확인할 수 있습니다.')}
    <div class="v5-filter-bar"><div data-v5-filter-group data-v5-filter-target="[data-v5-case-card]"><button data-v5-filter="all" aria-pressed="true">전체</button>${categories.map((category) => `<button data-v5-filter="${h(category)}" aria-pressed="false">${h(category)}</button>`).join('')}</div><output data-v5-filter-output>${model.cases.length}개 항목</output></div>
    <div class="v5-case-grid">${model.cases.map((caseItem) => `<article class="v5-case-card" data-v5-case-card data-v5-category="${h(caseItem.category)}"><div class="v5-case-art"><span class="sr-only">${h(caseItem.title)} 시각 이미지</span></div><div><span class="v5-card-index">${h(caseItem.category)} · CASE ${String(caseItem.id).padStart(2, '0')}</span><h3>${h(caseItem.title)}</h3><p>${h(caseItem.summary)}</p><div class="v5-card-footer"><span>${h(caseItem.metrics[0].value)} ${h(caseItem.metrics[0].label)}</span><span>READ →</span></div></div><a class="v5-card-link" href="${base}/work/${caseItem.slug}/"><span class="sr-only">${h(caseItem.title)} 상세 보기</span></a></article>`).join('')}</div>
  </div></section>
  <section id="method" class="v5-section" data-v5-label="사례 기록법"><div class="v5-section-inner">
    ${sectionHead('02 · METHOD', '결과 숫자 앞에 문제와 접근을 기록합니다', '좋아 보이는 결과만 보여주지 않고 어떤 제약 속에서 무엇을 바꿨는지 같은 구조로 남깁니다.')}
    <div class="v5-process">${['문제와 맥락', '가설과 기준', '적용과 검증', '결과와 다음 단계'].map((title, index) => `<article><h3>${title}</h3><p>${index === 0 ? `${site.materials[0]} 관련 실제 질문을 수집합니다.` : index === 1 ? `${site.materials[1]} 선택 기준을 다시 세웁니다.` : index === 2 ? `${site.materials[2]} 흐름에 작은 변화를 적용합니다.` : `${site.materials[3]} 이후의 운영 과제를 기록합니다.`}</p></article>`).join('')}</div>
  </div></section>`;
}

function casePage(model, route) {
  const site = model.site;
  const caseItem = route.item;
  const base = `/Site100/sites/${site.slug}`;
  const related = model.cases.filter((item) => item.slug !== caseItem.slug).map((item) => ({ path: `${base}/work/${item.slug}/`, title: item.title }));
  return `${pageHero(model, route, {
    breadcrumbs: [{ label: '사례', path: `${base}/work/` }, { label: caseItem.title, path: `${base}/work/${caseItem.slug}/` }],
    eyebrow: `${caseItem.category} · CASE ${String(caseItem.id).padStart(2, '0')}`,
    title: caseItem.title,
    lead: caseItem.summary,
    actions: `<a class="primary" href="#challenge">사례 읽기</a><a href="${base}/contact/">비슷한 문제 문의</a>`
  })}
  <section id="metrics" class="v5-section" data-v5-label="결과 지표"><div class="v5-section-inner">
    ${sectionHead('01 · RESULT SNAPSHOT', '한눈에 보는 변화', '가상의 템플릿 사례를 위한 결과 지표이며 실제 기업 성과를 주장하지 않습니다.')}
    <div class="v5-metrics">${caseItem.metrics.map((metric) => `<article><strong>${h(metric.value)}</strong><span>${h(metric.label)}</span></article>`).join('')}</div>
  </div></section>
  <section id="challenge" class="v5-section" data-v5-label="문제"><div class="v5-section-inner">
    <div class="v5-case-story"><h3>무엇이 문제였나요?</h3><div><p>${h(caseItem.challenge)}</p><blockquote>${h(site.materials[0])} 정보가 많아서 어려운 것이 아니라, 언제 봐야 하는지가 보이지 않는 것이 문제였습니다.</blockquote></div></div>
  </div></section>
  <section id="approach" class="v5-section" data-v5-label="접근"><div class="v5-section-inner">
    <div class="v5-case-story"><h3>어떻게 접근했나요?</h3><div><ul>${caseItem.approach.map((item) => `<li>${h(item)}</li>`).join('')}</ul><p>${h(caseItem.result)}</p></div></div>
  </div></section>
  <section id="timeline" class="v5-section" data-v5-label="진행 과정"><div class="v5-section-inner">
    ${sectionHead('04 · DELIVERY', '네 단계로 진행한 적용 과정', '각 단계의 결과가 다음 단계의 입력이 되도록 연결했습니다.')}
    <div class="v5-process">${caseItem.timeline.map((title, index) => `<article><h3>${h(title)}</h3><p>${index === 0 ? '현재 문의와 운영 기록을 확인합니다.' : index === 1 ? '우선순위와 화면 구조를 다시 세웁니다.' : index === 2 ? '핵심 행동을 중심으로 시안을 검증합니다.' : '결과와 다음 운영 과제를 문서로 인계합니다.'}</p></article>`).join('')}</div>
  </div></section>
  <section id="related" class="v5-section" data-v5-label="다른 사례"><div class="v5-section-inner">
    ${sectionHead('05 · RELATED', '다른 문제를 다룬 사례', '같은 업종 안에서도 문제 유형에 따라 접근과 결과가 달라집니다.')}
    ${relatedLinks(model, [...related, { path: `${base}/contact/`, title: '프로젝트 문의서 작성' }])}
  </div></section>`;
}

function journalPage(model, route) {
  const site = model.site;
  const base = `/Site100/sites/${site.slug}`;
  const categories = [...new Set(model.articles.map((article) => article.category))];
  return `${pageHero(model, route, {
    breadcrumbs: [{ label: '저널', path: `${base}/journal/` }],
    eyebrow: 'JOURNAL · OPERATING NOTES',
    title: `${site.kind} 경험을 설계하고 운영하는 기록`,
    lead: '첫 화면의 인상보다 선택 기준, 안내 순서, 운영자가 계속 관리할 수 있는 구조를 긴 글로 정리했습니다.',
    actions: `<a class="primary" href="#articles">최근 글</a><a href="${base}/about/">운영 원칙</a>`
  })}
  <section id="articles" class="v5-section" data-v5-label="글 목록"><div class="v5-section-inner">
    ${sectionHead('01 · ARTICLES', '읽고 다시 적용할 수 있는 두 편의 가이드', '각 글은 실제 업종 소재와 서비스 흐름을 기준으로 구성했습니다.')}
    <div class="v5-filter-bar"><div data-v5-filter-group data-v5-filter-target="[data-v5-article-card]"><button data-v5-filter="all" aria-pressed="true">전체</button>${categories.map((category) => `<button data-v5-filter="${h(category)}" aria-pressed="false">${h(category)}</button>`).join('')}</div><output data-v5-filter-output>${model.articles.length}개 항목</output></div>
    <div class="v5-article-grid">${model.articles.map((article) => `<article class="v5-article-card" data-v5-article-card data-v5-category="${h(article.category)}"><div class="v5-article-meta"><span>${h(article.category)}</span><time datetime="${article.date}">${article.date}</time><span>${article.minutes}분 읽기</span></div><h3>${h(article.title)}</h3><p>${h(article.excerpt)}</p><div class="v5-card-footer"><span>${article.sections.length} SECTIONS</span><span>READ →</span></div><a class="v5-card-link" href="${base}/journal/${article.slug}/"><span class="sr-only">${h(article.title)} 읽기</span></a></article>`).join('')}</div>
  </div></section>
  <section id="topics" class="v5-section" data-v5-label="다루는 주제"><div class="v5-section-inner">
    ${sectionHead('02 · TOPICS', '이 저널이 반복해서 다루는 질문', '페이지 수보다 사용자가 판단하는 순서와 운영자가 계속 관리하는 방법을 다룹니다.')}
    <div class="v5-principles"><article><span>01</span><h3>무엇을 먼저 보여줄까?</h3><p>${h(site.materials[0])} 정보가 필요한 순간과 우선순위를 관찰합니다.</p></article><article><span>02</span><h3>어디에서 망설일까?</h3><p>${h(site.materials[1])} 선택 기준을 비교 가능한 형태로 바꿉니다.</p></article><article><span>03</span><h3>누가 계속 운영할까?</h3><p>${h(site.materials[2])}와 ${h(site.materials[3])} 정보를 반복해서 추가할 수 있는 구조를 만듭니다.</p></article></div>
  </div></section>`;
}

function articlePage(model, route) {
  const site = model.site;
  const article = route.item;
  const base = `/Site100/sites/${site.slug}`;
  const related = model.articles.filter((item) => item.slug !== article.slug).map((item) => ({ path: `${base}/journal/${item.slug}/`, title: item.title }));
  return `${pageHero(model, route, {
    breadcrumbs: [{ label: '저널', path: `${base}/journal/` }, { label: article.title, path: `${base}/journal/${article.slug}/` }],
    eyebrow: `${article.category} · ${article.date} · ${article.minutes} MIN READ`,
    title: article.title,
    lead: article.excerpt,
    actions: `<a class="primary" href="#article-start">글 읽기</a><a href="${base}/journal/">전체 저널</a>`
  })}
  <section id="article-start" class="v5-section" data-v5-label="본문"><div class="v5-section-inner">
    <article class="v5-article-layout" data-v5-article>
      <nav class="v5-article-toc" aria-label="글 목차"><span>CONTENTS</span>${article.sections.map((section, index) => `<a href="#article-section-${index + 1}"><span>${String(index + 1).padStart(2, '0')}</span>${h(section.title)}</a>`).join('')}</nav>
      <div class="v5-article-body"><p>${h(article.excerpt)}</p><blockquote>좋은 정보 구조는 모든 것을 한 번에 보여주는 것이 아니라, 지금 필요한 판단만 앞으로 가져옵니다.</blockquote>${article.sections.map((section, index) => `<section id="article-section-${index + 1}"><span class="v5-section-kicker">SECTION ${String(index + 1).padStart(2, '0')}</span><h2>${h(section.title)}</h2><p>${h(section.body)}</p><p>${h(site.materials[index % site.materials.length])} 관련 정보도 같은 원칙으로 분류할 수 있습니다. 사용자가 묻는 시점과 운영자가 갱신하는 주기를 함께 고려하면 화면이 복잡해지지 않습니다.</p></section>`).join('')}</div>
      <aside class="v5-article-aside"><button type="button" data-v5-bookmark aria-pressed="false">글 저장</button><a href="${base}/contact/">관련 프로젝트 문의</a><a href="${base}/journal/">다른 글 읽기</a></aside>
    </article>
  </div></section>
  <section id="related" class="v5-section" data-v5-label="다음 읽기"><div class="v5-section-inner">
    ${sectionHead('02 · CONTINUE', '다음 글과 서비스로 이어 보기', '읽은 내용을 실제 서비스 선택과 프로젝트 문의에 연결할 수 있습니다.')}
    ${relatedLinks(model, [...related, { path: `${base}/services/`, title: '서비스 구조 살펴보기' }, { path: `${base}/contact/`, title: '프로젝트 문의서 작성' }])}
  </div></section>`;
}

function contactPage(model, route) {
  const site = model.site;
  const base = `/Site100/sites/${site.slug}`;
  return `${pageHero(model, route, {
    breadcrumbs: [{ label: '문의', path: `${base}/contact/` }],
    eyebrow: 'PROJECT INQUIRY · LOCAL DRAFT',
    title: '필요한 내용을 세 단계로 정리합니다',
    lead: '서비스를 고르지 못했어도 괜찮습니다. 목적, 현재 상황, 일정과 연락 정보를 순서대로 입력하면 복사 가능한 문의 초안이 만들어집니다.',
    actions: `<a class="primary" href="#wizard">문의서 시작</a><a href="${base}/services/">서비스 먼저 비교</a>`
  })}
  <section id="wizard" class="v5-section" data-v5-label="문의서"><div class="v5-section-inner">
    <div class="v5-wizard-layout">
      <div class="v5-wizard-intro"><span class="v5-section-kicker">01 · PROJECT BRIEF</span><h2>한 번에 보내지 않고 단계별로 정리합니다</h2><p>입력한 내용은 서버로 전송되지 않고 현재 브라우저에 임시 저장됩니다. 마지막 단계에서 TXT 파일이나 클립보드로 내보낼 수 있습니다.</p><div class="v5-wizard-steps" aria-label="문의 단계"><i data-v5-step-dot></i><i data-v5-step-dot></i><i data-v5-step-dot></i></div></div>
      <form class="v5-wizard" data-v5-wizard>
        <div class="v5-wizard-top"><span data-v5-step-label>1 / 3</span><span data-v5-draft-status>임시 저장 내용 없음</span></div>
        <fieldset data-v5-step><legend>무엇을 해결하고 싶나요?</legend><div class="v5-selected-services">${model.services.map((service) => `<button type="button" data-v5-add-service="${service.slug}" aria-pressed="false">${h(service.title)} 담기</button>`).join('')}</div><label>문의 목적<select name="goal" required><option value="">선택하세요</option>${model.contactTopics.map((topic) => `<option>${h(topic)}</option>`).join('')}</select></label><label>현재 상황<textarea name="context" required placeholder="지금 어떤 화면이나 운영 과정에서 어려움을 느끼고 있나요?"></textarea></label><div class="v5-wizard-buttons"><span></span><button class="primary" type="button" data-v5-next>다음 단계</button></div></fieldset>
        <fieldset data-v5-step hidden><legend>범위와 일정을 알려주세요</legend><label>원하는 일정<select name="timeline" required><option value="">선택하세요</option><option>2주 안에 방향 확인</option><option>1개월 안에 1차 적용</option><option>2–3개월 단계적 진행</option><option>아직 정하지 않음</option></select></label><label>예산 범위<select name="budget" required><option value="">선택하세요</option><option>기획·진단 중심</option><option>핵심 화면 제작</option><option>전체 웹사이트 구축</option><option>논의 후 결정</option></select></label><label>추가 내용<textarea name="message" placeholder="참고할 사이트, 필수 기능, 내부 제약을 적어주세요."></textarea></label><div class="v5-wizard-buttons"><button type="button" data-v5-back>이전</button><button class="primary" type="button" data-v5-next>다음 단계</button></div></fieldset>
        <fieldset data-v5-step hidden><legend>연락 가능한 정보를 남겨주세요</legend><label>이름<input name="name" autocomplete="name" required></label><label>이메일<input name="email" type="email" autocomplete="email" required></label><div class="v5-wizard-buttons"><button type="button" data-v5-back>이전</button><button class="primary" type="submit">문의 초안 만들기</button></div><div class="v5-wizard-result" data-v5-wizard-result hidden><h3>문의 초안이 준비됐습니다</h3><pre></pre><div class="v5-wizard-buttons"><button type="button" data-v5-copy-summary>복사</button><button type="button" data-v5-download-summary>TXT 저장</button><button type="button" data-v5-clear-draft>초기화</button></div></div></fieldset>
      </form>
    </div>
  </div></section>
  <section id="before" class="v5-section" data-v5-label="준비사항"><div class="v5-section-inner">
    ${sectionHead('02 · BEFORE WE START', '완벽한 기획서보다 현재 상황이 중요합니다', '정리된 자료가 없어도 반복되는 질문, 바꾸고 싶은 흐름, 반드시 유지해야 할 조건부터 시작할 수 있습니다.')}
    <div class="v5-principles"><article><span>01</span><h3>현재 자료</h3><p>기존 홈페이지, 안내문, 메뉴, 일정표처럼 실제 운영에 사용하는 자료가 있으면 도움이 됩니다.</p></article><article><span>02</span><h3>반복 질문</h3><p>고객이나 내부 담당자가 자주 묻는 질문은 정보구조를 설계하는 가장 좋은 단서입니다.</p></article><article><span>03</span><h3>성공 기준</h3><p>방문, 예약, 신청, 문의처럼 프로젝트 이후 달라져야 할 행동을 한 가지라도 정해두면 좋습니다.</p></article></div>
  </div></section>`;
}

function pageContent(model, route) {
  if (route.type === 'about') return aboutPage(model, route);
  if (route.type === 'services') return servicesPage(model, route);
  if (route.type === 'service') return servicePage(model, route);
  if (route.type === 'work') return workPage(model, route);
  if (route.type === 'case') return casePage(model, route);
  if (route.type === 'journal') return journalPage(model, route);
  if (route.type === 'article') return articlePage(model, route);
  if (route.type === 'contact') return contactPage(model, route);
  throw new Error(`Unsupported deep page type: ${route.type}`);
}

function pageDescription(model, route) {
  const item = route.item;
  if (route.type === 'service') return `${item.summary} 기대 결과, 산출물, 진행 과정과 FAQ를 확인하세요.`;
  if (route.type === 'case') return `${item.summary} 문제, 접근, 결과 지표와 진행 과정을 확인하는 ${model.site.kind} 사례입니다.`;
  if (route.type === 'article') return `${item.excerpt} ${item.minutes}분 분량의 ${model.site.kind} 운영 가이드입니다.`;
  const descriptions = {
    about: `${model.site.name}의 시작 배경, 운영 원칙, 변화 과정과 역할을 소개합니다.`,
    services: `${model.site.name}의 세 가지 서비스를 비교하고 각 서비스 상세로 이동할 수 있습니다.`,
    work: `${model.site.name}의 문제 해결 과정과 결과를 세 가지 사례로 확인합니다.`,
    journal: `${model.site.kind} 경험 설계와 운영 방식을 정리한 장문 저널입니다.`,
    contact: `관심 서비스, 현재 상황, 일정과 연락 정보를 단계별로 정리하는 ${model.site.name} 문의 페이지입니다.`
  };
  return descriptions[route.type];
}

function schema(model, route, canonical, description) {
  const breadcrumbsItems = canonical.replace(`${baseUrl}/sites/${model.site.slug}/`, '').split('/').filter(Boolean);
  const breadcrumbList = [
    { '@type': 'ListItem', position: 1, name: '100WORLDS', item: `${baseUrl}/` },
    { '@type': 'ListItem', position: 2, name: model.site.name, item: `${baseUrl}/sites/${model.site.slug}/` },
    ...breadcrumbsItems.map((part, index) => ({ '@type': 'ListItem', position: index + 3, name: part, item: `${baseUrl}/sites/${model.site.slug}/${breadcrumbsItems.slice(0, index + 1).join('/')}/` }))
  ];
  const pageType = route.type === 'article' ? 'Article' : route.type === 'service' ? 'Service' : route.type === 'about' ? 'AboutPage' : route.type === 'contact' ? 'ContactPage' : 'CollectionPage';
  const mainEntity = {
    '@type': pageType,
    name: route.title,
    description,
    url: canonical,
    image: `${baseUrl}/artworks/${model.site.slug}.svg`,
    isPartOf: { '@type': 'WebSite', name: model.site.name, url: `${baseUrl}/sites/${model.site.slug}/` }
  };
  if (route.type === 'article') {
    mainEntity.datePublished = route.item.date;
    mainEntity.dateModified = buildDate;
    mainEntity.articleSection = route.item.category;
  }
  if (route.type === 'service') mainEntity.provider = { '@type': 'Organization', name: model.site.name };
  return { '@context': 'https://schema.org', '@graph': [mainEntity, { '@type': 'BreadcrumbList', itemListElement: breadcrumbList }] };
}

function pageDocument(model, route) {
  const site = model.site;
  const canonical = `${baseUrl}${route.path}`;
  const description = pageDescription(model, route);
  const context = { type: route.type, depth: route.depth, itemSlug: route.item?.slug || '', parent: route.type === 'service' ? 'services' : route.type === 'case' ? 'work' : route.type === 'article' ? 'journal' : '' };
  const structured = JSON.stringify(schema(model, route, canonical, description)).replace(/</g, '\\u003c');
  return `<!doctype html><html lang="ko"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="index,follow,max-image-preview:large"><meta name="theme-color" content="${h(site.design.palette.bg)}"><meta name="color-scheme" content="light dark">
<title>${h(route.title)} | ${h(site.name)} · 100WORLDS</title><meta name="description" content="${h(description)}">
<meta property="og:title" content="${h(route.title)} | ${h(site.name)}"><meta property="og:description" content="${h(description)}"><meta property="og:type" content="${route.type === 'article' ? 'article' : 'website'}"><meta property="og:url" content="${h(canonical)}"><meta property="og:image" content="${baseUrl}/artworks/${site.slug}.svg">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${h(route.title)} | ${h(site.name)}"><meta name="twitter:description" content="${h(description)}"><meta name="twitter:image" content="${baseUrl}/artworks/${site.slug}.svg">
<link rel="canonical" href="${h(canonical)}"><link rel="manifest" href="/Site100/site.webmanifest"><link rel="icon" href="/Site100/icon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/Site100/assets/styles.css"><link rel="stylesheet" href="/Site100/assets/v2.css"><link rel="stylesheet" href="/Site100/assets/v3.css"><link rel="stylesheet" href="/Site100/assets/v4-responsive.css"><link rel="stylesheet" href="/Site100/assets/v4-responsive-fixes.css"><link rel="stylesheet" href="/Site100/assets/v4-fixes.css"><link rel="stylesheet" href="/Site100/assets/v5-depth.css">
<script type="application/ld+json">${structured}</script></head><body><a class="skip-link" href="#site100-main">본문 바로가기</a>
<div class="${worldClasses(site)}" style="${styleVariables(site)}" data-v5-page="${route.type}">
${staticNav(model, route.type)}<main id="site100-main" class="v5-page-main">${pageContent(model, route)}</main>
<footer><strong>${h(site.name)}</strong><span>WORLD ${pad(site.id)} · ${h(site.kind)}</span><a href="/Site100/">100WORLDS</a></footer></div>
<script>window.SITE100_SLUG=${JSON.stringify(site.slug)};window.SITE100_PAGE=${JSON.stringify(context)};</script>
<script type="module" src="/Site100/assets/copy-bootstrap.js"></script><script type="module" src="/Site100/assets/depth.js"></script><script type="module" src="/Site100/assets/enhance.js"></script><script type="module" src="/Site100/assets/enhance-fix.js"></script><script type="module" src="/Site100/assets/art-direction.js"></script><script type="module" src="/Site100/assets/responsive.js"></script><script type="module" src="/Site100/assets/responsive-fixes.js"></script></body></html>`;
}

const allRoutes = [];
for (const rawSite of SITES) {
  const model = buildDeepModel(rawSite);
  const routes = deepRoutes(rawSite);
  allRoutes.push(...routes);
  const siteRoot = resolve(dist, 'sites', model.site.slug);
  const siteMap = {
    version,
    siteId: model.site.id,
    slug: model.site.slug,
    count: routes.length,
    maxDepth: Math.max(...routes.map((route) => route.depth)),
    routes: routes.map((route) => ({ type: route.type, title: route.title, path: route.path, depth: route.depth }))
  };
  writeFileSync(resolve(siteRoot, 'site-map.json'), `${JSON.stringify(siteMap, null, 2)}\n`);

  const designPath = resolve(siteRoot, 'design.json');
  const design = JSON.parse(readFileSync(designPath, 'utf8'));
  design.depthVersion = version;
  design.informationArchitecture = {
    pageCount: routes.length,
    maxDepth: 3,
    sections: ['about', 'services', 'work', 'journal', 'contact'],
    detailCounts: { services: model.services.length, cases: model.cases.length, articles: model.articles.length },
    capabilities: ['breadcrumbs', 'mega-navigation', 'service-planner', 'case-details', 'article-toc', 'bookmarks', 'contact-wizard', 'local-draft']
  };
  writeFileSync(designPath, `${JSON.stringify(design, null, 2)}\n`);

  for (const route of routes) {
    if (route.type === 'home') continue;
    const directory = routeDirectory(route.path);
    mkdirSync(directory, { recursive: true });
    writeFileSync(resolve(directory, 'index.html'), pageDocument(model, route));
  }
}

function injectDepthAssets(directory) {
  for (const name of readdirSync(directory)) {
    const path = resolve(directory, name);
    if (statSync(path).isDirectory()) {
      injectDepthAssets(path);
      continue;
    }
    if (!name.endsWith('.html')) continue;
    let html = readFileSync(path, 'utf8');
    if (!html.includes('/Site100/assets/v5-depth.css')) html = html.replace('</head>', '<link rel="stylesheet" href="/Site100/assets/v5-depth.css"></head>');
    if (!html.includes('/Site100/assets/depth.js')) html = html.replace('</body>', '<script type="module" src="/Site100/assets/depth.js"></script></body>');
    writeFileSync(path, html);
  }
}
injectDepthAssets(dist);

const urls = [`${baseUrl}/`, ...allRoutes.map((route) => `${baseUrl}${route.path}`)];
writeFileSync(resolve(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `<url><loc>${xml(url)}</loc><lastmod>${buildDate}</lastmod></url>`).join('\n')}\n</urlset>\n`);
writeFileSync(resolve(dist, 'depth-manifest.json'), `${JSON.stringify({
  version,
  generatedAt: `${buildDate}T00:00:00+09:00`,
  siteCount: SITES.length,
  pagesPerSite: 14,
  sitePageCount: allRoutes.length,
  totalIndexedPages: urls.length,
  maximumDepth: 3,
  routeTypes: {
    home: 100,
    about: 100,
    servicesIndex: 100,
    serviceDetail: 300,
    workIndex: 100,
    caseDetail: 300,
    journalIndex: 100,
    articleDetail: 200,
    contact: 100
  },
  features: ['mega-navigation', 'breadcrumbs', 'service-planner', 'persistent-plan', 'case-filters', 'article-toc', 'article-bookmarks', 'contact-wizard', 'local-drafts', 'deep-seo']
}, null, 2)}\n`);

const manifestPath = resolve(dist, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
manifest.depthVersion = version;
manifest.deepArchitecture = {
  pagesPerSite: 14,
  sitePageCount: allRoutes.length,
  totalIndexedPages: urls.length,
  maximumDepth: 3,
  detailPages: 800,
  features: ['mega-navigation', 'breadcrumbs', 'service-planner', 'case-details', 'article-toc', 'bookmarks', 'contact-wizard', 'local-draft']
};
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Generated Site100 v5: ${allRoutes.length} site pages across ${SITES.length} sites, plus the gallery.`);
