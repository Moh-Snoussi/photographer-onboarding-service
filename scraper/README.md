# Playwright Scraper Worker

Der Playwright Scraper Worker ist ein Node.js-Service mit HTTP-API zur automatisierten Analyse öffentlich erreichbarer Webseiten.

Der Service verwendet Playwright mit Chromium, um Webseiten vollständig zu rendern, freigegebene Inhalte zu extrahieren und die Ergebnisse anschließend über einen konfigurierten LLM-Provider aufzubereiten.

Welche Inhalte verarbeitet werden dürfen, wird pro Request über explizite Consent-Flags gesteuert.

## Voraussetzungen

Benötigt werden:

* Node.js 24
* npm
* Chromium-Abhängigkeiten für Playwright

### Linux

Unter Debian beziehungsweise Ubuntu kann die benötigte GStreamer-Bibliothek installiert werden mit:

```bash
sudo apt install libgstreamer-plugins-bad1.0-0
```

Weitere benötigte Browser-Abhängigkeiten können von Playwright automatisch installiert werden:

```bash
npx playwright install-deps
```

### macOS

Unter macOS werden keine `apt`-Pakete benötigt.

Nach der Installation von Node.js können die Playwright-Abhängigkeiten direkt installiert werden:

```bash
npm install
npx playwright install
```

### iOS

Der Scraper Worker ist nicht für die direkte Ausführung unter iOS vorgesehen.

Er benötigt eine Node.js-Laufzeit sowie einen von Playwright unterstützten Browser. Der Service sollte daher auf Linux, macOS oder einer entsprechenden Serverumgebung betrieben werden.

## Installation

Im Verzeichnis `scraper/` zunächst die Node.js-Abhängigkeiten installieren:

```bash
npm install
```

Danach den von Playwright benötigten Chromium-Browser installieren:

```bash
npx playwright install
```

`npm install` installiert die JavaScript-Abhängigkeiten des Projekts.

`npx playwright install` lädt zusätzlich die benötigten Browser-Binaries herunter. Dieser Schritt ist separat erforderlich.

Unter Linux können bei Bedarf Browser und Systemabhängigkeiten gemeinsam installiert werden:

```bash
npx playwright install --with-deps
```

## Konfiguration

Der Worker lädt seine Konfiguration aus folgenden Quellen:

1. Prozess-Umgebung
2. `.env.local`
3. `.env`

Bereits gesetzte Umgebungsvariablen haben die höchste Priorität.

Werte aus `.env.local` überschreiben Werte aus `.env`.

Beide Dateien werden nicht in Git eingecheckt.

### API-Authentifizierung

Vor dem Start muss ein API-Token definiert werden:

```env
ONBOARDING_API_TOKEN=your-secure-random-token
```

Jeder API-Request muss diesen Token als Bearer Token mitsenden:

```text
Authorization: Bearer <token>
```

Für produktive Umgebungen sollte ein zufällig erzeugtes Secret verwendet werden.

Beispiel:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Start

Der Worker wird gestartet mit:

```bash
npm start
```

Standardmäßig läuft die API unter:

```text
http://localhost:3001
```

## Health Check

Mit folgendem Request kann überprüft werden, ob der Worker erreichbar ist:

```bash
curl http://localhost:3001/health \
  -H 'Authorization: Bearer your-onboarding-api-token'
```

Erwartete Antwort:

```json
{
  "status": "ok"
}
```

## Smart Crawl

Der Endpoint

```text
POST /smart-crawl
```

analysiert eine Webseite entsprechend der übergebenen Consent-Flags.

Beispiel:

```bash
curl -X POST http://localhost:3001/smart-crawl \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer your-onboarding-api-token' \
  -d '{
    "url": "https://example.com",
    "allow_text_scraping": true,
    "allow_image_scraping": true
  }'
```

Die Consent-Flags sind:

```json
{
  "allow_text_scraping": true,
  "allow_image_scraping": true
}
```

Nicht übergebene Flags werden standardmäßig als `false` behandelt.

Deaktivierte Kategorien werden weder analysiert noch heruntergeladen oder zurückgegeben.

## Bildanalyse

Wenn

```json
"allow_image_scraping": true
```

gesetzt ist, analysiert der Worker die Bilder der Startseite.

Die Antwort enthält ein `images`-Objekt mit:

* einer erkannten Logo-URL unter `logo`
* geeigneten Hero-Bildkandidaten unter `hero`

### Logo-Erkennung

Die Logo-Erkennung priorisiert:

1. Bilder innerhalb eines `<header>` mit Klassen oder IDs wie `logo` oder `brand`
2. entsprechend markierte Bilder außerhalb des Headers
3. Bilder mit `logo` im `alt`-Text oder in der URL
4. Favicon-Metadaten als Fallback

Unterstützte Favicon-Varianten sind unter anderem:

* `icon`
* `shortcut icon`
* `apple-touch-icon`

Favicons werden ausschließlich als Logo-Fallback verwendet und nicht als Hero-Bilder zurückgegeben.

### Hero-Bilder

Als Hero-Kandidaten werden Bilder berücksichtigt, die:

* im sichtbaren oberen Seitenbereich liegen oder
* sich innerhalb der ersten drei größeren Seitenbereiche befinden
* mindestens eine natürliche Auflösung von `800x600` besitzen

