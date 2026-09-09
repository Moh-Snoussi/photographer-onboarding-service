# Playwright Scraper Worker

This service exposes a small HTTP API that uses Playwright to render a
photographer website and return its page title, resolved URL, and links.

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