# Prompty

![Screenshot](screenshot.png)

A self-hosted prompt library for managing and organizing your AI prompts. Store, search, and discover prompts across categories â€” all synced server-side so your library is available everywhere.

## Getting started

Pick whichever install path matches your setup. All paths land on [http://localhost:3060](http://localhost:3060).

### 1. Docker (Docker Desktop, NAS, or any Docker server)

Works on Synology, Unraid, TrueNAS, QNAP, Proxmox, or a plain Docker host.

```bash
docker run -d \
  --name prompty \
  -p 3060:3060 \
  -v prompty_data:/app/data \
  --restart unless-stopped \
  larsmikki/prompty:latest
```

Or with Compose:

```yaml
services:
  prompty:
    image: larsmikki/prompty:latest
    container_name: prompty
    ports:
      - "3060:3060"
    volumes:
      - prompty_data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3060/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

volumes:
  prompty_data:
```

### 2. Local install on Windows

Requires [Git for Windows](https://git-scm.com/download/win) and [Node.js 20+](https://nodejs.org/).

```powershell
git clone https://github.com/larsmikki/prompty.git
cd prompty
npm install
npm run dev
```

For a production build: `npm run build && npm start`.

### 3. Local install on macOS

```bash
brew install node git
git clone https://github.com/larsmikki/prompty.git
cd prompty
npm install
npm run dev
```

For a production build: `npm run build && npm start`.

### 4. Local install on Linux

Debian/Ubuntu:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git

git clone https://github.com/larsmikki/prompty.git
cd prompty
npm install
npm run dev
```

On Fedora/RHEL use `dnf install nodejs git`; on Arch use `pacman -S nodejs npm git`.

For a production build: `npm run build && npm start`.

In dev, the client runs on `:3060` and the API on `:3061`. For local dev, copy `.env.example` to `.env` to override defaults.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3061` (dev) / `3060` (Docker image) | Port the server listens on |
| `DATA_DIR` | `../data` (dev) / `/app/data` (Docker) | Directory where the SQLite database and uploaded images are stored |
| `OPENAI_API_KEY` | _unset_ | Optional fallback OpenAI API key. The Settings page also accepts a key and stores it in the database; the env var is only used if the DB has no key. |

## Features

- **Prompt library** â€” create, edit, and delete prompts with titles and categories
- **Categories** â€” organize prompts into custom categories
- **Search** â€” full-text search across prompt titles and content
- **Discover** â€” browse 170+ pre-made prompts across 12 categories (Writing, Business, Development, and more)
- **Export / Import** â€” backup and restore your library as JSON
- **Themes** â€” 10 built-in light and dark themes
- **Persistent storage** â€” all data stored in SQLite via a Docker volume

## Upgrading from Promptr

The Docker volume is now named `prompty_data`. Existing Docker deployments can keep using the old `promptr_data` volume by mounting it at `/app/data`, or migrate its contents to the new volume before starting Prompty. Local installations keep their existing `data/` directory unchanged.

## Development scripts

```bash
npm test                  # run the server test suite (vitest)
npm run lint -w client    # lint the client
npm run build             # production build of client + server
docker build -t prompty . # build a production image locally
```
