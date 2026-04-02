# Faltai Technical Documentation

## 1. Project overview

Faltai is split into two main parts:

1. Frontend PWA
   - React + Vite application
   - runs on GitHub Pages
   - handles UI, Firebase auth, local state, reminders, and user flows

2. UnB API
   - Node + Express service
   - runs separately on Render
   - serves departments and classes from a semester snapshot

This separation exists because GitHub Pages cannot run server-side scraping logic.

## 2. Frontend architecture

Main entrypoints:
- [main.jsx](/Users/victo/Faltai/src/main.jsx)
- [App.jsx](/Users/victo/Faltai/src/app/App.jsx)
- [providers.jsx](/Users/victo/Faltai/src/app/providers.jsx)

High-level areas:
- `src/app`
  - app shell and providers
- `src/components`
  - reusable UI, modals, and layout pieces
- `src/contexts`
  - auth, errors, and subject state
- `src/features`
  - domain-focused logic for calendar, dashboard, notifications, schedule, and auth
- `src/lib`
  - environment resolution helpers
- `src/services`
  - service-layer integrations such as Firebase auth and notifications
- `src/utils`
  - validation, PWA helpers, assets, and storage utilities

Current feature grouping:
- `features/auth`
- `features/calendar`
- `features/dashboard`
- `features/home`
- `features/materias`
- `features/notifications`
- `features/schedule`

## 3. Data model on the frontend

The core user object in practice revolves around:
- subjects (`materias`)
- absences
- evaluations
- imported class schedule blocks
- reminder preferences

Important modules:
- [materiasState.js](/Users/victo/Faltai/src/features/materias/lib/materiasState.js)
- [turmasStorage.js](/Users/victo/Faltai/src/features/schedule/lib/turmasStorage.js)
- [notificationState.js](/Users/victo/Faltai/src/features/notifications/lib/notificationState.js)
- [dashboardMetrics.js](/Users/victo/Faltai/src/features/dashboard/lib/dashboardMetrics.js)

## 4. UnB API architecture

Main files:
- [server.js](/Users/victo/Faltai/api/server.js)
- [sigaa.js](/Users/victo/Faltai/api/unb/sigaa.js)
- [snapshotStore.js](/Users/victo/Faltai/api/unb/snapshotStore.js)
- [pushStore.js](/Users/victo/Faltai/api/pushStore.js)

### 4.1 What a snapshot is

A snapshot is a pre-generated semester dataset.

Example:
- `snapshot-2026-1.json`

This file contains:
- semester metadata
- the list of departments
- the disciplines grouped by department
- classes for each discipline
- refresh metadata
- precomputed stats

The goal is simple:
- scrape SIGAA before the user needs the data
- serve searches from local prepared data

### 4.2 Why the API moved to snapshots

The live scraper approach had a cold-start cost tied to:
- the Render instance waking up
- the API calling SIGAA
- parsing HTML on the fly

With snapshots:
- the first user request no longer depends on scraping
- searches are faster and more stable
- refresh cost is moved to a weekly maintenance flow

### 4.3 Snapshot lifecycle

The snapshot lifecycle is:

1. Determine active semester
   - `UNB_SNAPSHOT_YEAR`
   - `UNB_SNAPSHOT_PERIOD`

2. Refresh snapshot
   - load departments from SIGAA
   - fetch each department for the semester
   - store the result in one JSON file

3. Prepare snapshot in memory
   - normalize searchable fields once
   - sort disciplines and classes once
   - compute summary stats once

4. Serve requests
   - `/api/unb/departamentos`
   - `/api/unb/turmas`

5. Refresh again when stale
   - stale threshold: 7 days

### 4.4 Why one snapshot per semester

This was chosen over one file per department because it gave the best balance of:
- simpler deployment
- easier inspection and backup
- very good performance
- fewer files to manage

The API still stores disciplines grouped by department inside the single file, so lookups remain simple.

### 4.5 Refresh model

Automatic refresh:
- the API checks snapshot freshness on startup
- the API checks again periodically
- if the snapshot is older than 7 days, it refreshes in background

Manual refresh:
- `POST /api/unb/snapshot/refresh?year=2026&period=1`
- if `UNB_SNAPSHOT_ADMIN_KEY` is configured, send it in `x-snapshot-admin-key`

Status endpoint:
- `GET /api/unb/snapshot/status?year=2026&period=1`

## 5. Search flow

### Departments

Request:
- `GET /api/unb/departamentos`

Flow:
1. try snapshot
2. if snapshot exists, return departments from snapshot
3. if snapshot is stale, trigger background refresh
4. if no snapshot exists, fall back to live SIGAA fetch

### Classes

Request:
- `GET /api/unb/turmas?department=508&year=2026&period=1&query=pesquisa`

Flow:
1. validate `department`
2. resolve semester
3. try snapshot
4. if snapshot exists, run in-memory search
5. if snapshot is stale, keep serving current snapshot and refresh in background
6. if no snapshot exists, fall back to the live scraper path

## 6. Performance notes

Important implementation choices:
- searchable strings are normalized once during snapshot preparation
- stats are precomputed and cached in the snapshot object
- classes and disciplines are sorted once
- snapshot writes are asynchronous
- prepared helper fields stay only in memory and are stripped before writing JSON

This means the API spends less CPU on:
- repeated string normalization
- repeated sorting
- repeated nested reductions for stats

## 7. Push notifications

Frontend pieces:
- [notificationService.js](/Users/victo/Faltai/src/services/notificationService.js)
- [pushNotifications.js](/Users/victo/Faltai/src/features/notifications/lib/pushNotifications.js)

Backend pieces:
- [server.js](/Users/victo/Faltai/api/server.js)
- [pushStore.js](/Users/victo/Faltai/api/pushStore.js)

Relevant endpoints:
- `GET /api/push/public-key`
- `POST /api/push/subscribe`
- `POST /api/push/settings`
- `POST /api/push/unsubscribe`
- `POST /api/push/test`

Push behavior:
- the frontend stores reminder preferences
- subscriptions are persisted on the backend
- weekly reminder dispatch runs on the API

## 8. Environment variables

### Frontend

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_API_URL=
VITE_UNB_API_URL=
```

### Backend

```bash
UNB_API_PORT=8787
UNB_API_HOST=0.0.0.0
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,https://victorhugoguimaraes.github.io
UNB_SNAPSHOT_YEAR=2026
UNB_SNAPSHOT_PERIOD=1
UNB_SNAPSHOT_CONCURRENCY=3
UNB_SNAPSHOT_ADMIN_KEY=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:you@example.com
```

## 9. Local commands

Install:

```bash
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

Run tests:

```bash
npm run test:ci
```

Build:

```bash
npm run build
```

## 10. Production deployment

Frontend:
- GitHub Pages
- workflow reads `VITE_API_URL` or `VITE_UNB_API_URL`

Backend:
- Render service defined by [render.yaml](/Users/victo/Faltai/render.yaml)
- update env vars in Render
- deploy latest commit
- trigger one manual snapshot refresh after deploy

## 11. Testing and profiling

Main automated validation:
- `npm run test:ci`
- `npm run build`

Snapshot and performance experiments are intentionally kept outside the main runtime path.

Profiling recommendation:
- use Node CPU profiles with `node --cpu-prof`
- profile snapshot search separately from network-bound requests
- compare local snapshot performance against production latency to isolate infra cost from algorithm cost
