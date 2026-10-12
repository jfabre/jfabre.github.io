// Screenshot media: inline loop playback and the full-size viewer.
// Without this script every frame link still opens its image or clip directly, and clips show their poster.
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
let viewerOpen = false;

// ---------- Inline clips: loop only while on screen, never under reduced motion ----------
const visible = new Set();
const syncClip = (video) => {
  // A refused autoplay (e.g. iOS Low Power Mode) just leaves the poster showing.
  if (visible.has(video) && !reduce.matches && !viewerOpen) video.play().catch(() => {});
  else video.pause();
};
const clips = [...document.querySelectorAll('.carousel .frame video')];
const visibility = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) visible.add(entry.target);
    else visible.delete(entry.target);
    syncClip(entry.target);
  }
}, { threshold: 0.5 });
for (const video of clips) visibility.observe(video);
reduce.addEventListener('change', () => clips.forEach(syncClip));

// ---------- Viewer: native modal dialog, one gallery at a time ----------
const viewer = document.createElement('dialog');
viewer.className = 'lightbox';
viewer.innerHTML = `
  <div class="lightbox-bar">
    <p class="lightbox-count" aria-live="polite"></p>
    <button class="lightbox-btn lightbox-close" type="button" aria-label="Close viewer" autofocus><span aria-hidden="true">&#215;</span></button>
  </div>
  <figure class="lightbox-figure">
    <div class="lightbox-stage"></div>
    <figcaption class="lightbox-caption"></figcaption>
  </figure>
  <button class="lightbox-btn lightbox-nav" type="button" data-dir="-1" aria-label="Previous"><span aria-hidden="true">&#8592;</span></button>
  <button class="lightbox-btn lightbox-nav" type="button" data-dir="1" aria-label="Next"><span aria-hidden="true">&#8594;</span></button>`;
document.body.append(viewer);
const stage = viewer.querySelector('.lightbox-stage');
const caption = viewer.querySelector('.lightbox-caption');
const counter = viewer.querySelector('.lightbox-count');
const [prev, next] = viewer.querySelectorAll('.lightbox-nav');
let items = [];
let index = 0;

const describe = (link) => {
  const media = link.querySelector('img, video');
  const row = link.closest('.row');
  return {
    link,
    href: link.getAttribute('href'),
    video: media.tagName === 'VIDEO',
    poster: media.getAttribute('poster'),
    label: media.getAttribute('alt') ?? media.getAttribute('aria-label'),
    width: media.getAttribute('width'),
    height: media.getAttribute('height'),
    title: (link.closest('.slide')?.querySelector('.slide-title') ?? row.querySelector('.title')).textContent,
    project: row.querySelector('.title').textContent,
  };
};

const show = (i) => {
  index = i;
  const item = items[i];
  const media = document.createElement(item.video ? 'video' : 'img');
  media.className = 'lightbox-media';
  media.src = item.href;
  media.width = item.width;
  media.height = item.height;
  media.style.setProperty('--ratio', `${item.width} / ${item.height}`);
  media.style.setProperty('--w', item.width);
  if (item.video) {
    // A clean loop with no player chrome; under reduced motion it doesn't autoplay, so it keeps controls to start it.
    Object.assign(media, { poster: item.poster, muted: true, loop: true, playsInline: true, controls: reduce.matches, autoplay: !reduce.matches });
    media.disablePictureInPicture = true;
    media.setAttribute('aria-label', item.label);
  } else {
    media.alt = item.label;
  }
  stage.replaceChildren(media);
  caption.textContent = item.title;
  counter.textContent = items.length > 1 ? `${i + 1} / ${items.length}` : '';
  prev.hidden = next.hidden = items.length < 2;
  prev.disabled = i === 0;
  next.disabled = i === items.length - 1;
  // Warm the neighbours so stepping through stills is instant; clips stream on demand.
  for (const near of [items[i - 1], items[i + 1]]) if (near && !near.video) new Image().src = near.href;
};
const step = (dir) => {
  const target = index + dir;
  if (target >= 0 && target < items.length) show(target);
};

document.addEventListener('click', (event) => {
  const link = event.target.closest('.carousel .frame-link');
  if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  const carousel = link.closest('[data-carousel]');
  const links = [...carousel.querySelectorAll('.frame-link')];
  items = links.map(describe);
  viewer.setAttribute('aria-label', `${items[0].project}, full-size view`);
  show(links.indexOf(link));
  viewerOpen = true;
  clips.forEach(syncClip);
  viewer.showModal();
});

for (const button of [prev, next]) button.addEventListener('click', () => step(Number(button.dataset.dir)));
viewer.querySelector('.lightbox-close').addEventListener('click', () => viewer.close());
viewer.addEventListener('keydown', (event) => {
  if (event.target.closest('video')) return; // native player keys (seek, play) win inside the clip
  if (event.key === 'ArrowLeft') step(-1);
  else if (event.key === 'ArrowRight') step(1);
  else return;
  event.preventDefault();
});

// Swipe between items on touch; a horizontal drag near a clip's control strip is left to the player.
let swipe = null;
let swiped = false;
stage.addEventListener('pointerdown', (event) => {
  const media = stage.firstElementChild;
  const nearControls = media?.tagName === 'VIDEO' && media.controls && event.clientY > media.getBoundingClientRect().bottom - 56;
  swipe = event.pointerType === 'mouse' || nearControls ? null : { x: event.clientX, y: event.clientY };
});
stage.addEventListener('pointerup', (event) => {
  if (!swipe) return;
  const dx = event.clientX - swipe.x;
  const dy = event.clientY - swipe.y;
  swipe = null;
  if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
  swiped = true;
  step(dx < 0 ? 1 : -1);
});
stage.addEventListener('pointercancel', () => { swipe = null; });

// Clicking anywhere in the dimmed surround closes; the media, text and buttons keep their clicks.
viewer.addEventListener('click', (event) => {
  if (swiped) { swiped = false; return; }
  if (!event.target.closest('.lightbox-media, .lightbox-btn, .lightbox-caption, .lightbox-count')) viewer.close();
});

viewer.addEventListener('close', () => {
  stage.replaceChildren();
  viewerOpen = false;
  clips.forEach(syncClip);
  // Return focus to the item last viewed; the carousel follows focus, so it lands on that slide.
  items[index]?.link.focus({ preventScroll: true });
});
