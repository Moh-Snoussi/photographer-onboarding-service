# Zwischenstand

**Datum:** 10.09.2026
**Beteiligte:** Nicht dokumentiert
**Status:** Browserbasiertes Crawling validiert

## Status

Die Anwendung wurde mit mehreren Websites getestet. Das browserbasierte
Crawling mit Playwright funktionierte fuer die grundlegende Extraktion ohne LLM.
Der Scraper konnte Informationen direkt aus dem gerenderten DOM ermitteln.

## Diskussion

Symfony blieb zu diesem Zeitpunkt die API- und Authentifizierungsschicht,
waehrend Node.js das Crawling und Scraping uebernahm.

Fuer Faelle, in denen deterministisches Scraping nicht ausreicht, wurde ein
lokales LLM erwogen. Als Infrastrukturziel standen Server mit 4 GB oder 8 GB
RAM zur Diskussion. Geprueft werden sollte, ob ein kleines lokales Modell den
Onboarding-Prozess unterstuetzen kann, ohne GPU-Infrastruktur zu erfordern.

## Entscheidung

Browserbasiertes Crawling bleibt der primaere Extraktionsmechanismus. Ein
leichtgewichtiges lokales LLM wird nur fuer ausgewaehlte Verarbeitungsaufgaben
untersucht und nicht fuer den gesamten Crawl-Vorgang eingesetzt.

## Begruendung

Die grundlegende Extraktion ist mit Playwright bereits belastbar moeglich. Ein
lokales Modell soll gezielt Unsicherheiten bei der Verarbeitung reduzieren und
muss deshalb innerhalb eines kleinen RAM-Budgets betreibbar sein.
