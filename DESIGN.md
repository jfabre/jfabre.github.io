# DESIGN.md — Portfolio design spec (B selected; A/C kept as comparison record)

Status: **B, Light editorial, is the selected direction** (user choice recorded 2026-09-27 in `.omo/drafts/portfolio-demo-selection.md`: `selected: B`, `scope: unchanged`). Section 3 is now the production contract for `site/`. Sections 2 and 4 (A and C) are retained unchanged as the comparison record and are not built.

Production notes (task 11, 2026-09-30):

- `site/styles.css` is §1 foundations plus §3 merged into one unscoped stylesheet: the `[data-variant="b"]` scope and `--b-` prefixes are dropped (`--bg`, `--ink`, `--accent`, …), the demo switcher and showcase chrome (§1.4, §7) do not exist, and the placeholder frame stripes are removed because real captures ship. Values are otherwise identical to §3. The tokens now include the accent set (`--spire`, `--ember`, `--mapper`, `--npc`, `--accent`, `--ring-on-ink`).
- Layout tiers are container queries on `.rows`: single column, two columns at 38em (ordinal + text / image), three columns with alternation at 52em (`.is-alt` swaps text and image columns).
- Added primitives: `.skip-link` (ink on off-white, revealed on `:focus-visible`), `.not-found` for `404.html` reusing `.ordinal`, `.name`, `.role`, `.deck`, `.btn`.
- Canonical URL `https://jfabre.github.io/` lives in `site/index.html`, `site/sitemap.xml` and `site/robots.txt` only. Changing the host is a content edit in those three files; no runtime code depends on it.
- The CV remark in the user's choice did not add scope: no timeline, dates, employers, or downloadable CV. CV requests go through LinkedIn: the footer reads "Let’s talk." (`h2.contact-text`), with the footer LinkedIn link labelled "Message me on LinkedIn".

Production notes (feature galleries, 2026-09-30):

