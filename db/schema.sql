CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  -- 'packing' items are filtered by trip weather/packs while
  -- 'house' and 'abdul' always show in the "Before you leave" section.
  section TEXT NOT NULL DEFAULT 'packing' CHECK (section IN ('packing', 'house', 'abdul')),
  -- NULL = pack on every trip; 'hot' shows on hot/mixed trips, 'cold' on cold/mixed.
  weather TEXT CHECK (weather IN ('hot', 'cold')),
  -- Optional pack tag ('water', 'camping', ...); item shows only when the trip
  -- has that pack toggled on.
  pack TEXT,
  -- Display group within the packing section ('tech', 'clothes', 'outdoors',
  -- ...). NULL falls into the "Other" group. Unused for house/abdul items.
  category TEXT,
  checked BOOLEAN NOT NULL DEFAULT FALSE,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ
);

-- Singleton row describing the current trip.
CREATE TABLE IF NOT EXISTS trip (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  weather TEXT NOT NULL DEFAULT 'mixed' CHECK (weather IN ('hot', 'cold', 'mixed')),
  packs TEXT[] NOT NULL DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO trip (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Trip metadata for the NWS weather lookup (added Aug 2026).
ALTER TABLE trip ADD COLUMN IF NOT EXISTS destination TEXT;
ALTER TABLE trip ADD COLUMN IF NOT EXISTS starts_on DATE;
ALTER TABLE trip ADD COLUMN IF NOT EXISTS nights INTEGER;
ALTER TABLE trip ADD COLUMN IF NOT EXISTS weather_stats JSONB;

-- Logical display groups within the packing section (added Aug 2026).
ALTER TABLE items ADD COLUMN IF NOT EXISTS category TEXT;
