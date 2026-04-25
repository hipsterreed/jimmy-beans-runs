# Jimmy-Bean Runs (React app)

Vite + React + TypeScript port of the LOTR run tracker. Hits the same Firestore project as the legacy April site at the repo root, so live data stays in sync.

The 6 playable side-quest minigames and the ending video reel are intentionally **not** ported here — clicking a playable mission card opens a placeholder modal that links back to the legacy app for the actual gameplay.

## Local dev

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # tsc + vite build → dist/
npm run preview      # serve dist/ for sanity check
```

The Firebase web config is hardcoded to the existing `jimbo-and-bean-runs` project for local dev convenience. To override (e.g., point at a staging project), copy `.env.example` to `.env` and fill in the `VITE_FIREBASE_*` vars.

## Deploy (Railway)

- **Build command:** `npm ci && npm run build`
- **Start command:** `npm run preview -- --host 0.0.0.0 --port $PORT`
  - Or use `serve dist -l $PORT` after adding `serve` as a dep — slightly leaner than running Vite's preview server in prod.
- **Required env vars:** `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`. Optional: `VITE_LEGACY_APP_URL` (defaults to the existing Firebase Hosting URL).

Vite reads env vars at build time, so changing them in Railway requires a redeploy.

## Layout

- `src/lib/` — pure modules (types, data, utils, selectors, firebase, chart math).
- `src/store/questStore.ts` — Zustand store: runners, runs, devMode, syncState, modal slots.
- `src/hooks/useFirestoreQuest.ts` — Firestore subscriber, StrictMode-safe.
- `src/components/` — one file per visible piece. Modals under `components/modals/`.
- `public/assets/` — runner photos + journey background. Copied from `../assets`. Filename casing matters on Linux.

## Where the legacy app lives

`/index.html`, `/app.mjs`, `/js/`, `/styles.css`, `/firebase-config.js` at the repo root, deployed to Firebase Hosting via `.github/workflows/firebase-hosting-pull-request.yml`. Don't edit those files — they are the April archive and the only place the playable minigames currently work.

## Admin mode

Append `?admin=true` to the URL to reveal the destructive **Reset Quest** button.
