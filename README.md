# Photographer Onboarding Scraper

Der Photographer Onboarding Scraper ist ein authentifizierter Node.js-Service zur automatisierten Erfassung öffentlich verfügbarer Inhalte von Fotografen-Websites.

Der Service nutzt Playwright mit einem Headless Browser, um Webseiten vollständig zu laden und zu analysieren. Dabei werden unter anderem relevante Bilder der Startseite sowie der Link zum Impressum erkannt. Anschließend wird die Impressumsseite aufgerufen und der dort öffentlich verfügbare Inhalt extrahiert.

Für die intelligente Auswahl und Aufbereitung der gefundenen Inhalte kann zusätzlich ein privat betriebener LLM-Service über Ollama verwendet werden.

Die ermittelten Daten werden anschließend an den Photographer-Backend-Service zurückgegeben. Dieser übernimmt die weitere Verwaltung, Zuordnung und Organisation der Fotografen-Daten.

# Hintergrund

Der Scraper wird über die Photographer-Backend-Anwendung verwendet.

Im Backend steht dem Benutzer eine entsprechende Funktion zur Verfügung, über die das Scraping gestartet werden kann. Zusätzlich kann der Benutzer über Checkboxen ausdrücklich festlegen, ob Text- und/oder Bildinhalte verarbeitet werden dürfen.

Nach dem Start sendet das Backend eine authentifizierte Anfrage an den Scraper-Service. Die Anfrage enthält sowohl die Ziel-URL als auch die entsprechenden Consent-Flags.

Der Scraper führt daraufhin das Crawling durch, verarbeitet die freigegebenen Inhalte und gibt die strukturierten Ergebnisse an das Backend zurück.

## Architektur

```text
Photographer Backend
        |
        | Authorization: Bearer <ONBOARDING_API_TOKEN>
        | Consent Flags:
        | - allow_text_scraping
        | - allow_image_scraping
        v
Home Page Scraping
        |
        |-- Öffentliche Webseite mit Playwright laden
        |-- Bilder und mögliche Impressum-Links extrahieren
        |
        +--> LLM wählt relevante Bilder und Links
             anhand von URL, href, Label und Kontext
        |
        v
Impressum Scraping
        |
        |-- Gefundene Impressumsseite aufrufen
        |-- Öffentlich verfügbare Inhalte extrahieren
        |
        +--> Optional: LLM-Aufbereitung der extrahierten Inhalte
        |
        v
Structured Response
        |
        v
Photographer Backend
```

Der Ordner [`scraper/`](scraper) enthält die HTTP-API und die eigentliche Scraping-Logik.

Der Ordner [`ollama/`](ollama) enthält die Konfiguration für den optionalen, privat betriebenen LLM-Service unter Linux, einschließlich Installations- und systemd-Konfiguration.

Der Ordner `test/` enthält HTTP-Requests für VS Code, mit denen die API während der Entwicklung getestet werden kann.

## Anwendung starten

Für die lokale Entwicklung muss zunächst ein API-Token in `scraper/.env.local` konfiguriert werden. Alternativ kann die Entwicklungs-Konfiguration aus `scraper/.env` verwendet werden.

```bash
cd scraper
npm install
npx playwright install
## LLM Provider im .env.local konfigurieren
# Beispiel:
# LLM_PROVIDER=ollama
# OLLAMA_API_URL=http://localhost:11434
# OLLAMA_MODEL=your-model-name
npm run dev
```

Die API ist anschließend standardmäßig erreichbar unter:

```text
http://localhost:3001
```

Weiterführende technische Voraussetzungen können in der Datei `scraper/README.md` nachgelesen werden.

## Smart Crawl Request

Beispiel für einen API-Aufruf:

```bash
curl -X POST http://localhost:3001/smart-crawl \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer change-me-to-a-long-random-secret' \
  -d '{
    "url": "https://example.com",
    "allow_text_scraping": true,
    "allow_image_scraping": true
  }'
```

## Roadmap

* Image Hosting: Integration eines zuverlässigen Image-Hosting-Services zur Speicherung und Bereitstellung extrahierter Bilder. Die Bilder müssen dabei eindeutig einem Benutzer beziehungsweise Fotografen zugeordnet werden können. Zusätzlich sollen entsprechende Endpunkte zur Verwaltung dieser Bilder bereitgestellt werden.

* Production Authentication: Vor dem produktiven Einsatz muss das Development-Token durch ein individuell generiertes und sicher verwaltetes Secret ersetzt werden.

* Crawling Security: Das Crawling beliebiger URLs muss zusätzlich gegen SSRF und Weiterleitungen in private Netzwerke abgesichert werden.

* Resource Protection: Download-Größen, Crawl-Tiefe, Request-Laufzeiten und Browser-Ressourcen müssen begrenzt werden, um Missbrauch und Ressourcenüberlastung zu verhindern.

* Ollama Security: Der Ollama-Service sollte ausschließlich innerhalb eines privaten Netzwerks erreichbar sein, da die native Ollama-API standardmäßig keine eigene Authentifizierung bereitstellt.

## Authorization Key erstellen

Für die lokale Entwicklung muss ein API-Token in `scraper/.env.local` konfiguriert werden. Dieses Token wird für die Authentifizierung bei API-Aufrufen verwendet.

Beispiel:
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Kopiere den ausgegebenen Wert in `scraper/.env.local` als AUTHORIZATION_KEY=
```
