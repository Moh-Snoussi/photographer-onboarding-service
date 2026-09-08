# Architecture Notes

## Boundary

The Symfony application owns the public API and business rules. The Node worker owns browser automation only.

## Why a separate Playwright worker?

Playwright has first-class Node.js support and gives us reliable access to the rendered DOM, element geometry, CSS backgrounds, network requests, and JavaScript-heavy websites while keeping the business API in Symfony.

## Planned modules

- Consent validation
- SSRF-safe URL validation
- Playwright crawling
- Legal-page discovery
- Logo detection
- Above-the-fold hero-image ranking
- Image validation and WebP conversion
- MinIO storage
- Local LLM legal-text cleanup
- Final shop-backend push
- Guaranteed temporary-data cleanup
