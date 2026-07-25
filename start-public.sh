#!/usr/bin/env sh
set -eu

export PORT="${PORT:-8090}"

if [ -z "${EAA_ADMIN_PASSWORD:-}" ]; then
  echo "Falta EAA_ADMIN_PASSWORD. Definila en el entorno antes de iniciar." >&2
  exit 1
fi

exec node server.js
