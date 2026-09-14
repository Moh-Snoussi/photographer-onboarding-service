#!/usr/bin/env bash

set -euo pipefail

project_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
env_file="$project_dir/.env"
service_file="$project_dir/systemd/ollama.service"
target_env_file=/etc/ollama/ollama.env
target_service_file=/etc/systemd/system/ollama-local.service

if [[ $EUID -ne 0 ]]; then
  echo 'Run this script with sudo.' >&2
  exit 1
fi

if [[ ! -f $env_file ]]; then
  cp "$project_dir/.env.example" "$env_file"
  echo "Created $env_file. Review it, then run this script again." >&2
  exit 1
fi

if ! command -v ollama >/dev/null 2>&1; then
  curl -fsSL https://ollama.com/install.sh | sh
fi

install -d -m 0755 /etc/ollama
install -m 0644 "$env_file" "$target_env_file"
install -m 0644 "$service_file" "$target_service_file"

systemctl daemon-reload
systemctl enable --now ollama-local.service

echo 'Ollama service installed. Pull the configured model with:'
echo "  sudo $project_dir/bin/pull-model.sh"
