export const identity = {
  name: 'Jeremy Fabre',
  role: 'Senior Software Developer',
  tagline: 'Delivering quality software on budget.',
};

export const section = {
  heading: 'Selected projects',
  intro: 'A selection of personal projects built with AI-assisted development, from tabletop gaming tools to more ambitious applications that integrate AI directly.',
};

export const contact = {
  ctaLabel: 'View my projects',
  ctaHref: '#projects',
  label: 'Connect on LinkedIn',
  href: 'https://www.linkedin.com/in/jeremy-fabre-977b1b53/',
  text: 'For professional opportunities or to request my CV, connect with me on LinkedIn.',
};

/* Stable markup hooks: data-project = id, data-title = title,
   data-description = summary, data-ai-note = aiNote. Values are plain text. */
export const projects = [
  {
    id: 'shadowdark-sheet',
    title: 'The Dark Spire — TaleSpire Character Sheet',
    summary: 'A digital Shadowdark character sheet for TaleSpire and standalone browsers, bringing character stats, inventory, spells, and dice-roll integration together.',
    stack: 'HTML · CSS · JavaScript',
    aiNote: 'Built with AI-assisted development.',
  },
  {
    id: 'torchlight-timer',
    title: 'Darklight — Torchlight Timer',
    summary: 'An atmospheric countdown timer for torches and light spells in TaleSpire, with animated visuals, playback controls, and duration adjustments.',
    stack: 'HTML · CSS · JavaScript',
    aiNote: 'Built with AI-assisted development.',
  },
  {
    id: 'dungeon-mapper',
    title: 'Dungeon Mapper',
    summary: 'An agent-guided workflow for turning reviewed 2D dungeon descriptions into TaleSpire slabs, supported by deterministic validation, overlays, and export tools.',
    stack: 'Python',
    aiNote: 'Built with AI-assisted development; AI assists the mapping workflow.',
  },
  {
    id: 'npc-voice',
    title: 'NPC Voice',
    summary: 'A local prototype for AI-driven NPC conversations, with a web control panel and integrations for language generation, speech recognition, and voice synthesis. Discord voice integration is still in development.',
    stack: 'Elixir · Phoenix LiveView · JavaScript',
    aiNote: 'Built with AI-assisted development; integrates AI dialogue and speech services.',
  },
].map((project) => ({
  ...project,
  'data-project': project.id,
  'data-title': project.title,
  'data-description': project.summary,
  'data-ai-note': project.aiNote,
}));
