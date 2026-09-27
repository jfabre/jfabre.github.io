/* demo/variants/b.js — Variant B: Light editorial.
   Renders the shared content module with DOM APIs only. Markup hooks
   (data-project, data-title, data-description, data-ai-note) are set at
   runtime from content.js; no literal markup lives in this file. */

import { identity, section, contact, projects } from '../content.js';

const ASSET_DIR = 'assets/projects/';
const PROJECT_HOOKS = ['data-project', 'data-title', 'data-description', 'data-ai-note'];

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function link(href, className, text) {
  const a = el('a', className, text);
  a.href = href;
  return a;
}

function assetPath(id) {
  return `${ASSET_DIR}${id}.webp`;
}

function ordinalLabel(index) {
  return String(index + 1).padStart(2, '0');
}

function renderOpener() {
  const opener = el('header', 'opener');
  opener.append(
    el('h1', 'name', identity.name),
    el('p', 'role', identity.role),
    el('p', 'deck', identity.tagline),
  );

  const actions = el('div', 'actions');
  const primary = link(contact.ctaHref, 'btn btn-primary', contact.ctaLabel);
  const secondary = link(contact.href, 'btn btn-secondary', contact.label);
  secondary.rel = 'noopener';
  actions.append(primary, secondary);
  opener.append(actions);
  return opener;
}

function renderRow(project, index) {
  const row = el('li', index % 2 === 1 ? 'row is-alt' : 'row');
  for (const hook of PROJECT_HOOKS) row.setAttribute(hook, project[hook]);

  const ordinal = el('p', 'ordinal', ordinalLabel(index));
  ordinal.setAttribute('aria-hidden', 'true');

  const text = el('div', 'row-text');
  const titleId = `project-${project.id}-title`;
  const title = el('h3', 'title', project.title);
  title.id = titleId;
  const meta = el('p', 'meta');
  meta.append(el('span', 'stack', project.stack), el('span', 'ai-note', project.aiNote));
  text.append(title, el('p', 'summary', project.summary), meta);

  const asset = assetPath(project.id);
  const figure = el('figure', 'figure');
  const frameLink = link(asset, 'frame-link');
  frameLink.setAttribute('aria-labelledby', `${titleId} project-${project.id}-caption`);
  const frame = el('div', 'frame has-image');
  const img = el('img');
  img.src = asset;
  img.alt = project.title;
  img.decoding = 'async';
  if (index > 0) img.loading = 'lazy';
  frame.append(img);
  frameLink.append(frame);
  const caption = el('figcaption', 'frame-caption');
  const captionLink = link(asset, 'text-link', 'View full image');
  captionLink.id = `project-${project.id}-caption`;
  caption.append(captionLink);
  figure.append(frameLink, caption);

  row.append(ordinal, text, figure);
  row.setAttribute('aria-labelledby', titleId);
  return row;
}

function renderProjects() {
  const projectsSection = el('section', 'projects');
  projectsSection.id = 'projects';
  projectsSection.setAttribute('aria-labelledby', 'projects-heading');

  const head = el('div', 'section-head');
  const heading = el('h2', 'section-heading', section.heading);
  heading.id = 'projects-heading';
  head.append(heading, el('p', 'intro', section.intro));

  const rows = el('ol', 'rows');
  projects.forEach((project, index) => rows.append(renderRow(project, index)));

  projectsSection.append(head, rows);
  return projectsSection;
}

function renderContact() {
  const footer = el('footer', 'contact');
  footer.setAttribute('aria-label', 'Contact');
  footer.append(el('p', 'contact-text', contact.text));
  const cta = link(contact.href, 'btn btn-primary', contact.label);
  cta.rel = 'noopener';
  footer.append(cta);
  return footer;
}

export function renderVariantB(root) {
  root.setAttribute('data-variant', 'b');
  root.replaceChildren();

  const canvas = el('div', 'v-canvas');
  /* The integrator owns the main landmark; the renderer only fills the root. */
  const page = el('div', 'page');
  page.append(renderOpener(), renderProjects(), renderContact());
  canvas.append(page);
  root.append(canvas);
  return root;
}

export default renderVariantB;
