# Architektur

Der Photographer Onboarding Scraper ist ein authentifizierter Node.js-Dienst. Er
stellt die HTTP-API bereit und fuehrt die browserbasierte Analyse oeffentlich
zugreifbarer Fotografen-Websites durch.

```text
API-Client
  |
  | Authorization: Bearer <ONBOARDING_API_TOKEN>
  v
Node.js-Scraper (:3001)
  |
  +--> Playwright: Rendering und Extraktion
  |     +--> Hero-Bild und Logo
  |     +--> Impressum finden und Rechtstext extrahieren
  |
  +--> Optional: privater Ollama-Server
        +--> Normalisierung von Startseite und Impressum
```

Alle Routen, auch `/health`, erfordern ein Bearer-Token. Der Token wird ueber
`ONBOARDING_API_TOKEN` in `scraper/.env.local` oder als Prozessumgebungsvariable
konfiguriert.

Ollama ist eine optionale, getrennt betriebene Abhaengigkeit. Der Scraper nutzt
sie nur bei `LLM_PROVIDER=ollama`; der Dienst darf nicht als oeffentlicher
Endpunkt freigegeben werden.

Weitere bestehende Architekturhinweise befinden sich in
[../architecture.md](../architecture.md).
