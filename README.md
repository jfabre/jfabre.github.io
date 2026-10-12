# Portfolio

Source for https://jfabre.github.io/. Pushing to `main` runs
`.github/workflows/pages.yml`, which checks and publishes only `site/` to GitHub
Pages. Everything else in this repository is never served. Direction B (light editorial) is selected;
the production page lives in `site/`. The three comparison demos remain in `demo/`
as a record.

## Preview safely

Use the system Python and Node installations; no packages or global installs are needed.
From this directory, check whether the preferred port is occupied:

```sh
lsof -nP -iTCP:8000 -sTCP:LISTEN
```

If port 8000 is free, start:

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory site
```

Use `--directory demo` instead to open the A/B/C comparison record.

If port 8000 is busy, pick another free loopback port and record the selected port
and your server PID in private evidence. Never kill an unrelated process to free
a port. Keep the bind address `127.0.0.1`; never bind `0.0.0.0`.
Use Ctrl-C for a foreground server. For a background server record `$!` immediately,
then stop only that PID with `kill "$server_pid"` and `wait "$server_pid"`.

Open `http://127.0.0.1:8000/`. For the demo record, open `?variant=A`, `?variant=B`
or `?variant=C`. No remote deployment occurs.

Confirm the listener:

```sh
lsof -nP -iTCP:8000 -sTCP:LISTEN
curl -sS -D - --max-time 5 http://127.0.0.1:8000/
```

The listener must show `127.0.0.1:8000`, not `*:8000`. If a later start fails because
another process acquired the port, leave that process alone and choose another.
Do not bind `0.0.0.0`.

## Executable checks

```sh
node --test scripts/check-static.test.mjs scripts/check-release.test.mjs scripts/check-gallery.test.mjs scripts/check-design.test.mjs
node scripts/check-static.mjs site
node scripts/check-static.mjs demo
```

The checker accepts exactly one directory argument. Exit 0 means every static
assertion passed; exit 1 prints a reason list to stderr. `demo/` now passes
`node scripts/check-static.mjs demo`. That pass is not a design choice, and it
does not create a production site. Self-tests create disposable complete fixtures
in the system temporary directory and delete them after each test. Fake fixture
image bytes prove file existence only; they are never portfolio imagery.

The checker uses Node built-ins, does not access the network or execute scanned
code, and scans HTML, JS, MJS, CSS, SVG, TXT, XML, and Markdown. A root README is
excluded only when every nonblank line matches the narrow server-doc grammar:
`# Local preview`, a shell fence, the loopback Python command, or a loopback URL
with an optional A/B/C query. Other README content is scanned normally.

The static markup contract requires exactly four literal `data-project` values,
in order, with a `src`, `srcset`, `poster`, or `data-asset` reference on the project
element or inside it. Each asset must exist inside the checked tree. HTML and JS
markup assets resolve from that tree's root; CSS URLs resolve from the stylesheet.
Quoted and unquoted attributes are supported. Keep project hooks literal and
unique; computed JS templates are not evaluated. Symbolic links, private files,
base overrides, external assets and nonapproved contact URLs fail closed.
Only the exact approved LinkedIn and GitHub profile URLs are allowed externally.
`scripts/check-gallery.test.mjs` pins the site galleries: 3/3/1/3 slides, a caption on
every feature slide, unique local media, the Darklight clip contract (muted loop, poster,
no `autoplay` attribute), and the unchanged Dungeon Mapper image.

`scripts/check-design.test.mjs` pins the vendored Fraunces font (bytes, preload,
licence location), the grain asset, the accent-token contrast floors, and the motion
gating (reveal styles only inside reduced-motion and scroll-timeline guards). It also
pins the dark theme: the two dark token lists in `site/styles.css` §2b are identical
and screen-only (print stays light), dark accents and muted text are at least 4.5:1 on
the dark page and paper, the focus rings at least 3:1, and the inline theme script runs
before the stylesheet on both pages with the switch shipped `hidden`. The theme follows
the system until the switch saves a choice in `localStorage`; see DESIGN.md.

This is a static contract check, not a full HTML parser, image decoder, browser
test, or complete security audit. Later work still requires rendered-page QA and
asset provenance/privacy review. Rendered QA uses headless system Chromium.
No build step, dependency manifest or bundler exists.

## Privacy boundary

Private evidence lives in ignored `.omo/evidence/portfolio-demo-first/`.
Planning, source snapshots, scratch/capture directories, caches, environment
files, databases, and keys are ignored. Ignore rules are not a substitute for
reviewing staged paths. Never use blanket staging. Only explicitly reviewed
public scaffold files may enter local prototype history; no private working data
may be staged.
