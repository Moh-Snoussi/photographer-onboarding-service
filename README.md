# Photographer Onboarding Scraper

An authenticated Node.js service for extracting photographer website data. It
uses Playwright to render public pages, identifies a homepage hero image,
discovers the Impressum page, and returns extracted legal-notice text. Optional
LLM enrichment runs through a privately deployed Ollama server.

## Architecture

```text
API client
    |
    | Authorization: Bearer <ONBOARDING_API_TOKEN>
    v
Playwright scraper (:3001)
    |
    +--> rendered DOM and image extraction
    +--> Impressum discovery and text extraction
    |
    +--> optional private Ollama server (:11434)
```

The scraper is the only application service. The [`scraper/`](scraper) folder
contains the HTTP API; [`ollama/`](ollama) contains standalone Linux
installation and systemd files for the optional local model server.

## Run

Configure a development token in `scraper/.env.local` or use the development
default in `scraper/.env`, then start the scraper:

```bash
cd scraper
npm install
npx playwright install
npm run dev
```

Scraper API: `http://localhost:3001`

## Example request

```bash
curl -X POST http://localhost:3001/crawl \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer change-me-to-a-long-random-secret' \
  -d '{
    "url": "https://example.com"
  }'
```

## Security roadmap

Before production use, replace the development API token with a unique secret.
Arbitrary URL crawling must also be protected against SSRF, redirects to private
networks, oversized downloads, excessive crawl depth, and browser resource
exhaustion. Keep Ollama on a private network because its native API has no
authentication.
