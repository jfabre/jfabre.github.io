import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

// Site design contract: font bytes, grain, contrast floors, accent hooks, motion gating.
const site = fileURLToPath(new URL('../site/', import.meta.url));
const FRAUNCES_SHA256 = '7e744849028e2219e2aa1bc467dc4032980dc4487c9c3da3010081cd72d3b103';
const PRELOAD = '<link rel="preload" href="assets/fonts/fraunces-latin-full-normal.woff2" as="font" type="font/woff2" crossorigin>';
const PROJECT_IDS = ['shadowdark-sheet', 'torchlight-timer', 'dungeon-mapper', 'npc-voice'];
const NO_PREFERENCE = '@media (prefers-reduced-motion: no-preference)';
const SCROLL_TIMELINE = '@supports (animation-timeline: view())';
const css = readFileSync(join(site, 'styles.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const indexHtml = readFileSync(join(site, 'index.html'), 'utf8');

const norm = (value) => value.replace(/\s+/g, ' ').trim();

function parseCss(source) {
  const blocks = [];
  const preludes = [];
  const stack = [];
  let i = 0;
  let preludeStart = 0;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '"' || ch === "'") {
      i += 1;
      while (i < source.length) {
        if (source[i] === '\\') { i += 2; continue; }
        if (source[i] === ch) { i += 1; break; }
        i += 1;
      }
      continue;
    }
    if (ch === '{') {
      preludes.push([preludeStart, i]);
      const block = { prelude: source.slice(preludeStart, i).trim(), bodyStart: i + 1, bodyEnd: source.length };
      blocks.push(block);
      stack.push(block);
      i += 1;
      preludeStart = i;
      continue;
    }
    if (ch === '}') {
      const block = stack.pop();
      assert.ok(block, 'unbalanced CSS braces');
      block.bodyEnd = i;
      i += 1;
      preludeStart = i;
      continue;
    }
    i += 1;
  }
  assert.equal(stack.length, 0, 'unbalanced CSS braces');
  return { blocks, preludes };
}

const parsed = parseCss(css);
const bodyOf = (block) => css.slice(block.bodyStart, block.bodyEnd);

function enclosedBy(index, pred) {
  return parsed.blocks.some((block) => index >= block.bodyStart && index < block.bodyEnd && pred(block));
}

function blockWith(prelude) {
  return parsed.blocks.find((block) => norm(block.prelude) === prelude);
}

function channel(pair) {
  const srgb = Number.parseInt(pair, 16) / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

function contrast(left, right) {
  const luminance = (hex) => {
    const digits = hex.slice(1);
    const full = digits.length === 3 ? [...digits].map((item) => item + item).join('') : digits;
    return 0.2126 * channel(full.slice(0, 2)) + 0.7152 * channel(full.slice(2, 4)) + 0.0722 * channel(full.slice(4, 6));
  };
  const [hi, lo] = [luminance(left), luminance(right)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

function rootTokens() {
  const root = blockWith(':root');
  assert.ok(root, 'missing :root block');
  const tokens = {};
  for (const match of bodyOf(root).matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})/g)) tokens[match[1]] = match[2];
  return tokens;
}

test('(a) vendored Fraunces file is wOF2 with the pinned digest', () => {
  const fontPath = join(site, 'assets/fonts/fraunces-latin-full-normal.woff2');
  assert.ok(existsSync(fontPath), fontPath);
  const font = readFileSync(fontPath);
  assert.equal(font.subarray(0, 4).toString('ascii'), 'wOF2');
  assert.equal(createHash('sha256').update(font).digest('hex'), FRAUNCES_SHA256);
});

