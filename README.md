# Ei Pim

Mobiele bezorgapp voor een wekelijkse eierbezorging. Klanten, instellingen, bezorgrondes en blijvende bezorgstatus worden veilig in Neon opgeslagen.

## Wat werkt

- Gedeelde login met een ondertekende `HttpOnly`-sessie van zeven dagen.
- Klanten toevoegen, wijzigen, archiveren, herstellen, zoeken en in routevolgorde zetten.
- `.xlsx`- en `.csv`-import met werkbladkeuze, kolomkoppeling en controlevoorbeeld.
- Handmatig een ronde maken, starten, afvinken, ongedaan maken en als historie bewaren.
- Instellingen voor rondedag, titel, standaardprijs, startadres en terugkeer naar start.
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
- `.env.local`, databaseverbindingen, gebruikersnamen, hashes en sessiegeheimen worden niet gecommit.
- Databaseverkeer loopt uitsluitend via servercode.
- Gebruik voor Vercel Preview de Neon-ontwikkelbranch en voor Vercel Production de Neon-productiebranch.

## Nog niet in deze fase

Tikkie, WhatsApp, een ingebouwde kaart en automatische route-optimalisatie zijn bewust nog niet gekoppeld.
