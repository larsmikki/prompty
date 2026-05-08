# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (runs client + server concurrently from repo root)
npm run dev

# Build (client Vite bundle, then server TypeScript compile)
npm run build

# Start production server
npm start

# Client only
cd client && npm run dev      # Vite dev server on :3060
cd client && npm run lint     # ESLint
cd client && npm run build    # tsc + vite build

# Server only
cd server && npm run dev      # tsx watch (hot reload)
cd server && npm run build    # tsc compile to dist/
```

There are no automated tests.

## Architecture

Prompty is a self-hosted AI prompt manager — a monorepo with a React frontend and Express backend sharing a single SQLite database.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser                                  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  React App (client/src/)                                │   │
│   │                                                         │   │
│   │  ┌──────────────────┐   ┌───────────────────────────┐  │   │
│   │  │  ThemeContext    │   │  PromptsContext            │  │   │
│   │  │  (CSS vars)      │   │  (global state + API)     │  │   │
│   │  └──────────────────┘   └─────────────┬─────────────┘  │   │
│   │                                       │                 │   │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │   │
│   │  │ HomePage │  │Discover  │  │   SettingsPage        │  │   │
│   │  └──────────┘  └──────────┘  └──────────────────────┘  │   │
│   │                                       │                 │   │
│   │                                   api.ts                │   │
│   └───────────────────────────────────────┼─────────────────┘   │
└───────────────────────────────────────────┼─────────────────────┘
                                            │
              DEV: Vite proxy :3060 → :3061 │  PROD: same origin
              GET/POST/PUT/DELETE /api/*     │
                                            │
┌───────────────────────────────────────────┼─────────────────────┐
│  Express Server (server/src/)             │                     │
│                                           ▼                     │
│   ┌───────────────────────────────────────────────────────────┐ │
│   │  app.ts  (compression · CORS · Morgan · body-parser)      │ │
│   └───────────┬───────────────┬──────────────────┬────────────┘ │
│               │               │                  │              │
│        /api/prompts   /api/categories      /api/import          │
│               │               │                  │              │
│   ┌───────────┴───────────────┴──────────────────┴────────────┐ │
│   │  db/connection.ts  (sql.js — SQLite in memory)            │ │
│   │  saveDb() serializes to disk after every write            │ │
│   └───────────────────────────────┬───────────────────────────┘ │
└───────────────────────────────────┼─────────────────────────────┘
                                    │
                    ┌───────────────▼──────────────┐
                    │   data/prompty.db  (file)   │
                    │                              │
                    │  categories (id, name)       │
                    │  prompts (id, title, text,   │
                    │           category,          │
                    │           created_at)        │
                    └──────────────────────────────┘
```

**Ports:**
- Dev: Vite on `:3060`, Express on `:3061`. Vite proxies `/api` → `:3061`.
- Production: Single Express server on `:3060` serves both the static client build and the API.

**Monorepo workspaces:** `client/` and `server/` are npm workspaces managed from the root.

### Frontend (`client/src/`)

- **`api.ts`** — thin typed fetch wrapper; all server calls go through here
- **`types.ts`** — shared `Prompt` and `Category` interfaces
- **`contexts/PromptsContext.tsx`** — global state for prompts and categories; handles all API calls and includes one-time localStorage→server migration logic on first load
- **`contexts/ThemeContext.tsx`** — manages 10 predefined themes by injecting CSS variables onto `document.documentElement`
- **`pages/HomePage.tsx`** — main UI: search, category filter pills, prompt cards, category management
- **`pages/DiscoverPage.tsx`** — browse 100+ preset prompts (sourced from `data/presetPrompts.ts`)
- **`pages/SettingsPage.tsx`** — theme selection and JSON export/import backup

### Backend (`server/src/`)

- **`app.ts`** — Express setup: compression, CORS, Morgan, JSON body parser, route mounts
- **`config.ts`** — reads `PORT` (default 3061 dev / 3060 prod) and `DATA_DIR` env vars
- **`db/connection.ts`** — SQLite via `sql.js` (pure JS, no native bindings); saves entire DB file to disk after every write via `saveDb()`
- **`db/migrate.ts`** — runs `.sql` migration files from `db/migrations/`; tracks applied migrations in `_migrations` table
- **`routes/`** — REST routes for `prompts`, `categories`, and bulk `import`

**Database schema:** Two tables — `categories (id, name)` and `prompts (id, title, text, category, created_at)`. Prompts store category by name string, not foreign key. `created_at` is a Unix timestamp integer. A default "General" category is seeded in the initial migration.

**Important:** `sql.js` loads the entire database into memory and serializes it to disk on every mutation. This is by design for simplicity — not a concern at typical prompt library scale.

### Docker

Multi-stage build: builder stage compiles everything, runtime stage copies only compiled output and production `node_modules`. SQLite data persists via a volume at `/app/data`. Health check hits `GET /api/health`.
