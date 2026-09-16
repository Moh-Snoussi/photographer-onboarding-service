# Urspruengliche Aufgabe

**Datum:** 04.09.2026
**Beteiligte:** Nicht dokumentiert
**Status:** Prototyp geplant

## Ausgangsanforderung

Ziel des Projekts ist die Automatisierung des Onboardings von Fotografen. Dazu
sollen relevante Informationen aus ihren bestehenden, oeffentlich erreichbaren
Websites extrahiert werden.

Der urspruengliche Umfang umfasst:

- Rechtstexte wie Impressum und Datenschutzerklaerung
- das Website-Logo
- geeignete Header- oder Hero-Bilder
- browserbasiertes Crawling fuer JavaScript-lastige Websites
- die Beachtung ausdruecklicher Freigaben fuer Text- und Bild-Scraping
- die Bereitstellung der Daten ueber eine strukturierte API-Antwort

## Diskussion

Die erste Architektur teilte die Aufgaben auf Drei Anwendungen auf:

- Symfony-Backend fuer API-Authentifizierung, Benutzerverwaltung und API-Einstieg
- Node.js-Scraper fuer Playwright-Crawling, Website-Analyse sowie Text- und Bildextraktion
- Ollama fuer das lokale LLM, das bei Bedarf Unsicherheiten in der Verarbeitung reduzieren soll
Der Scraper sollte als separater Dienst durch das Symfony-Backend aufgerufen
werden.

## Entscheidung

Ein funktionsfaehiger Prototyp mit getrenntem Symfony-Backend und Node.js-
Scraper wird erstellt.

## Begruendung

Die Aufteilung trennt klassische Backend-Aufgaben von der spezialisierten
Browserautomatisierung und ermoeglicht einen fruehen Nachweis, dass
Fotografen-Websites mit geringem manuellem Aufwand analysiert werden koennen.

## Aufgabe

IT-Briefing: Backend-Scraping-Service (Fotografen-Onboarding)
Dieses Feature automatisiert das Onboarding, indem es Rechtstexte, das Logo und die Header-Bilder der Fotografen-Website extrahiert. Das Frontend wird extern entwickelt und übergibt lediglich die Ziel-URL sowie die zwingenden Consent-Flags (allow_text_scraping, allow_image_scraping) via JSON-Payload.
1. API-Endpoint & Crawling-Engine
 * Schnittstelle: REST-Endpoint (z. B. FastAPI) zur Entgegennahme und strikten Validierung der Opt-ins.
 * Engine: Einsatz eines Headless Browsers (Playwright/Puppeteer), um den vollständig gerenderten DOM abzugreifen (essenziell für JS-lastige Baukästen wie Wix oder Squarespace).
2. Heuristisches Bild-Scraping (Ohne Vision-KI)
Die Bildauswahl erfolgt ressourcenschonend über die Position im DOM und Dateieigenschaften:
 * Logo-Extraktion: Gezielte Suche im <header> nach Klassen/IDs wie logo, brand oder Auslesen der Favicon-Meta-Tags.
 * Hero-Bilder (Positionsbasiert): Scraping der Bilder, die im obersten sichtbaren Bereich der Startseite (Above the Fold) oder in den ersten großen HTML-Containern geladen werden.
 * Filterregeln (Icon-Ausschluss): Harter Ausschluss von .svg-Dateien, transparenten .png-Dateien sowie allen Bildern mit einer Auflösung von unter 800x600 Pixeln.
 * Ergebnis: Die ersten 3 bis 5 validen Treffer werden direkt als Header- und Referenzbilder für den Shop definiert.
3. Rechtstext-Extraktion
 * Routing: Der Crawler sucht und öffnet die Unterseiten /impressum und /datenschutz (bzw. /legal).
 * Text-Bereinigung: Ein kleines, lokal gehostetes Open-Source-LLM bereinigt den extrahierten HTML-Body, entfernt Menüs/Footer und gibt reinen, formatierten Text zurück.
4. Infrastruktur, Compliance & Push
 * Strict On-Premise (Hetzner): Alle Prozesse (Scraper und das kleine Text-LLM) laufen komplett auf der eigenen Hetzner-Infrastruktur. Es dürfen keine externen APIs (OpenAI, Google) angebunden werden.
 * Datenverarbeitung: Gescrapte Bilder als WebP in den eigenen internen Storage (z. B. MinIO) hochladen.
 * Finaler Push: Das formatierte JSON-Objekt (Rechtstexte als String, Logo- und Bild-URLs) an die Shop-Datenbank des Fotografen übergeben. Temporäre Crawl-Daten direkt löschen.