- User-approved removals: the "Selected projects" heading, the "View my projects" button and the projects intro paragraph are gone (the intro sentence is now the opener deck; the projects section is labelled by a visually hidden `h2#projects-heading` "Selected projects", so the outline runs h1 → h2 → h3 → h4); the opener carries LinkedIn and GitHub (`https://github.com/jfabre`, exact profile only) as icon + text social links, repeated in the footer.
- Each project image is a native scroll-snap carousel (`[data-carousel]`, `site/carousel.js`). Slide counts: Dark Spire 3, Darklight 3, Dungeon Mapper 1 (unchanged image and markup), NPC Voice 3.
- Feature slides are a `div.slide` holding a full-image `a.frame-link` plus a `.slide-caption`: serif `.slide-title` (h4, 1.1875rem), sans `.slide-text` (0.9375rem), muted `.slide-source` provenance line (0.8125rem). The caption is text, never part of the link. Slides stretch to the tallest caption so each step is exactly one track width; captioned tracks drop the track shadow.
- Controls: prev/next buttons plus a `n / N` counter, always rendered. Buttons ship `disabled` in markup and are enabled by script, so no-JS readers never see live-looking dead buttons; content stays reachable by native horizontal scroll. No autoplay, no wrap; arrows disable at the ends; Mapper stays 1 / 1 with both disabled.
- Script contract: index is the slide nearest `scrollLeft` (by slide offset, clamped; a zero-width hidden track keeps its last index); rapid clicks accumulate on the pending target; `scrollend` hands control back to the real position after a drag; a `ResizeObserver` re-snaps to the current slide instantly; `focusin` scrolls a keyboard-focused slide into view. Reduced motion inherits the global `scroll-behavior: auto`.
- Focus: the track clips overflow, so a focused slide link draws its ring inside the `.frame` (inset by the ring width) rather than on the link.
- Dark captures (Dark Spire, Darklight) sit in `.frame.is-dark`. In the row, captures whose shape or size would shrink their text are close-up crops (`.frame.is-crop`, owner-approved 2026-10-12): the image fills the 4:3 frame edge to edge with `object-fit: cover`, an inline `--crop` focus (also the zoom origin) and an optional `--zoom`, tuned so each crop shows what its caption names: sheet and inventory top (`50% 0%`), party cards (`80% 50%`), torch and light spell centred on flame and time (`50% 55%`), light board top, NPC editor (`62% 0%`), NPC scene context and transcript (`55% 0%`, zoom 1.25), transcript top-left. The Dungeon Mapper map stays contained. The full-size viewer always shows the whole capture, unchanged.
- Link previews: `site/assets/social/preview.jpg` (1200×630, JPEG q86, stripped, about 115 KB) is the opener redrawn as a card from `site/styles.css` itself (paper, grain, Newsreader name 108px and role 44px, deck in `--muted` sans, the framed portrait with its ink offset, the four accent-ruled index items and the double hairline), rendered in Chromium at DPR 2 and downscaled. `index.html` carries `og:*` and `twitter:card` tags; `og:url` and `og:image` are the only absolute self-references besides the canonical link, and the static checker accepts `og:image` only as an existing image under `assets/social/`. Re-render the card when the name, role, deck, portrait or project list changes.
- Dark Spire sheet and party captures (`shadowdark-sheet.webp`, `shadowdark-party.webp`) are taken from the v1.0.1 release in Chromium at an 800px viewport, DPR 2, clipped to the 484px column so the fixed settings button stays out of frame. Character portraits are head crops of public-domain (CC0) paintings from The Met's Open Access collection, captioned on the slide as public-domain paintings: Ira Voss, Rembrandt, *Bellona*, 1633 (32.100.23); Wren, Biagio d'Antonio, *Portrait of a Young Man*, ca. 1470 (32.100.68); Odo, Velázquez, *Portrait of a Man*, ca. 1650 (89.15.29); Sela, Rembrandt, *Flora*, ca. 1654 (26.101.10). Party peers are injected through the app's `renderPartyPanel`, so the slide stays a simulated session.
- Darklight slides are recorded clips, not stills: H.264 MP4 (`torchlight-timer|spell|board.mp4`, 1080×1800, 30 fps, 6–7 s, under 300 KB each), recorded from the real app under a virtual clock so frames are evenly spaced. Torch and spell loops cross-fade their last half second into the first, except the countdown, which cuts. Markup is `<video muted loop playsinline preload="none">` with a WebP poster of the first frame and no `autoplay` attribute. `site/media.js` plays a clip only while at least half of it is on screen. Under reduced motion it never plays. There is no inline play/pause toggle: the user chose a clean loop over WCAG 2.2.2 (accepted debt; reduced motion is the only way to stop motion). Without JS, the poster shows and the link opens the MP4.
- Full-size viewer (`site/media.js`): clicking any carousel frame link opens a native modal `<dialog class="lightbox">` scoped to that project's slides. It has an ink surround, the slide title as caption (the project title for Dungeon Mapper), an `n / N` count, prev/next arrows that disable at the ends with no wrap, arrow keys, touch swipe, Esc, a close button and click-outside to close. Media fit the stage at their own aspect through container units and are never upscaled past their declared width. Clips loop without player controls, by the user's choice; under reduced motion they don't autoplay and show native controls instead. Inline clips pause while the viewer is open. Closing focuses the last-viewed slide's link, so the carousel follows. Modified clicks (Ctrl/⌘/Shift/Alt) keep the native link behaviour.
- Image provenance and captions are recorded in `.omo/drafts/portfolio-gallery-image-assessment.md` (private).

Production notes (visual character, 2026-10-11):

