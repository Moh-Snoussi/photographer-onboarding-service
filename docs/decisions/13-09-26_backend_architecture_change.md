# Aenderung der Backend-Architektur

**Datum:** 13.09.2026
**Beteiligte:** Nicht dokumentiert
**Status:** Symfony-Backend aus der aktuellen Architektur entfernt

## Status

Bis zu diesem Zeitpunkt stand Symfony vor dem Scraper und stellte vor allem
API-Authentifizierung, API-Zugang und benutzerbezogene Infrastruktur bereit.
Die eigentliche Scraping-Logik befand sich bereits im Node.js-Scraper.

## Diskussion

Die Notwendigkeit eines separaten Symfony-Backends wurde neu bewertet. Fuer den
aktuellen Umfang bot es nicht genug zusaetzlichen Nutzen, um die weitere
Infrastruktur zu rechtfertigen.

Ein vollstaendiges Backend-Framework bringt zusaetzliche Abhaengigkeiten,
regelmaessige Framework- und Paketupdates, weiteren Betriebsaufwand sowie eine
groessere Angriffsoberflaeche mit sich. Die Kommunikation zwischen Symfony und
dem Scraper erzeugte ausserdem eine zusaetzliche Schicht ohne wesentlichen
Mehrwert fuer den aktuellen Anwendungsfall.

## Entscheidung

Das separate Symfony-Backend wird aus der aktuellen Architektur entfernt. Die
API-Funktionalitaet und Authentifizierung werden direkt im Node.js-Scraper
implementiert.

## Begruendung

Der Node.js-Scraper uebernimmt damit API-Endpunkt, Authentifizierung,
Anfragevalidierung, Browser-Crawling, Text- und Bild-Scraping sowie
Antwortgenerierung. Die Entscheidung reduziert Infrastrukturkomplexitaet,
Wartungsaufwand, externe Abhaengigkeiten, Angriffsoberflaeche,
Kommunikationsaufwand und den Bereitstellungsaufwand.

Symfony kann erneut bewertet werden, falls kuenftige Anforderungen ein
eigenstaendiges Anwendungs-Backend rechtfertigen.
