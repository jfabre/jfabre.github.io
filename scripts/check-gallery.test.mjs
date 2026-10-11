import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

// Site-specific gallery contract: slide counts, captions and local assets.
const site = fileURLToPath(new URL('../site/', import.meta.url));
const html = readFileSync(join(site, 'index.html'), 'utf8');
const expected = { 'shadowdark-sheet': 3, 'torchlight-timer': 3, 'dungeon-mapper': 1, 'npc-voice': 3 };

function rows() {
  return Object.fromEntries([...html.matchAll(/<li class="row[^"]*" data-project="([^"]+)"[\s\S]*?<\/li>\s*(?=<li class="row|<\/ol>)/g)]
    .map(([block, id]) => [id, block]));
}
const slidesOf = (block) => [...block.matchAll(/<(?:div|a) class="slide(?: [^"]*)?"[\s\S]*?(?=<(?:div|a) class="slide(?: [^"]*)?"|<\/div>\s*<figcaption)/g)].map(([s]) => s);

test('projects keep order and slide counts 3/3/1/3', () => {
  const found = rows();
  assert.deepEqual(Object.keys(found), Object.keys(expected));
  for (const [id, count] of Object.entries(expected)) {
    assert.equal(slidesOf(found[id]).length, count, id);
    assert.match(found[id], new RegExp(`class="carousel-count"[^>]*>1 / ${count}<`), `${id} counter`);
  }
});

test('nine feature slides each carry heading, description, provenance and described media', () => {
  const featured = Object.entries(rows()).filter(([id]) => id !== 'dungeon-mapper').flatMap(([, b]) => slidesOf(b));
  assert.equal(featured.length, 9);
  for (const slide of featured) {
    assert.match(slide, /<h4 class="slide-title">[^<]+<\/h4>/);
    assert.match(slide, /<p class="slide-text">[^<]+<\/p>/);
    assert.match(slide, /<p class="slide-source">[^<]+<\/p>/);
    const media = slide.match(/<(img|video) [^>]*>/);
    assert.ok(media, 'slide media');
    assert.match(media[0], /width="\d+" height="\d+"/);
    assert.match(media[0], media[1] === 'img' ? / alt="[^"]{10,}"/ : / aria-label="[^"]{10,}"/);
  }
});

test('gallery media are unique existing local files, each linked full size', () => {
  const sources = [...html.matchAll(/<(?:img|video) src="([^"]+)"/g)].map(([, s]) => s);
  assert.equal(sources.length, 10);
  assert.equal(new Set(sources).size, 10);
  for (const src of sources) {
    assert.match(src, /^assets\/projects\/[a-z-]+\.(?:webp|mp4)$/);
    assert.ok(existsSync(join(site, src)), src);
    assert.ok(html.includes(`href="${src}"`), `full-size link ${src}`);
  }
  assert.doesNotMatch(html, /modcdn|mod\.io/i);
});

test('Darklight slides are short muted inline loops with a still poster and no autoplay attribute', () => {
  const videos = [...rows()['torchlight-timer'].matchAll(/<video [^>]*>/g)].map(([v]) => v);
  assert.equal(videos.length, 3);
  for (const video of videos) {
    for (const attr of [' muted', ' loop', ' playsinline', ' preload="none"']) assert.ok(video.includes(attr), `${attr} in ${video}`);
    assert.doesNotMatch(video, / autoplay/);
    const poster = video.match(/ poster="(assets\/projects\/[a-z-]+\.webp)"/);
    assert.ok(poster && existsSync(join(site, poster[1])), video);
  }
  assert.match(html, /<script src="media\.js" defer><\/script>/);
});

test('Dungeon Mapper image and slide are unchanged', () => {
  const block = rows()['dungeon-mapper'];
  assert.ok(block.includes('<a class="slide frame-link" href="assets/projects/dungeon-mapper.webp" aria-label="View full image: Dungeon Mapper overlay of a 2D dungeon layout with rooms, corridors and validation markers">'));
  assert.ok(block.includes('width="1600" height="993"'));
  const hash = createHash('sha256').update(readFileSync(join(site, 'assets/projects/dungeon-mapper.webp'))).digest('hex');
  assert.equal(hash, '6121a4e4ac4631af13ce704e767cced339a903832a6d98d4a3b00818b835d8ad');
});
