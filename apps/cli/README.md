# @ndusunday/envsync

CLI tool for [EnvSync](https://github.com/SunnyBe/envsync) — sync environment variables securely across your team.

Variables are encrypted with AES-256-GCM before leaving your machine. The server stores only ciphertext — plaintext secrets are never persisted.

---

## Installation

```bash
# Global install (recommended)
npm install -g @ndusunday/envsync

# One-liner installer
curl -sSfL https://raw.githubusercontent.com/SunnyBe/envsync/main/install.sh | bash

# Run without installing
npx @ndusunday/envsync --help
```

**Requires Node.js ≥ 18**

Once installed, the command is simply `envsync` regardless of how you installed it.

---

## Getting started

### 1. Get an API token

Sign up at the [EnvSync dashboard](https://github.com/SunnyBe/envsync#readme) to receive an API token, or run a self-hosted instance.

### 2. Log in

```bash
envsync login --token YOUR_API_TOKEN
```

If you self-host EnvSync, point to your instance:

```bash
envsync login --token YOUR_API_TOKEN --api-url https://your-envsync.example.com
```

Your token is stored locally at `~/.envsync/config.json`. It is never sent anywhere except to the configured API URL.

### 3. Create or find your project ID

```bash
# List all your projects
envsync project list

# Or create a new one
envsync project create my-app
```

### 4. Push variables

From a directory containing a `.env` file:

```bash
envsync push --project <project-id> --env development
```

### 5. Pull variables

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

| Option      | Required | Description                                            |
| ----------- | -------- | ------------------------------------------------------ |
| `--token`   | Yes      | Your API token                                         |
| `--api-url` | No       | API base URL (defaults to the public EnvSync instance) |

---

### `envsync logout`

Removes your locally stored token (`~/.envsync/config.json`).

---

### `envsync whoami`

Shows your current login status, configured API URL, and masked token.

---

### `envsync push`

```
envsync push --project <id> --env <environment> [--file <path>]
```

Reads variables from a `.env` file and uploads them to EnvSync.

| Option      | Required | Description                                                    |
| ----------- | -------- | -------------------------------------------------------------- |
| `--project` | Yes      | Project ID (from `envsync project list` or the dashboard)      |
| `--env`     | Yes      | Target environment: `development`, `staging`, or `production`  |
| `--file`    | No       | Path to the `.env` file (default: `.env` in current directory) |

---

### `envsync pull`

```
envsync pull --project <id> --env <environment> [--file <path>]
```

Downloads variables from EnvSync and writes them to a `.env` file.

| Option      | Required | Description                                                   |
| ----------- | -------- | ------------------------------------------------------------- |
| `--project` | Yes      | Project ID                                                    |
| `--env`     | Yes      | Source environment: `development`, `staging`, or `production` |
| `--file`    | No       | Output path (default: `.env` in current directory)            |

---

### `envsync project`

Manage projects from the terminal.

```bash
envsync project list                        # List all your projects
envsync project create <name>               # Create a new project
envsync project get <id>                    # Show project details
envsync project update <id> --name <name>   # Rename a project
envsync project delete <id>                 # Delete a project
```

---

### `envsync help [command]`

Show help for a specific command:

```bash
envsync help push
envsync help project
envsync --help
```

---

### `envsync --version` / `-V`

Print the installed version.

---

## Value quoting

The CLI automatically quotes `.env` values that contain spaces, `#`, `"`, or newlines when writing the output file, ensuring they round-trip correctly on the next push.

---

## Security notes

- Your API token is stored in `~/.envsync/config.json` on disk. Protect this file as you would any credential.
- Encryption is handled server-side using AES-256-GCM; the server stores only `iv:ciphertext:authTag`.
- API tokens are stored as SHA-256 hashes on the server — the plaintext token is never persisted after registration.
- Always add `.env` to your `.gitignore`.

---

## License

MIT
