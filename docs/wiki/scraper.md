# Scraper

Der Scraper unter `scraper/` ist der zentrale Anwendungsdienst fuer das
Onboarding von Fotografen. Er verarbeitet Anfragen, prueft das Bearer-Token und
liefert strukturierte Ergebnisse aus der Analyse einer oeffentlichen Website.

## Aufgaben

- Rendering JavaScript-lastiger Websites mit Playwright
- Ermittlung geeigneter Header- beziehungsweise Hero-Bilder
- Extraktion des Website-Logos
- Auffinden von Impressum-Links und Extraktion des Rechtstexts
- Optionale LLM-Normalisierung der extrahierten Inhalte
- Beruecksichtigung der Freigaben fuer Text- und Bild-Scraping

## Schnittstelle

Die API laeuft standardmaessig auf Port `3001`. Die Anfrage an `POST /smart-crawl`
enthaelt mindestens die Ziel-URL sowie die Felder `allow_text_scraping` und
`allow_image_scraping`. Die Autorisierung erfolgt mit:

```text
Authorization: Bearer <ONBOARDING_API_TOKEN>
```

## Betrieb

```bash
cd scraper
npm install
npx playwright install
npm run dev
```

Vor einem produktiven Betrieb muessen URL-Crawls gegen SSRF, Weiterleitungen in
private Netze, grosse Downloads, zu hohe Crawl-Tiefe und Browser-
Ressourcenverbrauch abgesichert werden.
