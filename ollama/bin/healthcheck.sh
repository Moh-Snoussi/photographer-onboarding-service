#!/usr/bin/env bash

set -euo pipefail

project_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
env_file="$project_dir/.env"

if [[ ! -f $env_file ]]; then
  echo "Missing $env_file. Copy .env.example first." >&2
  exit 1
fi

# shellcheck disable=SC1090
source "$env_file"

: "${OLLAMA_HOST:?OLLAMA_HOST must be set in .env}"

curl --fail --silent --show-error "http://${OLLAMA_HOST}/api/tags"
echo
