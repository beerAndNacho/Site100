const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const BREAKPOINTS = [
  ['compact', 479],
  ['mobile', 767],
  ['tablet', 1023],
  ['desktop', 1439],
  ['wide', Number.POSITIVE_INFINITY]
];

const ROOT = document.documentElement;
const BODY = document.body;
let resizeFrame = 0;
let overflowFrame = 0;

function breakpointFor(width) {
  return BREAKPOINTS.find(([, maximum]) => width <= maximum)?.[0] || 'wide';
}

function viewportMetrics() {
  const viewport = window.visualViewport;
  const width = Math.round(viewport?.width || window.innerWidth || ROOT.clientWidth);
  const height = Math.round(viewport?.height || window.innerHeight || ROOT.clientHeight);
  const layoutHeight = Math.round(window.innerHeight || ROOT.clientHeight);
  const keyboardOpen = width <= 1024 && layoutHeight - height > Math.max(130, layoutHeight * 0.18);

  ROOT.style.setProperty('--v4-viewport-width', `${width}px`);
  ROOT.style.setProperty('--v4-viewport-height', `${height}px`);
  ROOT.style.setProperty('--v4-vw', `${width * 0.01}px`);
  ROOT.style.setProperty('--v4-vh', `${height * 0.01}px`);
  ROOT.style.setProperty('--v4-layout-height', `${layoutHeight}px`);
  ROOT.dataset.v4Breakpoint = breakpointFor(width);
  ROOT.dataset.v4Orientation = width > height ? 'landscape' : 'portrait';
  ROOT.dataset.v4Pointer = matchMedia('(pointer: coarse)').matches ? 'coarse' : 'fine';
  ROOT.dataset.v4Hover = matchMedia('(hover: hover)').matches ? 'true' : 'false';
  ROOT.dataset.v4KeyboardOpen = String(keyboardOpen);
  ROOT.dataset.responsiveVersion = '4.0.0';

  const nav = $('.world > .nav, .gallery > header');
  if (nav) ROOT.style.setProperty('--v4-header-height', `${Math.ceil(nav.getBoundingClientRect().height)}px`);
  return { width, height, keyboardOpen };
}

function scheduleViewportUpdate() {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => {
    viewportMetrics();
    scheduleOverflowScan();
  });
}

function markScrollRegions() {
  const regions = [
    '.materials > div',
    '.timeline > div:last-child',
    '.gtools nav',
    '.v3-runway-track',
    '.v2-toolbar-primary',
    '.filter nav',
    '.scheduledemo nav',
    '.switcher nav',
    '.configure nav',
    '.carousel nav',
    '.button-row',
    '.v2-compare-grid',
    '.v2-recommend-results'
  ];

  $$(regions.join(',')).forEach((element, index) => {
    element.classList.add('v4-scroll-region');
    if (!element.hasAttribute('tabindex')) element.tabIndex = 0;
    if (!element.hasAttribute('role')) element.setAttribute('role', 'region');
    if (!element.hasAttribute('aria-label')) element.setAttribute('aria-label', `가로 탐색 영역 ${index + 1}`);
  });

  $$('pre, table').forEach((element) => {
    element.classList.add('v4-content-scroll');
    if (!element.hasAttribute('tabindex')) element.tabIndex = 0;
  });
}

function markAdaptiveComponents() {
  const selectors = [
    '.section',
    '.hero',
    '.demo',
    '.v2-world-explorer',
    '.v2-gallery-toolbar',
    '.v3-runway-track',
    '.gindex',
    '.v2-dialog'
  ];
  const components = $$(selectors.join(','));
  if (!('ResizeObserver' in window)) return;

  const observer = new ResizeObserver((entries) => {
    entries.forEach((entry) => {
      const width = entry.contentRect.width;
      entry.target.dataset.v4Container = width < 420 ? 'compact' : width < 720 ? 'narrow' : width < 1040 ? 'medium' : 'wide';
    });
  });
  components.forEach((component) => observer.observe(component));
}

