import { SITES } from './catalog.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const pad = (value) => String(value).padStart(3, '0');
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);

const DIRECTIONS = [
  'atelier',
  'precision',
  'interface',
  'notebook',
  'organic',
  'studio',
  'atlas',
  'catalog',
  'civic',
  'experimental'
];

const directionFor = (site) => DIRECTIONS[Math.min(9, Math.floor((site.id - 1) / 10))];
const currentSlug = () => window.SITE100_SLUG || location.pathname.split('/').filter(Boolean).pop();
const siteBySlug = (slug) => SITES.find((site) => site.slug === slug);

function addSplitTitle(element) {
  if (!element || element.dataset.v3Split === 'true') return;
  const words = element.textContent.trim().split(/\s+/);
  element.innerHTML = words.map((word, index) => `<span style="--word-index:${index}">${escapeHtml(word)}</span>`).join(' ');
  element.dataset.v3Split = 'true';
}

function decorateGallery() {
  const gallery = $('.gallery');
  if (!gallery) return;
  document.documentElement.dataset.visualVersion = '3';
  gallery.classList.add('v3-gallery');

  const aura = document.createElement('div');
  aura.className = 'v3-gallery-aura';
  aura.setAttribute('aria-hidden', 'true');
  gallery.prepend(aura);

  const cards = $$('.gcard-shell');
  cards.forEach((shell, index) => {
    const slug = shell.dataset.slug;
    const site = siteBySlug(slug);
    if (!site) return;
    const direction = directionFor(site);
    shell.dataset.v3Direction = direction;
    shell.style.setProperty('--v3-card-accent', site.design.palette.accent);
    shell.style.setProperty('--v3-card-accent-2', site.design.palette.accent2);
    shell.style.setProperty('--v3-card-delay', `${Math.min(index, 18) * 28}ms`);
    shell.classList.add('v3-reveal');

    const card = $('.gcard', shell);
    const preview = $('.preview', shell);
    if (preview && !$('.v3-card-art', preview)) {
      preview.insertAdjacentHTML('beforeend', `<img class="v3-card-art" src="/Site100/artworks/${site.slug}.svg" alt="" loading="lazy" decoding="async"><span class="v3-card-direction">${escapeHtml(direction)}</span>`);
    }
    if (card && !$('.v3-card-meta', card)) {
      card.insertAdjacentHTML('beforeend', `<div class="v3-card-meta"><span>${escapeHtml(site.design.type)}</span><span>${escapeHtml(site.design.medium)}</span><span>${escapeHtml(site.design.mood)}</span></div>`);
    }

    shell.addEventListener('pointermove', (event) => {
      const rect = shell.getBoundingClientRect();
      shell.style.setProperty('--pointer-x', `${((event.clientX - rect.left) / rect.width) * 100}%`);
      shell.style.setProperty('--pointer-y', `${((event.clientY - rect.top) / rect.height) * 100}%`);
      shell.style.setProperty('--tilt-x', `${((event.clientY - rect.top) / rect.height - 0.5) * -5}deg`);
      shell.style.setProperty('--tilt-y', `${((event.clientX - rect.left) / rect.width - 0.5) * 5}deg`);
    });
    shell.addEventListener('pointerleave', () => {
      shell.style.setProperty('--tilt-x', '0deg');
      shell.style.setProperty('--tilt-y', '0deg');
    });
  });

  const featured = SITES.filter((site) => [1, 13, 24, 37, 51, 67, 74, 83, 91, 100].includes(site.id));
  const runway = document.createElement('section');
  runway.className = 'v3-runway v3-reveal';
  runway.innerHTML = `<div class="v3-runway-heading"><span>CURATED ART DIRECTIONS</span><h2>색이 아니라<br>구조부터 다르게.</h2><p>업종별 소재와 사용자의 다음 행동을 기준으로 선정한 대표 디자인입니다.</p></div><div class="v3-runway-track">${featured.map((site) => `<a href="/Site100/sites/${site.slug}/" style="--runway-accent:${site.design.palette.accent};--runway-bg:${site.design.palette.bg}"><img src="/Site100/artworks/${site.slug}.svg" alt="${escapeHtml(site.name)} 디자인 미리보기" loading="lazy"><span>WORLD ${pad(site.id)} · ${escapeHtml(directionFor(site))}</span><h3>${escapeHtml(site.name)}</h3><p>${escapeHtml(site.kind)} · ${escapeHtml(site.design.layout)} · ${escapeHtml(site.interaction)}</p></a>`).join('')}</div>`;
  const grid = $('.ggrid');
  grid?.insertAdjacentElement('beforebegin', runway);

  gallery.addEventListener('pointermove', (event) => {
    gallery.style.setProperty('--gallery-x', `${event.clientX}px`);
    gallery.style.setProperty('--gallery-y', `${event.clientY}px`);
  });

  setupRevealObserver(gallery);
}

