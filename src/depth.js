import { SITES } from './catalog.js';
import { buildDeepModel } from './depth-content.js';

const $ = (selector, root = document) => root?.querySelector?.(selector) || null;
const $$ = (selector, root = document) => root?.querySelectorAll ? [...root.querySelectorAll(selector)] : [];
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);

const pageContext = window.SITE100_PAGE || { type: 'home' };
const slug = window.SITE100_SLUG || location.pathname.split('/').filter(Boolean)[2];
const sourceSite = SITES.find((site) => site.slug === slug);
const model = sourceSite ? buildDeepModel(sourceSite) : null;
const base = model ? `/Site100/sites/${model.site.slug}` : '';
const PLAN_KEY = model ? `site100:v5:plan:${model.site.slug}` : '';
const DRAFT_KEY = model ? `site100:v5:contact:${model.site.slug}` : '';
const BOOKMARK_KEY = model ? `site100:v5:bookmarks:${model.site.slug}` : '';

function readJSON(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* optional storage */ }
}

function copyText(value) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
  return Promise.resolve();
}

function downloadText(filename, value) {
  const blob = new Blob([value], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function announce(message) {
  let region = $('#site100-depth-live');
  if (!region) {
    region = document.createElement('div');
    region.id = 'site100-depth-live';
    region.className = 'sr-only';
    region.setAttribute('aria-live', 'polite');
    document.body.appendChild(region);
  }
  region.textContent = '';
  requestAnimationFrame(() => { region.textContent = message; });
}

function track(event, detail = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, site_slug: model?.site.slug, page_type: pageContext.type, ...detail });
  try {
    if (typeof window.clarity === 'function') window.clarity('event', event);
  } catch { /* analytics is optional */ }
}

function navItem(path, label, type) {
  const active = pageContext.type === type || (type === 'services' && pageContext.type === 'service') || (type === 'work' && pageContext.type === 'case') || (type === 'journal' && pageContext.type === 'article');
  return `<a href="${path}" data-v5-nav="${type}" ${active ? 'aria-current="page"' : ''}>${label}</a>`;
}

function megaMenu(label, type, parentPath, entries) {
  const active = pageContext.type === type || (type === 'services' && pageContext.type === 'service') || (type === 'work' && pageContext.type === 'case') || (type === 'journal' && pageContext.type === 'article');
  return `<details class="v5-mega" ${active ? 'data-active="true"' : ''}>
    <summary ${active ? 'aria-current="page"' : ''}>${label}<i aria-hidden="true">＋</i></summary>
    <div class="v5-mega-panel">
      <a class="v5-mega-lead" href="${parentPath}"><span>${label} 전체</span><b>${escapeHtml(model.site.kind)}의 ${label} 살펴보기</b></a>
      <div>${entries.map((entry, index) => `<a href="${entry.path}"><span>${String(index + 1).padStart(2, '0')}</span><b>${escapeHtml(entry.title)}</b><small>${escapeHtml(entry.meta)}</small></a>`).join('')}</div>
    </div>
  </details>`;
}

function setupNavigation() {
  if (!model) return;
  const header = $('.world > .nav');
  if (!header) return;
  const brand = $('.brand', header);
  if (brand) brand.href = `${base}/`;

  const services = model.services.map((service) => ({ path: `${base}/services/${service.slug}/`, title: service.title, meta: service.eyebrow }));
  const cases = model.cases.map((caseItem) => ({ path: `${base}/work/${caseItem.slug}/`, title: caseItem.title, meta: caseItem.category }));
  const articles = model.articles.map((article) => ({ path: `${base}/journal/${article.slug}/`, title: article.title, meta: `${article.minutes}분 읽기` }));
  let nav = $('nav', header);
  if (!nav) {
    nav = document.createElement('nav');
    header.appendChild(nav);
  }
  nav.className = 'v5-primary-nav';
  nav.setAttribute('aria-label', `${model.site.name} 주요 페이지`);
  nav.innerHTML = [
    navItem(`${base}/`, '홈', 'home'),
    navItem(`${base}/about/`, '소개', 'about'),
    megaMenu('서비스', 'services', `${base}/services/`, services),
    megaMenu('사례', 'work', `${base}/work/`, cases),
    megaMenu('저널', 'journal', `${base}/journal/`, articles),
    navItem(`${base}/contact/`, '문의', 'contact')
  ].join('');

  const oldCta = [...header.children].find((child) => child.matches?.('button[data-go],a.v5-nav-cta'));
  const cta = document.createElement('a');
  cta.className = 'v5-nav-cta';
  cta.href = `${base}/contact/`;
  cta.textContent = '프로젝트 문의';
  if (oldCta) oldCta.replaceWith(cta);
  else header.appendChild(cta);

  nav.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) return;
    $$('details', nav).forEach((details) => { details.open = false; });
  });
  document.addEventListener('pointerdown', (event) => {
    if (event.target.closest('.v5-mega')) return;
    $$('.v5-mega[open]', nav).forEach((details) => { details.open = false; });
  });
}

