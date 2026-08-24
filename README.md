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
  ≥ 30%, the `rain` pack (rain jacket) is auto-added — at lookup time,
  again server-side at trip start, and as a one-tap suggestion on the trip
  card if the pack is off while the stored forecast crosses the threshold.
  The set points that drive all of this live in
  [lib/setpoints.ts](lib/setpoints.ts) (`SETPOINTS`).
  Starting the trip clears every checkbox and keeps all items.
- **Day of** marks an item that's in use until departure (the kid's
  nightlight, phone chargers) and can't be packed the day before. While
  today is before the trip's departure date, those items are held in a
  muted "🌙 Day of" card at the bottom of the packing list; on departure
  day they rejoin their normal groups, tagged `day of`. Toggle it in any
  item's editor ("Pack anytime" / "🌙 Day of only") for items that are
  day-of on every trip, or tap the dashed `day of` button on an item's
  row to hold it **for the current trip only** (undo via the chip's `×`;
  cleared automatically when a new trip starts). The date boundary is
  pinned to America/New_York — packing happens at home.
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