- Font: Fraunces variable, file `site/assets/fonts/fraunces-latin-full-normal.woff2` from `@fontsource-variable/fraunces` 5.3.0, unmodified, sha256 `7e744849028e2219e2aa1bc467dc4032980dc4487c9c3da3010081cd72d3b103`. Axes: opsz, wght, SOFT, WONK. Preload with `crossorigin` on `site/index.html` and `site/404.html`. `font-display: swap`. Licence OFL-1.1. Full text in `third-party/fraunces/OFL.txt` in the public repository. The served font carries the copyright notice and the OFL licence URL in its name table (IDs 0 and 14); it has no ID 13 text. Licence text never goes under `site/`, because the static checker rejects its URLs. That supersedes the old "no webfont" rule for `site/`. The name and role use a second vendored face, Newsreader, through `--font-reading`, not Fraunces and not the sans stack. Newsreader variable (opsz 6–72, wght 200–800), file `site/assets/fonts/newsreader-latin-opsz-normal.woff2` from `@fontsource-variable/newsreader` 5.3.0, latin, roman only, unmodified, sha256 `6e4f2958c3a7c4a80acde4e5a679abe7e01bc1e30b92be3c7a8b696ef401d101`. It is preloaded with `crossorigin` after the Fraunces preload and before the stylesheet on both pages, `font-display: swap`, licence OFL-1.1, full text in `third-party/newsreader/OFL.txt`. It was chosen over Source Serif 4 and Literata because its f, j, and J are plain (J sits on the baseline, f has a small teardrop, no swash or wonk) and its display optical size reads as editorial at 96px. `.name` is weight 600 with letter-spacing −0.02em, `.role` is upright weight 400, and neither sets `font-variation-settings`; optical size follows font-size automatically. The opener is calm reading type; the character lives in Fraunces on the project names. The project index sits in the opener and is set in Newsreader too, so the header carries one serif plus the sans; Fraunces starts at the project rows and stays on project titles, ordinals, slide titles, and the contact line. Project titles use `overflow-wrap: normal`. From the 52em row tier they are 1.25rem, and from a 61em container (about 1037px, because container em is the 17px body size) they are `nowrap`, so "The Dark Spire — TaleSpire Character Sheet" (about 416px) sits on one line at 1280.
- Accent tokens, with roles: `--spire` (The Dark Spire, antique gold, `#7a5c12`), `--ember` (Darklight, torch ember, `#a8470a`), `--mapper` (Dungeon Mapper, map green, `#2f6b4c`), `--npc` (NPC Voice, violet, `#6b3fa0`), `--accent` (shared default for links, paper focus, and unmatched rows, `#1d4ed8`), `--ring-on-ink` (focus and hover on the ink band, `#9db7ff`). Computed ratios:

  | Token | on `--bg` | on `--paper` |
  | --- | --- | --- |
  | `--spire` | 5.50 | 5.84 |
  | `--ember` | 5.19 | 5.51 |
  | `--mapper` | 5.57 | 5.91 |
  | `--npc` | 6.51 | 6.91 |
  | `--accent` | 5.91 | 6.28 |

  `--ring-on-ink` is 8.77 on `--ink` and `--on-ink` is 15.26 on `--ink`. Rendered-background darkening from `task-7-contrast.json` is 0.03255, about 3.3%, with grain matrix offset `-0.089`. Accents are mapped only through `[data-project]` and `.index-link[href]` selectors. There are no extra markup hooks. Accents are never used on ink.
- Offset block: `.frame-link` padding plus `::before`. Hover is transform-only. The dark-frame focus ring uses `--ring-on-ink`.
- Carousel progress: `--progress` is set by `render()`; without JS only the hairline shows.
- Grain: a tiled `body` background (`assets/texture/grain.svg`, 200px repeat). The shipped matrix offset is `-0.089`, chosen so mean alpha stays at least 0.015 and rendered darkening stays at most 3.5%. Removed in print and forced colours.
- Opener: the kicker `Portfolio · Four selected projects` and the project index, linking to the existing title ids with `scroll-margin-top: 8rem`.
- Contact band: the footer sits outside `.page` with an inner `.page`.
- Motion addendum: time-based motion stays at most 240 ms. Scroll-linked motion is inside both the no-preference and `@supports` guards, and is exempt from the duration cap. Base styles are always visible. Reduced motion means no animations.
- Print and forced colours: print paints the body white, drops the ink fill on `.contact`, hides the offset block, the progress bar, and the carousel buttons, clears `.frame-link` padding, and disables animations. Forced colours remove the grain image, hide the offset block, the progress bar, and the title accent rule, and clear `.frame-link` padding. Focus rings stay.
- Known limitation: 404 styling only applies at top-level paths, because asset paths must be relative.
- Static-checker text traps for any `site/` text file: no URLs, no `github.com`, no `xlink`, no `//` without a following space, and no scheme-like substrings such as `data:` or `file:`, which also catches words like "metadata:". The same scan also rejects `mailto:`, `tel:`, `sms:`, `javascript:`, and `ftp:`, including a word such as "profile:". Sanctioned exceptions already in the checker are the two profile links, the four exact project links (TaleSpire, Shadowdark, and the Dark Spire and Darklight mod.io pages, as inline `.text-link` anchors opening in a new tab), the canonical link, sitemap and robots self-references, and the exact SVG namespace in `.svg` files.

Production notes (dark theme, 2026-10-11):

