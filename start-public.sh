#!/usr/bin/env sh
set -eu

export PORT="${PORT:-8090}"

if [ -z "${EAA_ADMIN_PASSWORD:-}" ] || [ -z "${EAA_AGENCIA_PASSWORD:-}" ]; then
  echo "Faltan EAA_ADMIN_PASSWORD y/o EAA_AGENCIA_PASSWORD. Definilas en el entorno antes de iniciar." >&2
  exit 1
fi

exec node server.js