function setNavigationOpen(world, toggle, open) {
  world.classList.toggle('v2-nav-open', open);
  BODY.classList.toggle('v4-scroll-locked', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');

  const navPanel = $('.nav > nav', world);
  if (navPanel) {
    navPanel.dataset.v4Open = String(open);
    if ('inert' in navPanel) navPanel.inert = !open && matchMedia('(max-width: 980px)').matches;
  }
}

function setupMobileNavigation() {
  const world = $('.world');
  const toggle = $('.v2-nav-toggle', world);
  if (!world || !toggle || toggle.dataset.v4Bound === 'true') return;
  toggle.dataset.v4Bound = 'true';
  const navPanel = $('.nav > nav', world);
  if (navPanel) navPanel.dataset.v4Open = 'false';

  toggle.addEventListener('click', () => {
    queueMicrotask(() => setNavigationOpen(world, toggle, world.classList.contains('v2-nav-open')));
  });

  $$('a', navPanel || world).forEach((link) => {
    link.addEventListener('click', () => setNavigationOpen(world, toggle, false));
  });

  document.addEventListener('pointerdown', (event) => {
    if (!world.classList.contains('v2-nav-open')) return;
    if (event.target.closest('.nav')) return;
    setNavigationOpen(world, toggle, false);
  });

  document.addEventListener('keydown', (event) => {
    if (!world.classList.contains('v2-nav-open')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      setNavigationOpen(world, toggle, false);
      toggle.focus();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = $$('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])', $('.nav', world))
      .filter((element) => element.getClientRects().length > 0);
    if (focusable.length < 2) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  matchMedia('(min-width: 981px)').addEventListener('change', (event) => {
    if (event.matches) setNavigationOpen(world, toggle, false);
  });
}

function setupFixedAppUi() {
  const worldDock = $('.v2-world-dock');
  const compareDock = $('.v2-compare-dock');
  const bottomNav = $('.nav-bottom');

  if (worldDock) {
    BODY.classList.add('v4-has-world-dock');
    worldDock.dataset.v4Ui = 'world-dock';
    worldDock.setAttribute('role', 'toolbar');
    worldDock.setAttribute('aria-orientation', 'horizontal');
  }
  if (compareDock) {
    BODY.classList.add('v4-has-compare-dock');
    compareDock.dataset.v4Ui = 'compare-dock';
  }
  if (bottomNav) {
    BODY.classList.add('v4-has-bottom-nav');
    bottomNav.dataset.v4Ui = 'bottom-nav';
  }

  const observer = new MutationObserver(() => {
    const nextCompareDock = $('.v2-compare-dock');
    if (nextCompareDock && !nextCompareDock.dataset.v4Ui) {
      BODY.classList.add('v4-has-compare-dock');
      nextCompareDock.dataset.v4Ui = 'compare-dock';
    }
  });
  observer.observe(BODY, { childList: true, subtree: false });
}

function setupFocusVisibility() {
  document.addEventListener('focusin', (event) => {
    const field = event.target.closest('input,textarea,select,[contenteditable="true"]');
    if (!field || ROOT.dataset.v4KeyboardOpen !== 'true') return;
    setTimeout(() => field.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' }), 80);
  });
}

function setupDialogs() {
  const apply = (dialog) => {
    if (!(dialog instanceof HTMLDialogElement) || dialog.dataset.v4Dialog === 'true') return;
    dialog.dataset.v4Dialog = 'true';
    dialog.classList.add('v4-dialog-fit');
    dialog.addEventListener('close', () => BODY.classList.remove('v4-dialog-open'));
    const observer = new MutationObserver(() => BODY.classList.toggle('v4-dialog-open', dialog.open));
    observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
  };

  $$('dialog').forEach(apply);
  const observer = new MutationObserver((records) => {
    records.forEach((record) => record.addedNodes.forEach((node) => {
      if (node instanceof HTMLDialogElement) apply(node);
      if (node instanceof Element) $$('dialog', node).forEach(apply);
    }));
  });
  observer.observe(BODY, { childList: true, subtree: true });
}

function setupMedia() {
  $$('img,svg,video,canvas').forEach((media) => {
    media.classList.add('v4-fluid-media');
    if (media instanceof HTMLImageElement && !media.closest('.hero,.v3-hero-stage,.gintro')) {
      if (!media.loading) media.loading = 'lazy';
      media.decoding = 'async';
    }
  });
}

function setupInteractiveDemos() {
  $$('.drag > div').forEach((canvas) => {
    canvas.classList.add('v4-drag-canvas');
    canvas.setAttribute('aria-label', '요소 배치 영역');
  });
  $$('.mapdemo > div,.mapboard,.minimap').forEach((map) => map.classList.add('v4-map-surface'));
  $$('.command pre').forEach((pre) => pre.setAttribute('aria-label', '명령 실행 결과'));
}

function overflowCandidates() {
  return $$([
    '.nav',
    '.hero',
    '.section',
    '.demo',
    '.heading',
    '.cards',
    '.works',
    '.numbers',
    '.journal > div',
    '.team > div',
    '.pricing > div',
    '.contact form',
    '.v2-world-explorer',
    '.v3-footer-statement',
    '.gintro',
    '.gindex',
    '.ggrid',
    '.gcard-shell',
    '.v2-gallery-toolbar',
    '.v3-runway',
    '.v2-dialog[open]'
  ].join(','));
}

function scanOverflow() {
  const viewportWidth = Math.round(window.visualViewport?.width || window.innerWidth);
  ROOT.dataset.v4DocumentOverflow = String(Math.max(ROOT.scrollWidth, BODY.scrollWidth) > viewportWidth + 2);

  overflowCandidates().forEach((element) => {
    if (element.getClientRects().length === 0) return;
    const style = getComputedStyle(element);
    const intentionalScroll = ['auto', 'scroll'].includes(style.overflowX) || element.classList.contains('v4-scroll-region');
    const overflow = element.scrollWidth > element.clientWidth + 3 && !intentionalScroll;
    element.dataset.v4Overflow = String(overflow);
  });
}

function scheduleOverflowScan() {
  cancelAnimationFrame(overflowFrame);
  overflowFrame = requestAnimationFrame(() => requestAnimationFrame(scanOverflow));
}

function setupDebugMode() {
  if (new URLSearchParams(location.search).get('responsiveDebug') !== '1') return;
  ROOT.dataset.v4Debug = 'true';
  const badge = document.createElement('output');
  badge.className = 'v4-responsive-debug';
  BODY.appendChild(badge);
  const update = () => {
    badge.textContent = `${ROOT.dataset.v4Breakpoint} · ${ROOT.dataset.v4Orientation} · ${Math.round(window.visualViewport?.width || innerWidth)}×${Math.round(window.visualViewport?.height || innerHeight)} · overflow ${ROOT.dataset.v4DocumentOverflow}`;
  };
  new MutationObserver(update).observe(ROOT, { attributes: true });
  update();
}

function boot() {
  ROOT.dataset.responsiveVersion = '4.0.0';
  if ($('.world')) $('.world').dataset.v4App = 'world';
  if ($('.gallery')) $('.gallery').dataset.v4App = 'gallery';
  viewportMetrics();
  markScrollRegions();
  markAdaptiveComponents();
  setupMobileNavigation();
  setupFixedAppUi();
  setupFocusVisibility();
  setupDialogs();
  setupMedia();
  setupInteractiveDemos();
  setupDebugMode();

  addEventListener('resize', scheduleViewportUpdate, { passive: true });
  addEventListener('orientationchange', scheduleViewportUpdate, { passive: true });
  window.visualViewport?.addEventListener('resize', scheduleViewportUpdate, { passive: true });
  window.visualViewport?.addEventListener('scroll', scheduleViewportUpdate, { passive: true });
  document.fonts?.ready.then(scheduleOverflowScan).catch(scheduleOverflowScan);
  new MutationObserver(scheduleOverflowScan).observe(BODY, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'open', 'hidden'] });
  scheduleOverflowScan();
}

const run = () => requestAnimationFrame(() => requestAnimationFrame(boot));
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
else run();