function createMaterialMarquee(site) {
  const marquee = document.createElement('div');
  marquee.className = 'v3-material-marquee';
  marquee.setAttribute('aria-hidden', 'true');
  const items = [...site.materials, ...site.services, site.kind, site.design.layout, site.design.medium];
  marquee.innerHTML = `<div>${[...items, ...items].map((item, index) => `<span><i>${pad(index + 1)}</i>${escapeHtml(item)}</span>`).join('')}</div>`;
  return marquee;
}

function createSectionRail(site, sections) {
  const rail = document.createElement('nav');
  rail.className = 'v3-section-rail';
  rail.setAttribute('aria-label', `${site.name} 섹션 위치`);
  rail.innerHTML = `<span>${pad(site.id)}</span>${sections.map((section, index) => `<a href="#${section.id}" data-target="${section.id}" aria-label="${index + 1}번째 섹션으로 이동"><i></i><b>${String(index + 1).padStart(2, '0')}</b></a>`).join('')}`;
  document.body.appendChild(rail);
  return rail;
}

function createCursor() {
  if (!matchMedia('(pointer:fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  const cursor = document.createElement('div');
  cursor.className = 'v3-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = '<i></i><b>VIEW</b>';
  document.body.appendChild(cursor);
  let targetX = innerWidth / 2;
  let targetY = innerHeight / 2;
  let x = targetX;
  let y = targetY;
  let frame = 0;
  const loop = () => {
    x += (targetX - x) * 0.18;
    y += (targetY - y) * 0.18;
    cursor.style.transform = `translate3d(${x}px,${y}px,0)`;
    frame = requestAnimationFrame(loop);
  };
  addEventListener('pointermove', (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    cursor.classList.add('is-visible');
  }, { passive: true });
  addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));
  document.addEventListener('pointerover', (event) => {
    cursor.classList.toggle('is-active', Boolean(event.target.closest('a,button,input,textarea,select,summary,[data-go]')));
  });
  frame = requestAnimationFrame(loop);
  addEventListener('pagehide', () => cancelAnimationFrame(frame), { once: true });
  return cursor;
}

