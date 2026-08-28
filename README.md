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
  Starting the trip clears every check and "not needed" mark and keeps all
  items.
- **Packed vs. not needed** — starting a trip lands in a "not needed" pass:
  tap the ⊘ on anything you're skipping this trip (it collects under a
  "Not needed" section; tap again to bring one back), hit Done, then pack.
  The header count only tracks what you actually mean to bring. The toggle
  chip on the Packing heading re-enters the pass any time.
- **Time to go home** — once every packing item is packed or marked not
  needed, a 🏠 button appears on the trip card (hidden while packing so it
  doesn't take up space). When it's time to pack up (hotel checkout), it
  flips the list into a repack checklist: only the items
  you actually packed, checked off again as they go back into bags or the
  car. It ignores the weather/pack filters on purpose — if it came along, it
  goes home. "← Back to packing" flips back; the phase lives on the trip row
  so every device sees the same mode.
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