- The light theme is the original contract and is unchanged pixel for pixel; the only new light pixels are the 44px theme switch. The dark theme is the same magazine printed on dark stock: warm near-black paper, cream ink, lighter per-project inks, a light-speck grain.
- Semantic dark-surface tokens replace `--ink` used as a fill. `--stage` / `--on-stage` (`#1b1a1f` / `#f6f0e6`, never themed) sit behind dark captures (`.frame.is-dark`) and the full-size viewer, so dark screenshots and video letterboxes look the same in both themes. `--stage-line` is the `.frame.is-dark` edge (invisible on cream, a hairline on dark stock). `--band` / `--on-band` / `--band-edge` are the contact footer: the ink band in light, a deeper band than the page with a hairline top edge in dark, never inverted to cream. `--ink` / `--on-ink` remain text and the primary button / skip link, which invert naturally (cream button, dark label). `--ring-on-ink` is the focus and hover colour on the stage and the band in both themes.
- Mechanism: `site/styles.css` §2b holds the dark list twice, under `@media screen { :root[data-theme="dark"] }` and `@media screen and (prefers-color-scheme: dark) { :root:not([data-theme]) }`; `check-design.test.mjs` (j) requires the two to be identical. Both are screen-only, so print always uses the light tokens. `:root` carries `color-scheme: light`, the dark lists `color-scheme: dark`; the meta is `light dark`. Grain is `var(--grain, url("assets/texture/grain.svg"))`; dark sets `--grain` to `assets/texture/grain-dark.svg` (same turbulence and alpha matrix, specks in the dark `--ink` colour).
- Dark tokens and computed ratios (WCAG 2.x):

  | Token | Value | on `--bg` `#1a1612` | on `--paper` `#221d18` |
  | --- | --- | --- | --- |
  | `--ink` | `#ece3d2` | 14.12 | 13.11 |
  | `--muted` | `#a99e8c` | 6.82 | 6.33 |
  | `--accent` (links, focus ring) | `#8fabf7` | 8.00 | 7.43 |
  | `--spire` | `#cfa64a` | 7.89 | 7.32 |
  | `--ember` | `#e8854b` | 6.76 | 6.28 |
  | `--mapper` | `#72b791` | 7.62 | 7.08 |
  | `--npc` | `#b499ea` | 7.44 | 6.91 |
  | `--rule` (decorative) | `#433a30` | 1.62 | 1.50 |

  `--on-ink` `#1a1612` is 14.12 on `--ink` and 8.00 on `--accent` (primary button hover). `--band` `#0e0c0a` carries `--on-band` `#ece3d2` at 15.33 and `--ring-on-ink` at 9.90; on `--stage` the ring is 8.77. `theme-color` is `#f6f0e6` light and `#1a1612` dark.
- Switch: a 44px square `button.theme-toggle` (moon in light, sun in dark: the icon names the theme a click switches to) at the top-right of `.page`, out of flow, with a `--control-edge` border like the carousel buttons (`#8b857c` light, 3.23:1 on `--bg`; `#76695a` dark, 3.37:1; set in both dark lists), because a control boundary needs 3:1 where the decorative `--rule` is about 1.5:1. Its accessible name and tooltip state the action ("Switch to dark theme" / "Switch to light theme"); no `aria-pressed`, because a pressed state on an action label reads as a double negative. It ships `hidden` and is revealed by script, and is hidden in print.
- Behaviour (inline script in `<head>`, before the stylesheet, identical on both pages): a saved `localStorage.theme` of `light` or `dark` wins; otherwise the system preference applies and is followed live. The script always sets `data-theme` before the stylesheet and body are parsed, so the first paint has the right theme, and it keeps both `theme-color` metas on the active colour. A click saves an explicit choice, unless the theme it switches to is the one the system already asks for: then the saved choice is removed and the page follows the system again, so the two-state switch also leads back to "system". Blocked storage falls back to the system preference and the switch still works for the page view. Without script the media-query list follows the system and the switch stays hidden. The switch is instant: no colour transitions were added.

Production notes (opener portrait, 2026-10-12):

- Portrait: owner-supplied painted portrait, cropped 4:5 (960×1200 from the 1408 square at +245+40, face centred, eyes about 36% down), graded before export (blue hues 0.52–0.68 with saturation above about 15% taken to 68% saturation through a feathered mask, so the polo reads slate and no longer outshouts the warm palette; then a slight warm colour matrix R×1.02, B×0.955; no smoothing filter, because it flattened the source brushwork), exported as WebP q80 at 720×900 (`site/assets/portrait/jeremy.webp`, about 110 KB) and 360×450 (`jeremy-360.webp`, about 24 KB) with all EXIF/XMP/ICC stripped (`magick -strip`), served via `srcset` with `sizes` mirroring the CSS widths (so DPR 3 phones take the 360w file), eager with `fetchpriority="high"`, explicit `width`/`height`, alt "Painted portrait of Jeremy Fabre". It is a `figure.portrait` in `header.opener` between the social links and the index, hung like the project captures: a `--paper` mat (`--space-1`, `--space-2` from 48em), a `--frame-line` hairline and the `--offset` block in `--ink`, not a project accent, because it belongs to no project; dark sets `--portrait-offset` (`#574a3b`, in both dark lists) so the block reads as a shadow rather than a cream slab. The opener is a grid: below 43em the portrait sits top-right at `clamp(7rem, 30vw, 12rem)` (the 12rem cap keeps a real portrait at 600–767px and 200% zoom) with the name bottom-aligned beside it and the role, deck, links and index full width; from 43em (where a one-line name would leave a void above it) it takes its own `clamp(13rem, 22vw, 18rem)` column, with a `--space-4` top margin on name and portrait until 48em to clear the theme switch, beside the name/role/deck/links stack (name top-aligned with it), and the index spans both columns. It starts below the theme switch at every width. Below 48em the opener closes on `--space-6` and the index hangs `--space-6` below the links as a single list with no row gap and `--space-2` above each name (44px targets kept), so at 390×844 the first project title reaches the first screen; from 48em the index returns to `--space-8` and `--space-3`. It is not interactive and has no hover; it joins the opener's gated rise with the name's 40ms delay, since it sits beside the name. The project index is two by two from 37.5em to 64em so four items never wrap 3 + 1. The role reads "Senior Software Developer", matching the title, and the header link is labelled "LinkedIn" beside "GitHub"; the footer keeps "Message me on LinkedIn". Print and forced colours hide the offset block and clear its padding.

