## HypeZone (AI ATL 2025)

HypeZone is a second‑screen sports experience: a simple, fun “watch party” app where friends post reactions in a Twitter‑style feed, and an AI assistant jumps in with memes, fact‑checks, and quick insights. A separate service detects “key moments” from game data and streams them live to the UI.

### What it is
- **Social feed**: Post text + GIFs/memes, reply, repost, like, and bookmark.
- **AI assistant (@PrizePicksAI)**: 
  - Makes sports memes (image generation)
  - Fact‑checks claims using game data
  - Gives quick opinions/predictions
  - Can email a hype recap to friends
- **Key moments**: A backend analyzes plays/audio to surface the most exciting moments as they happen (via SSE).

### Why it’s useful
HypeZone makes following a game feel like a live group chat with superpowers—your feed stays lively, and the AI keeps things fun, informative, and fast.

---

## Brief Architecture Overview

### Frontend Web App (Next.js + React)
- Renders the feed, timeline, and video UI.
- Calls internal APIs:
  - `GET /api/game-data` – aggregates stats from a local play‑by‑play JSON
  - `GET/POST /api/forum/threads` – simple thread storage in MongoDB
  - `POST /api/ai/orchestrate` – routes `@PrizePicksAI` prompts
  - `POST /api/send-email` – sends recap emails (Resend)
- Connects to the key‑moments SSE stream via a small React hook.

### AI Orchestrator (inside the Next.js app)
- Parses user prompts and routes to “agents”:
  - Meme Generator (image model)
  - Fact Checker (uses game data)
  - Opinion/Prediction (uses game data)
  - Email Sender (formats and sends via Resend)
- Backed by Gemini APIs for text/image generation.

### Key Moments Service (FastAPI)
- Scores plays and detects “key moments” based on play‑by‑play (and optionally audio sentiment).
- Exposes a streaming endpoint (`GET /getkeymoments`) that the UI subscribes to via EventSource (SSE).

### Data
- Local JSON dataset (play‑by‑play) in `research/data/` powers the stats and examples.
- MongoDB stores forum threads created from the feed.

---

## Repo at a glance
- `nextjs/` – web app and internal APIs, AI orchestration
- `fastapi/` – key‑moment detection + SSE stream
- `research/` – sample data and utilities

That’s it—simple pieces working together for a lively, AI‑enhanced game companion. 🎉