test('(b) @font-face names Fraunces and --font-serif starts with it', () => {
  const face = parsed.blocks.find((block) => norm(block.prelude) === '@font-face' && /font-family:\s*"Fraunces"/.test(bodyOf(block)));
  assert.ok(face, 'missing Fraunces @font-face');
  const body = bodyOf(face);
  assert.match(body, /font-display:\s*swap/);
  const url = body.match(/url\(\s*(['"]?)([^'")\s]+)\1\s*\)/);
  assert.ok(url, 'missing font url');
  const resolved = resolve(site, url[2]);
  assert.ok(resolved.startsWith(resolve(site) + sep), url[2]);
  assert.ok(existsSync(resolved), url[2]);
  const serif = css.match(/--font-serif:\s*([^;]+)/);
  assert.ok(serif, 'missing --font-serif');
  assert.ok(serif[1].trim().startsWith('"Fraunces"'));
});

test('(c) font preload precedes the stylesheet in index and 404', () => {
  for (const name of ['index.html', '404.html']) {
    const html = readFileSync(join(site, name), 'utf8');
    assert.equal(html.split(PRELOAD).length - 1, 1, name);
    assert.ok(html.indexOf(PRELOAD) < html.indexOf('<link rel="stylesheet"'), `${name} preload order`);
  }
});

test('(d) OFL text lives outside site/', () => {
  const licence = readFileSync(fileURLToPath(new URL('../third-party/fraunces/OFL.txt', import.meta.url)), 'utf8');
  assert.ok(licence.includes('SIL OPEN FONT LICENSE Version 1.1'));
  for (const rel of readdirSync(site, { recursive: true })) {
    for (const part of String(rel).split(sep)) assert.doesNotMatch(part, /OFL|LICENSE/i, String(rel));
  }
});

test('(e) grain turbulence is the body background', () => {
  const grain = readFileSync(join(site, 'assets/texture/grain.svg'), 'utf8');
  assert.match(grain, /feTurbulence/);
  const referenced = parsed.blocks.some((block) => (
    /(?:^|[\s,>+~])body(?![\w-])/.test(block.prelude)
    && /background(?:-image)?\s*:[^;]*assets\/texture\/grain\.svg/.test(bodyOf(block))
  ));
  assert.ok(referenced, 'body background missing grain');
});

test('(f) accent tokens meet contrast floors', () => {
  assert.ok(Math.abs(contrast('#000000', '#ffffff') - 21) <= 0.01);
  assert.ok(contrast('#777777', '#ffffff') < 4.5);
  const tokens = rootTokens();
  for (const name of ['--bg', '--paper', '--ink', '--on-ink', '--accent', '--spire', '--ember', '--mapper', '--npc', '--ring-on-ink']) {
    assert.match(tokens[name] ?? '', /^#[0-9a-fA-F]{3,8}$/, name);
  }
  for (const name of ['--accent', '--spire', '--ember', '--mapper', '--npc']) {
    for (const surface of ['--bg', '--paper']) {
      const ratio = contrast(tokens[name], tokens[surface]);
      assert.ok(ratio >= 4.5, `${name} on ${surface} contrast ${ratio.toFixed(2)} is below 4.5`);
    }
  }
  const onInk = contrast(tokens['--on-ink'], tokens['--ink']);
  assert.ok(onInk >= 4.5, `--on-ink on --ink contrast ${onInk.toFixed(2)} is below 4.5`);
  const ring = contrast(tokens['--ring-on-ink'], tokens['--ink']);
  assert.ok(ring >= 3, `--ring-on-ink on --ink contrast ${ring.toFixed(2)} is below 3`);
});

test('(g) each project accent hook is wired in css and html', () => {
  for (const id of PROJECT_IDS) {
    assert.ok(css.includes(`[data-project="${id}"]`), id);
    assert.ok(css.includes(`.index-link[href="#project-${id}-title"]`), id);
    assert.ok(indexHtml.includes(`href="#project-${id}-title"`), id);
    assert.ok(indexHtml.includes(`id="project-${id}-title"`), id);
  }
});

test('(h) reveal motion stays inside reduced-motion and scroll-timeline guards', () => {
  const opacityZero = /opacity:\s*0[;\s}]/g;
  assert.equal('opacity: 0.4'.match(opacityZero), null);
  const zeros = [...css.matchAll(opacityZero)];
  assert.ok(zeros.length > 0, 'missing keyframe opacity 0');
  for (const match of zeros) {
    assert.ok(enclosedBy(match.index, (block) => /^@keyframes\b/.test(norm(block.prelude))), 'opacity 0 outside @keyframes');
  }

  const support = blockWith(SCROLL_TIMELINE);
  assert.ok(support, 'missing scroll-timeline support block');
  assert.ok(enclosedBy(support.bodyStart, (block) => norm(block.prelude) === NO_PREFERENCE), 'supports outside no-preference');
  const inPrelude = (index) => parsed.preludes.some(([start, end]) => index >= start && index < end);
  const timelines = [...css.matchAll(/animation-timeline/g)].filter((match) => !inPrelude(match.index));
  assert.ok(timelines.length > 0, 'missing animation-timeline declaration');
  for (const match of timelines) {
    assert.ok(enclosedBy(match.index, (block) => norm(block.prelude) === SCROLL_TIMELINE), 'animation-timeline outside @supports');
  }

  const rises = [...css.matchAll(/animation\s*:\s*([^;}{]+)/g)].filter((match) => match[1].includes('rise'));
  assert.ok(rises.length > 0, 'missing rise animation');
  for (const match of rises) {
    assert.ok(enclosedBy(match.index, (block) => norm(block.prelude) === NO_PREFERENCE), 'rise animation outside no-preference');
  }

  const reduce = blockWith('@media (prefers-reduced-motion: reduce)');
  assert.ok(reduce, 'missing reduce media');
  assert.match(bodyOf(reduce), /animation:\s*none\s*!important/);
});

test('(i) print and forced-colors blocks keep their contract', () => {
  const print = blockWith('@media print');
  assert.ok(print, 'missing print media');
  assert.ok(bodyOf(print).includes('.contact'));
  const forced = blockWith('@media (forced-colors: active)');
  assert.ok(forced, 'missing forced-colors media');
  assert.match(bodyOf(forced), /background-image:\s*none/);
});
