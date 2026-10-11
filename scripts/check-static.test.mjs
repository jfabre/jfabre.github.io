import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const checker = resolve(import.meta.dirname, 'check-static.mjs');
const linkedIn = 'https://www.linkedin.com/in/jeremy-fabre-977b1b53/';
const ids = ['shadowdark-sheet', 'torchlight-timer', 'dungeon-mapper', 'npc-voice'];
const copy = [
  'Jeremy Fabre',
  'Senior Software Developer',
  'A selection of personal projects built with AI-assisted development, from tabletop gaming tools to more ambitious applications that integrate AI directly.',
  'Connect on LinkedIn',
  linkedIn,
  'For professional opportunities or to request my CV, connect with me on LinkedIn.',
];
const card = (id) => `<article data-project="${id}"><img src="assets/projects/${id}.webp" alt="Project"></article>`;
const markup = () => `<!doctype html><html><body>${copy.map((text) => `<p>${text}</p>`).join('')}
<a href="${linkedIn}">Connect on LinkedIn</a>${ids.map(card).join('')}</body></html>`;

function fixture(t, transform = (html) => html) {
  const root = mkdtempSync(join(tmpdir(), 'portfolio-static-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'assets/projects'), { recursive: true });
  for (const id of ids) writeFileSync(join(root, `assets/projects/${id}.webp`), 'fixture-only image');
  writeFileSync(join(root, 'index.html'), transform(markup()));
  return root;
}

function run(t, root, expected, reason) {
  const result = spawnSync(process.execPath, [checker, ...root], { encoding: 'utf8', timeout: 5000 });
  assert.ifError(result.error);
  assert.equal(result.signal, null);
  t.diagnostic(`node scripts/check-static.mjs ${root.join(' ')} => exit ${result.status}; ${result.stderr.trim() || result.stdout.trim()}`);
  assert.equal(result.status, expected, result.stderr || result.stdout);
  if (reason) assert.match(result.stderr, reason);
  if (expected === 0) assert.match(result.stdout, /Static checks passed/);
  else assert.doesNotMatch(result.stdout, /passed/i);
}

test('complete minimal fixture succeeds', (t) => run(t, [fixture(t)], 0));
test('missing image is rejected', (t) => {
  const root = fixture(t);
  rmSync(join(root, 'assets/projects/shadowdark-sheet.webp'));
  run(t, [root], 1, /missing asset/i);
});

for (const [name, addition, reason] of [
  ['mailto', '<a href="mailto:test@example.com">Email</a>', /disallowed URL/i],
  ['tel', '<a href="tel:5550100">Call</a>', /disallowed URL/i],
  ['private repository URL', 'https://github.com/jfabre/shadowdark-sheet', /disallowed URL|private source/i],
  ['private source path', '/Users/jeremy/dev/shadowdark-sheet', /private source/i],
  ['other contact scheme', '<a href="sms:5550100">Message</a>', /disallowed URL/i],
  ['protocol relative URL', '<a href="//example.com/contact">Contact</a>', /disallowed URL/i],
  ['encoded mailto', '<a href="mail&#116;o:test@example.com">Contact</a>', /disallowed URL/i],
  ['base URL override', '<base href="elsewhere/">', /base element/i],
]) test(`${name} is rejected`, (t) => run(t, [fixture(t, (html) => html + addition)], 1, reason));

const publication = 'https://jfabre.github.io/';
const canonical = `<link rel="canonical" href="${publication}">`;
test('publication origin is accepted as an exact canonical link', (t) => run(t,
  [fixture(t, (html) => html.replace('<body>', `<head>${canonical}</head><body>`))], 0));
test('publication sitemap and robots self-references are accepted', (t) => {
  const root = fixture(t, (html) => html.replace('<body>', `<head>${canonical}</head><body>`));
  writeFileSync(join(root, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${publication}</loc></url>\n</urlset>\n`);
  writeFileSync(join(root, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${publication}sitemap.xml\n`);
  writeFileSync(join(root, 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32"/></svg>');
  run(t, [root], 0);
});
for (const [name, addition] of [
  ['publication origin outside a canonical link', `<a href="${publication}">Home</a>`],
  ['publication origin as bare text', publication],
  ['publication subpath in a canonical link', canonical.replace(publication, `${publication}about/`)],
  ['other https origin in a canonical link', canonical.replace(publication, 'https://example.com/')],
  ['other https origin', 'https://example.com/'],
  ['private repository URL beside a canonical link', `${canonical}https://github.com/jfabre/jfabre.github.io`],
  ['data URL', '<img src="data:image/svg+xml,%3Csvg%3E" alt="">'],
]) test(`${name} is rejected`, (t) => run(t, [fixture(t, (html) => html + addition)], 1, /disallowed URL|private source|asset/i));
test('sitemap with a foreign location is rejected', (t) => {
  const root = fixture(t);
  writeFileSync(join(root, 'sitemap.xml'), '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://example.com/</loc></url></urlset>');
  run(t, [root], 1, /disallowed URL/i);
});
test('robots pointing at a foreign sitemap is rejected', (t) => {
  const root = fixture(t);
  writeFileSync(join(root, 'robots.txt'), 'User-agent: *\nSitemap: https://example.com/sitemap.xml\n');
  run(t, [root], 1, /disallowed URL/i);
});
test('sitemap namespace is not accepted in an HTML file', (t) => run(t,
  [fixture(t, (html) => html + '<div xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></div>')], 1, /disallowed URL/i));

test('wrong LinkedIn URL is rejected', (t) => run(t,
  [fixture(t, (html) => html.replaceAll(linkedIn, 'https://www.linkedin.com/in/someone-else/'))],
  1, /required copy|disallowed URL/i));
test('extra LinkedIn suffix is rejected even with canonical copy present', (t) => run(t,
  [fixture(t, (html) => html + `<a href="${linkedIn}?tracking=1">Contact</a>`)], 1, /disallowed URL/i));
test('duplicate project ID is rejected', (t) => run(t,
  [fixture(t, (html) => html + card(ids[0]))], 1, /exactly once/i));
test('out-of-order projects are rejected', (t) => run(t,
  [fixture(t, (html) => html.replace(card(ids[0]) + card(ids[1]), card(ids[1]) + card(ids[0])))], 1, /order/i));
test('unknown project ID is rejected', (t) => run(t,
  [fixture(t, (html) => html + card('unknown'))], 1, /unexpected project/i));
test('project cannot borrow an adjacent card image', (t) => run(t,
  [fixture(t, (html) => html.replace(`<img src="assets/projects/${ids[0]}.webp" alt="Project">`, ''))],
  1, /project.*asset/i));
test('nested markup and unquoted attributes are supported', (t) => run(t,
  [fixture(t, (html) => html.replaceAll(/data-project="([^"]+)"/g, 'data-project=$1')
    .replaceAll('<img ', '<div><img ').replaceAll('</article>', '</div></article>'))], 0));

for (const value of ['/tmp/image.webp', 'C:\\private\\image.webp', '../outside.webp',
  'https://example.com/image.webp', linkedIn, '//example.com/image.webp',
  'data:image/png;base64,AAAA', '%2e%2e/outside.webp']) {
  test(`nonlocal image ${value} is rejected`, (t) => run(t,
    [fixture(t, (html) => html.replace('assets/projects/shadowdark-sheet.webp', value))], 1, /asset/i));
}
for (const required of copy) test(`missing required copy: ${required}`, (t) => run(t,
  [fixture(t, (html) => html.replaceAll(required, 'removed'))], 1, /required copy/i));

for (const filename of ['.env', '.env.local', 'settings.env', 'data.db', 'data.sqlite', 'data.sqlite3',
  'data.sqlite3-wal', 'secret.pem', 'secret.key', 'PRIVATE-notes.txt', '.omo/notes.md']) {
  test(`dangerous file ${filename} is rejected`, (t) => {
    const root = fixture(t);
    if (filename.startsWith('.omo/')) mkdirSync(join(root, '.omo'));
    writeFileSync(join(root, filename), 'disposable test');
    run(t, [root], 1, /forbidden/i);
  });
}
for (const extension of ['html', 'js', 'mjs', 'css', 'svg', 'txt', 'xml', 'md']) {
  test(`privacy scanning includes .${extension}`, (t) => {
    const root = fixture(t);
    writeFileSync(join(root, `extra.${extension}`), 'https://github.com/jfabre/private');
    run(t, [root], 1, /disallowed URL|private source/i);
  });
}
test('root README with public content is scanned', (t) => {
  const root = fixture(t);
  writeFileSync(join(root, 'README.md'), 'https://github.com/jfabre/private');
  run(t, [root], 1, /disallowed URL|private source/i);
});
test('root README containing only supported server docs is excluded', (t) => {
  const root = fixture(t);
  writeFileSync(join(root, 'README.md'), '# Local preview\n\npython3 -m http.server 8000 --bind 127.0.0.1 --directory demo\nhttp://127.0.0.1:8000/\n');
  run(t, [root], 0);
});
test('CSS missing local asset is rejected', (t) => {
  const root = fixture(t);
  writeFileSync(join(root, 'styles.css'), 'body { background: url("assets/missing.webp"); }');
  run(t, [root], 1, /missing asset/i);
});
test('symlinks are rejected without reading their target', (t) => {
  const root = fixture(t);
  symlinkSync('index.html', join(root, 'linked.html'));
  run(t, [root], 1, /symlink/i);
});
test('missing CLI argument is rejected', (t) => run(t, [], 1, /usage/i));
test('non-directory CLI root is rejected', (t) => run(t, [join(fixture(t), 'index.html')], 1, /directory/i));
test('real integrated demo passes the static contract', (t) => run(t,
  [resolve(import.meta.dirname, '../demo')], 0));

test('shared content exports the exact approved identity, section and contact', async () => {
  const { identity, section, contact } = await import('../demo/content.js');
  assert.deepEqual(identity, {
    name: 'Jeremy Fabre', role: 'Senior Software Developer', tagline: 'Delivering quality software on budget.',
  });
  assert.deepEqual(section, { heading: 'Selected projects', intro: copy[2] });
  assert.deepEqual(contact, {
    ctaLabel: 'View my projects', ctaHref: '#projects', label: 'Connect on LinkedIn',
    href: linkedIn, text: copy[5],
  });
});

test('shared content has exactly four ordered projects with approved copy and stable hooks', async () => {
  const { projects } = await import('../demo/content.js');
  assert.deepEqual(projects.map(({ id }) => id), ids);
  const expected = [
    ['The Dark Spire — TaleSpire Character Sheet',
      'A digital Shadowdark character sheet for TaleSpire and standalone browsers, bringing character stats, inventory, spells, and dice-roll integration together.',
      'HTML · CSS · JavaScript', 'Built with AI-assisted development.'],
    ['Darklight — Torchlight Timer',
      'An atmospheric countdown timer for torches and light spells in TaleSpire, with animated visuals, playback controls, and duration adjustments.',
      'HTML · CSS · JavaScript', 'Built with AI-assisted development.'],
    ['Dungeon Mapper',
      'An agent-guided workflow for turning reviewed 2D dungeon descriptions into TaleSpire slabs, supported by deterministic validation, overlays, and export tools.',
      'Python', 'Built with AI-assisted development; AI assists the mapping workflow.'],
    ['NPC Voice',
      'A local prototype for AI-driven NPC conversations, with a web control panel and integrations for language generation, speech recognition, and voice synthesis. Discord voice integration is still in development.',
      'Elixir · Phoenix LiveView · JavaScript', 'Built with AI-assisted development; integrates AI dialogue and speech services.'],
  ];
  assert.deepEqual(projects.map(({ title, summary, stack, aiNote }) => [title, summary, stack, aiNote]), expected);
  for (const project of projects) {
    for (const [hook, field] of Object.entries({
      'data-project': 'id', 'data-title': 'title', 'data-description': 'summary', 'data-ai-note': 'aiNote',
    })) {
      assert.equal(typeof project[hook], 'string');
      assert.equal(project[hook], project[field]);
    }
  }
});

test('shared content source contains no private paths, contact alternatives or HTML tags', async () => {
  await import('../demo/content.js');
  const source = readFileSync(new URL('../demo/content.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /mailto:|github\.com|\/Users\//i);
  assert.doesNotMatch(source, /<\/?[a-z][^>]*>/i);
});