function decorateSite() {
  const world = $('.world');
  if (!world) return;
  const site = siteBySlug(currentSlug());
  if (!site) return;

  const direction = directionFor(site);
  document.documentElement.dataset.visualVersion = '3';
  world.classList.add('v3-world');
  world.dataset.v3Direction = direction;
  world.dataset.v3Type = site.design.type;
  world.dataset.v3Medium = site.design.medium;
  world.dataset.v3Geometry = site.design.geometry;
  world.dataset.v3Mood = site.design.mood;
  world.dataset.v3Layout = site.design.layout;
  world.dataset.v3Variant = String(site.design.variant || 1);
  world.style.setProperty('--v3-seed', String(site.id));

  const ambient = document.createElement('div');
  ambient.className = 'v3-ambient';
  ambient.setAttribute('aria-hidden', 'true');
  ambient.innerHTML = '<i class="v3-noise"></i><i class="v3-grid"></i><i class="v3-glow g1"></i><i class="v3-glow g2"></i>';
  world.prepend(ambient);

  const hero = $('.hero', world);
  if (hero) {
    hero.classList.add('v3-hero');
    addSplitTitle($('h1', hero));
    const stage = document.createElement('figure');
    stage.className = `v3-hero-stage direction-${direction}`;
    stage.innerHTML = `<div class="v3-stage-frame"><img src="/Site100/artworks/${site.slug}.svg" alt="${escapeHtml(site.name)}의 ${escapeHtml(site.kind)} 아트 디렉션" decoding="async"><i class="v3-stage-glass"></i><span class="v3-stage-index">${pad(site.id)}</span><span class="v3-stage-caption">${escapeHtml(site.design.layout)} / ${escapeHtml(site.design.hero)}</span></div><figcaption><span>${escapeHtml(site.kind)}</span><b>${escapeHtml(site.materials[0])}</b><em>${escapeHtml(site.materials[1])}</em></figcaption>`;
    hero.appendChild(stage);
    hero.insertAdjacentElement('afterend', createMaterialMarquee(site));

    hero.addEventListener('pointermove', (event) => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      hero.style.setProperty('--hero-x', `${x}`);
      hero.style.setProperty('--hero-y', `${y}`);
    }, { passive: true });
    hero.addEventListener('pointerleave', () => {
      hero.style.setProperty('--hero-x', '0');
      hero.style.setProperty('--hero-y', '0');
    });
  }

  const headings = $$('.heading h2', world);
  headings.forEach(addSplitTitle);
  const sections = $$('main > section[id], main > section.section', world).filter((section, index, all) => {
    if (!section.id) section.id = `section-${index + 1}`;
    return all.findIndex((candidate) => candidate.id === section.id) === index;
  });
  sections.forEach((section, index) => {
    section.classList.add('v3-reveal');
    section.style.setProperty('--section-index', String(index));
    section.dataset.v3Section = index % 4 === 0 ? 'lead' : index % 4 === 1 ? 'grid' : index % 4 === 2 ? 'offset' : 'quiet';
  });

  const rail = createSectionRail(site, sections);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      const active = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!active) return;
      $$('a', rail).forEach((link) => link.classList.toggle('is-active', link.dataset.target === active.target.id));
    }, { rootMargin: '-30% 0px -55%', threshold: [0.08, 0.35, 0.65] });
    sections.forEach((section) => observer.observe(section));
  }

  $$('.works figure, .cards article, .journal article, .team article, .pricing article', world).forEach((item, index) => {
    item.classList.add('v3-surface');
    item.style.setProperty('--surface-index', String(index));
    item.addEventListener('pointermove', (event) => {
      const rect = item.getBoundingClientRect();
      item.style.setProperty('--surface-x', `${((event.clientX - rect.left) / rect.width) * 100}%`);
      item.style.setProperty('--surface-y', `${((event.clientY - rect.top) / rect.height) * 100}%`);
    }, { passive: true });
  });

  const footer = $('footer', world);
  if (footer) {
    footer.insertAdjacentHTML('beforebegin', `<div class="v3-footer-statement"><span>WORLD ${pad(site.id)}</span><strong>${escapeHtml(site.name)}</strong><em>${escapeHtml(site.design.fingerprint)}</em></div>`);
  }

  setupRevealObserver(world);
  createCursor();
}

function setupRevealObserver(root) {
  const items = $$('.v3-reveal', root);
  if (!('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8%', threshold: 0.08 });
  items.forEach((item) => observer.observe(item));
}

function boot() {
  const run = () => requestAnimationFrame(() => requestAnimationFrame(() => {
    if ($('.gallery')) decorateGallery();
    if ($('.world')) decorateSite();
  }));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
}

boot();
