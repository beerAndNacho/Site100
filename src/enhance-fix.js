const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function applyCompatibilityFixes() {
  // v1 binds the sector filter handler to every element with data-sector,
  // including gallery card links. Remove that handler after v2 wraps the cards.
  $$('.gcard[data-sector]').forEach((anchor) => {
    anchor.onclick = null;
    anchor.classList.remove('active');
    anchor.removeAttribute('aria-pressed');
  });

  // Let the v2 capture listener prepare copy/download actions, then prevent the
  // older bubbling submit handler from replacing the enhanced output message.
  $$('form').forEach((form) => {
    if (form.closest('dialog') || form.dataset.v2SubmitGuard === 'true') return;
    form.dataset.v2SubmitGuard = 'true';
    form.addEventListener('submit', (event) => {
      event.stopImmediatePropagation();
    }, { capture: true });
  });

  const sectorButtons = $$('.gtools nav button[data-sector]');
  sectorButtons.forEach((button) => {
    if (!button.hasAttribute('aria-pressed')) {
      button.setAttribute('aria-pressed', String(button.classList.contains('active')));
    }
  });
}

const run = () => requestAnimationFrame(() => requestAnimationFrame(applyCompatibilityFixes));
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
else run();
