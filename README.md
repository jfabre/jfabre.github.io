# Jeremy Fabre — Portfolio

A static portfolio of Jeremy Fabre's personal projects. The screenshots are the
author's own captures of those projects using fictional sample data. They do not
demonstrate in-game TaleSpire fidelity; NPC Voice's Discord voice integration is
still in development.

The site uses system fonts only, so no font license file is required.

## Preview locally

No build, package installation, or server-side application is needed. With Python 3
installed, run this from the export root:

```sh
python3 -m http.server 8001 --bind 127.0.0.1 --directory docs
```

Open `http://127.0.0.1:8001/`. If the port is occupied, choose another free port;
do not stop an unrelated server. Stop your preview with Ctrl-C. Open each full
project image and `404.html` as part of checking an update.

## Update the export

`docs/` is the complete deployable site. When maintaining the authoring workspace,
edit and review `site/` first, then copy only these approved files into the export,
preserving their relative paths and bytes:

```text
site/.nojekyll                              -> docs/.nojekyll
site/404.html                               -> docs/404.html
site/favicon.svg                           -> docs/favicon.svg
site/index.html                            -> docs/index.html
site/robots.txt                            -> docs/robots.txt
site/sitemap.xml                           -> docs/sitemap.xml
site/styles.css                            -> docs/styles.css
site/assets/projects/shadowdark-sheet.webp  -> docs/assets/projects/shadowdark-sheet.webp
site/assets/projects/torchlight-timer.webp  -> docs/assets/projects/torchlight-timer.webp
site/assets/projects/dungeon-mapper.webp    -> docs/assets/projects/dungeon-mapper.webp
site/assets/projects/npc-voice.webp         -> docs/assets/projects/npc-voice.webp
```

Keep this README at the export root. Do not copy the whole authoring workspace or
any project source repositories. The export must contain only `README.md` and
`docs/`, with only the files listed above inside `docs/`. Recheck all text and
screenshots for personal information, credentials, source URLs, or local paths.
Preview the result before publishing. If only this export is available, edit
`docs/` directly and keep the authoring copy in sync before the next export.

## Deploy with GitHub Pages

After the export has been reviewed and publication authorized, place only this
README and `docs/` in the public repository's `main` branch. In **Settings → Pages
→ Build and deployment**, choose **Deploy from a branch**, select **main** and
**/docs**, then **Save**. Keep `docs/.nojekyll` so these files are served as a
plain static site. No build command is needed.

The configured publication address is `https://jfabre.github.io/`. This assumes
the account site repository `jfabre.github.io`; if using a project site or a
different address, update the three address references described below before
deployment. Check the Pages deployment result and the served home page, all four
images, and the not-found page.

## Roll back

Revert the public commit that introduced the unwanted change, preserving public
history rather than force-pushing it away. Publish that revert to `main`; GitHub
Pages will redeploy `/docs`. Check the deployment result and served pages again.
Apply the same correction to the authoring copy so a later export cannot restore
the reverted change.

## Move to another host

Copy the contents of `docs/` to the new static host's document root (or chosen
subdirectory), including `.nojekyll` if retaining the same export. No backend or
vendor-specific runtime is required. Update:

- The canonical link in `docs/index.html` to the new public home-page URL.
- The `<loc>` value in `docs/sitemap.xml` to that same URL.
- The `Sitemap:` line in `docs/robots.txt` to the new sitemap URL.

Include any deployment subdirectory in these URLs. Asset links are relative.
Configure the new host to serve `404.html` for missing pages; when hosting under a
subdirectory, ensure the site's robots policy is also available at the host's
origin root. Preview and check the deployed paths before switching traffic.
