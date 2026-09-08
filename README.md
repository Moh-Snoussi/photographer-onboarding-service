# Photographer Onboarding Service

On-premise backend service for automated photographer onboarding.

The service receives a photographer website URL plus explicit scraping consent, renders the website with Playwright, extracts legal pages and image candidates, stores accepted images internally, and returns normalized onboarding data for the shop backend.

## Architecture

```text
Client / Frontend
       |
       v
Symfony + API Platform
       |
       v
Onboarding Application Service
       |
       v
Node.js + Playwright Worker
       |
       +--> Legal-page discovery
       +--> Logo / hero-image heuristics
       +--> Rendered DOM / geometry
       |
       v
Local processing / MinIO / local LLM
```

## First milestone

The initial vertical slice:

1. accepts `url`, `allow_text_scraping`, and `allow_image_scraping`,
2. validates the request,
3. calls the Playwright worker,
4. renders the target page,
5. returns basic metadata and discovered links.

## Run

```bash
docker compose up --build
```

Backend: `http://localhost:8080`
Scraper worker: `http://localhost:3001`

## Example request

```bash
curl -X POST http://localhost:8080/api/onboarding/scrape \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://example.com",
    "allow_text_scraping": true,
    "allow_image_scraping": true
  }'
```

## Security roadmap

Before production use, arbitrary URL crawling must be protected against SSRF, redirects to private networks, oversized downloads, excessive crawl depth, and browser resource exhaustion.
