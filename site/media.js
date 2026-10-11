// Screenshot media: inline loop playback and the full-size viewer.
// Without this script every frame link still opens its image or clip directly, and clips show their poster.
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const PAUSE_ICON = '<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>';
const PLAY_ICON = '<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5.5v13l10.5-6.5z"/></svg>';
let viewerOpen = false;

// ---------- Inline clips: play only while on screen, never under reduced motion unless asked ----------
// A clip's choice is null (follow the motion preference), 'play' or 'pause' once its toggle is used.
const clips = new Map();
const syncClip = (video) => {
  const clip = clips.get(video);
  const wanted = clip.choice ? clip.choice === 'play' : !reduce.matches;
  if (clip.visible && wanted && !viewerOpen) video.play().catch(() => renderToggle(video));
  else video.pause();
};
const renderToggle = (video) => {
  const { toggle } = clips.get(video);
  const playing = !video.paused;
  toggle.innerHTML = playing ? PAUSE_ICON : PLAY_ICON;
  toggle.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} animation`);
};
const visibility = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    clips.get(entry.target).visible = entry.isIntersecting;
    syncClip(entry.target);
  }
}, { threshold: 0.5 });

for (const video of document.querySelectorAll('.carousel .frame video')) {
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'motion-toggle';
  video.closest('.slide').append(toggle);
  clips.set(video, { toggle, visible: false, choice: null });
  toggle.addEventListener('click', () => {
    clips.get(video).choice = video.paused ? 'play' : 'pause';
    syncClip(video);
  });
  video.addEventListener('play', () => renderToggle(video));
  video.addEventListener('pause', () => renderToggle(video));
  renderToggle(video);
  visibility.observe(video);
}
reduce.addEventListener('change', () => clips.forEach((_, video) => syncClip(video)));

// ---------- Viewer: native modal dialog, one gallery at a time ----------
const viewer = document.createElement('dialog');
viewer.className = 'lightbox';
viewer.innerHTML = `
  <div class="lightbox-bar">
    <p class="lightbox-count" aria-live="polite"></p>
    <button class="lightbox-btn lightbox-close" type="button" aria-label="Close viewer" autofocus>&#215;</button>
  </div>
  <figure class="lightbox-figure">
    <div class="lightbox-stage"></div>
    <figcaption class="lightbox-caption"></figcaption>
  </figure>
  <button class="lightbox-btn lightbox-nav" type="button" data-dir="-1" aria-label="Previous">&#8592;</button>
  <button class="lightbox-btn lightbox-nav" type="button" data-dir="1" aria-label="Next">&#8594;</button>`;
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
    Object.assign(media, { poster: item.poster, muted: true, loop: true, playsInline: true, controls: true, autoplay: !reduce.matches });
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
  clips.forEach((_, video) => syncClip(video));
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
  const nearControls = media?.tagName === 'VIDEO' && event.clientY > media.getBoundingClientRect().bottom - 56;
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
  clips.forEach((_, video) => syncClip(video));
  // Return focus to the item last viewed; the carousel follows focus, so it lands on that slide.
  items[index]?.link.focus({ preventScroll: true });
});