---

Original comparison preamble follows.

Status at comparison time: three independent design directions (A, B, C) were specified side by side so they could be built as separate demos and compared fairly.

Scope of this file: shared accessibility and spacing foundations (`demo/styles/base.css`), and three isolated token/type/layout contracts (`demo/styles/a.css`, `b.css`, `c.css`). The primitive showcase that proves the contracts is `demo/showcase.html`. Final variant pages, content module, integration switcher, and the production `site/` are out of scope here.

---

## 0. Research Log

Honest record of what was actually opened while writing this spec. Sources inspired composition grammar only; no brand palette, logo, copy, or layout was copied.

| Lane | Deliverable | Result |
|---|---|---|
| Plan variant briefs | `.omo/plans/portfolio-demo-first.md` Scope lines 27–29 and task 5 (lines 142–148) | Read in full. They are the binding briefs for A/B/C. |
| Prototype skill | Local `prototype` skill `UI.md`, lines 46–54 and 77–90 (agent skill directory; path redacted) | Read. Requirements adopted: variants must be structurally different (different layout, hierarchy, primary affordance — "not wallpaper"); switcher is a bottom-centre pill visually distinct from the page with prev/next, label, and no arrow-key capture in editable fields. |
| Frontend skill embedded references (`references/design/README.md`, `_INDEX.md`, `design-system-architecture.md`, Layer A/B files, `lazyweb.md`) | — | **Not available on disk.** Searched `~/.cache/opencode`, `~/.config/opencode`, `~/.agents`, `~/.claude` for `design-system-architecture.md`, `_INDEX.md`, `lazyweb.md`; none found. The router text injected with the task was followed for its gates (design system before components, primitive showcase, no emoji icons, GPU-only motion, no slop animation, reduced motion) but no Layer B brand file was loaded. Lazyweb screens were therefore **not** viewed. |
| Imagen concept drafts | — | **Skipped deliberately.** The task forbids fabricated product imagery, and a generated mockup would risk becoming a de-facto visual contract for a comparison that must stay open. |
| `visual-qa` bundled `scripts/visual-qa.mjs` | — | **Not available on disk.** Overflow and contrast were measured directly in Playwright (`document.documentElement.scrollWidth`, `getComputedStyle`) and computed with the WCAG 2.x relative-luminance formula. |
| Local fonts | `/System/Library/Fonts`, `/System/Library/Fonts/Supplemental`, `/Library/Fonts` (system directories only; no protected home folders were searched) | Confirmed presence of SF Pro (`system-ui`), New York (`ui-serif`), Charter, Georgia, Iowan Old Style, Palatino, SF Mono / Menlo (`ui-monospace`). These are OS fonts and are **referenced by stack, never vendored**. |

Design-grammar reference points named for orientation only (not opened as files, drawn from general knowledge): developer-tool marketing sites for A's split-hero/index grammar; long-form magazine layouts for B's numbered, alternating rows; photography-portfolio "chapter" pages for C's image-led sections.

---

## 1. Shared foundations (`demo/styles/base.css`)

Everything here applies to all three variants and must not carry visual identity. Variant files may **not** override these rules except where explicitly marked as a hook (`--focus-ring-color`, `--target-min`).

### 1.1 Spacing scale (4px base)

