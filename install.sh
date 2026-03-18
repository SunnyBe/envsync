#!/usr/bin/env bash
# EnvSync CLI — installer
#
# Usage (recommended):
#   curl -sSfL https://raw.githubusercontent.com/SunnyBe/envsync/main/install.sh | bash
#
# Or download and run locally:
#   bash install.sh
#
# Supported: macOS, Linux (Debian/Ubuntu/Arch/Alpine/RHEL)
# Requires:  Node.js >= 18 and npm

set -euo pipefail

# ── Colours ───────────────────────────────────────────────────────────────────

if [ -t 1 ] && command -v tput >/dev/null 2>&1; then
  BOLD="$(tput bold)"
  CYAN="$(tput setaf 6)"
  GREEN="$(tput setaf 2)"
  YELLOW="$(tput setaf 3)"
  RED="$(tput setaf 1)"
  DIM="$(tput dim)"
  RESET="$(tput sgr0)"
else
  BOLD="" CYAN="" GREEN="" YELLOW="" RED="" DIM="" RESET=""
fi

info()    { printf '%s  ℹ  %s%s\n' "${DIM}"  "$1" "${RESET}"; }
success() { printf '%s  ✔  %s%s\n' "${GREEN}" "$1" "${RESET}"; }
warn()    { printf '%s  ⚠  %s%s\n' "${YELLOW}" "$1" "${RESET}"; }
error()   { printf '%s  ✖  %s%s\n' "${RED}"   "$1" "${RESET}" >&2; }
step()    { printf '%s  →  %s%s\n' "${BOLD}"  "$1" "${RESET}"; }

# ── Banner ────────────────────────────────────────────────────────────────────

printf '\n'
printf '%s  ┌───────────────────────────────┐%s\n' "${CYAN}" "${RESET}"
printf '%s  │   EnvSync CLI — Installer     │%s\n' "${CYAN}" "${RESET}"
printf '%s  └───────────────────────────────┘%s\n' "${CYAN}" "${RESET}"
printf '\n'

# ── Check: Node.js ────────────────────────────────────────────────────────────

step "Checking prerequisites..."

if ! command -v node >/dev/null 2>&1; then
  error "Node.js is not installed."
  info  "Install Node.js v18 or later from: https://nodejs.org"
  info  "Or use a version manager: https://github.com/nvm-sh/nvm"
  exit 1
fi

NODE_VERSION_RAW="$(node --version)"                    # e.g. v20.11.0
NODE_MAJOR="$(echo "${NODE_VERSION_RAW}" | sed 's/v//' | cut -d. -f1)"

if [ "${NODE_MAJOR}" -lt 18 ]; then
  error "Node.js v18+ is required (you have ${NODE_VERSION_RAW})"
  info  "Upgrade at: https://nodejs.org"
  exit 1
fi

success "Node.js ${NODE_VERSION_RAW} found"

# ── Check: npm ────────────────────────────────────────────────────────────────

if ! command -v npm >/dev/null 2>&1; then
  error "npm is not available. It usually ships with Node.js — try reinstalling."
  exit 1
fi

NPM_VERSION="$(npm --version)"
success "npm ${NPM_VERSION} found"

# ── Install ───────────────────────────────────────────────────────────────────

step "Installing envsync..."

# Try global install; on some systems npm global requires sudo
if npm install -g @ndusunday/envsync 2>&1; then
  : # success — continue
else
  warn "npm install failed — retrying with sudo..."
  if sudo npm install -g @ndusunday/envsync 2>&1; then
    : # success with sudo
  else
    error "Installation failed."
    info  "Try manually: npm install -g @ndusunday/envsync"
    info  "Or without a global install: npx @ndusunday/envsync --help"
    exit 1
  fi
fi

# ── Verify ────────────────────────────────────────────────────────────────────

if ! command -v envsync >/dev/null 2>&1; then
  warn "'envsync' was installed but is not in your PATH."
  NPM_BIN="$(npm config get prefix)/bin"
  info  "Add this to your shell profile (.bashrc / .zshrc):"
  printf '\n    %sexport PATH="%s:\$PATH"%s\n\n' "${CYAN}" "${NPM_BIN}" "${RESET}"
  info  "Then restart your shell and run: envsync --help"
  exit 0
fi

INSTALLED_VERSION="$(envsync --version 2>/dev/null || echo '?')"
success "envsync ${INSTALLED_VERSION} installed at $(command -v envsync)"

# ── Quick start ───────────────────────────────────────────────────────────────

printf '\n'
printf '%s  Quick start:%s\n' "${BOLD}" "${RESET}"
printf '\n'
printf '  %s1.%s Get your API token from the EnvSync dashboard → Settings\n' "${CYAN}" "${RESET}"
printf '     %shttps://github.com/SunnyBe/envsync#readme%s\n' "${DIM}" "${RESET}"
printf '\n'
printf '  %s2.%s Log in:\n' "${CYAN}" "${RESET}"
printf '     %senvsync login --token <your-api-token>%s\n' "${BOLD}" "${RESET}"
printf '\n'
printf '  %s3.%s Push your .env file:\n' "${CYAN}" "${RESET}"
printf '     %senvsync push --project <project-id> --env development%s\n' "${BOLD}" "${RESET}"
printf '\n'
printf '  %s4.%s Pull on another machine:\n' "${CYAN}" "${RESET}"
printf '     %senvsync pull --project <project-id> --env development%s\n' "${BOLD}" "${RESET}"
printf '\n'
printf '  %sFull reference: envsync --help%s\n' "${DIM}" "${RESET}"
printf '\n'