function enhanceHome() {
  if (!model || pageContext.type !== 'home') return;
  const world = $('.world');
  const main = $('main', world);
  if (!main || $('.v5-depth-hub', main)) return;

  const secondary = $('.hero .actions a[href="#showcase"]', world);
  if (secondary) secondary.href = `${base}/work/`;
  $$('.services .cards article', world).forEach((card, index) => {
    const link = $('a', card);
    if (link && model.services[index]) {
      link.href = `${base}/services/${model.services[index].slug}/`;
      link.textContent = '서비스 상세';
    }
  });
  $$('.showcase .works figure', world).forEach((figure, index) => {
    const caseItem = model.cases[index % model.cases.length];
    if (!caseItem || $('a.v5-card-link', figure)) return;
    figure.insertAdjacentHTML('beforeend', `<a class="v5-card-link" href="${base}/work/${caseItem.slug}/"><span class="sr-only">${escapeHtml(caseItem.title)} 보기</span></a>`);
  });
  $$('.journal article', world).forEach((article, index) => {
    const item = model.articles[index % model.articles.length];
    if (!item || $('a.v5-card-link', article)) return;
    article.insertAdjacentHTML('beforeend', `<a class="v5-card-link" href="${base}/journal/${item.slug}/"><span class="sr-only">${escapeHtml(item.title)} 읽기</span></a>`);
  });

  const hub = document.createElement('section');
  hub.className = 'section v5-depth-hub v3-reveal';
  hub.id = 'explore-depth';
  hub.innerHTML = `<div class="heading"><span>08 / EXPLORE</span><h2>첫 화면 다음의<br>깊은 구조</h2><p>브랜드 이야기부터 서비스 상세, 사례, 운영 저널과 문의까지 연결했습니다.</p></div>
  <div class="v5-depth-grid">
    <a href="${base}/about/"><span>01</span><h3>브랜드와 기준</h3><p>시작 배경, 운영 원칙, 역할과 변화 과정을 확인합니다.</p></a>
    <a href="${base}/services/"><span>02</span><h3>서비스 구조</h3><p>세 가지 서비스를 비교하고 각 상세 페이지에서 결과와 과정을 살펴봅니다.</p></a>
    <a href="${base}/work/"><span>03</span><h3>사례와 근거</h3><p>문제, 접근 방식, 결과 지표가 연결된 사례를 읽습니다.</p></a>
    <a href="${base}/journal/"><span>04</span><h3>운영 저널</h3><p>${escapeHtml(model.site.kind)} 경험을 설계하고 운영하는 방법을 긴 글로 정리했습니다.</p></a>
    <a href="${base}/contact/"><span>05</span><h3>프로젝트 설계</h3><p>관심 서비스를 저장한 뒤 다단계 문의 흐름으로 요구사항을 정리합니다.</p></a>
  </div>`;
  const contact = $('#contact', main);
  if (contact) contact.insertAdjacentElement('beforebegin', hub);
  else main.appendChild(hub);
}

function serviceBySlug(serviceSlug) {
  return model?.services.find((service) => service.slug === serviceSlug);
}

function selectedPlan() {
  return new Set(readJSON(PLAN_KEY, []));
}

function setSelectedPlan(plan) {
  writeJSON(PLAN_KEY, [...plan]);
  renderPlanDock();
  updatePlanButtons();
}

function updatePlanButtons() {
  const plan = selectedPlan();
  $$('[data-v5-add-service]').forEach((button) => {
    const selected = plan.has(button.dataset.v5AddService);
    button.setAttribute('aria-pressed', String(selected));
    button.textContent = selected ? '프로젝트에서 빼기' : '프로젝트에 담기';
  });
}

function renderPlanDock() {
  if (!model) return;
  const plan = selectedPlan();
  let dock = $('.v5-plan-dock');
  if (!plan.size) {
    dock?.remove();
    document.body.classList.remove('v5-has-plan');
    return;
  }
  if (!dock) {
    dock = document.createElement('aside');
    dock.className = 'v5-plan-dock';
    dock.setAttribute('aria-label', '선택한 서비스');
    document.body.appendChild(dock);
  }
  document.body.classList.add('v5-has-plan');
  const items = [...plan].map(serviceBySlug).filter(Boolean);
  dock.innerHTML = `<div><span>PROJECT PLAN</span><b>${items.length}개 서비스 선택</b><small>${items.map((item) => escapeHtml(item.title)).join(' · ')}</small></div>
    <a href="${base}/contact/?plan=${encodeURIComponent([...plan].join(','))}">문의서 작성</a>
    <button type="button" data-v5-clear-plan>비우기</button>`;
  $('[data-v5-clear-plan]', dock)?.addEventListener('click', () => setSelectedPlan(new Set()));
}

