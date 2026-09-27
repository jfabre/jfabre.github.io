/* demo/variants/a.js — Variant A: Dark technical.
   Renders the shared portfolio (demo/content.js) as a split identity/index hero,
   horizontal project rows, and a contact block. Markup is described once as a plain
   node tree and serialised two ways: to live DOM (renderVariantA) and to an HTML
   string (renderStaticA) for the no-JS baseline. No tag literals live in this file. */

import { identity, section, contact, projects } from '../content.js';

const ASSET_DIR = 'assets/projects/';
const ASSET_EXT = '.webp';

/* ---------- node tree helpers ---------- */

function node(tag, attrs = {}, children = []) {
  return { tag, attrs, children: Array.isArray(children) ? children : [children] };
}

const VOID_TAGS = new Set(['img', 'br', 'hr', 'input', 'meta', 'link', 'source']);

function escapeText(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(value) {
  return escapeText(value).replace(/"/g, '&quot;');
}

function toHtml(item) {
  if (typeof item === 'string') return escapeText(item);
  const attrs = Object.entries(item.attrs)
    .filter(([, v]) => v !== null && v !== undefined && v !== false)
    .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${escapeAttr(v)}"`))
    .join('');
  const open = '<' + item.tag + attrs + '>';
  if (VOID_TAGS.has(item.tag)) return open;
  return open + item.children.map(toHtml).join('') + '</' + item.tag + '>';
}

function toDom(item, doc) {
  if (typeof item === 'string') return doc.createTextNode(item);
  const el = doc.createElement(item.tag);
  for (const [k, v] of Object.entries(item.attrs)) {
    if (v === null || v === undefined || v === false) continue;
    el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const child of item.children) el.append(toDom(child, doc));
  return el;
}

/* ---------- content → tree ---------- */

const pad = (n) => String(n).padStart(2, '0');
const assetPath = (project) => ASSET_DIR + project.id + ASSET_EXT;
const anchorId = (project) => 'project-' + project.id;

function buildHero() {
  const indexItems = projects.map((project, i) =>
    node('li', {}, node('a', { href: '#' + anchorId(project) }, [
      node('span', { class: 'n', 'aria-hidden': 'true' }, pad(i + 1)),
      node('span', { class: 'index-label' }, project.title),
    ])),
  );

  return node('header', { class: 'hero' }, [
    node('div', { class: 'identity' }, [
      node('p', { class: 'eyebrow' }, identity.role),
      node('h1', { class: 'name' }, identity.name),
      node('p', { class: 'tagline' }, identity.tagline),
      node('div', { class: 'actions' }, [
        node('a', { class: 'btn btn-primary', href: contact.ctaHref }, contact.ctaLabel),
        node('a', { class: 'btn btn-secondary', href: contact.href, rel: 'me noopener' }, contact.label),
      ]),
    ]),
    node('nav', { class: 'index', 'aria-labelledby': 'index-title' }, [
      node('p', { class: 'index-title', id: 'index-title' }, 'Index'),
      node('ol', {}, indexItems),
    ]),
  ]);
}

function buildProject(project, i) {
  const src = assetPath(project);
  const article = node('article', {
    class: 'project',
    id: anchorId(project),
    'data-project': project['data-project'],
    'data-title': project['data-title'],
    'data-description': project['data-description'],
    'data-ai-note': project['data-ai-note'],
  }, [
    node('a', { class: 'frame frame-link', href: src, 'aria-label': 'Open full-size image: ' + project.title }, [
      node('img', {
        class: 'frame-img',
        src,
        alt: project.title + ' — screenshot of the project',
        decoding: 'async',
      }),
    ]),
    node('div', { class: 'project-body' }, [
      node('p', { class: 'project-n', 'aria-hidden': 'true' }, pad(i + 1)),
      node('h3', { class: 'title' }, project.title),
      node('p', { class: 'summary' }, project.summary),
      node('p', { class: 'meta' }, [
        node('span', { class: 'meta-stack' }, project.stack),
        node('span', { class: 'meta-ai' }, project.aiNote),
      ]),
    ]),
  ]);
  return node('li', {}, article);
}

function buildProjects() {
  return node('section', { class: 'projects', id: 'projects', 'aria-labelledby': 'projects-heading' }, [
    node('h2', { class: 'section-heading', id: 'projects-heading' }, section.heading),
    node('p', { class: 'section-intro' }, section.intro),
    node('ol', { class: 'project-list' }, projects.map(buildProject)),
  ]);
}

function buildContact() {
  return node('section', { class: 'contact', 'aria-labelledby': 'contact-title' }, [
    node('p', { class: 'eyebrow', id: 'contact-title' }, 'Contact'),
    node('p', { class: 'contact-text' }, contact.text),
    node('a', { class: 'btn btn-primary', href: contact.href, rel: 'me noopener' }, contact.label),
  ]);
}

function buildPage() {
  return node('div', { class: 'v-canvas page' }, [
    buildHero(),
    node('main', { class: 'page-main' }, [buildProjects(), buildContact()]),
  ]);
}

/* ---------- public API ---------- */

/** Fill `root` with the live variant A DOM. Replaces existing children. */
export function renderVariantA(root) {
  const doc = root.ownerDocument;
  root.replaceChildren(toDom(buildPage(), doc));
  return root;
}

/** HTML string of the same markup, built at runtime, for the no-JS baseline. */
export function renderStaticA() {
  return toHtml(buildPage());
}
