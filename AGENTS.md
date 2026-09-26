# Binance Skills Hub — Base44 Dev Environment

## What this repo is

This is **not a web application**. It's the Binance Skills Hub — a collection of AI skill definitions (`SKILL.md` files with YAML frontmatter) designed to be consumed by AI agents via `npx skills add`. There is no server, no frontend, no backend in the original repo.

## What Base44 added

A lightweight **skill browser** (`viewer/`) so the repo's content is visible in the preview:
- `viewer/server.js` — pure Node.js HTTP server (no npm dependencies), scans `skills/` for `SKILL.md` files, parses frontmatter, serves a JSON API + static HTML.
- `viewer/public/index.html` — SPA that renders the skill catalog with search, categories, and per-skill detail views (uses `marked.js` from CDN for markdown rendering).
- `docker-compose.base44.yml` — runs `node:22-slim` with the repo bind-mounted, serving on port 3000.

## Running

```bash
docker compose -f docker-compose.base44.yml up -d
```

The viewer auto-discovers all `SKILL.md` files at startup — no rebuild needed when skills are added or edited.

## API endpoints

- `GET /api/skills` — JSON array of all skills (slug, title, description, version, author, category)
- `GET /api/skill/:slug` — full skill content + list of reference files
- `GET /api/reference/:slug/:ref` — raw markdown of a reference file

## Verification

```bash
curl http://localhost:3000/api/skills   # should return JSON array
curl http://localhost:3000/               # should return HTML
```

## No secrets required

This repo has no external service dependencies. Individual skills reference Binance API credentials at runtime (when used by an agent), but the viewer itself needs none.
