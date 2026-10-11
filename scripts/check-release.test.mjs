import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const project = fileURLToPath(new URL('../', import.meta.url));
const checker = join(project, 'scripts/check-release.mjs');
const temporaryRoot = tmpdir();
const files = [
  '.nojekyll', '404.html', 'favicon.svg', 'index.html', 'robots.txt', 'sitemap.xml', 'styles.css', 'carousel.js', 'media.js',
  'assets/projects/shadowdark-sheet.webp', 'assets/projects/torchlight-timer.webp',
  'assets/projects/dungeon-mapper.webp', 'assets/projects/npc-voice.webp',
  'assets/projects/shadowdark-party.webp', 'assets/projects/shadowdark-equipment.webp', 'assets/projects/torchlight-spell.webp', 'assets/projects/torchlight-board.webp', 'assets/projects/npc-session.webp', 'assets/projects/npc-transcript.webp',
  'assets/projects/torchlight-timer.mp4', 'assets/projects/torchlight-spell.mp4', 'assets/projects/torchlight-board.mp4',
  'assets/fonts/fraunces-latin-full-normal.woff2', 'assets/fonts/newsreader-latin-opsz-normal.woff2', 'assets/texture/grain.svg',
];

function fixture(t) {
  const root = mkdtempSync(join(temporaryRoot, 'release-preflight-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'docs/assets/projects'), { recursive: true });
  mkdirSync(join(root, 'docs/assets/fonts'), { recursive: true });
  mkdirSync(join(root, 'docs/assets/texture'), { recursive: true });
  writeFileSync(join(root, 'README.md'), '# Jeremy Fabre\nPersonal projects.\nhttps://jfabre.github.io/\n');
  for (const file of files) copyFileSync(join(project, 'site', file), join(root, 'docs', file));
  return root;
}

function check(root) {
  return spawnSync(process.execPath, [checker, root], { encoding: 'utf8' });
}

test('accepts the explicit approved export and publication origin', (t) => {
  const result = check(fixture(t));
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Release checks passed/);
});

for (const name of ['PRIVATE-notes.txt', '.env', '.git', '.omo', 'secrets.db', 'demo', 'manifest.txt']) {
  test(`rejects extra root entry ${name}`, (t) => {
    const root = fixture(t);
    writeFileSync(join(root, name), 'sample');
    const result = check(root);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /unexpected entry|forbidden/i);
    if (name === 'PRIVATE-notes.txt') console.log(`Disposable fixture ${name}: exit ${result.status}\n${result.stderr.trim()}`);
  });
}

for (const name of ['.env', '.git', '.omo', 'secrets.db', 'PRIVATE-notes.txt', 'content.js', 'DESIGN.md', 'extra.json']) {
  test(`rejects nested docs entry ${name}`, (t) => {
    const root = fixture(t);
    writeFileSync(join(root, 'docs/assets/projects', name), 'sample');
    const result = check(root);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /unexpected entry|forbidden/i);
  });
}

for (const text of ['/Users/jeremy/dev/secret', 'https://github.com/example/private-repo', 'git@github.com:example/private-repo.git']) {
  test(`rejects private README text: ${text}`, (t) => {
    const root = fixture(t);
    writeFileSync(join(root, 'README.md'), text);
    const result = check(root);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /README.md: private source URL or path/);
    console.log(`Disposable fixture README text: exit ${result.status}\n${result.stderr.trim()}`);
  });
}

test('rejects private text inside an approved docs file', (t) => {
  const root = fixture(t);
  writeFileSync(join(root, 'docs/styles.css'), '/Users/jeremy/dev/secret');
  const result = check(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /styles.css: private source URL or path/);
});

test('invokes the static contract rather than accepting only the file list', (t) => {
  const root = fixture(t);
  const path = join(root, 'docs/index.html');
  writeFileSync(path, readFileSync(path, 'utf8').replaceAll('Senior Software Developer', 'Another role'));
  const result = check(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Missing required copy: Senior Software Developer/);
});

test('rejects a missing approved file', (t) => {
  const root = fixture(t);
  rmSync(join(root, 'docs/.nojekyll'));
  const result = check(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /missing required entry docs\/\.nojekyll/);
});

test('rejects a symlink instead of following it', (t) => {
  const root = fixture(t);
  rmSync(join(root, 'README.md'));
  symlinkSync(join(project, 'README.md'), join(root, 'README.md'));
  const result = check(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /symlink is forbidden/);
});

test('rejects a symlink root', (t) => {
  const root = fixture(t);
  const link = `${root}-link`;
  t.after(() => rmSync(link));
  symlinkSync(root, link);
  const result = check(link);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Root must be a directory, not a symlink/);
});

test('requires one directory argument', () => {
  const result = spawnSync(process.execPath, [checker], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Usage: node scripts\/check-release.mjs/);
});
