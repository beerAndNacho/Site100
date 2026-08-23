(() => {
  'use strict';

  const queryOne = (selector, root = document) => root?.querySelector?.(selector) || null;
  const queryAll = (selector, root = document) => root?.querySelectorAll ? [...root.querySelectorAll(selector)] : [];

  function applyDevicePreview(device) {
    if (!['desktop', 'tablet', 'mobile'].includes(device)) return;
    document.body.dataset.previewDevice = device;
    queryAll('[data-device]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.device === device));
    });
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
      document.documentElement.dispatchEvent(new CustomEvent('site100:preview-device', { detail: { device } }));
    });
  }

  function bindDeviceControls() {
    const controls = queryAll('[data-device]');
    if (!controls.length) return;

    document.addEventListener('click', (event) => {
      const button = event.target.closest?.('[data-device]');
      if (!button) return;
      applyDevicePreview(button.dataset.device);
    }, { capture: true });

    const active = controls.find((button) => button.getAttribute('aria-pressed') === 'true')?.dataset.device || document.body.dataset.previewDevice || 'desktop';
    applyDevicePreview(active);
  }

  function normalizeHiddenPanels(root = document) {
    queryAll('.v2-compare-dock,.v2-recent', root).forEach((panel) => {
      if (panel.hidden) panel.setAttribute('aria-hidden', 'true');
      else panel.removeAttribute('aria-hidden');
    });
  }

  function bindHiddenPanels() {
    normalizeHiddenPanels();
    const observer = new MutationObserver((records) => {
      records.forEach((record) => {
        if (record.type === 'attributes' && record.target instanceof Element) normalizeHiddenPanels(record.target.parentElement || document);
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) normalizeHiddenPanels(node);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
  }

  function setMenuState(toggle, open) {
    const world = toggle?.closest?.('.world') || queryOne('.world');
    if (!world || !toggle) return;
    const panel = queryOne('.nav > nav', world);

    world.classList.toggle('v2-nav-open', open);
    document.body.classList.toggle('v4-scroll-locked', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');

    if (panel) {
      panel.dataset.v4Open = String(open);
      panel.setAttribute('aria-hidden', String(!open && matchMedia('(max-width: 980px)').matches));
      if ('inert' in panel) panel.inert = !open && matchMedia('(max-width: 980px)').matches;
    }
  }

  function bindMobileNavigationController() {
    if (window.__SITE100_MOBILE_NAV_CONTROLLER__) return;
    window.__SITE100_MOBILE_NAV_CONTROLLER__ = true;

    document.addEventListener('click', (event) => {
      const toggle = event.target.closest?.('.v2-nav-toggle');
      if (toggle) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const world = toggle.closest('.world') || queryOne('.world');
        setMenuState(toggle, !world?.classList.contains('v2-nav-open'));
        return;
      }

      const link = event.target.closest?.('.nav > nav a');
      if (link) setMenuState(queryOne('.v2-nav-toggle', link.closest('.world') || document), false);
    }, { capture: true });

    document.addEventListener('pointerdown', (event) => {
      const world = queryOne('.world.v2-nav-open');
      if (!world || event.target.closest?.('.nav')) return;
      setMenuState(queryOne('.v2-nav-toggle', world), false);
    }, { capture: true });

    document.addEventListener('keydown', (event) => {
      const world = queryOne('.world.v2-nav-open');
      if (!world) return;
      const toggle = queryOne('.v2-nav-toggle', world);

      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        setMenuState(toggle, false);
        toggle?.focus();
        return;
      }

      if (event.key !== 'Tab') return;
      const nav = queryOne('.nav', world);
      const focusable = queryAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])', nav)
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
    }, { capture: true });

    matchMedia('(min-width: 981px)').addEventListener('change', (event) => {
      if (!event.matches) return;
      const toggle = queryOne('.v2-nav-toggle');
      if (toggle) setMenuState(toggle, false);
    });
  }

  function normalizeMobileToggle() {
    const toggle = queryOne('.v2-nav-toggle');
    if (!toggle) return;
    toggle.type = 'button';
    toggle.removeAttribute('style');
    if (!toggle.hasAttribute('aria-expanded')) toggle.setAttribute('aria-expanded', 'false');
    const world = toggle.closest('.world') || queryOne('.world');
    setMenuState(toggle, Boolean(world?.classList.contains('v2-nav-open')));
  }

  function horizontalOverflowIsClipped() {
    const values = [document.documentElement, document.body]
      .map((element) => getComputedStyle(element).overflowX);
    return values.some((value) => value === 'hidden' || value === 'clip');
  }

  function normalizeDocumentOverflowFlag() {
    const rawOverflow = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth;
    const clipped = rawOverflow > 2 && horizontalOverflowIsClipped();
    document.documentElement.dataset.v4ClippedDecorativeOverflow = String(clipped);
    if (clipped && document.documentElement.dataset.v4DocumentOverflow !== 'false') {
      document.documentElement.dataset.v4DocumentOverflow = 'false';
    }
  }

  function bindOverflowPolicy() {
    if (window.__SITE100_OVERFLOW_POLICY__) return;
    window.__SITE100_OVERFLOW_POLICY__ = true;
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => requestAnimationFrame(normalizeDocumentOverflowFlag));
    };

    new MutationObserver((records) => {
      if (records.some((record) => record.attributeName === 'data-v4-document-overflow')) schedule();
    }).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-v4-document-overflow']
    });

    window.addEventListener('resize', schedule, { passive: true });
    document.documentElement.addEventListener('site100:preview-device', schedule);
    schedule();
  }

  function boot() {
    bindDeviceControls();
    bindHiddenPanels();
    bindMobileNavigationController();
    normalizeMobileToggle();
    bindOverflowPolicy();
  }

  const run = () => requestAnimationFrame(() => requestAnimationFrame(boot));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
})();
