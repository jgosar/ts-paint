#!/usr/bin/env bash
#
# Runs the Playwright e2e suite inside the pinned Playwright Docker image, so that visual-regression screenshots
# render exactly as in CI (same Linux fonts and antialiasing).
#
# Usage:
#   scripts/e2e-docker.sh                     # run the whole suite (functional + visual)
#   scripts/e2e-docker.sh --update-snapshots  # (re)generate the Linux baselines, then commit e2e/*-snapshots/
#   scripts/e2e-docker.sh <playwright args>   # e.g. toolbox.visual.spec.ts --grep eraser
#
# Notes:
# - The image tag MUST match @playwright/test in ts-paint/package.json.
# - --platform linux/amd64 matches the GitHub Actions runner; on Apple Silicon it runs under emulation
#   (slower, but pixel-identical to CI).
# - ts-paint/node_modules is shadowed with an anonymous volume: the host's native binaries (macOS) don't run in the
#   Linux container, so `npm ci` installs Linux ones inside it.
# - --ipc=host: Docker's default /dev/shm is too small for Chromium.
# - The image's Node is older than the Angular CLI's minimum, so the version from ts-paint/.nvmrc is installed first
#   (the same version the CI jobs use through actions/setup-node).
# - FONTCONFIG_FILE: text is rendered without anti-aliasing, see ts-paint/e2e/fonts.conf.
set -euo pipefail

IMAGE="mcr.microsoft.com/playwright:v1.58.2-noble"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE_VERSION="$(tr -d '[:space:]' < "${REPO_ROOT}/ts-paint/.nvmrc")"

docker run --rm \
  --platform linux/amd64 \
  --ipc=host \
  -v "${REPO_ROOT}:/work" \
  -v /work/ts-paint/node_modules \
  -w /work/ts-paint \
  -e CI=true \
  -e NODE_VERSION="${NODE_VERSION}" \
  -e FONTCONFIG_FILE=/work/ts-paint/e2e/fonts.conf \
  "${IMAGE}" \
  bash -c 'npm install -g n >/dev/null && n "${NODE_VERSION}" >/dev/null && node -v && npm ci && npx playwright test "$@"' bash "$@"
