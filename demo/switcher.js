/* demo/switcher.js — fixed bottom "Demo controls — not part of the site" pill.
   Built with DOM APIs only (no tag literals, no innerHTML). Owns: the control markup,
   aria-current, the visible/spoken label, the live-region announcement, the bottom
   space reservation (--switcher-space), and the Left/Right keyboard shortcut.
   It never decides which variant is active: app.js calls `setActive(variant)`. */

export const VARIANTS = ['A', 'B', 'C'];

const LABEL = 'Demo controls — not part of the site';
const NAMES = { A: 'Dark technical', B: 'Light editorial', C: 'Dark immersive' };

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'text') node.textContent = value;
    else node.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of children) node.append(child);
  return node;
}

function arrow(direction) {
  /* Text glyph rather than an inline SVG so this module carries no URL/namespace strings. */
  return el('span', { 'aria-hidden': 'true', class: 'dc-arrow', text: direction === 'prev' ? '\u2190' : '\u2192' });
}

export function step(current, delta) {
  const index = VARIANTS.indexOf(current);
  return VARIANTS[(index + delta + VARIANTS.length) % VARIANTS.length];
}

/* Arrow shortcuts must never steal keys from typing or from other controls. */
function isEditable(target) {
  if (!(target instanceof Element)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ||
    target.closest('[contenteditable]:not([contenteditable="false"])') !== null;
}

/**
 * Mount the switcher after `root` and return a handle.
 * `onSelect(variant, { source })` is called for every user request; the caller renders
 * and then calls `setActive`, so the pill always reflects the URL, never a guess.
 */
export function mountSwitcher({ root, status, onSelect }) {
  const buttons = new Map();

  const prev = el('button', { type: 'button', class: 'dc-btn', 'aria-label': 'Previous variant', 'data-step': '-1' }, [arrow('prev')]);
  const next = el('button', { type: 'button', class: 'dc-btn', 'aria-label': 'Next variant', 'data-step': '1' }, [arrow('next')]);
  const row = el('div', { class: 'dc-row' }, [prev]);
  for (const variant of VARIANTS) {
    const button = el('button', {
      type: 'button', class: 'dc-btn', 'data-variant-target': variant, text: variant,
      'aria-label': 'Variant ' + variant + ' — ' + NAMES[variant],
    });
    buttons.set(variant, button);
    row.append(button);
  }
  row.append(next);
  const group = el('div', { class: 'demo-controls', role: 'group', 'aria-label': LABEL }, [
    el('span', { class: 'dc-label', text: LABEL, 'aria-hidden': 'true' }),
    row,
  ]);

  const bar = el('nav', { class: 'demo-switcher', 'aria-label': LABEL }, [group]);
  root.insertAdjacentElement('afterend', bar);
  document.body.classList.add('has-switcher');

  let active = null;

  group.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest('button') : null;
    if (!button || !active) return;
    const target = button.dataset.variantTarget || step(active, Number(button.dataset.step));
    onSelect(target, { source: button });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (isEditable(event.target)) return;
    if (!active) return;
    /* Focus inside the pill keeps the buttons' own keyboard behaviour; the shortcut
       is for the page body, so it only acts when the document itself has focus. */
    if (event.target instanceof Element && event.target !== document.body && event.target !== document.documentElement) return;
    event.preventDefault();
    const delta = event.key === 'ArrowLeft' ? -1 : 1;
    onSelect(step(active, delta), { source: delta < 0 ? prev : next });
  });

  /* Reserve the pill's real height (plus a gap) inside the page canvas. */
  const reserve = () => {
    const height = bar.getBoundingClientRect().height;
    document.body.style.setProperty('--switcher-space', Math.ceil(height + 16) + 'px');
  };
  if (typeof ResizeObserver === 'function') new ResizeObserver(reserve).observe(bar);
  window.addEventListener('resize', reserve);
  reserve();

  function setActive(variant, { announce = true } = {}) {
    active = variant;
    for (const [key, button] of buttons) {
      if (key === variant) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    }
    prev.setAttribute('aria-label', 'Previous variant (' + step(variant, -1) + ')');
    next.setAttribute('aria-label', 'Next variant (' + step(variant, 1) + ')');
    if (announce && status) status.textContent = 'Variant ' + variant + ' — ' + NAMES[variant] + ' — active';
  }

  return { setActive, element: bar, buttons, prev, next, reserve };
}
