/* demo/variants/c.js — Variant C: Dark immersive.
   Renders the shared portfolio (demo/content.js) as a centred introduction followed by
   full-width, image-led project chapters and a centred contact block. Built with DOM
   APIs only: no tag literals, no innerHTML. Project hooks (data-project, data-title,
   data-description, data-ai-note) are set at runtime from content.js. */

import { identity, section, contact, projects } from '../content.js';

const ASSET_DIR = 'assets/projects/';
const ASSET_EXT = '.webp';

/* ---------- DOM helpers ---------- */

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'text') node.textContent = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else node.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of Array.isArray(children) ? children : [children]) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child);
  }
  return node;
}

function assetPath(id) {
  return ASSET_DIR + id + ASSET_EXT;
}

function chapterNumeral(index) {
  return 'Chapter ' + String(index + 1).padStart(2, '0');
}

/* ---------- sections ---------- */

function renderIntro() {
  return el('header', { class: 'intro' }, [
    el('p', { class: 'role', text: identity.role }),
    el('h1', { class: 'name', text: identity.name }),
    el('p', { class: 'tagline', text: identity.tagline }),
    el('div', { class: 'actions' }, [
      el('a', { class: 'btn btn-primary', href: contact.ctaHref, text: contact.ctaLabel }),
      el('a', { class: 'btn btn-secondary', href: contact.href, text: contact.label }),
    ]),
  ]);
}

/* Portrait captures get a taller frame so the whole image stays legible; the choice is
   made from the decoded image, so no dimensions are hard-coded here. */
function markOrientation(img, article) {
  const apply = () => {
    if (img.naturalWidth && img.naturalHeight) {
      article.dataset.orientation = img.naturalHeight > img.naturalWidth ? 'portrait' : 'landscape';
    }
  };
  if (img.complete && img.naturalWidth) apply();
  else img.addEventListener('load', apply, { once: true });
}

function renderChapter(project, index) {
  const src = assetPath(project.id);
  const titleId = 'c-title-' + project.id;

  const shot = el('img', {
    class: 'chapter-img',
    src,
    alt: project.title + ' — project image',
    loading: index === 0 ? 'eager' : 'lazy',
    decoding: 'async',
  });
  /* Decorative ambient backdrop: the same capture, blurred, filling the frame behind the
     un-cropped image. Hidden from assistive tech. */
  const backdrop = el('img', {
    class: 'shot-backdrop',
    src,
    alt: '',
    'aria-hidden': 'true',
    loading: index === 0 ? 'eager' : 'lazy',
    decoding: 'async',
  });

  const article = el('article', {
    class: 'chapter',
    'aria-labelledby': titleId,
    dataset: {
      project: project['data-project'],
      title: project['data-title'],
      description: project['data-description'],
      aiNote: project['data-ai-note'],
    },
  }, [
    el('div', { class: 'chapter-head has-image' }, [
      el('div', { class: 'shot' }, [backdrop, shot]),
      el('div', { class: 'scrim' }, [
        el('span', { class: 'numeral', text: chapterNumeral(index) }),
        el('h3', { class: 'title', id: titleId, text: project.title }),
      ]),
    ]),
    el('div', { class: 'chapter-body' }, [
      el('p', { class: 'summary', text: project.summary }),
      el('p', { class: 'meta' }, [
        el('span', { text: project.stack }),
        el('span', { text: project.aiNote }),
      ]),
      el('a', { class: 'text-link full-image', href: src }, [
        'View full image',
        el('span', { class: 'visually-hidden', text: ' of ' + project.title }),
      ]),
    ]),
  ]);

  markOrientation(shot, article);
  return el('li', {}, article);
}

function renderProjects() {
  return el('section', { class: 'projects', id: 'projects', 'aria-labelledby': 'c-projects-heading' }, [
    el('h2', { class: 'section-heading', id: 'c-projects-heading', text: section.heading }),
    el('p', { class: 'section-intro', text: section.intro }),
    el('ol', { class: 'chapters' }, projects.map(renderChapter)),
  ]);
}

function renderContact() {
  return el('footer', { class: 'contact' }, [
    el('p', { class: 'contact-text', text: contact.text }),
    el('a', { class: 'btn btn-primary', href: contact.href, text: contact.label }),
  ]);
}

/* ---------- entry ---------- */

export function renderVariantC(root) {
  root.setAttribute('data-variant', 'c');
  root.replaceChildren(
    el('div', { class: 'v-canvas v-page' }, [renderIntro(), renderProjects(), renderContact()]),
  );
  return root;
}

export default renderVariantC;
