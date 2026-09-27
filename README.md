# Portfolio — private local preview

This is a local preview only. No remote deployment occurs. No remote is configured,
and prototype history must not be pushed. The theme is not selected. Only the
workspace and verification scaffold exist; the three demos are later work.

## Preview safely

Use the system Python and Node installations; no packages or global installs are needed.
From this directory, check whether the preferred port is occupied:

```sh
lsof -nP -iTCP:8000 -sTCP:LISTEN
```

If port 8000 is free, start:

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory demo
```

If port 8000 is busy, pick another free loopback port and record the selected port
and your server PID in private evidence. Never kill an unrelated process to free
a port. Keep the bind address `127.0.0.1`; never bind `0.0.0.0`.
Use Ctrl-C for a foreground server. For a background server record `$!` immediately,
then stop only that PID with `kill "$server_pid"` and `wait "$server_pid"`.

Verify the selected port (substitute its number for `<port>`):

```sh
lsof -nP -iTCP:<port> -sTCP:LISTEN
curl -sS -D - --max-time 5 http://127.0.0.1:<port>/
```

The listener must show `127.0.0.1:<port>`, not `*:<port>`. If a start fails because
another process acquired the port, leave that process alone and choose another.
Once later tasks exist, direct URLs will be `http://127.0.0.1:<port>/?variant=A|B|C`:

- `http://127.0.0.1:<port>/?variant=A`
- `http://127.0.0.1:<port>/?variant=B`
- `http://127.0.0.1:<port>/?variant=C`

Right now the server provides an empty scaffold, not a portfolio.

## Executable checks

```sh
node --test scripts/check-static.test.mjs
node scripts/check-static.mjs demo
# Later, after a selected site exists:
node scripts/check-static.mjs site
```

The checker accepts exactly one directory argument. Exit 0 means every static
assertion passed; exit 1 prints a reason list to stderr. **The incomplete `demo/`
must fail** until later tasks provide all required copy, ordered project markup,
and actual assets. Self-tests instead create disposable complete fixtures in the
system temporary directory and delete them after each test. Fake fixture image
bytes prove file existence only; they are never portfolio imagery.

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
Only the exact approved LinkedIn URL is allowed externally.

This is a static contract check, not a full HTML parser, image decoder, browser
test, or complete security audit. Later work still requires rendered-page QA and
asset provenance/privacy review. No build step, dependency manifest or bundler exists.

## Privacy boundary

Private evidence lives in ignored `.omo/evidence/portfolio-demo-first/`.
Planning, source snapshots, scratch/capture directories, caches, environment
files, databases, and keys are ignored. Ignore rules are not a substitute for
reviewing staged paths. Never use blanket staging. Only explicitly reviewed
public scaffold files may enter local prototype history; no private working data
may be staged. Nothing here authorizes publication or theme selection.
