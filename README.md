# Ei Pim

Mobiele bezorgapp voor een wekelijkse eierbezorging. Klanten, instellingen, bezorgrondes en blijvende bezorgstatus worden veilig in Neon opgeslagen.

## Wat werkt

- Gedeelde login met een ondertekende `HttpOnly`-sessie van zeven dagen.
- Klanten toevoegen, wijzigen, archiveren, herstellen, definitief verwijderen, zoeken en in routevolgorde zetten.
- `.xlsx`- en `.csv`-import met werkbladkeuze, kolomkoppeling en controlevoorbeeld.
- Handmatig een ronde maken, starten, afvinken, ongedaan maken, als historie bewaren en een afgeronde ronde veilig verwijderen.
- Na bezorgen een ING-betaalverzoeklink opslaan en WhatsApp openen met een voorbereid bericht met klantnaam, bedrag en betaallink.
- Instellingen voor rondedag, titel, standaardprijs, startadres en terugkeer naar start.
- Volledige reset vanuit Instellingen voor een schone overdracht of nieuwe Excel-import.
- Google Maps-wandelnavigatie per stop, zonder API-sleutel.

## Lokaal starten

Vereisten: Node.js 20.9 of nieuwer en pnpm.

```bash
pnpm install
cp .env.example .env.local
pnpm auth:hash
pnpm dev
```

Zet in `.env.local`:

- `DATABASE_URL`: de connection string van de Neon-ontwikkelbranch;
- `APP_USERNAME`: de gedeelde gebruikersnaam;
- `APP_PASSWORD_HASH`: de uitvoer van `pnpm auth:hash`;
- `SESSION_SECRET`: een lange willekeurige geheime waarde.

Open daarna [http://localhost:3000](http://localhost:3000).

## Neon

Het Neon-project `eieren` gebruikt twee branches:

- `production`: schema en instellingen, zonder klanten of bezorghistorie;
- `development`: hetzelfde schema met uitsluitend fictieve testklanten.

Het databaseschema staat in `db/schema.sql`. De fictieve ontwikkeldata staat in `db/seed-development.sql`.

## Excel importeren

- Ondersteund: `.xlsx` en `.csv`, maximaal 5 MB en 1.000 regels.
- Een oud `.xls`-bestand moet eerst in Excel als `.xlsx` worden opgeslagen.
- Het originele bestand wordt alleen tijdelijk op de server gelezen en nergens bewaard.
- Het bestaande Ei Pim-tabblad `Klanten` wordt automatisch herkend: straatnamen en huisnummers worden samengevoegd en de laatst ingevulde bestelling bepaalt het standaard aantal en de prijs.
- Voor dit bestaande bestand wordt `Apeldoorn` voorgesteld. De plaats blijft bij iedere import wijzigbaar; postcode mag later per klant worden aangevuld.
- Controleer altijd het voorbeeld met `nieuw`, `bijwerken`, `overslaan` en `fout` vóór de definitieve import.
- Een volgend bijgewerkt Excel-bestand werkt klanten met hetzelfde adres bij en voegt nieuwe adressen toe.
- Ontbrekende klanten in Excel worden nooit automatisch verwijderd of gearchiveerd.

## Controleren

```bash
pnpm typecheck
pnpm test
pnpm build
```

## Privacy en veiligheid

- Echte persoonsgegevens en bezorghistorie horen alleen in Neon, nooit in GitHub.
- Bij het definitief verwijderen van een gearchiveerde klant worden persoonsgegevens en betaallinks in rondes geanonimiseerd; ronde-aantallen en bezorgstatus blijven bewaard.
- De volledige reset verwijdert alle klanten en rondes en zet ingevulde instellingen terug naar neutrale standaardwaarden; de login blijft behouden.
- `.env.local`, databaseverbindingen, gebruikersnamen, hashes en sessiegeheimen worden niet gecommit.
- Databaseverkeer loopt uitsluitend via servercode.
- Gebruik voor Vercel Preview de Neon-ontwikkelbranch en voor Vercel Production de Neon-productiebranch.

## Betaalverzoek en WhatsApp

- Maak het betaalverzoek eerst zelf in de ING-app en plak de link bij de bezorgde klant.
- De app maakt daarna een WhatsApp-bericht klaar; Pim controleert en verstuurt het bericht zelf.
- De betaallink hoort alleen bij die bezorgstop en wordt niet meegenomen naar een volgende ronde.
- Zonder geschikt telefoonnummer blijft de WhatsApp-knop uit en toont de app een duidelijke melding.

Een ingebouwde kaart, automatische route-optimalisatie en het automatisch aanmaken of versturen van betaalverzoeken zijn nog niet gekoppeld.
