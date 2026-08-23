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

  function normalizeMobileToggle() {
    const toggle = queryOne('.v2-nav-toggle');
    if (!toggle) return;
    toggle.type = 'button';
    toggle.removeAttribute('style');
  }

  function boot() {
    bindDeviceControls();
    bindHiddenPanels();
    normalizeMobileToggle();
  }

  const run = () => requestAnimationFrame(() => requestAnimationFrame(boot));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
})();
