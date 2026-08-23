import { SITES, SECTORS } from './catalog.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const pad = (value) => String(value).padStart(3, '0');
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);

const STORAGE = {
  favorites: 'site100:v2:favorites',
  compare: 'site100:v2:compare',
  visited: 'site100:v2:visited',
  recent: 'site100:v2:recent',
  motion: 'site100:v2:motion',
  galleryTheme: 'site100:v2:gallery-theme'
};

const readJSON = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return value ?? fallback;
  } catch {
    return fallback;
  }
};
const writeJSON = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage is optional */ }
};
const getSet = (key) => new Set(readJSON(key, []));
const writeSet = (key, value) => writeJSON(key, [...value]);

function announce(message) {
  let live = $('#site100-live');
  if (!live) {
    live = document.createElement('div');
    live.id = 'site100-live';
    live.className = 'sr-only';
    live.setAttribute('aria-live', 'polite');
    document.body.appendChild(live);
  }
  live.textContent = '';
  requestAnimationFrame(() => { live.textContent = message; });
}

function track(name, detail = {}) {
  const payload = { event: name, ...detail };
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
  try {
    if (typeof window.clarity === 'function') {
      window.clarity('event', name);
      Object.entries(detail).forEach(([key, value]) => window.clarity('set', key, String(value)));
    }
  } catch { /* analytics is optional */ }
}

function siteBySlug(slug) {
  return SITES.find((site) => site.slug === slug);
}

function currentSlug() {
  return window.SITE100_SLUG || location.pathname.split('/').filter(Boolean).pop();
}

