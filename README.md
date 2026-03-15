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
- **CLI tool** — push and pull `.env` files from the terminal
- **Web dashboard** — manage projects and environments in the browser
- **Multi-environment** — separate `development`, `staging`, and `production` stores per project
- **API-token auth** — no passwords; tokens are generated on registration

---

## Quick start

See the [CLI README](apps/cli/README.md) for full usage instructions.

```bash
npx envsync --help
```

---

## Repository structure

```text
apps/
  backend/          Express + Prisma REST API
  cli/              Commander CLI — published to npm as `envsync`
  web/              Next.js dashboard
packages/
  shared-types/     TypeScript interfaces shared across apps
```

---

## Local development

### Prerequisites

- Node.js ≥ 18
- Docker and Docker Compose

### Setup

```bash
git clone https://github.com/YOUR_USERNAME/envsync.git
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

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `ENV_SYNC_SECRET` | Yes | 64-char hex key for AES-256-GCM |
| `PORT` | No | Server port (default `3001`) |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins for the dashboard |
| `HEALTH_SECRET` | No | Token for the internal health endpoint |

### Web (`apps/web/.env.local`)

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `NEXT_PUBLIC_API_URL` | Yes | Backend API base URL |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | PostHog analytics key (optional) |

---

## API reference

All endpoints except `/health` and `/auth/*` require `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `POST` | `/auth/register` | Register; returns an API token |
| `GET` | `/projects` | List projects |
| `POST` | `/projects` | Create a project |
| `POST` | `/projects/:id/env?env=<environment>` | Push variables |
| `GET` | `/projects/:id/env?env=<environment>` | Pull variables |

Supported environments: `development`, `staging`, `production`

---

## Security

- Variable values are encrypted with AES-256-GCM before being written to the database
- A unique IV is generated per encryption operation
- 5xx error responses never expose internal details to the client
- `.env` files are excluded from this repository via `.gitignore`

To report a vulnerability, open a GitHub issue marked **[security]** and we will arrange private disclosure.

---

## Development

```bash
# Tests
npm test --workspace=apps/backend
npm test --workspace=apps/cli

# Lint
npm run lint --workspace=apps/backend
npm run lint --workspace=apps/web
npm run lint --workspace=apps/cli
```

CI runs lint and tests on every push to `main`. See [`.github/workflows/build.yml`](.github/workflows/build.yml).

---

## Contributing

1. Fork the repo and create a feature branch
2. Make your changes with tests where applicable
3. Ensure `npm test` and `npm run lint` pass in the affected workspaces
4. Open a pull request with a clear description of the change

---

## License

MIT
