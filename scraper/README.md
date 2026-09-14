# Playwright Scraper Worker

This service exposes a small HTTP API that uses Playwright to render a
photographer website and return its homepage hero image and text from a
discovered Impressum page.

## Prerequisites

- Node.js 20 or later
- npm
- Linux package required by Chromium/Playwright:

```bash
sudo apt install libgstreamer-plugins-bad1.0-0
```

## Install

From this directory, install the application dependencies and download the
Playwright browser binary:

```bash
npm install
npx playwright install
```

`npm install` installs the Playwright JavaScript package. `npx playwright
install` downloads Chromium, which is a separate required step.

## Run

```bash
npm start
```

The worker listens on `http://localhost:3001`.

## Verify

Check that the worker is running:

```bash
curl http://localhost:3001/health
```

Expected response:

```json
{"status":"ok"}
```

Send a crawl request:

```bash
curl -X POST http://localhost:3001/crawl \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com"}'
```

The response includes the discovered hero image, Impressum URL, and Impressum
content. Fields are `null` when no corresponding item is found.

```json
{
  "Hero": "https://example.com/hero.jpg",
  "ImpressumUrl": "https://example.com/impressum",
  "Impressum": "Legal notice text..."
}
```

## Smart crawl with an LLM

`POST /smart-crawl` first performs the normal crawl, then asks the configured LLM
to normalize only that extracted result. It returns `{ "success": true, "crawl": ... }`
only when LLM enrichment succeeds. Missing LLM configuration and LLM failures
return `{ "success": false, "error": "..." }` with HTTP `503`.

The shared system message is read at request time from
`src/llm/system-message.md`. Edit that file to change the LLM's instructions
without changing provider code. It is a template expression: `{{url}}` is
replaced with the requested URL and `{{crawl}}` with the JSON-serialized
deterministic crawl object. The rendered system message is the only input sent
to the LLM adapter.

Set `LLM_PROVIDER` and the provider-specific variables before starting the worker:

| Provider | Required configuration |
| --- | --- |
| Ollama | `LLM_PROVIDER=ollama`, `LLM_MODEL`; optional `OLLAMA_BASE_URL` (defaults to `http://localhost:11434`) |
| xAI / Grok | `LLM_PROVIDER=xai`, `LLM_MODEL`, `XAI_API_KEY`; optional `XAI_BASE_URL` |
| Aleph Alpha PhariaInference | `LLM_PROVIDER=aleph-alpha`, `LLM_MODEL`, `ALEPH_ALPHA_BASE_URL`, `ALEPH_ALPHA_API_KEY` |

The worker loads `scraper/.env` first and then `scraper/.env.local`; values in
`.env.local` override values from `.env`. Values already provided by the process
environment, including Docker Compose configuration, take precedence over both
files. Both scraper environment files are ignored by Git.

For Aleph Alpha, `ALEPH_ALPHA_BASE_URL` is the PhariaInference deployment URL;
the adapter calls its documented `/complete/json` endpoint.

```bash
curl -X POST http://localhost:3001/smart-crawl \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com"}'
```

## Logs and Troubleshooting

The worker writes structured JSON logs to standard output. A failed browser
launch or navigation is logged with its original error message and returned as
HTTP `502` with a safe client-facing error body.

If startup or crawling reports that an executable or a shared library is
missing, rerun the install commands above. On Debian or Ubuntu, install the
required GStreamer package with:

```bash
sudo apt install libgstreamer-plugins-bad1.0-0
```