function updateQuery(values) {
  const url = new URL(location.href);
  Object.entries(values).forEach(([key, value]) => {
    if (!value || value === 'all') url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  });
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

function openDialog(dialog) {
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
  requestAnimationFrame(() => $('button, input, select, textarea, a', dialog)?.focus());
}

function closeDialog(dialog) {
  if (typeof dialog.close === 'function') dialog.close();
  else dialog.removeAttribute('open');
}

function downloadFile(filename, content, type = 'application/json') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

function renderDesignPreview(site, compact = false) {
  const { design } = site;
  return `<div class="v2-design-preview mini-${escapeHtml(design.layout)}" style="--preview-bg:${design.palette.bg};--preview-surface:${design.palette.surface};--preview-ink:${design.palette.ink};--preview-accent:${design.palette.accent};--preview-accent2:${design.palette.accent2}">
    <img src="/Site100/previews/${escapeHtml(site.slug)}.svg" alt="" loading="lazy" decoding="async">
    ${compact ? '' : `<span>${escapeHtml(design.layout)}</span><b>${escapeHtml(design.hero)}</b>`}
  </div>`;
}

function setupGallery() {
  const gallery = $('.gallery');
  if (!gallery) return;

  document.documentElement.dataset.site100Page = 'gallery';
  const favorites = getSet(STORAGE.favorites);
  const compare = getSet(STORAGE.compare);
  const visited = getSet(STORAGE.visited);
  const recent = readJSON(STORAGE.recent, []).filter((slug) => siteBySlug(slug)).slice(0, 8);
  const params = new URLSearchParams(location.search);

  const index = $('.gindex');
  const tools = $('.gtools');
  const grid = $('.ggrid');
  const originalCards = $$('.gcard', grid);

  const toolbar = document.createElement('div');
  toolbar.className = 'v2-gallery-toolbar';
  toolbar.innerHTML = `
    <div class="v2-toolbar-primary">
      <button type="button" class="v2-primary" data-v2-action="recommend">내 업종에 맞는 디자인 찾기</button>
      <button type="button" data-v2-action="random">무작위 세계</button>
      <button type="button" data-v2-action="favorites" aria-pressed="false">즐겨찾기만</button>
    </div>
    <div class="v2-toolbar-filters">
      <label>레이아웃<select data-v2-filter="layout"><option value="all">전체</option>${[...new Set(SITES.map((site) => site.design.layout))].sort().map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('')}</select></label>
      <label>분위기<select data-v2-filter="mood"><option value="all">전체</option>${[...new Set(SITES.map((site) => site.design.mood))].sort().map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('')}</select></label>
      <label>인터랙션<select data-v2-filter="interaction"><option value="all">전체</option>${[...new Set(SITES.map((site) => site.interaction))].sort().map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('')}</select></label>
      <label>정렬<select data-v2-filter="sort"><option value="id">번호순</option><option value="name">이름순</option><option value="visited">최근 본 순</option><option value="favorites">즐겨찾기 우선</option></select></label>
    </div>
    <div class="v2-toolbar-status"><span data-v2-count>100개 표시</span><span>방문 ${visited.size}/100</span><span>즐겨찾기 ${favorites.size}</span><button type="button" data-v2-action="theme" aria-label="갤러리 명암 전환">명암 전환</button></div>`;
  tools.insertAdjacentElement('afterend', toolbar);

  const recentSection = document.createElement('section');
  recentSection.className = 'v2-recent';
  recentSection.hidden = recent.length === 0;
  recentSection.innerHTML = `<div><span>RECENTLY VISITED</span><h2>최근 본 세계</h2></div><div>${recent.map((slug) => {
    const site = siteBySlug(slug);
    return `<a href="/Site100/sites/${site.slug}/">${renderDesignPreview(site, true)}<span>${pad(site.id)}</span><b>${escapeHtml(site.name)}</b></a>`;
  }).join('')}</div>`;
  index.insertAdjacentElement('beforebegin', recentSection);

  const state = {
    sector: params.get('sector') || 'all',
    query: params.get('q') || '',
    layout: params.get('layout') || 'all',
    mood: params.get('mood') || 'all',
    interaction: params.get('interaction') || 'all',
    sort: params.get('sort') || 'id',
    favoritesOnly: params.get('saved') === '1'
  };

  const search = $('#search');
  search.value = state.query;
  $('[data-v2-filter="layout"]').value = state.layout;
  $('[data-v2-filter="mood"]').value = state.mood;
  $('[data-v2-filter="interaction"]').value = state.interaction;
  $('[data-v2-filter="sort"]').value = state.sort;
  $('[data-v2-action="favorites"]').setAttribute('aria-pressed', String(state.favoritesOnly));

  const cardRecords = originalCards.map((anchor) => {
    const slug = new URL(anchor.href).pathname.split('/').filter(Boolean).pop();
    const site = siteBySlug(slug);
    const shell = document.createElement('article');
    shell.className = 'gcard-shell';
    shell.dataset.id = String(site.id);
    shell.dataset.slug = site.slug;
    shell.dataset.sector = site.sector;
    shell.dataset.layout = site.design.layout;
    shell.dataset.mood = site.design.mood;
    shell.dataset.interaction = site.interaction;
    shell.dataset.search = [site.name, site.kind, site.sector, site.design.layout, site.design.hero, site.design.mood, site.interaction, ...site.materials].join(' ').toLowerCase();
    anchor.parentNode.insertBefore(shell, anchor);
    shell.appendChild(anchor);
    const preview = $('.preview', anchor);
    if (preview) preview.insertAdjacentHTML('afterbegin', `<img src="/Site100/previews/${site.slug}.svg" alt="" loading="lazy" decoding="async">`);
    const actions = document.createElement('div');
    actions.className = 'gcard-actions';
    actions.innerHTML = `<button type="button" data-card-action="favorite" aria-label="${escapeHtml(site.name)} 즐겨찾기" aria-pressed="${favorites.has(site.slug)}">${favorites.has(site.slug) ? '★' : '☆'}</button><button type="button" data-card-action="compare" aria-label="${escapeHtml(site.name)} 비교에 추가" aria-pressed="${compare.has(site.slug)}">비교</button>`;
    shell.appendChild(actions);
    anchor.addEventListener('click', () => track('site100_card_open', { site_id: site.id, site_slug: site.slug, sector: site.sector }));
    return { shell, anchor, site };
  });

  const originalSectorButtons = $$('[data-sector]');
  originalSectorButtons.forEach((button) => {
    const selected = button.dataset.sector === state.sector;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
    button.onclick = () => {
      state.sector = button.dataset.sector;
      originalSectorButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      apply();
    };
  });

  search.oninput = (event) => {
    state.query = event.target.value.trim().toLowerCase();
    apply();
  };

  $$('[data-v2-filter]').forEach((select) => {
    select.onchange = () => {
      state[select.dataset.v2Filter] = select.value;
      apply();
    };
  });

  toolbar.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-v2-action]');
    if (!button) return;
    const action = button.dataset.v2Action;
    if (action === 'random') {
      const visible = cardRecords.filter(({ shell }) => !shell.hidden);
      const target = visible[Math.floor(Math.random() * visible.length)] || cardRecords[Math.floor(Math.random() * cardRecords.length)];
      if (target) location.href = target.anchor.href;
    }
    if (action === 'favorites') {
      state.favoritesOnly = !state.favoritesOnly;
      button.setAttribute('aria-pressed', String(state.favoritesOnly));
      apply();
    }
    if (action === 'recommend') openRecommendationDialog();
    if (action === 'theme') {
      const next = document.documentElement.dataset.galleryTheme === 'light' ? 'dark' : 'light';
      document.documentElement.dataset.galleryTheme = next;
      localStorage.setItem(STORAGE.galleryTheme, next);
      announce(`${next === 'light' ? '밝은' : '어두운'} 갤러리로 전환했습니다.`);
    }
  });

  grid.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-card-action]');
    if (!button) return;
    const shell = button.closest('.gcard-shell');
    const slug = shell.dataset.slug;
    const site = siteBySlug(slug);
    if (button.dataset.cardAction === 'favorite') {
      if (favorites.has(slug)) favorites.delete(slug); else favorites.add(slug);
      writeSet(STORAGE.favorites, favorites);
      button.textContent = favorites.has(slug) ? '★' : '☆';
      button.setAttribute('aria-pressed', String(favorites.has(slug)));
      announce(`${site.name}을 즐겨찾기${favorites.has(slug) ? '에 저장했습니다' : '에서 제거했습니다'}.`);
      track('site100_favorite_toggle', { site_id: site.id, saved: favorites.has(slug) });
      apply();
    }
    if (button.dataset.cardAction === 'compare') {
      if (compare.has(slug)) compare.delete(slug);
      else if (compare.size < 3) compare.add(slug);
      else return announce('비교는 최대 세 개까지 선택할 수 있습니다.');
      writeSet(STORAGE.compare, compare);
      button.setAttribute('aria-pressed', String(compare.has(slug)));
      renderCompareDock();
    }
  });

  function apply() {
    let visibleCount = 0;
    const recentOrder = new Map(readJSON(STORAGE.recent, []).map((slug, index) => [slug, index]));
    cardRecords.forEach(({ shell, site }) => {
      const visible =
        (state.sector === 'all' || site.sector === state.sector) &&
        (state.layout === 'all' || site.design.layout === state.layout) &&
        (state.mood === 'all' || site.design.mood === state.mood) &&
        (state.interaction === 'all' || site.interaction === state.interaction) &&
        (!state.favoritesOnly || favorites.has(site.slug)) &&
        (!state.query || shell.dataset.search.includes(state.query));
      shell.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    const sortable = [...cardRecords].sort((a, b) => {
      if (state.sort === 'name') return a.site.name.localeCompare(b.site.name, 'ko');
      if (state.sort === 'visited') return (recentOrder.get(a.site.slug) ?? 999) - (recentOrder.get(b.site.slug) ?? 999);
      if (state.sort === 'favorites') return Number(favorites.has(b.site.slug)) - Number(favorites.has(a.site.slug)) || a.site.id - b.site.id;
      return a.site.id - b.site.id;
    });
    sortable.forEach(({ shell }) => grid.appendChild(shell));
    $('[data-v2-count]').textContent = `${visibleCount}개 표시`;
    $('.empty').hidden = visibleCount > 0;
    updateQuery({
      sector: state.sector,
      q: state.query,
      layout: state.layout,
      mood: state.mood,
      interaction: state.interaction,
      sort: state.sort,
      saved: state.favoritesOnly ? '1' : ''
    });
  }

  function renderCompareDock() {
    let dock = $('.v2-compare-dock');
    if (!dock) {
      dock = document.createElement('aside');
      dock.className = 'v2-compare-dock';
      document.body.appendChild(dock);
    }
    const selected = [...compare].map(siteBySlug).filter(Boolean);
    dock.hidden = selected.length === 0;
    dock.innerHTML = `<div><b>디자인 비교 ${selected.length}/3</b><span>${selected.map((site) => site.name).join(' · ')}</span></div><button type="button" data-compare-open ${selected.length < 2 ? 'disabled' : ''}>비교 열기</button><button type="button" data-compare-clear>비우기</button>`;
    $('[data-compare-clear]', dock)?.addEventListener('click', () => {
      compare.clear();
      writeSet(STORAGE.compare, compare);
      cardRecords.forEach(({ shell }) => $('[data-card-action="compare"]', shell)?.setAttribute('aria-pressed', 'false'));
      renderCompareDock();
    });
    $('[data-compare-open]', dock)?.addEventListener('click', () => openCompareDialog(selected));
  }

  function openCompareDialog(selected) {
    const dialog = document.createElement('dialog');
    dialog.className = 'v2-dialog v2-compare-dialog';
    dialog.innerHTML = `<form method="dialog" class="v2-dialog-head"><div><span>DESIGN COMPARISON</span><h2>선택한 세계 비교</h2></div><button aria-label="닫기">×</button></form><div class="v2-compare-grid">${selected.map((site) => `<article>${renderDesignPreview(site)}<span>WORLD ${pad(site.id)}</span><h3>${escapeHtml(site.name)}</h3><dl><div><dt>업종</dt><dd>${escapeHtml(site.kind)}</dd></div><div><dt>레이아웃</dt><dd>${escapeHtml(site.design.layout)}</dd></div><div><dt>Hero</dt><dd>${escapeHtml(site.design.hero)}</dd></div><div><dt>타입</dt><dd>${escapeHtml(site.design.type)}</dd></div><div><dt>분위기</dt><dd>${escapeHtml(site.design.mood)}</dd></div><div><dt>인터랙션</dt><dd>${escapeHtml(site.interaction)}</dd></div></dl><a href="/Site100/sites/${site.slug}/">세계 열기 →</a></article>`).join('')}</div>`;
    document.body.appendChild(dialog);
    dialog.addEventListener('close', () => dialog.remove());
    openDialog(dialog);
    track('site100_compare_open', { count: selected.length, slugs: selected.map((site) => site.slug).join(',') });
  }

  function openRecommendationDialog() {
    const dialog = document.createElement('dialog');
    dialog.className = 'v2-dialog v2-recommend-dialog';
    const moods = [...new Set(SITES.map((site) => site.design.mood))].sort();
    const goals = [...new Set(SITES.map((site) => site.interaction))].sort();
    dialog.innerHTML = `<form class="v2-recommend-form"><div class="v2-dialog-head"><div><span>DESIGN MATCH</span><h2>내 목적에 맞는 세 세계</h2></div><button type="button" data-close aria-label="닫기">×</button></div><label>업종 분야<select name="sector"><option value="all">분야 무관</option>${SECTORS.map((value) => `<option>${escapeHtml(value)}</option>`).join('')}</select></label><label>원하는 분위기<select name="mood"><option value="all">분위기 무관</option>${moods.map((value) => `<option>${escapeHtml(value)}</option>`).join('')}</select></label><label>핵심 전환 행동<select name="interaction"><option value="all">행동 무관</option>${goals.map((value) => `<option>${escapeHtml(value)}</option>`).join('')}</select></label><button class="v2-primary">추천 보기</button><div class="v2-recommend-results" aria-live="polite"></div></form>`;
    document.body.appendChild(dialog);
    $('[data-close]', dialog).onclick = () => closeDialog(dialog);
    $('.v2-recommend-form', dialog).onsubmit = (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const sector = data.get('sector');
      const mood = data.get('mood');
      const interaction = data.get('interaction');
      const ranked = SITES.map((site) => ({
        site,
        score: (sector === 'all' || site.sector === sector ? 4 : 0) +
          (mood === 'all' || site.design.mood === mood ? 3 : 0) +
          (interaction === 'all' || site.interaction === interaction ? 4 : 0) +
          ((site.id * 17 + String(sector).length * 7) % 13) / 20
      })).sort((a, b) => b.score - a.score).slice(0, 3);
      $('.v2-recommend-results', dialog).innerHTML = ranked.map(({ site }, index) => `<a href="/Site100/sites/${site.slug}/"><span>0${index + 1}</span>${renderDesignPreview(site, true)}<div><b>${escapeHtml(site.name)}</b><small>${escapeHtml(site.kind)} · ${escapeHtml(site.design.mood)} · ${escapeHtml(site.interaction)}</small></div></a>`).join('');
      track('site100_recommend_result', { sector, mood, interaction });
    };
    dialog.addEventListener('close', () => dialog.remove());
    openDialog(dialog);
  }

  document.documentElement.dataset.galleryTheme = localStorage.getItem(STORAGE.galleryTheme) || 'dark';
  renderCompareDock();
  apply();

  document.addEventListener('keydown', (event) => {
    if (event.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) {
      event.preventDefault();
      search.focus();
    }
    if (event.key.toLowerCase() === 'r' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) {
      const visible = cardRecords.filter(({ shell }) => !shell.hidden);
      const target = visible[Math.floor(Math.random() * visible.length)];
      if (target) location.href = target.anchor.href;
    }
  });

  track('site100_gallery_view', { site_count: SITES.length });
}

function setupSite() {
  const world = $('.world');
  if (!world) return;
  const site = siteBySlug(currentSlug());
  if (!site) return;

  document.documentElement.dataset.site100Page = 'site';
  const favorites = getSet(STORAGE.favorites);
  const visited = getSet(STORAGE.visited);
  visited.add(site.slug);
  writeSet(STORAGE.visited, visited);
  const recent = readJSON(STORAGE.recent, []).filter((slug) => slug !== site.slug && siteBySlug(slug));
  recent.unshift(site.slug);
  writeJSON(STORAGE.recent, recent.slice(0, 12));

  const skip = document.createElement('a');
  skip.className = 'skip-link';
  skip.href = '#site100-main';
  skip.textContent = '본문 바로가기';
  document.body.insertAdjacentElement('afterbegin', skip);
  const main = $('main', world);
  if (main) main.id = 'site100-main';

  const progress = document.createElement('div');
  progress.className = 'v2-scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  progress.innerHTML = '<i></i>';
  document.body.appendChild(progress);

  const nav = $('.nav', world);
  if (nav) {
    nav.setAttribute('aria-label', `${site.name} 주요 메뉴`);
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'v2-nav-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', '메뉴 열기');
    toggle.innerHTML = '<span></span><span></span>';
    nav.appendChild(toggle);
    toggle.onclick = () => {
      const open = world.classList.toggle('v2-nav-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    };
    $$('nav a', nav).forEach((link) => link.addEventListener('click', () => world.classList.remove('v2-nav-open')));
  }

  const dock = document.createElement('aside');
  dock.className = 'v2-world-dock';
  dock.setAttribute('aria-label', '템플릿 도구');
  dock.innerHTML = `<button type="button" data-world-action="favorite" aria-pressed="${favorites.has(site.slug)}" title="즐겨찾기">${favorites.has(site.slug) ? '★' : '☆'}</button><button type="button" data-world-action="share" title="공유">↗</button><button type="button" data-world-action="customize" title="맞춤 설정">조정</button><button type="button" data-world-action="motion" aria-pressed="${localStorage.getItem(STORAGE.motion) === 'reduce'}" title="모션 줄이기">모션</button><div role="group" aria-label="미리보기 폭"><button type="button" data-device="desktop" aria-pressed="true">D</button><button type="button" data-device="tablet" aria-pressed="false">T</button><button type="button" data-device="mobile" aria-pressed="false">M</button></div>`;
  document.body.appendChild(dock);

  const index = SITES.findIndex((entry) => entry.slug === site.slug);
  const previous = SITES[(index - 1 + SITES.length) % SITES.length];
  const next = SITES[(index + 1) % SITES.length];
  const related = SITES.filter((entry) => entry.slug !== site.slug)
    .map((entry) => ({ entry, score: (entry.sector === site.sector ? 4 : 0) + (entry.design.mood === site.design.mood ? 2 : 0) + (entry.interaction === site.interaction ? 2 : 0) - Math.abs(entry.id - site.id) / 100 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ entry }) => entry);

  const explorer = document.createElement('section');
  explorer.className = 'v2-world-explorer';
  explorer.innerHTML = `<div class="v2-design-fingerprint"><span>DESIGN FINGERPRINT</span><h2>${escapeHtml(site.design.layout)} × ${escapeHtml(site.design.hero)}</h2><dl><div><dt>Navigation</dt><dd>${escapeHtml(site.design.nav)}</dd></div><div><dt>Typography</dt><dd>${escapeHtml(site.design.type)}</dd></div><div><dt>Geometry</dt><dd>${escapeHtml(site.design.geometry)}</dd></div><div><dt>Medium</dt><dd>${escapeHtml(site.design.medium)}</dd></div><div><dt>Mood</dt><dd>${escapeHtml(site.design.mood)}</dd></div><div><dt>Interaction</dt><dd>${escapeHtml(site.interaction)}</dd></div></dl></div><div class="v2-related"><span>RELATED WORLDS</span><div>${related.map((entry) => `<a href="/Site100/sites/${entry.slug}/">${renderDesignPreview(entry, true)}<span>${pad(entry.id)}</span><b>${escapeHtml(entry.name)}</b></a>`).join('')}</div></div><nav class="v2-world-pagination"><a href="/Site100/sites/${previous.slug}/"><span>← PREVIOUS</span><b>${escapeHtml(previous.name)}</b></a><a href="/Site100/">100개 세계 보기</a><a href="/Site100/sites/${next.slug}/"><span>NEXT →</span><b>${escapeHtml(next.name)}</b></a></nav>`;
  const footer = $('footer', world);
  footer?.insertAdjacentElement('beforebegin', explorer);

  const customizer = createCustomizer(site, world);
  document.body.appendChild(customizer);

  dock.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const action = button.dataset.worldAction;
    if (action === 'favorite') {
      if (favorites.has(site.slug)) favorites.delete(site.slug); else favorites.add(site.slug);
      writeSet(STORAGE.favorites, favorites);
      button.textContent = favorites.has(site.slug) ? '★' : '☆';
      button.setAttribute('aria-pressed', String(favorites.has(site.slug)));
      announce(`${site.name}을 즐겨찾기${favorites.has(site.slug) ? '에 저장했습니다' : '에서 제거했습니다'}.`);
      track('site100_favorite_toggle', { site_id: site.id, saved: favorites.has(site.slug) });
    }
    if (action === 'share') {
      const shareData = { title: `${site.name} | 100WORLDS`, text: site.tagline, url: location.href };
      try {
        if (navigator.share) await navigator.share(shareData);
        else { await copyText(location.href); announce('주소를 복사했습니다.'); }
        track('site100_share', { site_id: site.id });
      } catch { /* user canceled */ }
    }
    if (action === 'customize') openDialog(customizer);
    if (action === 'motion') {
      const reduce = document.documentElement.dataset.motion !== 'reduce';
      document.documentElement.dataset.motion = reduce ? 'reduce' : 'full';
      localStorage.setItem(STORAGE.motion, reduce ? 'reduce' : 'full');
      button.setAttribute('aria-pressed', String(reduce));
      announce(reduce ? '모션을 줄였습니다.' : '모션을 다시 켰습니다.');
    }
    if (button.dataset.device) {
      const device = button.dataset.device;
      document.body.dataset.previewDevice = device;
      $$('[data-device]', dock).forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      announce(`${device} 미리보기로 전환했습니다.`);
      track('site100_device_preview', { site_id: site.id, device });
    }
  });

  const sections = $$('main section[id]', world);
  const navLinks = $$('header.nav a[href^="#"]', world);
  if ('IntersectionObserver' in window && sections.length) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      navLinks.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${visible.target.id}`));
    }, { rootMargin: '-25% 0px -60%', threshold: [0.05, 0.25, 0.55] });
    sections.forEach((section) => observer.observe(section));
  }

  addFormEnhancement(site);
  addDragEnhancement();

  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const percent = max > 0 ? Math.min(100, Math.max(0, scrollY / max * 100)) : 0;
    $('.v2-scroll-progress i').style.width = `${percent}%`;
  };
  addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  document.documentElement.dataset.motion = localStorage.getItem(STORAGE.motion) || 'full';
  track('site100_world_view', { site_id: site.id, site_slug: site.slug, sector: site.sector, layout: site.design.layout, interaction: site.interaction });
}

function createCustomizer(site, world) {
  const dialog = document.createElement('dialog');
  dialog.className = 'v2-dialog v2-customizer';
  const key = `site100:v2:custom:${site.slug}`;
  const saved = readJSON(key, {});
  dialog.innerHTML = `<form class="v2-customizer-form"><div class="v2-dialog-head"><div><span>TEMPLATE LAB</span><h2>${escapeHtml(site.name)} 맞춤 설정</h2></div><button type="button" data-close aria-label="닫기">×</button></div><label>브랜드명<input name="brand" value="${escapeHtml(saved.brand || site.name)}" maxlength="42"></label><label>강조색<input name="accent" type="color" value="${escapeHtml(saved.accent || hslToHex(site.design.palette.accent))}"></label><label>보조 강조색<input name="accent2" type="color" value="${escapeHtml(saved.accent2 || hslToHex(site.design.palette.accent2))}"></label><label>정보 밀도<select name="density"><option value="original">원본</option><option value="airy">여유롭게</option><option value="compact">촘촘하게</option></select></label><label class="v2-check"><input name="highContrast" type="checkbox" ${saved.highContrast ? 'checked' : ''}>고대비 미리보기</label><div class="v2-customizer-actions"><button class="v2-primary" type="submit">미리보기 적용</button><button type="button" data-custom-action="copy">기획서 복사</button><button type="button" data-custom-action="download">설정 JSON</button><button type="button" data-custom-action="reset">초기화</button></div><output>현재 브라우저에만 저장됩니다.</output></form>`;
  $('[data-close]', dialog).onclick = () => closeDialog(dialog);
  const form = $('.v2-customizer-form', dialog);
  form.elements.density.value = saved.density || 'original';

  const apply = (values) => {
    const brand = values.brand || site.name;
    $('.brand strong', world).textContent = brand;
    $('.hero h1', world).textContent = brand;
    world.style.setProperty('--accent', values.accent || site.design.palette.accent);
    world.style.setProperty('--accent2', values.accent2 || site.design.palette.accent2);
    world.dataset.customDensity = values.density || 'original';
    world.classList.toggle('v2-high-contrast', Boolean(values.highContrast));
  };
  if (Object.keys(saved).length) apply(saved);

  form.onsubmit = (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const values = {
      brand: String(data.get('brand') || '').trim() || site.name,
      accent: String(data.get('accent') || ''),
      accent2: String(data.get('accent2') || ''),
      density: String(data.get('density') || 'original'),
      highContrast: data.get('highContrast') === 'on'
    };
    writeJSON(key, values);
    apply(values);
    $('output', dialog).textContent = '맞춤 미리보기를 적용했습니다.';
    track('site100_customize_apply', { site_id: site.id, density: values.density, high_contrast: values.highContrast });
  };

  dialog.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-custom-action]');
    if (!button) return;
    const action = button.dataset.customAction;
    const values = readJSON(key, {
      brand: site.name,
      accent: hslToHex(site.design.palette.accent),
      accent2: hslToHex(site.design.palette.accent2),
      density: 'original',
      highContrast: false
    });
    const brief = `${values.brand} 홈페이지 기획\n업종: ${site.kind}\n분야: ${site.sector}\n핵심 문구: ${site.tagline}\nCTA: ${site.cta}\n레이아웃: ${site.design.layout}\nHero: ${site.design.hero}\n내비게이션: ${site.design.nav}\n분위기: ${site.design.mood}\n인터랙션: ${site.interaction}\n핵심 소재: ${site.materials.join(', ')}\n서비스: ${site.services.join(', ')}`;
    if (action === 'copy') {
      await copyText(brief);
      $('output', dialog).textContent = '기획서를 복사했습니다.';
    }
    if (action === 'download') downloadFile(`${site.slug}-design.json`, JSON.stringify({ siteId: site.id, slug: site.slug, ...values, design: site.design, materials: site.materials, services: site.services }, null, 2));
    if (action === 'reset') {
      localStorage.removeItem(key);
      location.reload();
    }
  });
  dialog.addEventListener('close', () => announce('맞춤 설정 창을 닫았습니다.'));
  return dialog;
}

function hslToHex(value) {
  const match = String(value).match(/hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/i);
  if (!match) return '#e95b3f';
  const h = Number(match[1]) / 360;
  const s = Number(match[2]) / 100;
  const l = Number(match[3]) / 100;
  const hue = (p, q, t) => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  let r; let g; let b;
  if (s === 0) r = g = b = l;
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue(p, q, h + 1 / 3);
    g = hue(p, q, h);
    b = hue(p, q, h - 1 / 3);
  }
  return `#${[r, g, b].map((channel) => Math.round(channel * 255).toString(16).padStart(2, '0')).join('')}`;
}