Ausgeschlossen werden:

* SVG-Dateien
* transparente PNG-Dateien
* Favicons

Die API liefert maximal fünf geeignete Hero-Bilder zurück.

## Impressum

Wenn

```json
"allow_text_scraping": true
```

gesetzt ist, sucht der Worker nach möglichen rechtlichen Links auf der Webseite.

Der erkannte Impressums-Link wird aufgerufen und der öffentlich verfügbare Text extrahiert.

Anschließend kann der Text über den konfigurierten LLM-Provider strukturiert beziehungsweise normalisiert werden.

## LLM-Verarbeitung

Für jede LLM-Verarbeitung existiert ein eigenes System-Message-Template.

Homepage:

```text
src/llm/homepage-system-message.md
```

Impressum:

```text
src/llm/impressum-system-message.md
```

Die Templates werden bei jedem Request neu eingelesen.

Folgende Platzhalter stehen zur Verfügung:

```text
{{url}}
```

enthält die aktuelle Quell-URL.

```text
{{crawl}}
```

enthält die JSON-serialisierten Crawl-Daten der jeweiligen Verarbeitungsstufe.

Die gerenderte System Message ist die Eingabe für den jeweiligen LLM-Adapter.

## LLM Provider

Der verwendete Provider wird über

```env
LLM_PROVIDER=
```

konfiguriert.

### Ollama

```env
LLM_PROVIDER=ollama
LLM_MODEL=<model>
OLLAMA_BASE_URL=http://localhost:11434
```

`OLLAMA_BASE_URL` ist optional und verwendet standardmäßig:

```text
http://localhost:11434
```

### OpenAI

```env
LLM_PROVIDER=openai
LLM_MODEL=<model>
OPENAI_API_KEY=<api-key>
OPENAI_BASE_URL=https://api.openai.com/v1
```

`OPENAI_BASE_URL` ist optional.

Das konfigurierte Modell muss strukturierte JSON-Ausgaben unterstützen.

### xAI / Grok

```env
LLM_PROVIDER=xai
LLM_MODEL=<model>
XAI_API_KEY=<api-key>
XAI_BASE_URL=<endpoint>
```

### Aleph Alpha / PhariaInference

```env
LLM_PROVIDER=aleph-alpha
LLM_MODEL=<model>
ALEPH_ALPHA_BASE_URL=<deployment-url>
ALEPH_ALPHA_API_KEY=<api-key>
```

`ALEPH_ALPHA_BASE_URL` entspricht der URL des jeweiligen PhariaInference-Deployments.

Der Adapter verwendet den dafür vorgesehenen `/complete/json`-Endpoint.

## Antwortformat

Bei erfolgreicher Verarbeitung liefert der Worker:

```json
{
  "success": true,
  "crawl": {}
}
```

Wenn der LLM-Provider nicht konfiguriert oder nicht erreichbar ist, wird HTTP `503` zurückgegeben:

```json
{
  "success": false,
  "error": "..."
}
```

Wenn beide Consent-Flags fehlen oder `false` sind, wird weder ein Browser geöffnet noch ein LLM aufgerufen.

Die Antwort lautet dann:

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

## Logging

Der Worker schreibt strukturierte JSON-Logs auf die Standardausgabe.

Standardmäßig werden Logs zusätzlich gespeichert unter:

```text
logs/scraper.log
```

Der Pfad kann konfiguriert werden:

```env
LOG_FILE=logs/scraper.log
```

### Log-Level

Terminal:

```env
LOG_LEVEL=info
```

Log-Datei:

```env
LOG_FILE_LEVEL=debug
```

Mit

```env
LOG_LEVEL=debug
```

werden zusätzliche technische Informationen auch im Terminal angezeigt.

LLM-Diagnosen enthalten unter anderem:

* Verarbeitungsschritt
* Provider
* Modell
* Endpoint
* Response-Format
* Prompt-Größe
* Response-Keys
* Verarbeitungsdauer

Fehlgeschlagene Requests enthalten zusätzlich Fehlermeldung und Dauer.

## LLM Payload Logging

Für detaillierte Analyse kann das Logging der vollständigen LLM-Eingaben und -Antworten aktiviert werden:

```env
LOG_LLM_PAYLOADS=true
```

Diese Logs können ausgelesene URLs und vom Benutzer freigegebene Webseiteninhalte enthalten.

Die Option sollte daher ausschließlich in Umgebungen aktiviert werden, in denen diese Daten sicher gespeichert und verarbeitet werden dürfen.

## Fehlerbehandlung

Fehler beim Start des Browsers oder bei der Navigation werden intern mit der ursprünglichen Fehlermeldung protokolliert.

Dem Client wird stattdessen eine reduzierte Fehlermeldung mit HTTP-Status `502` zurückgegeben.

Falls Playwright meldet, dass Browser-Binaries oder Systembibliotheken fehlen, sollten die Installationsschritte erneut ausgeführt werden.

Unter Linux beispielsweise:

```bash
npx playwright install --with-deps
```

oder für die bekannte GStreamer-Abhängigkeit:

```bash
sudo apt install libgstreamer-plugins-bad1.0-0
```
