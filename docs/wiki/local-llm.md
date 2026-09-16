# Lokales LLM

Ein lokales Sprachmodell wird nur fuer Aufgaben eingesetzt, die sich nicht
zuverlaessig deterministisch aus dem gerenderten DOM ableiten lassen. Das
Crawling und die grundlegende Extraktion funktionieren ohne LLM.

## Einsatzbereich

Bei `LLM_PROVIDER=ollama` kann der Scraper einen privaten Ollama-Dienst fuer die
Normalisierung von Startseiten- und Impressumsinhalten verwenden.

## Betrieb und Sicherheit

Die Dateien fuer Installation, systemd-Dienst, Modell-Download und Health-Check
befinden sich unter `ollama/`. Ollama ist standardmaessig nur ueber Loopback
verfuegbar und darf nicht als oeffentliche Anwendungsschnittstelle freigegeben
werden, da die native API keine Authentifizierung bereitstellt.

## Ressourcenziel

Fuer die Auswahl eines Modells ist ein Betrieb auf einem kleinen Server mit etwa
4 bis 8 GB RAM vorgesehen. Das Modell soll gezielt unterstuetzen und nicht die
vollstaendige Browser-Analyse ersetzen.
