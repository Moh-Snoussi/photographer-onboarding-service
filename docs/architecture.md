# Architecture Notes

## Services

The Node.js scraper owns the public HTTP API, bearer-token authentication,
browser automation, deterministic extraction, and optional LLM enrichment.
Ollama can be installed separately and is used only when
the scraper is configured with `LLM_PROVIDER=ollama`.

```text
API client
	|
	| Authorization: Bearer <ONBOARDING_API_TOKEN>
	v
Node.js scraper (:3001)
	|
	+--> Playwright page rendering and extraction
	|     +--> hero image detection
	|     +--> Impressum link discovery and text extraction
	|
	+--> Optional private Ollama API (:11434)
		  +--> homepage normalization
		  +--> Impressum-text normalization
```

All scraper routes, including `/health`, require the bearer token. The token is
configured through `scraper/.env.local` or the process environment. Ollama is
kept loopback-only by default; it must not be exposed as a public application
endpoint.

## Why Node.js and Playwright?

Playwright has first-class Node.js support and gives us reliable access to the
rendered DOM, element geometry, CSS backgrounds, network requests, and
JavaScript-heavy websites.

## Repository components

- `scraper/`: authenticated Playwright HTTP service and optional LLM adapters
- `ollama/`: Linux installation, systemd, model-pull, and health-check files
- `tests/http/`: REST Client smoke-test requests for the scraper and Ollama

## Security roadmap

Before production use, protect arbitrary URL crawling against SSRF, redirects
to private networks, oversized downloads, excessive crawl depth, and browser
resource exhaustion. Use a unique secret for `ONBOARDING_API_TOKEN` outside of
development and restrict network access to the Ollama host.