| Token | Value | Use |
|---|---|---|
| `--space-1` | 0.25rem (4px) | hairline gaps |
| `--space-2` | 0.5rem (8px) | inline gaps, chip padding |
| `--space-3` | 0.75rem (12px) | button vertical padding |
| `--space-4` | 1rem (16px) | default gap |
| `--space-5` | 1.5rem (24px) | card padding |
| `--space-6` | 2rem (32px) | group separation |
| `--space-8` | 3rem (48px) | section rhythm (mobile) |
| `--space-10` | 4rem (64px) | section rhythm (tablet) |
| `--space-12` | 6rem (96px) | section rhythm (desktop) |

Variants choose *which* steps they use (A is tight, B is airy, C is tall) but never invent off-scale values.

### 1.2 Accessibility contract

- **Contrast:** body text ≥ 4.5:1 against its actual background; large text (≥ 24px regular or ≥ 18.66px bold), control borders, and focus indicators ≥ 3:1. Measured values are recorded in §5 and in evidence. Decorative rules may fall below 3:1 and must not be the only separator of meaning.
- **Focus:** `:focus-visible` renders a 3px solid outline in `--focus-ring-color`, offset 3px, on every interactive element. Variants set the colour; base owns the geometry. Focus is never removed.
- **Targets:** interactive controls have `min-height: var(--target-min)` = 44px and `min-width: 44px`. Inline text links are exempt but get `padding-block: var(--space-1)` for a taller hit area.
- **Semantics:** actions are real `<button>`; navigation is real `<a href>`. No positive `tabindex`. No emoji as icons; inline SVG only, with `aria-hidden="true"` when text is present.
- **Zoom / reflow:** all measures use `rem`, `clamp()`, `min()` and `%`. Layouts must reflow at 200% zoom (≈ 640px effective width at 1280) without clipping controls.
- **Motion:** only `transform`, `opacity`, `filter` are animated; durations ≤ 240ms; easing `cubic-bezier(.2,.7,.2,1)`. Under `@media (prefers-reduced-motion: reduce)` all transitions/animations are set to ~0ms and translate/scale hovers are removed; colour changes remain so state is still communicated. Nothing is hidden by the reduced-motion rule.
- **Overflow:** no horizontal scroll at 375, 768, 1280. Long titles wrap via `overflow-wrap: anywhere` on title elements; no `text-overflow: ellipsis` on primary content.

### 1.3 Type foundations

Root `font-size: 100%`; body line-height 1.55; headings line-height ≤ 1.15 (section headings 1.1, project titles 1.15); measure capped at `65ch` for paragraphs. Font families are variant-owned (§2–4). No webfont is loaded: no CDN link, no `@import`, no `@font-face`.

### 1.4 Showcase-only chrome

`base.css` also styles the comparison scaffolding (`.spec-*` classes): a neutral grey header, per-variant section labels, and the state-column labels (default / hover / focus / long title). This chrome is never used by the demos or the site.

---

## 2. Variant A — Dark technical

**Composition grammar:** split hero. Identity and CTAs sit in a left column; a compact numbered *project index* sits in the right column and doubles as in-page navigation. Projects render as **horizontal rows**: a fixed-ratio image frame on the left, then title, summary, and a restrained mono metadata line (stack · AI note). Rows collapse to a single flow on mobile. No terminal prompt, no typing animation, no blinking cursor.

**Scope selector:** all A tokens live under `[data-variant="a"]` so they cannot leak.

### 2.1 Tokens

| Token | Hex | Role |
|---|---|---|
| `--a-bg` | `#15181d` | page |
| `--a-surface` | `#1c2129` | rows, index panel |
| `--a-line` | `#2a313c` | hairline borders |
| `--a-text` | `#e7eaef` | body/headings |
| `--a-muted` | `#a3adbb` | summaries, secondary |
| `--a-meta` | `#93a0b0` | mono metadata |
| `--a-accent` | `#5aa6ff` | primary button fill, index markers |
| `--a-accent-text` | `#0b1220` | text on accent |
| `--a-link` | `#7ab8ff` | text links |
| `--a-border-strong` | `#8a94a3` | secondary button border |
| `--a-focus` | `#9dcbff` | focus ring |
| `--a-radius` | 6px | corners (tight) |

### 2.2 Type

- Sans: `system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif` (SF Pro on macOS).
- Mono: `ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`.
- Name: `clamp(2rem, 1.4rem + 2.6vw, 3.25rem)`, weight 650, letter-spacing −0.02em.
- Section heading: `clamp(1.25rem, 1.05rem + 0.9vw, 1.6rem)`, weight 600.
- Project title: 1.125rem, weight 600. Body 1rem. Mono meta 0.8125rem, uppercase tracking 0.06em.

### 2.3 Layout

