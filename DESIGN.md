# DESIGN.md — Portfolio comparison spec (three directions, none selected)

Status: **comparison specification**. Three independent design directions (A, B, C) are specified side by side so they can be built as separate demos and compared fairly. **No variant is selected.** Nothing in this document is approval of any direction; selection is a separate, explicit user decision recorded later in the plan.

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

**Reminder: no variant is selected.**