function setupPlanner() {
  if (!model) return;
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-v5-add-service]');
    if (!button) return;
    const plan = selectedPlan();
    const serviceSlug = button.dataset.v5AddService;
    if (plan.has(serviceSlug)) plan.delete(serviceSlug);
    else plan.add(serviceSlug);
    setSelectedPlan(plan);
    const service = serviceBySlug(serviceSlug);
    announce(`${service?.title || '서비스'}${plan.has(serviceSlug) ? '를 프로젝트에 담았습니다.' : '를 프로젝트에서 뺐습니다.'}`);
    track('site100_depth_plan_toggle', { service_slug: serviceSlug, selected: plan.has(serviceSlug), plan_size: plan.size });
  });
  updatePlanButtons();
  renderPlanDock();
}

function setupFilters() {
  $$('[data-v5-filter-group]').forEach((group) => {
    const targetSelector = group.dataset.v5FilterTarget;
    const items = $$(targetSelector);
    group.addEventListener('click', (event) => {
      const button = event.target.closest('[data-v5-filter]');
      if (!button) return;
      const value = button.dataset.v5Filter;
      $$('[data-v5-filter]', group).forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      let visible = 0;
      items.forEach((item) => {
        const show = value === 'all' || item.dataset.v5Category === value;
        item.hidden = !show;
        if (show) visible += 1;
      });
      const output = $('[data-v5-filter-output]', group.parentElement);
      if (output) output.textContent = `${visible}개 항목`;
      track('site100_depth_filter', { filter: value, visible });
    });
  });
}

function setupArticle() {
  const article = $('[data-v5-article]');
  if (!article || !model) return;
  const articleSlug = pageContext.itemSlug;
  const sections = $$('section[id]', article);
  const links = $$('.v5-article-toc a');
  const progress = document.createElement('div');
  progress.className = 'v5-reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  progress.innerHTML = '<i></i>';
  document.body.appendChild(progress);

  const update = () => {
    const rect = article.getBoundingClientRect();
    const total = Math.max(1, article.offsetHeight - innerHeight * 0.45);
    const value = Math.min(1, Math.max(0, -rect.top / total));
    $('i', progress).style.width = `${value * 100}%`;
  };
  addEventListener('scroll', update, { passive: true });
  update();

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      const active = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!active) return;
      links.forEach((link) => link.classList.toggle('is-active', link.hash === `#${active.target.id}`));
    }, { rootMargin: '-22% 0px -60%', threshold: [0.08, 0.35] });
    sections.forEach((section) => observer.observe(section));
  }

  const bookmark = $('[data-v5-bookmark]');
  if (bookmark) {
    const bookmarks = new Set(readJSON(BOOKMARK_KEY, []));
    const refresh = () => {
      const saved = bookmarks.has(articleSlug);
      bookmark.setAttribute('aria-pressed', String(saved));
      bookmark.textContent = saved ? '저장됨' : '글 저장';
    };
    refresh();
    bookmark.addEventListener('click', () => {
      if (bookmarks.has(articleSlug)) bookmarks.delete(articleSlug);
      else bookmarks.add(articleSlug);
      writeJSON(BOOKMARK_KEY, [...bookmarks]);
      refresh();
      announce(bookmarks.has(articleSlug) ? '글을 저장했습니다.' : '저장을 해제했습니다.');
    });
  }
}

function wizardSummary(form) {
  const data = new FormData(form);
  const selected = [...selectedPlan()].map(serviceBySlug).filter(Boolean).map((service) => service.title);
  return `${model.site.name} 프로젝트 문의서\n\n관심 서비스\n${selected.length ? selected.map((item) => `- ${item}`).join('\n') : '- 아직 선택하지 않음'}\n\n문의 목적\n${data.get('goal') || '-'}\n\n현재 상황\n${data.get('context') || '-'}\n\n원하는 일정\n${data.get('timeline') || '-'}\n\n예산 범위\n${data.get('budget') || '-'}\n\n담당자\n${data.get('name') || '-'}\n${data.get('email') || '-'}\n\n추가 내용\n${data.get('message') || '-'}\n\n이 문서는 브라우저에서 생성된 문의 초안이며 실제 전송되지 않았습니다.`;
}

