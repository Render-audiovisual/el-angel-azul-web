#!/usr/bin/env sh
set -eu

export PORT="${PORT:-8090}"
export EAA_ADMIN_PASSWORD="${EAA_ADMIN_PASSWORD:-Angel2026!}"
export EAA_AGENCIA_PASSWORD="${EAA_AGENCIA_PASSWORD:-Azul2026!}"

exec node server.js
