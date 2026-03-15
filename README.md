# EnvSync

**Sync environment variables securely across your team.**

EnvSync is an open-source tool for storing, encrypting, and sharing `.env` files across teams and environments. Variables are encrypted with AES-256-GCM before being stored — the server never holds plaintext secrets.

---

## Features

- **End-to-end encryption** — AES-256-GCM; plaintext never leaves the client unencrypted
- **CLI tool** — push and pull `.env` files from the terminal (`npx envsync`)
- **Web dashboard** — manage projects and environments in the browser
- **Multi-environment support** — separate `development`, `staging`, and `production` stores per project
- **API-token auth** — no passwords; tokens are generated on registration and revocable
- **Structured audit logging** — every push/pull is logged with user and project context

---

## Architecture

```text
┌─────────────┐     HTTPS / Bearer token     ┌──────────────────┐
│  CLI tool   │ ───────────────────────────► │  Express API     │
│  (npm pkg)  │                              │  (Node/TypeScript)│
└─────────────┘                              │                  │
                                             │  AES-256-GCM     │
┌─────────────┐     HTTPS / Bearer token     │  encryption      │
│  Web dash   │ ───────────────────────────► │                  │
│  (Next.js)  │                              └────────┬─────────┘
└─────────────┘                                       │
                                               Prisma ORM
                                                      │
                                             ┌────────▼─────────┐
                                             │   PostgreSQL     │
                                             │  (encrypted      │
                                             │   values only)   │
                                             └──────────────────┘
```

**Monorepo layout:**

```text
apps/
  backend/   — Express + Prisma REST API
  cli/       — Commander CLI (publishable npm package)
  web/       — Next.js dashboard
packages/
  shared-types/  — TypeScript interfaces shared across apps
```

---

## Quick Start (CLI)

Install globally or use via `npx`:

```bash
npm install -g envsync
# or
npx envsync --help
```

**1. Log in with your API token** (get one by registering on the web dashboard or via the API):

```bash
envsync login --token YOUR_API_TOKEN
```

To point at a self-hosted instance:

```bash
envsync login --token YOUR_API_TOKEN --api-url https://your-api.example.com
```

**2. Push your `.env` file:**

```bash
envsync push --project PROJECT_ID --env development
envsync push --project PROJECT_ID --env staging
envsync push --project PROJECT_ID --env production
```

**3. Pull variables into a local `.env`:**

```bash
envsync pull --project PROJECT_ID --env development
# writes to .env in the current directory
```

**Other commands:**

```bash
envsync whoami    # show current login status
envsync logout    # remove locally stored token
envsync --help    # full command reference
```

---

## Running Locally

### Prerequisites

- Node.js ≥ 18
- Docker and Docker Compose

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/envsync.git
cd envsync
npm install
```

### 2. Configure environment variables

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.local.example apps/web/.env.local
```

Edit `apps/backend/.env` and fill in the required values. To generate the encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste the output as `ENV_SYNC_SECRET` in your `.env`.

### 3. Start the database

```bash
docker compose up db -d
```

### 4. Run database migrations

```bash
cd apps/backend
npx prisma migrate dev --name init
cd ../..
```

### 5. Start the backend and web

```bash
# from repo root — run each in a separate terminal
npm run dev:backend
npm run dev:web
```

| Service | URL |
| ------- | --- |
| API | `http://localhost:3001` |
| Health check | `http://localhost:3001/health` |
| Web dashboard | `http://localhost:3000` |

---

## Environment Variables

### Backend (`apps/backend/.env`)

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `ENV_SYNC_SECRET` | Yes | 64-char hex string (32 bytes) for AES-256-GCM |
| `PORT` | No | Server port (default: `3001`) |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins for the web dashboard |
| `HEALTH_SECRET` | No | Secret for the internal `/health?secret=` endpoint |

### Web (`apps/web/.env.local`)

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `NEXT_PUBLIC_API_URL` | Yes | Backend API base URL |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | PostHog analytics key (leave blank to disable) |

---

## API Reference

All endpoints (except `/health` and `/auth/*`) require:

```http
Authorization: Bearer YOUR_API_TOKEN
```

### Auth

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `POST` | `/auth/register` | Register and receive an API token |

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com"}'
# returns: { "token": "..." }
```

### Projects

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `GET` | `/projects` | List your projects |
| `POST` | `/projects` | Create a project |

### Env Variables

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `POST` | `/projects/:id/env?env=development` | Push variables |
| `GET` | `/projects/:id/env?env=development` | Pull variables |

Supported `env` values: `development`, `staging`, `production`

---

## Deploying to Railway

1. Create a new project at [railway.app](https://railway.app)
2. Add a **PostgreSQL** plugin — Railway injects `DATABASE_URL` automatically
3. Set these environment variables in your Railway service:
   - `ENV_SYNC_SECRET` — generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `ALLOWED_ORIGINS` — your web dashboard URL
   - `HEALTH_SECRET` — any random string
4. Set **Dockerfile path** to `apps/backend/Dockerfile` in Railway build settings
5. Push to `main` — Railway deploys automatically

Verify the deployment:

```bash
curl https://YOUR_RAILWAY_URL/health
# {"status":"ok"}
```

---

## Security

- **Encryption at rest** — all variable values are encrypted with AES-256-GCM before being written to the database. The encryption key (`ENV_SYNC_SECRET`) never leaves the server.
- **No plaintext storage** — the database contains only `iv:ciphertext:authTag` tuples; a database dump exposes nothing without the key.
- **Secrets management** — never commit `.env` files. The `.gitignore` in this repo excludes all `.env` files. Use your deployment platform's secret store for production values.
- **CORS allowlist** — the API only accepts cross-origin requests from origins listed in `ALLOWED_ORIGINS`.
- **Error boundaries** — 5xx errors return a generic message to the client; internal details are logged server-side only.

To report a security vulnerability, please open a [GitHub issue](https://github.com/YOUR_USERNAME/envsync/issues) marked **[security]**. Do not include sensitive details in the issue body — we will follow up to arrange private disclosure.

---

## Development

### Tests

```bash
npm test --workspace=apps/backend   # backend unit + integration tests
npm test --workspace=apps/cli       # CLI unit tests
```

### Linting

```bash
npm run lint --workspace=apps/backend
npm run lint --workspace=apps/web
npm run lint --workspace=apps/cli
```

### CI

GitHub Actions runs lint and tests on every push to `main` and on all pull requests. See [`.github/workflows/build.yml`](.github/workflows/build.yml).

---

## Contributing

Contributions are welcome. Please:

1. Fork the repo and create a feature branch
2. Make your changes with tests where applicable
3. Ensure `npm test` and `npm run lint` pass in affected workspaces
4. Open a pull request with a clear description of the change

---

## License

MIT — see [LICENSE](LICENSE).
