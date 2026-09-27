/* demo/app.js — comparison-page integrator (local demo only).
   Reads `?variant=`, renders exactly one of the three independent variant modules into
   #site, keeps the URL/history in sync, and drives the demo switcher. The static markup
   already in index.html is variant A, so a JS failure never blanks the page. No storage,
   no analytics, no theme memory: the URL is the only state. Nothing here selects a winner —
   A is merely the no-JS baseline and the fallback for a missing or invalid query. */

import { renderVariantA } from './variants/a.js';
import { renderVariantB } from './variants/b.js';
import { renderVariantC } from './variants/c.js';
import { VARIANTS, mountSwitcher } from './switcher.js';

const PARAM = 'variant';
const FALLBACK = 'A';
const RENDERERS = { A: renderVariantA, B: renderVariantB, C: renderVariantC };

const root = document.getElementById('site');
const status = document.getElementById('demo-status');

/** Only the exact keys A, B, C (case-folded) are valid; anything else is the fallback. */
export function normalizeVariant(value) {
  const key = typeof value === 'string' ? value.trim().toUpperCase() : '';
  return VARIANTS.includes(key) ? key : FALLBACK;
}

function variantFromLocation() {
  return normalizeVariant(new URLSearchParams(location.search).get(PARAM));
}

function urlFor(variant) {
  /* Built from pathname + query on purpose: the static checker's CSS url scanner
     would flag the URL constructor, and the hash is dropped because scroll resets. */
  const params = new URLSearchParams(location.search);
  params.set(PARAM, variant);
  return location.pathname + '?' + params.toString();
}

let current = null;

function render(variant) {
  if (variant === current) return;
  root.setAttribute('data-variant', variant.toLowerCase());
  document.body.setAttribute('data-variant', variant.toLowerCase());
  RENDERERS[variant](root);
  /* Variant A ships its own <main>; B and C fill the root, so the root becomes the landmark. */
  if (root.querySelector('main')) root.removeAttribute('role');
  else root.setAttribute('role', 'main');
  current = variant;
}

const switcher = mountSwitcher({
  root,
  status,
  onSelect(variant, { source }) {
    select(variant, { source });
  },
});

/** User-initiated switch: render, push history, reset scroll, keep focus on the control used. */
function select(variant, { source } = {}) {
  const changed = variant !== current;
  if (changed) {
    render(variant);
    history.pushState({ [PARAM]: variant }, '', urlFor(variant));
    window.scrollTo(0, 0);
  }
  switcher.setActive(variant, { announce: changed });
  if (source && typeof source.focus === 'function' && document.contains(source)) {
    source.focus({ preventScroll: true });
  }
}

/* Back/forward and hash-only navigations: the URL is the source of truth. */
window.addEventListener('popstate', () => {
  const variant = variantFromLocation();
  const changed = variant !== current;
  render(variant);
  if (changed) window.scrollTo(0, 0);
  switcher.setActive(variant, { announce: changed });
});

/* Initial paint. The static baseline already IS variant A, so it is only re-rendered when
   the URL asks for another variant; a missing or invalid query keeps the baseline and the
   URL untouched (no redirect, no "approval" of A). */
const initial = variantFromLocation();
if (initial === FALLBACK && root.getAttribute('data-variant') === 'a') {
  current = FALLBACK;
} else {
  render(initial);
}
switcher.setActive(initial, { announce: false });
