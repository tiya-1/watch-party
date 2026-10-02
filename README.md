# Watch Party (Vercel + Render)

Real-time YouTube watch rooms with Host / Moderator / Participant roles.
React (Vite) frontend + Express/Socket.IO backend. No database (rooms live in memory).

**Live URL:** _add your Vercel URL here_

```
watch-party/
├── frontend/   React + Vite  -> deploy on Vercel
└── backend/    Express + Socket.IO -> deploy on Render
```

## Run locally
Terminal 1:
    cd backend
    npm install
    npm run dev          # http://localhost:5000

Terminal 2:
    cd frontend
    npm install
    npm run dev          # http://localhost:5173

## Deploy
Vercel cannot run WebSocket servers, so the backend goes on Render.

**1. Backend on Render** (New -> Web Service)
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Env var (after step 2): `CLIENT_ORIGIN` = your Vercel URL (no trailing slash)
- Copy the Render URL, e.g. https://watch-party-api.onrender.com

**2. Frontend on Vercel** (Add New -> Project)
- Root Directory: `frontend` (framework: Vite is auto-detected)
- Env var: `VITE_SERVER_URL` = your Render URL
- Deploy, then put the Vercel URL into `CLIENT_ORIGIN` on Render.

Render's free tier sleeps when idle, so open the backend URL once before demoing.

## How it works
- `backend/index.js`: the server is the source of truth for playback state.
- Host/Moderator emit `play | pause | seek | change_video`; the server checks the role, updates state, broadcasts `sync_state`.
- Host only: `assign_role`, `remove_participant`, `transfer_host`. Roles are checked on the server; the UI only hides controls.
- `frontend/src/components/YouTubePlayer.jsx`: wraps the YouTube IFrame API and detects scrubbing by polling time jumps.
- Chat is UI only for now (messages are local to your browser).
