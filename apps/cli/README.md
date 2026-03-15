# envsync

CLI tool for [EnvSync](https://github.com/YOUR_USERNAME/envsync) — sync environment variables securely across your team.

Variables are encrypted with AES-256-GCM before leaving your machine. The server stores only ciphertext.

---

## Installation

```bash
npm install -g envsync
```

Or run without installing:

```bash
npx envsync --help
```

**Requires Node.js ≥ 18**

---

## Getting started

### 1. Get an API token

Register at your team's EnvSync instance (web dashboard or API) to receive an API token.

### 2. Log in

```bash
envsync login --token YOUR_API_TOKEN
```

If your team self-hosts EnvSync, point to your instance:

```bash
envsync login --token YOUR_API_TOKEN --api-url https://your-envsync.example.com
```

Your token is stored locally at `~/.envsync/config.json`. It is never sent anywhere except to the configured API URL.

### 3. Push variables

From a directory containing a `.env` file:

```bash
envsync push --project <project-id> --env development
```

### 4. Pull variables

```bash
envsync pull --project <project-id> --env development
```

This writes (or overwrites) a `.env` file in the current directory.

---

## Commands

### `envsync login`

```
envsync login --token <token> [--api-url <url>]
```

| Option | Required | Description |
| ------ | -------- | ----------- |
| `--token` | Yes | Your API token |
| `--api-url` | No | API base URL (defaults to the public EnvSync instance) |

---

### `envsync push`

```
envsync push --project <id> --env <environment> [--file <path>]
```

Reads variables from a `.env` file and uploads them to EnvSync.

| Option | Required | Description |
| ------ | -------- | ----------- |
| `--project` | Yes | Project ID (from the dashboard) |
| `--env` | Yes | Target environment: `development`, `staging`, or `production` |
| `--file` | No | Path to the `.env` file (default: `.env` in current directory) |

---

### `envsync pull`

```
envsync pull --project <id> --env <environment> [--file <path>]
```

Downloads variables from EnvSync and writes them to a `.env` file.

| Option | Required | Description |
| ------ | -------- | ----------- |
| `--project` | Yes | Project ID |
| `--env` | Yes | Source environment: `development`, `staging`, or `production` |
| `--file` | No | Output path (default: `.env` in current directory) |

---

### `envsync whoami`

Shows your current login status and configured API URL.

---

### `envsync logout`

Removes your locally stored token (`~/.envsync/config.json`).

---

## Value quoting

The CLI automatically quotes `.env` values that contain spaces, `#`, `"`, or newlines when writing the output file, ensuring they round-trip correctly on the next push.

---

## Security notes

- Your API token is stored in `~/.envsync/config.json` on disk. Protect this file as you would any credential.
- The CLI does not encrypt values locally — encryption is handled server-side using AES-256-GCM.
- The server stores only `iv:ciphertext:authTag`; plaintext values are never persisted.
- Always add `.env` to your `.gitignore`.

---

## License

MIT
