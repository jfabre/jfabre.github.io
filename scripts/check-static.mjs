import { readdirSync, readFileSync, lstatSync } from 'node:fs';
import { resolve, relative, dirname, extname, sep } from 'node:path';

const linkedIn = 'https://www.linkedin.com/in/jeremy-fabre-977b1b53/';
// The public GitHub profile is allowed exactly; repository URLs beneath it still fail.
const github = 'https://github.com/jfabre';
// Exact outbound project links: the platforms the tools target and their mod.io pages.
const projectLinks = [
  'https://talespire.com/',
  'https://www.thearcanelibrary.com/pages/shadowdark',
  'https://mod.io/g/talespire/m/the-dark-spire-character-sheet',
  'https://mod.io/g/talespire/m/darklight-a-torghlight-timer-for-shadowdark',
];
const contacts = [linkedIn, github, ...projectLinks];
// Publication origin. Allowed only as an exact self-reference in three places:
// <link rel="canonical"> in HTML, <loc> in a root sitemap.xml, and the Sitemap: line
// of a root robots.txt. Changing the host is a content edit in those three files.
const publication = 'https://jfabre.github.io/';
const sitemapUrl = `${publication}sitemap.xml`;
// XML namespace identifiers are not fetched; they are allowed only as exact xmlns values.
const namespaces = { '.svg': 'http://www.w3.org/2000/svg', '.xml': 'http://www.sitemaps.org/schemas/sitemap/0.9' };
const ids = ['shadowdark-sheet', 'torchlight-timer', 'dungeon-mapper', 'npc-voice'];
const required = [
  'Jeremy Fabre', 'Senior Software Developer',
  'A selection of personal projects built with AI-assisted development, from tabletop gaming tools to more ambitious applications that integrate AI directly.',
  'Connect on LinkedIn', linkedIn,
  'For professional opportunities or to request my CV, connect with me on LinkedIn.',
];
const textExtensions = new Set(['.html', '.js', '.mjs', '.css', '.svg', '.txt', '.xml', '.md']);
const forbidden = /(?:^\.env(?:\.|$)|\.env$|\.(?:db|sqlite|sqlite3)(?:$|-)|\.(?:pem|key)$|^\.omo$|PRIVATE)/i;
const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

function decode(text) {
  return text.replace(/&#(x[0-9a-f]+|\d+);?/gi, (match, code) => {
    const point = code[0].toLowerCase() === 'x' ? Number.parseInt(code.slice(1), 16) : Number(code);
    return point <= 0x10ffff ? String.fromCodePoint(point) : match;
  }).replace(/&(colon|sol|bsol|Tab|NewLine|amp);/g, (_, name) =>
    ({ colon: ':', sol: '/', bsol: '\\', Tab: '\t', NewLine: '\n', amp: '&' })[name]);
}

