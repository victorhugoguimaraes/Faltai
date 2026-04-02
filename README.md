# Faltai

Faltai is a mobile-first PWA for tracking class absences, schedule blocks, academic events, reminders, and semester risk in one place.

Live app:
[https://victorhugoguimaraes.github.io/Faltai/](https://victorhugoguimaraes.github.io/Faltai/)

## Current stack

- Frontend: React 19 + Vite 6
- Tests: Vitest + Testing Library
- Auth and user data: Firebase
- Public UnB class search API: Node + Express
- Hosting:
  - Frontend on GitHub Pages
  - UnB API on Render

## Main features

- Subject CRUD with absence tracking
- Weekly schedule assembled from imported classes
- Academic calendar and evaluation calendar
- Semester dashboard with useful summaries
- Reminder settings and web push support
- Google login and local fallback mode when Firebase is not configured
- UnB SIGAA search through a dedicated API

## UnB API architecture

The UnB API now works with one snapshot per semester.

What that means:
- the API generates a file like `snapshot-2026-1.json`
- this file stores departments, disciplines, and classes for that semester
- user searches query the snapshot instead of scraping SIGAA on every request
- the snapshot is refreshed weekly
- a manual refresh endpoint is available when needed

Why this exists:
- much faster first search
- much more predictable performance
- less dependency on SIGAA response time
- less scraping work during user requests

Useful endpoints:
- `GET /api/health`
- `GET /api/unb/departamentos`
- `GET /api/unb/turmas?department=508&year=2026&period=1&query=pesquisa`
- `GET /api/unb/snapshot/status?year=2026&period=1`
- `POST /api/unb/snapshot/refresh?year=2026&period=1`

## Local development

Requirements:
- Node.js 18+
- npm
- Firebase project if you want full auth/persistence locally

Install:

```bash
git clone https://github.com/victorhugoguimaraes/Faltai.git
cd Faltai
npm install
```

Run frontend:

```bash
npm run dev
```

Run API:

```bash
npm run dev:api
```

Frontend usually opens on:
- `http://localhost:5173`
- `http://localhost:5174`

API usually runs on:
- `http://localhost:8787`

## Environment variables

Frontend:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
VITE_API_URL=http://localhost:8787
VITE_UNB_API_URL=http://localhost:8787
```

Backend:

```bash
UNB_API_PORT=8787
UNB_API_HOST=0.0.0.0
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,https://victorhugoguimaraes.github.io
UNB_SNAPSHOT_YEAR=2026
UNB_SNAPSHOT_PERIOD=1
UNB_SNAPSHOT_CONCURRENCY=3
UNB_SNAPSHOT_ADMIN_KEY=change-me
```

Notes:
- `VITE_API_URL` is the preferred frontend API variable
- `VITE_UNB_API_URL` is still supported as fallback
- snapshot files are stored under `api/data/snapshots`

## Quality checks

Run tests:

```bash
npm run test:ci
```

Run production build:

```bash
npm run build
```

Run both:

```bash
npm run verify
```

## Deploy overview

Frontend:
- GitHub Pages publishes from the GitHub Actions workflow
- set `VITE_API_URL` or `VITE_UNB_API_URL` in repository variables

Backend:
- Render runs the Express API using [render.yaml](/Users/victo/Faltai/render.yaml)
- keep `CORS_ORIGINS` aligned with the GitHub Pages domain
- after deploy, trigger one manual snapshot refresh to warm the semester

## Documentation

- Technical documentation: [docs/DOCUMENTATION.md](/Users/victo/Faltai/docs/DOCUMENTATION.md)
- Security notes: [docs/SECURITY.md](/Users/victo/Faltai/docs/SECURITY.md)
