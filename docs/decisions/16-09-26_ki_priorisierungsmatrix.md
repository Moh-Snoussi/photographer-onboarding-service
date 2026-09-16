# AI Provider Priorisierungsmatrix

## 1. Hintergrund

In der Onboarding-Anwendung wird nach dem Scraping einer öffentlich zugänglichen Website ein LLM eingesetzt.

Das LLM unterstützt dabei insbesondere zwei Aufgaben:

* Auswahl bzw. Zuordnung geeigneter Bilder aus den gefundenen Website-Inhalten
* Erkennung und Aufbereitung des relevanten Impressum-Texts

Dabei werden keine sensiblen oder internen Unternehmensdaten an das LLM übermittelt. Das Modell verarbeitet ausschließlich Inhalte, die zuvor von öffentlich zugänglichen Webseiten abgerufen wurden.

Die Anwendung verwendet eine modulare LLM-Adapter-Architektur. Dadurch kann der eingesetzte KI-Provider ausgetauscht werden, ohne die eigentliche Anwendungslogik anzupassen.

Für die aktuelle Bewertung werden drei Betriebsmodelle betrachtet:

| Modell                   | Beispiel            | Ausgangslage                                                    |
| ------------------------ | ------------------- | --------------------------------------------------------------- |
| Self-Hosted              | Hetzner GEX45       | Eigenbetrieb eines LLM auf GPU-Infrastruktur, ca. 214 € / Monat |
| Europäischer KI-Provider | Aleph Alpha         | Europäischer Anbieter, Angebot und Kosten nach Vertriebsanfrage |
| Globaler KI-Service      | OpenAI, Google etc. | Nutzung externer KI-Modelle über API                            |

## 2. Ziel

Die Priorisierungsmatrix dient dazu, die möglichen KI-Provider anhand einheitlicher Kriterien zu bewerten und miteinander zu vergleichen.

Die Bewertung erfolgt in den beiden Dimensionen:

* Business Value
* Feasibility

### Bewertungsskala

| Score     | 1              | 2              | 3      | 4   | 5        |
| --------- | -------------- | -------------- | ------ | --- | -------- |
| Bedeutung | sehr ungünstig | eher ungünstig | mittel | gut | sehr gut |

---

# 3. Business Value

Der Business Value bewertet den wirtschaftlichen und strategischen Nutzen eines Providers.

## ROI / Economic Value

Berücksichtigt werden insbesondere:

* laufende Provider- oder Serverkosten
* notwendige Infrastruktur
* Betriebs- und Wartungsaufwand
* Skalierbarkeit der Kosten
* erwarteter Nutzen im Verhältnis zu den Gesamtkosten

## Strategic Initiative

Berücksichtigt werden insbesondere:

* Provider-Unabhängigkeit
* Kontrolle über Modelle und Infrastruktur
* Datenhoheit
* langfristige Skalierbarkeit
* strategische Relevanz für zukünftige KI-Anwendungen

### Bewertung

| Kriterium            | Self-Hosted – Hetzner | Aleph Alpha | Global AI Service |
| -------------------- | :-------------------: | :---------: | :---------------: |
| ROI / Economic Value |                       |             |                   |
| Strategic Initiative |                       |             |                   |

Anmerkungen:

---

# 4. Feasibility

Die Feasibility bewertet, wie realistisch und mit welchem Aufwand ein Provider technisch und organisatorisch eingesetzt werden kann.

## Technical Feasibility

Berücksichtigt werden insbesondere:

* technische Komplexität
* Hardware- und Infrastrukturbedarf
* Performance
* Stabilität
* Skalierbarkeit
* benötigtes technisches Know-how

## Integration

Berücksichtigt werden insbesondere:

* API-Kompatibilität
* Unterstützung der bestehenden LLM-Adapter
* Dokumentation und SDKs
* strukturierte Ein- und Ausgaben
* notwendige Anpassungen an der Anwendung

## Operational & Change Effort

Berücksichtigt werden insbesondere:

* Server- und Modellwartung
* Updates und Security-Patches
* Monitoring
* Skalierung
* internes Know-how
* Aufwand bei zukünftigen Änderungen

Ein hoher Score bedeutet einen geringen Betriebs- und Änderungsaufwand.

### Bewertung

| Kriterium                   | Self-Hosted – Hetzner | Aleph Alpha | Global AI Service |
| --------------------------- | :-------------------: | :---------: | :---------------: |
| Technical Feasibility       |                       |             |                   |
| Integration                 |                       |             |                   |
| Operational & Change Effort |                       |             |                   |

Anmerkungen:

---

# 5. Ergebnis

Die Bewertungen werden anschließend in einer Business-Value-/Feasibility-Priorisierungsmatrix zusammengeführt.

| Provider                            | Business Value | Feasibility |
| ----------------------------------- | :------------: | :---------: |
| Self-Hosted – Hetzner GEX45         |                |             |
| Aleph Alpha                         |                |             |
| Global AI Service – OpenAI / Google |                |             |

Die Matrix dient als gemeinsame und nachvollziehbare Entscheidungsgrundlage für die Auswahl eines geeigneten KI-Providers.
