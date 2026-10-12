// Per-project screenshot carousel. Controls always render; arrows disable at the ends. The track is a native scroll-snap strip, so swipe,
// trackpad and keyboard scrolling work without script; this adds prev/next and a counter.
// Buttons ship disabled in the markup and are enabled here only once the state is known.
// Only the visible slide's link is tabbable, so Tab moves track → slide → arrows and off-screen
// slides are reached with the arrows or by scrolling the track.
for (const carousel of document.querySelectorAll('[data-carousel]')) {
  const track = carousel.querySelector('.carousel-track');
  const slides = [...track.querySelectorAll(':scope > .slide')];
  const count = carousel.querySelector('.carousel-count');
  const [prev, next] = carousel.querySelectorAll('.carousel-btn');
  const links = slides.map((slide) => (slide.matches('a') ? slide : slide.querySelector('.frame-link')));
  const last = slides.length - 1;
  const clamp = (i) => Math.min(Math.max(i, 0), last);
  const offset = (i) => slides[i].offsetLeft - slides[0].offsetLeft;
  let index = 0;
  let pending = null; // target of an in-flight button scroll, so rapid clicks accumulate

  // A hidden (zero-width) track keeps the last known index.
  const nearest = () => {
    if (!track.clientWidth) return index;
    let best = 0;
    for (let i = 1; i <= last; i++) {
      if (Math.abs(offset(i) - track.scrollLeft) < Math.abs(offset(best) - track.scrollLeft)) best = i;
    }
    return best;
  };
  const render = () => {
    count.textContent = `${index + 1} / ${slides.length}`;
    prev.disabled = index === 0;
    next.disabled = index === last;
    carousel.style.setProperty('--progress', ((index + 1) / slides.length).toFixed(4));
    links.forEach((link, i) => { if (i === index) link.removeAttribute('tabindex'); else link.tabIndex = -1; });
  };
  const sync = () => {
    const settled = nearest();
    if (pending !== null && settled !== pending) return;
    pending = null;
    index = settled;
    render();
  };

  for (const button of [prev, next]) {
    button.addEventListener('click', () => {
      index = clamp((pending ?? index) + Number(button.dataset.dir));
      pending = index;
      render();
      track.scrollTo({ left: offset(index) });
    });
  }
  // Browsers do not reliably scroll a snap strip to a newly focused link; keep focus in view.
  track.addEventListener('focusin', (event) => {
    const focused = slides.findIndex((slide) => slide.contains(event.target));
    if (focused < 0 || focused === (pending ?? index)) return;
    index = pending = focused;
    render();
    track.scrollTo({ left: offset(index) });
  });
  track.addEventListener('scroll', sync, { passive: true });
  // A drag can interrupt a button scroll; once scrolling stops, the actual position wins.
  track.addEventListener('scrollend', () => { pending = null; sync(); });
  new ResizeObserver(() => {
    if (!track.clientWidth) return;
    pending = null;
    track.scrollTo({ left: offset(index), behavior: 'instant' });
    render();
  }).observe(track);
  render();
}
