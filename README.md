# Pack

The family packing list — [pack.rousseau.nyc](https://pack.rousseau.nyc).

A single shared list that replaced a years-old Apple Notes packing note.
Items can be tagged by weather (`hot` / `cold`, untagged = every trip) and
grouped into optional "packs" (`water`, `camping`, `rain`, …). Start a trip
by picking its weather and toggling packs on — the list shows only what that
trip needs. House-prep tasks live in a separate "Before you leave" section
(with the house-sitter's items as their own cluster) and appear on every
trip.

- **New trip** asks where you're going, when you leave (defaults to
  tomorrow — pack the day before), and for how many nights, then pulls the
  NWS forecast for that window: average high/low, hottest/coldest, and rain
  likelihood, and suggests hot/cold/mixed. When the peak rain chance is
  ≥ 30%, the `rain` pack (rain jacket) is auto-added. The set points that
  drive both live in [lib/weather.ts](lib/weather.ts) (`SETPOINTS`).
  Starting the trip clears every checkbox and keeps all items.
- **Archive** hides an item from the list but keeps it forever (restorable
  from `/archive`).
- The whole site sits behind a single password (`APP_PASSWORD`), verified on
  `/login` and held in a signed 30-day cookie — same pattern as
  plants.rousseau.nyc.

## Stack

Next.js (App Router) + Tailwind on Vercel; Neon Postgres via
`@neondatabase/serverless`. No ORM — schema in [db/schema.sql](db/schema.sql),
seed in [db/seed.sql](db/seed.sql).

## Development

```bash
pnpm install
vercel env pull .env.local   # POSTGRES_URL + APP_PASSWORD
pnpm db:migrate              # apply schema; seeds only if items is empty
pnpm dev                     # auto-port
```
