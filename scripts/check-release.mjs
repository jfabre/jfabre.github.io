import { lstatSync, readdirSync, readFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Deliberately closed: adding public files requires updating this reviewed list.
const files = new Set([
  'README.md', 'docs/.nojekyll', 'docs/404.html', 'docs/favicon.svg', 'docs/index.html',
  'docs/robots.txt', 'docs/sitemap.xml', 'docs/styles.css', 'docs/carousel.js', 'docs/media.js',
  'docs/assets/projects/shadowdark-sheet.webp', 'docs/assets/projects/torchlight-timer.webp',
  'docs/assets/projects/dungeon-mapper.webp', 'docs/assets/projects/npc-voice.webp',
  'docs/assets/projects/shadowdark-party.webp', 'docs/assets/projects/shadowdark-equipment.webp', 'docs/assets/projects/torchlight-spell.webp', 'docs/assets/projects/torchlight-board.webp', 'docs/assets/projects/npc-session.webp', 'docs/assets/projects/npc-transcript.webp',
  'docs/assets/projects/torchlight-timer.mp4', 'docs/assets/projects/torchlight-spell.mp4', 'docs/assets/projects/torchlight-board.mp4',
  'docs/assets/fonts/fraunces-latin-full-normal.woff2', 'docs/assets/fonts/newsreader-latin-opsz-normal.woff2', 'docs/assets/texture/grain.svg', 'docs/assets/texture/grain-dark.svg',
  'docs/assets/portrait/jeremy.webp', 'docs/assets/portrait/jeremy-360.webp', 'docs/assets/social/preview.jpg',
]);
const directories = new Set(['docs', 'docs/assets', 'docs/assets/projects', 'docs/assets/fonts', 'docs/assets/texture', 'docs/assets/portrait', 'docs/assets/social']);
const forbidden = /(?:^\.env(?:\.|$)|\.env$|^\.git(?:\.|$)|^\.omo$|\.(?:db|sqlite|sqlite3)(?:$|-)|\.(?:pem|key)$|PRIVATE)/i;

function inspect(root) {
  const reasons = [];
  const seen = new Set();
  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = resolve(directory, entry.name);
      const label = relative(root, path);
      if (forbidden.test(entry.name)) { reasons.push(`${label}: forbidden file or directory`); continue; }
      if (entry.isSymbolicLink()) { reasons.push(`${label}: symlink is forbidden`); continue; }
      if (entry.isDirectory() && directories.has(label)) {
        seen.add(label);
        walk(path);
      } else if (entry.isFile() && files.has(label)) {
        seen.add(label);
        // Also scan image bytes for literal source paths / metadata leaks. Visual
        // privacy and provenance still require a human review; this is not OCR.
        // The exact public GitHub profile is allowed; any repository path beneath it is not.
        const text = readFileSync(path, 'utf8').replace(/https:\/\/github\.com\/jfabre(?![\w/.?#-])/g, '');
        if (/\/Users\/|github\.com/i.test(text)) {
          reasons.push(`${label}: private source URL or path`);
        }
      } else {
        reasons.push(`${label}: unexpected entry or incorrect entry type`);
      }
    }
  }
  walk(root);
  for (const required of [...directories, ...files]) {
    if (!seen.has(required)) reasons.push(`missing required entry ${required}`);
  }
  // The trusted sibling checker enforces approved copy, project order, local
  // assets, and the exact allowed publication / LinkedIn URLs. Never execute
  // code from the export itself, and do not follow rejected filesystem entries.
  if (reasons.length === 0) {
    const checker = fileURLToPath(new URL('./check-static.mjs', import.meta.url));
    const result = spawnSync(process.execPath, [checker, resolve(root, 'docs')], { encoding: 'utf8' });
    if (result.status !== 0) reasons.push(result.stderr?.trim() || result.error?.message || 'Static checker failed');
  }
  return reasons;
}

let reasons;
try {
  if (process.argv.length !== 3) throw new Error('Usage: node scripts/check-release.mjs <release-directory>');
  const root = resolve(process.argv[2]);
  const stat = lstatSync(root);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Root must be a directory, not a symlink');
  reasons = inspect(root);
} catch (error) {
  reasons = [error instanceof Error ? error.message : 'Unable to inspect release directory'];
}
if (reasons.length) {
  console.error(`Release checks failed:\n${reasons.map((reason) => `- ${reason}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`Release checks passed (${files.size} files; static checks passed)`);
}
