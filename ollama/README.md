# Ollama Server

Standalone deployment files for running Ollama directly on a small Linux host.
The default model, `qwen3:1.7b`, is intended for a CPU-only server with 4-8 GB
RAM. Ollama exposes its native HTTP API at `http://127.0.0.1:11434` by default.

## Install

These commands assume a systemd-based Linux distribution and outbound internet
access during installation and model download.

```bash
cd ollama
cp .env.example .env
# Review .env, then install Ollama and register the system service.
sudo ./bin/install.sh
sudo ./bin/pull-model.sh
./bin/healthcheck.sh
```

`install.sh` downloads the official Ollama installer only when the `ollama`
command is absent. It installs this project configuration at
`/etc/ollama/ollama.env` and registers `ollama-local.service`.

## Configuration

All deployment values are in the untracked `.env` file:

| Variable | Default | Purpose |
| --- | --- | --- |
| `OLLAMA_MODEL` | `qwen3:1.7b` | Model pulled by `bin/pull-model.sh`; change this when replacing the model. |
| `OLLAMA_HOST` | `127.0.0.1:11434` | Bind address for the HTTP API. |
| `OLLAMA_MAX_LOADED_MODELS` | `1` | Caps loaded models for the available memory. |
| `OLLAMA_NUM_PARALLEL` | `1` | Serializes generation work on the small host. |
| `OLLAMA_KEEP_ALIVE` | `10m` | How long the model stays in memory after a request. |

After changing values consumed by the service, apply them with:

```bash
sudo ./bin/install.sh
sudo systemctl restart ollama-local.service
```

The service is intentionally loopback-only. Do not expose it directly on a
public network: Ollama's local API has no authentication. For remote access,
keep `OLLAMA_HOST` private and use a reverse proxy or tunnel with network
access controls and authentication.

## Operations

```bash
sudo systemctl status ollama-local.service
sudo journalctl -u ollama-local.service -f
./bin/healthcheck.sh
ollama list
```

Changing `OLLAMA_MODEL` does not alter the running server; pull the replacement
model with `sudo ./bin/pull-model.sh` and set the scraper's `LLM_MODEL` to the
same value.

## HTTP Smoke Tests

Run the requests in `ollama.http` with the VS Code REST Client extension to
verify the API, list installed models, and make a JSON-mode chat request. The
chat request sets `think: false` to avoid reasoning output, reducing response
time and generated tokens for structured scraper extraction.

## Scraper Connection

On the same host, configure the scraper with:

```dotenv
LLM_PROVIDER=ollama
LLM_MODEL=qwen3:1.7b
OLLAMA_BASE_URL=http://127.0.0.1:11434
```

The scraper sends non-streaming JSON-mode requests to Ollama's `/api/chat`
endpoint with `think: false`. When the scraper is on a different private host,
set `OLLAMA_BASE_URL` to the authenticated private endpoint instead of exposing
port `11434` publicly.