function setupWizard() {
  const form = $('[data-v5-wizard]');
  if (!form || !model) return;
  const queryPlan = new URLSearchParams(location.search).get('plan');
  if (queryPlan) {
    const valid = queryPlan.split(',').filter((item) => serviceBySlug(item));
    if (valid.length) setSelectedPlan(new Set(valid));
  }
  const fields = $$('input,textarea,select', form);
  const savedDraft = readJSON(DRAFT_KEY, {});
  fields.forEach((field) => {
    if (savedDraft[field.name] != null && field.type !== 'checkbox' && field.type !== 'radio') field.value = savedDraft[field.name];
    field.addEventListener('input', () => {
      const draft = Object.fromEntries([...new FormData(form).entries()]);
      writeJSON(DRAFT_KEY, draft);
      $('[data-v5-draft-status]', form).textContent = '이 브라우저에 임시 저장됨';
    });
  });

  const steps = $$('fieldset[data-v5-step]', form);
  let current = 0;
  const show = (next) => {
    current = Math.max(0, Math.min(steps.length - 1, next));
    steps.forEach((step, index) => { step.hidden = index !== current; });
    $$('[data-v5-step-dot]', form).forEach((dot, index) => {
      dot.classList.toggle('is-current', index === current);
      dot.classList.toggle('is-done', index < current);
      dot.setAttribute('aria-current', index === current ? 'step' : 'false');
    });
    $('[data-v5-step-label]', form).textContent = `${current + 1} / ${steps.length}`;
    steps[current].querySelector('input,textarea,select,button')?.focus();
  };

  form.addEventListener('click', (event) => {
    const next = event.target.closest('[data-v5-next]');
    const back = event.target.closest('[data-v5-back]');
    if (next) {
      const required = $$('[required]', steps[current]);
      const invalid = required.find((field) => !field.checkValidity());
      if (invalid) {
        invalid.reportValidity();
        return;
      }
      show(current + 1);
    }
    if (back) show(current - 1);
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const summary = wizardSummary(form);
    const result = $('[data-v5-wizard-result]', form);
    result.hidden = false;
    $('pre', result).textContent = summary;
    result.scrollIntoView({ block: 'center', behavior: 'smooth' });
    track('site100_depth_contact_complete', { selected_services: selectedPlan().size });
  });

  $('[data-v5-copy-summary]', form)?.addEventListener('click', async () => {
    await copyText(wizardSummary(form));
    announce('문의 초안을 복사했습니다.');
  });
  $('[data-v5-download-summary]', form)?.addEventListener('click', () => {
    downloadText(`${model.site.slug}-project-inquiry.txt`, wizardSummary(form));
  });
  $('[data-v5-clear-draft]', form)?.addEventListener('click', () => {
    localStorage.removeItem(DRAFT_KEY);
    form.reset();
    $('[data-v5-draft-status]', form).textContent = '임시 저장 내용 없음';
    announce('문의 초안을 초기화했습니다.');
  });
  show(0);
}

function setupSectionRail() {
  const main = $('.v5-page-main');
  if (!main) return;
  const sections = $$(':scope > section[id]', main);
  if (sections.length < 2 || $('.v5-local-rail')) return;
  const rail = document.createElement('nav');
  rail.className = 'v5-local-rail';
  rail.setAttribute('aria-label', '현재 페이지 목차');
  rail.innerHTML = sections.map((section, index) => `<a href="#${section.id}"><span>${String(index + 1).padStart(2, '0')}</span><b>${escapeHtml(section.dataset.v5Label || $('h2,h3', section)?.textContent || `섹션 ${index + 1}`)}</b></a>`).join('');
  main.insertAdjacentElement('beforebegin', rail);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      const active = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!active) return;
      $$('a', rail).forEach((link) => link.classList.toggle('is-active', link.hash === `#${active.target.id}`));
    }, { rootMargin: '-20% 0px -68%', threshold: [0.08, 0.3] });
    sections.forEach((section) => observer.observe(section));
  }
}

function setupRecentDepth() {
  if (!model) return;
  const key = 'site100:v5:recent-pages';
  const current = {
    site: model.site.slug,
    type: pageContext.type,
    title: document.title,
    path: location.pathname,
    visitedAt: Date.now()
  };
  const existing = readJSON(key, []).filter((item) => item.path !== current.path);
  existing.unshift(current);
  writeJSON(key, existing.slice(0, 24));
}

function boot() {
  if (!model) return;
  const world = $('.world');
  if (!world) {
    setTimeout(boot, 20);
    return;
  }
  document.documentElement.dataset.depthVersion = '5.0.0';
  world.dataset.v5Page = pageContext.type || 'home';
  setupNavigation();
  enhanceHome();
  setupPlanner();
  setupFilters();
  setupArticle();
  setupWizard();
  setupSectionRail();
  setupRecentDepth();
  track('site100_depth_page_view', { depth: pageContext.depth || 1, item_slug: pageContext.itemSlug || '' });
}

const run = () => requestAnimationFrame(() => requestAnimationFrame(boot));
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
else run();