// Exclude only a narrow, documented server-only README grammar, never arbitrary prose.
function serverDocs(text) {
  const lines = text.trim().split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return lines.length > 0 && lines.every((line) =>
    /^(?:# Local preview|```(?:sh|bash)?|python3 -m http\.server \d+ --bind 127\.0\.0\.1 --directory (?:demo|site)|http:\/\/127\.0\.0\.1:\d+\/(?:\?variant=[ABC])?)$/.test(line));
}

// Replace exact, sanctioned self-references with a neutral marker so the URL scan never
// sees them. Anything that does not match these exact forms stays in the text and fails.
function stripSelfReferences(label, text) {
  const ext = extname(label).toLowerCase();
  const escape = (value) => value.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  let out = text;
  if (ext === '.html') {
    out = out.replace(new RegExp(`<link\\s+rel="canonical"\\s+href="${escape(publication)}"\\s*/?>`, 'g'), '<link data-self-reference>');
  }
  if (label === 'sitemap.xml') {
    out = out.replace(new RegExp(`<loc>${escape(publication)}</loc>`, 'g'), '<loc>self-reference</loc>');
  }
  if (label === 'robots.txt') {
    out = out.replace(new RegExp(`^Sitemap: ${escape(sitemapUrl)}$`, 'gm'), 'Sitemap: self-reference');
  }
  if (namespaces[ext] && (ext === '.svg' || label === 'sitemap.xml')) {
    out = out.replace(new RegExp(`xmlns="${escape(namespaces[ext])}"`, 'g'), 'xmlns="namespace"');
  }
  return out;
}

function check(root) {
  const reasons = [];
  const files = new Set();
  const texts = [];
  const projects = [];
  const reject = (reason) => reasons.push(reason);
  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = resolve(directory, entry.name);
      const label = relative(root, file);
      if (forbidden.test(entry.name)) { reject(`${label}: forbidden file or directory`); continue; }
      if (entry.isSymbolicLink()) { reject(`${label}: symlink is forbidden`); continue; }
      if (entry.isDirectory()) { walk(file); continue; }
      if (!entry.isFile()) { reject(`${label}: unsupported filesystem entry`); continue; }
      files.add(file);
      if (!textExtensions.has(extname(file).toLowerCase())) continue;
      const text = readFileSync(file, 'utf8');
      if (directory === root && /^readme\.md$/i.test(entry.name) && serverDocs(text)) continue;
      texts.push({ file, label, text });
    }
  }
  walk(root);

  function asset(value, file, label) {
    let path;
    try { path = decodeURIComponent(decode(value)).split(/[?#]/)[0]; }
    catch { reject(`${label}: malformed asset reference`); return false; }
    if (!path || /^(?:[a-z][a-z\d+.-]*:|\/|\\)/i.test(path) || path.includes('\\') || /[\x00-\x1f]/.test(path)) {
      reject(`${label}: asset must be a local relative path`); return false;
    }
    // HTML/JS references resolve from the document root; stylesheet URLs from the stylesheet.
    const base = extname(file).toLowerCase() === '.css' ? dirname(file) : root;
    const target = resolve(base, path);
    const rel = relative(root, target);
    if (rel === '..' || rel.startsWith(`..${sep}`)) {
      reject(`${label}: asset escapes root`); return false;
    }
    if (!files.has(target)) { reject(`${label}: missing asset ${path}`); return false; }
    return true;
  }

  for (const { file, label, text } of texts) {
    const normalized = stripSelfReferences(label, decode(text));
    if (/\/Users\/|[A-Z]:\\|github\.com/i.test(normalized.replace(/https:\/\/github\.com\/jfabre(?![\w/.?#-])/g, ''))) reject(`${label}: private source URL or path`);
    for (const match of normalized.matchAll(/(?:[a-z][a-z\d+.-]*:\/\/|(?:mailto|tel|sms|javascript|data|ftp|file):|(?<!:)\/\/)[^\s<>"'`)}\]]+/gi)) {
      if (!contacts.includes(match[0])) reject(`${label}: disallowed URL`);
    }
    // A small static markup tokenizer, not a browser or JS evaluator.
    const stack = [];
    const markup = normalized.replace(/<!--[\s\S]*?-->/g, '');
    for (const token of markup.matchAll(/<\/?([a-z][\w:-]*)\b((?:"[^"]*"|'[^']*'|[^'">])*)>/gi)) {
      const tag = token[1].toLowerCase();
      if (token[0].startsWith('</')) {
        const index = stack.findLastIndex((item) => item.tag === tag);
        if (index >= 0) stack.length = index;
        continue;
      }
      const attrs = new Map();
      for (const match of token[2].matchAll(/([^\s=/'"<>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
        const name = match[1].toLowerCase();
        if (attrs.has(name)) reject(`${label}: duplicate attribute ${name}`);
        attrs.set(name, match[2] ?? match[3] ?? match[4]);
      }
      if (tag === 'base') reject(`${label}: base element overrides local asset resolution`);
      let project = stack.at(-1)?.project;
      if (attrs.has('data-project')) {
        project = { id: attrs.get('data-project'), assets: 0, label };
        projects.push(project);
      }
      for (const [name, value] of attrs) {
        if (['src', 'poster', 'data-asset'].includes(name)) {
          const valid = asset(value, file, label);
          if (valid && project) project.assets++;
        }
        if (name === 'srcset') for (const candidate of value.split(',')) {
          const valid = asset(candidate.trim().split(/\s+/)[0], file, label);
          if (valid && project) project.assets++;
        }
        if (['href', 'xlink:href', 'action', 'formaction'].includes(name)) {
          const compact = value.replace(/[\x00-\x20]/g, '');
          if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(compact)) {
            if (!contacts.includes(value) || tag !== 'a') reject(`${label}: disallowed URL in ${name}`);
          } else if (!value.startsWith('#')) asset(value, file, label);
        }
      }
      if (!voidTags.has(tag) && !token[0].endsWith('/>')) stack.push({ tag, project });
    }
    for (const match of normalized.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]*))\s*\)/gi)) {
      const value = match[1] ?? match[2] ?? match[3];
      if (!value.startsWith('#')) asset(value, file, label);
    }
  }

  for (const value of required) {
    if (!texts.some(({ text }) => text.includes(value))) reject(`Missing required copy: ${value}`);
  }
  for (const id of ids) {
    const count = projects.filter((project) => project.id === id).length;
    if (count !== 1) reject(`Project ${id} must occur exactly once (found ${count})`);
  }
  for (const project of projects) {
    if (!ids.includes(project.id)) reject(`${project.label}: unexpected project ID`);
    if (project.assets === 0) reject(`${project.label}: project ${project.id} requires a local relative asset`);
  }
  if (projects.map(({ id }) => id).join(',') !== ids.join(',')) reject('Project order must match the four approved IDs');
  return [...new Set(reasons)];
}

let reasons;
try {
  if (process.argv.length !== 3) throw new Error('Usage: node scripts/check-static.mjs <root-directory>');
  const root = resolve(process.argv[2]);
  const stat = lstatSync(root);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Root must be a directory, not a symlink');
  reasons = check(root);
} catch (error) {
  reasons = [error instanceof Error ? error.message : 'Unable to inspect root directory'];
}
if (reasons.length) {
  console.error(`Static checks failed:\n${reasons.map((reason) => `- ${reason}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log('Static checks passed');
}