- Container max 1120px; hero grid `minmax(0,1.3fr) minmax(0,1fr)` at ≥ 48em viewport, single column below.
- Project row grid `minmax(10rem, 30%) 1fr` when the row container is ≥ 36em (container query, so the same row works inside the narrow state columns); stacked below.
- Section rhythm: flat `--space-8` in the specimen; tasks 6 may step to `--space-10` at ≥ 48em.

### 2.4 States

- Primary button: accent fill; hover `filter: brightness(1.08)`; active `translateY(1px)`.
- Secondary button: transparent, 1px `--a-border-strong`; hover border → `--a-text`.
- Row hover: border-color → `--a-accent` (colour only; no lift).
- Index link hover: underline + marker turns accent.

---

## 3. Variant B — Light editorial

**Composition grammar:** typography-led. An **oversized stacked headline** (name on one line, role on the next, tagline as a deck) with a wide left margin creates a magazine opener. Projects are **numbered rows** separated by hairlines: a large ordinal, then text, then the image; image placement **alternates** left/right on desktop and stacks on mobile. Blue is used sparingly as an ink accent (links, ordinals, focus). No card grid.

**Scope selector:** `[data-variant="b"]`.

### 3.1 Tokens

| Token | Hex | Role |
|---|---|---|
| `--b-bg` | `#f6f0e6` | warm off-white page |
| `--b-paper` | `#fbf7f0` | image frame fill |
| `--b-ink` | `#1b1a1f` | text, primary button fill, secondary border |
| `--b-muted` | `#5e5a54` | deck, summaries |
| `--b-ordinal` | `#8b857c` | large row numbers (large text only) |
| `--b-rule` | `#cfc6b8` | decorative hairlines |
| `--b-accent` | `#1d4ed8` | links, focus ring, small marks |
| `--b-on-ink` | `#f6f0e6` | text on ink |
| `--b-radius` | 0 | square corners |

### 3.2 Type

- Display serif: `ui-serif, "New York", "Iowan Old Style", Charter, Georgia, "Times New Roman", serif`.
- Body sans: `system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`.
- Name: `clamp(2.75rem, 1.6rem + 6vw, 6rem)`, weight 500, line-height 0.98, letter-spacing −0.025em.
- Role: same family, `clamp(1.5rem, 1.1rem + 2.4vw, 2.75rem)`, italic.
- Production override: the name and role now use the reading serif Newsreader (`--font-reading`), role upright 400; see the production font note above.
- Section heading: serif `clamp(1.5rem, 1.2rem + 1.5vw, 2.25rem)`. Project title: serif 1.5rem. Body sans 1.0625rem, line-height 1.6. Ordinal: serif `clamp(2.5rem, 2rem + 3vw, 4.5rem)`.

### 3.3 Layout

- Container max 1200px with asymmetric padding: left `clamp(1rem, 8vw, 7rem)`, right `clamp(1rem, 4vw, 3rem)`.
- Row grid when the row container is ≥ 40em (container query): `4rem minmax(0,1fr) minmax(0,1fr)` (ordinal, text, image). `.is-alt` rows swap text and image columns via `order`. Below 768px: ordinal above, then text, then image.
- Section rhythm: `--space-10` in the specimen; tasks 7/8 may step to `--space-12` at ≥ 48em.

### 3.4 States

- Primary button: ink fill, off-white text; hover fill → `--b-accent`.
- Secondary button: 1px ink border; hover → 8% ink fill via `color-mix` (no underline on buttons).
- Link: underline always, thickness 1px → 2px on hover.
- Row hover: ordinal turns `--b-accent` (colour only).

---

## 4. Variant C — Dark immersive

**Composition grammar:** centred introduction (name, role, tagline, two buttons, all centred, narrow measure). Projects are **image-led chapters**: a full-width frame with a `21:9` → `16:9` aspect, chapter number and title overlaid at the bottom-left of the frame on a gradient scrim, and summary/AI note beneath in a centred narrow column. Atmosphere comes from a warm radial glow (`--c-glow`) behind the intro and amber/copper accents — no autoplay, no scroll-jacking, no custom cursor, no fantasy fonts.

**Scope selector:** `[data-variant="c"]`.

### 4.1 Tokens

| Token | Hex | Role |
|---|---|---|
| `--c-bg` | `#0d0b09` | near-black page |
| `--c-surface` | `#17130f` | chapter text panel |
| `--c-line` | `#2b241d` | hairlines |
| `--c-text` | `#efe6d8` | warm body text |
| `--c-muted` | `#b3a897` | summaries |
| `--c-amber` | `#e2a457` | primary fill, chapter numerals |
| `--c-copper` | `#d9895a` | links |
| `--c-on-amber` | `#1a120a` | text on amber |
| `--c-border-strong` | `#8f7f6a` | secondary border |
| `--c-focus` | `#f1c489` | focus ring |
| `--c-glow` | `rgba(226,164,87,.16)` | radial atmosphere behind intro (decorative) |
| `--c-scrim` / `--c-scrim-mid` | `#0d0b09` / `rgba(13,11,9,.92)` | chapter title scrim gradient stops |
| `--c-radius` | 14px | soft corners on frames |