function addFormEnhancement(site) {
  $$('form').forEach((form) => {
    if (form.closest('dialog')) return;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const values = [...new FormData(form).entries()].map(([key, value]) => `${key}: ${value}`).join('\n');
      const summary = `${site.name} 문의 초안\n${values || '입력 항목 확인 완료'}\n\n이 문서는 데모이며 실제 전송되지 않았습니다.`;
      let actions = $('.v2-form-actions', form);
      if (!actions) {
        actions = document.createElement('div');
        actions.className = 'v2-form-actions';
        actions.innerHTML = '<button type="button" data-form-copy>초안 복사</button><button type="button" data-form-download>TXT 저장</button>';
        form.appendChild(actions);
      }
      $('[data-form-copy]', actions).onclick = async () => { await copyText(summary); announce('문의 초안을 복사했습니다.'); };
      $('[data-form-download]', actions).onclick = () => downloadFile(`${site.slug}-inquiry.txt`, summary, 'text/plain;charset=utf-8');
      const output = $('output', form);
      if (output) output.textContent = '문의 초안이 준비됐습니다. 복사하거나 TXT로 저장하세요.';
      track('site100_form_complete', { site_id: site.id });
    }, { capture: true });
  });
}

function addDragEnhancement() {
  $$('.demo.drag button[draggable="true"]').forEach((button) => {
    button.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('text/plain', button.textContent);
      button.classList.add('is-dragging');
    });
    button.addEventListener('dragend', () => button.classList.remove('is-dragging'));
  });
  $$('.demo.drag > div').forEach((container) => {
    container.addEventListener('dragover', (event) => event.preventDefault());
    container.addEventListener('drop', (event) => {
      event.preventDefault();
      const dragging = $('.is-dragging', container);
      if (dragging) container.appendChild(dragging);
    });
  });
}

function boot() {
  const run = () => requestAnimationFrame(() => {
    if ($('.gallery')) setupGallery();
    else if ($('.world')) setupSite();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
}

boot();
