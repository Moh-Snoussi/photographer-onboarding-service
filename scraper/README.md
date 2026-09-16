# Playwright Scraper Worker

This service exposes a HTTP API that uses Playwright to render a
website, extract consented data, and normalize the result through a configured
LLM.

## Prerequisites

- Node.js 24
- npm
- Linux package required by Chromium/Playwright:

```bash
sudo apt install libgstreamer-plugins-bad1.0-0

## IOS

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

Set `ONBOARDING_API_TOKEN` in `.env.local` or the process environment before
starting the worker. Every route requires this value in an
`Authorization: Bearer <token>` header.

## Verify

Check that the worker is running:

```bash
curl http://localhost:3001/health \
  -H 'Authorization: Bearer your-onboarding-api-token'
```

Expected response:

```json
{"status":"ok"}
```

## Smart crawl with an LLM

`POST /smart-crawl` requires explicit consent for each category. Omitted flags
default to `false`. With `allow_image_scraping: true`, it inspects homepage
images and returns an `images` object containing a detected `logo` URL and all
non-favicon image candidates in `hero`. Logo detection prioritizes images in a
`<header>` marked with a `logo` or `brand` class or ID, then similarly marked
images elsewhere, then image `alt` text or URLs containing `logo`. Favicon
metadata (`icon`, `shortcut icon`, and `apple-touch-icon`) is used only as a
final logo fallback and is not included in `hero`. With `allow_text_scraping: true`, it
discovers legal links, visits the resolved Impressum URL, extracts its text, and
uses the LLM to normalize it. Disabled categories are not inspected, downloaded,
or returned, even when an LLM response contains values for them.

Hero candidates are limited to images visible above the fold or located in one
of the first three large page containers. They must be at least `800x600` in
their natural resolution; SVG files and transparent PNGs are excluded. The
response returns at most the first five eligible hero images.

The worker returns `{ "success": true, "crawl": ... }` when enrichment
succeeds. Missing LLM configuration and LLM failures return
`{ "success": false, "error": "..." }` with HTTP `503`.

When both flags are omitted or `false`, smart crawl does not open a browser or
call an LLM. It returns:

```json
{
  "success": true,
  "crawl": {
    "images": null,
    "ImpressumUrl": null,
    "Impressum": null,
    "llm_duration": 0
  }
}
```

Each LLM request has a dedicated system-message template, read at request time:

- `src/llm/homepage-system-message.md` for the homepage result
- `src/llm/impressum-system-message.md` for the legal-notice text

Both templates replace `{{url}}` with their current source URL and `{{crawl}}`
with their JSON-serialized, stage-specific crawl data. The rendered system
message is the only input sent to the LLM adapter.

Set `LLM_PROVIDER` and the provider-specific variables before starting the worker:

| Provider | Required configuration |
| --- | --- |
| Ollama | `LLM_PROVIDER=ollama`, `LLM_MODEL`; optional `OLLAMA_BASE_URL` (defaults to `http://localhost:11434`) |
| OpenAI | `LLM_PROVIDER=openai`, `LLM_MODEL`, `OPENAI_API_KEY`; optional `OPENAI_BASE_URL` (defaults to `https://api.openai.com/v1`). Use a JSON-capable OpenAI model such as `gpt-4o-mini`. |
| xAI / Grok | `LLM_PROVIDER=xai`, `LLM_MODEL`, `XAI_API_KEY`; optional `XAI_BASE_URL` |
| Aleph Alpha PhariaInference | `LLM_PROVIDER=aleph-alpha`, `LLM_MODEL`, `ALEPH_ALPHA_BASE_URL`, `ALEPH_ALPHA_API_KEY` |

The worker loads `scraper/.env` first and then `scraper/.env.local`; values in
`.env.local` override values from `.env`. Values already provided by the process
environment take precedence over both files. Both scraper environment files are
ignored by Git.

For Aleph Alpha, `ALEPH_ALPHA_BASE_URL` is the PhariaInference deployment URL;
the adapter calls its documented `/complete/json` endpoint.

```bash
curl -X POST http://localhost:3001/smart-crawl \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer your-onboarding-api-token' \
  -d '{"url":"https://example.com","allow_text_scraping":true,"allow_image_scraping":true}'
```

## Logs and Troubleshooting

The worker writes structured JSON-lines logs to standard output and, by default,
to `logs/scraper.log`. Set `LOG_FILE` to choose a different file path.

Terminal output defaults to `LOG_LEVEL=info`, which shows request validation and
smart-crawl start, completion, and failure. The log file defaults to
`LOG_FILE_LEVEL=debug`, preserving crawl and LLM diagnostics without adding them
to the terminal. Set `LOG_LEVEL=debug` to see those diagnostics in the terminal.

Each LLM diagnostic includes the stage, provider, model, endpoint, response
format, prompt size, response keys, and duration. A failed request includes its
error and duration. Set `LOG_LLM_PAYLOADS=true` to record the rendered
system-message payload and parsed LLM response. Set `LOG_LEVEL=debug` as well
to show those payloads in the terminal. Payload logs can contain consented crawl
text and URLs, so enable them only where that data may be retained safely.

A failed browser launch or navigation is logged with its original error message
and returned as HTTP `502` with a safe client-facing error body.

If startup or crawling reports that an executable or a shared library is
missing, rerun the install commands above. On Debian or Ubuntu, install the
required GStreamer package with:

```bash
sudo apt install libgstreamer-plugins-bad1.0-0
```