### 4.2 Type

- Sans display and body: `system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif` — display weight 300 at large sizes for the "quiet cinema" feel, body weight 400.
- Name: `clamp(2.5rem, 1.5rem + 4.5vw, 4.5rem)`, weight 300, letter-spacing 0.01em.
- Role: 0.875rem uppercase, tracking 0.18em, colour amber (kept small so the name carries the hierarchy).
- Chapter title on scrim: `clamp(1.375rem, 1.1rem + 1.4vw, 2rem)`, weight 500, text `--c-text`.
- Body 1.0625rem, line-height 1.65, measure 60ch centred.

### 4.3 Layout

- Intro column max 40rem, centred. Chapter frames span the full container (max 1200px).
- Chapter text column max 44rem, centred, padding `--space-6`.
- Section rhythm: `--space-10` in the specimen; tasks 7/8 may step to `--space-12` at ≥ 48em.

### 4.4 States

- Primary button: amber fill; hover `filter: brightness(1.06)`; pill radius.
- Secondary button: 1px `--c-border-strong`; hover border → `--c-amber`.
- Chapter frame hover: scrim opacity 0.85 → 1 (opacity only). Resting 0.85.
- Link: copper, underline on hover.

---

## 5. Contrast (computed)

Measured from `getComputedStyle` in Chromium during task-5 QA and cross-checked with the WCAG relative-luminance formula. Full table with every pair lives in `.omo/evidence/portfolio-demo-first/task-5-happy.md`. Minimum results:

| Variant | Body text | Muted text | Primary button text | Secondary border | Focus ring |
|---|---|---|---|---|---|
| A | 14.75:1 | 7.84:1 | 7.43:1 | 5.80:1 | 10.52:1 |
| B | 15.26:1 | 6.04:1 | 15.26:1 | 15.26:1 | 5.91:1 |
| C | 15.89:1 | 8.39:1 | 8.53:1 | 5.06:1 | 12.16:1 |

B ordinals (`#8b857c` on `#f6f0e6`) are 3.23:1 and are only used at ≥ 40px, which qualifies as large text (≥ 3:1). B rules (`#cfc6b8`) are decorative and 1.49:1 — never the only separator; numbering and headings carry the structure.

---

## 6. Primitives per variant (what the showcase proves)

Each variant renders, in `demo/showcase.html`: section heading, primary + secondary button, a project specimen (title, summary, AI note, image frame labelled "Design frame — not a project capture"), and the demo-switcher specimen, in four state columns: default, hover (forced via `.is-hover` class mirroring `:hover` rules), focus (forced via `.is-focus` mirroring `:focus-visible`), and a long-title fixture. Real `:hover`/`:focus-visible` rules exist in every variant file; the forced classes exist only so screenshots can show the states simultaneously.

## 7. Demo switcher (shared specimen, not part of any site)

Pill labelled **"Demo controls — not part of the site"**. Contains previous, A/B/C, next as real `<button>`/`<a>`. It uses its own neutral greys from `base.css` (`--dc-*`: `#26262b`, `#f2f2f4`, `#55555e`) so it is visibly *not* part of the direction under evaluation. In the showcase the pill is rendered **in document flow** (header and state columns), not fixed: review found a fixed pill covers whatever sits at the viewport bottom. In the integrated demo (task 9) the fixed placement must reserve bottom space equal to the pill height plus safe-area, and be verified in real viewports, not only full-page captures.

## 8. Accepted debt (comparison stage)

- Image frames are labelled placeholders; genuine captures arrive in tasks 3–4 and replace them in tasks 6–8.
- No Layer B brand reference file was loaded (unavailable); directions are derived from the plan briefs.
- Section rhythm and breakpoints in the specimen are container-query driven (so specimens render inside narrow state columns); variant builds may use viewport queries at 48em.
- Focus ring uses `outline` only; a double ring (outline + box-shadow halo) may be added if a variant's background makes a single ring weak on real imagery.
- Contrast on the C chapter scrim is verified against the solid scrim colour, not against arbitrary photographs; task 8 must re-verify with the real images.

**Selection record: B was selected on 2026-09-27 and built into `site/` in task 11. The comparison sections above are historical.**
