# EnvSync

**Sync environment variables securely across your team.**

EnvSync is an open-source tool for storing, encrypting, and sharing `.env` files across teams and environments. Variables are encrypted with AES-256-GCM before being stored — the server never holds plaintext secrets.

---

## How it works

```text
┌─────────────┐                              ┌──────────────────┐
│  CLI tool   │ ──── Bearer token / HTTPS ─► │  Express API     │
│  (npm pkg)  │                              │                  │
└─────────────┘                              │  AES-256-GCM     │
                                             │  encryption      │
┌─────────────┐                              │                  │
│  Web dash   │ ──── Bearer token / HTTPS ─► │                  │
│  (Next.js)  │                              └────────┬─────────┘
└─────────────┘                                       │
                                             ┌────────▼─────────┐
                                             │   PostgreSQL     │
                                             │  (ciphertext     │
                                             │   only stored)   │
                                             └──────────────────┘
```

The database stores only `iv:ciphertext:authTag` — a database breach exposes nothing without the encryption key.

---

## Features

- **Encrypted at rest** — AES-256-GCM with per-value IVs; the server never holds plaintext
- **CLI tool** — push and pull `.env` files, manage projects from the terminal
- **Web dashboard** — manage projects, variables, members, and settings in the browser
- **Multi-environment** — separate `development`, `staging`, and `production` stores per project
- **RBAC** — project owners, editors, and viewers with fine-grained access control
- **Audit trail** — every push, pull, delete, and auth event is logged with metadata
- **API-token auth** — no passwords; tokens are SHA-256 hashed before storage
- **Token regeneration** — rotate your API token at any time from settings
- **i18n** — UI available in English, French, and Spanish with auto locale detection

---

## CLI installation

```bash
# Global install
npm install -g @ndusunday/envsync

# Or with the one-liner installer
curl -sSfL https://raw.githubusercontent.com/SunnyBe/envsync/main/install.sh | bash

# Or run without installing
npx @ndusunday/envsync --help
```

See the [CLI README](apps/cli/README.md) for the full command reference.

---

## Quick start

```bash
# 1. Log in with your API token (from the web dashboard → Settings)
envsync login --token <your-api-token>

# 2. Create a project (or grab the ID from the web dashboard)
envsync project create my-app

# 3. Push your .env file
envsync push --project <project-id> --env development

# 4. Pull on another machine
envsync pull --project <project-id> --env development
```

---

## Repository structure

```text
apps/
  backend/          Express + Prisma REST API
  cli/              Commander CLI — published to npm as @ndusunday/envsync
  web/              Next.js dashboard
packages/
  shared-types/     TypeScript interfaces shared across apps
install.sh          One-liner installer script
```

---

## Local development

### Prerequisites

- Node.js ≥ 18
- Docker and Docker Compose

### Option A — Docker Compose (full stack)

```bash
git clone https://github.com/SunnyBe/envsync.git
cd envsync

# Copy and fill in the backend env file
cp apps/backend/.env.example apps/backend/.env

# Start everything: backend, web, postgres, grafana, prometheus
docker compose up
```

Services start at:

- Web dashboard: <http://localhost:3000>
- API: <http://localhost:3001>
- Grafana: <http://localhost:3002>

### Option B — Manual (backend + web separately)

```bash
git clone https://github.com/SunnyBe/envsync.git
cd envsync
npm install

cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.local.example apps/web/.env.local
```

Generate an encryption key and set it as `ENV_SYNC_SECRET` in `apps/backend/.env`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Start the database and run migrations:

```bash
docker compose up db -d
cd apps/backend && npx prisma migrate dev --name init && cd ../..
```

Start the services (each in a separate terminal):

```bash
npm run dev:backend   # http://localhost:3001
npm run dev:web       # http://localhost:3000
```

---

## Environment variables

### Backend (`apps/backend/.env`)

| Variable          | Required | Description                                    |
| ----------------- | -------- | ---------------------------------------------- |
| `DATABASE_URL`    | Yes      | PostgreSQL connection string                   |
| `ENV_SYNC_SECRET` | Yes      | 64-char hex key for AES-256-GCM                |
| `PORT`            | No       | Server port (default `3001`)                   |
| `ALLOWED_ORIGINS` | No       | Comma-separated CORS origins for the dashboard |
| `HEALTH_SECRET`   | No       | Token for the internal health endpoint         |

### Web (`apps/web/.env.local`)

| Variable                  | Required | Description                      |
| ------------------------- | -------- | -------------------------------- |
| `NEXT_PUBLIC_API_URL`     | Yes      | Backend API base URL             |
| `NEXT_PUBLIC_POSTHOG_KEY` | No       | PostHog analytics key (optional) |

---

## API reference

All endpoints except `/health` and `/auth/register` require `Authorization: Bearer <token>`.

### Auth

| Method | Endpoint           | Description                    |
| ------ | ------------------ | ------------------------------ |
| `POST` | `/auth/register`   | Register; returns an API token |
| `GET`  | `/auth/me`         | Get current user info          |
| `POST` | `/auth/regenerate` | Rotate API token               |

### Projects

| Method   | Endpoint        | Description                       |
| -------- | --------------- | --------------------------------- |
| `GET`    | `/projects`     | List your projects                |
| `POST`   | `/projects`     | Create a project                  |
| `GET`    | `/projects/:id` | Get project details and your role |
| `PATCH`  | `/projects/:id` | Rename a project                  |
| `DELETE` | `/projects/:id` | Delete a project (owner only)     |

### Env variables

| Method   | Endpoint                                   | Description       |
| -------- | ------------------------------------------ | ----------------- |
| `POST`   | `/projects/:id/env?env=<environment>`      | Push variables    |
| `GET`    | `/projects/:id/env?env=<environment>`      | Pull variables    |
| `DELETE` | `/projects/:id/env/:key?env=<environment>` | Delete a variable |

### Members

| Method   | Endpoint                          | Description          |
| -------- | --------------------------------- | -------------------- |
| `GET`    | `/projects/:id/members`           | List project members |
| `POST`   | `/projects/:id/members`           | Invite a member      |
| `DELETE` | `/projects/:id/members/:memberId` | Remove a member      |

### Audit

| Method | Endpoint | Description            |
| ------ | -------- | ---------------------- |
| `GET`  | `/audit` | List your audit events |

Supported environments: `development`, `staging`, `production`

---

## Security

- Variable values are encrypted with AES-256-GCM before being written to the database
- A unique IV is generated per encryption operation — no two ciphertexts are alike
- API tokens are stored as SHA-256 hashes; the plaintext token is never persisted
- 5xx error responses never expose internal details to the client
- Rate limiting on auth endpoints (20 req / 15 min)
- `.env` files are excluded from this repository via `.gitignore`

To report a vulnerability, email [ndusunday@gmail.com](mailto:ndusunday@gmail.com) or open a GitHub issue marked **[security]**.

---

## Development

```bash
# Tests
npm test -w apps/backend
npm test -w apps/cli

# Lint
npm run lint -w apps/backend
npm run lint -w apps/web
npm run lint -w apps/cli

# Rebuild CLI
npm run rebuild -w apps/cli
```

CI runs lint, tests, and a Docker build on every push to `main`. See [`.github/workflows/build.yml`](.github/workflows/build.yml).

---

## Contributing

1. Fork the repo and create a feature branch
2. Make your changes with tests where applicable
3. Ensure `npm test` and `npm run lint` pass in the affected workspaces
4. Open a pull request with a clear description of the change

---

## License

MIT
