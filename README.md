# Ei Pim

Mobiel dashboard voor een wekelijkse eierbezorging. Deze eerste versie bevat alleen een werkende interface met fictieve voorbeeldgegevens.

## Lokaal starten

Vereisten: Node.js 20.9 of nieuwer en pnpm.

```bash
pnpm install
pnpm dev
```

Open daarna [http://localhost:3000](http://localhost:3000).

## Controleren

```bash
pnpm typecheck
pnpm build
```

## Privacy en veiligheid

- De voorbeeldklanten en adressen in deze repository zijn volledig fictief.
- Echte persoonsgegevens, betaalgegevens en bezorghistorie horen nooit in GitHub.
- Lokale geheimen komen later in `.env.local`; dat bestand wordt door Git genegeerd.
- Neon wordt in een volgende stap via beveiligde servercode gekoppeld.

## Geplande vervolgstappen

1. Een afzonderlijk Neon-project `ei-pim` koppelen.
2. Inloggen en serverbeveiliging toevoegen.
3. Klanten, rondes, leveringen en instellingen opslaan.
4. Wandelroute, betaalverzoek en voorbereid WhatsApp-bericht toevoegen.
5. JSON/CSV-back-up, mobiele tests en Vercel-deployment afronden.
