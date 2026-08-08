-- Example starter list. Replace with your own items — this only runs when
-- the items table is empty (enforced by db/migrate.mjs), so an already
-- seeded database is never touched.
--
-- weather: NULL = every trip · 'hot' = hot/mixed trips · 'cold' = cold/mixed.
-- pack: optional tag ('water', 'camping', 'rain', ...); the item only shows
-- when that pack is toggled on for the trip. The 'rain' pack is auto-added
-- when the NWS forecast crosses SETPOINTS.RAIN_PACK_PCT (lib/weather.ts).
-- category: display group within the packing section ('tech', 'clothes',
-- 'outdoors', ...); NULL lands in "Other". Unused for house/abdul rows.
-- section: 'packing' is the filtered main list; 'house' and 'abdul' rows
-- always show in the "Before you leave" area.
INSERT INTO items (title, section, weather, pack, category, position) VALUES
  ('Phone charger', 'packing', NULL, NULL, 'tech', 10),
  ('Headphones', 'packing', NULL, NULL, 'tech', 20),
  ('Toiletries', 'packing', NULL, NULL, 'health', 30),
  ('Medications', 'packing', NULL, NULL, 'health', 40),
  ('Books / e-reader', 'packing', NULL, NULL, 'fun', 50),
  ('Sunscreen', 'packing', 'hot', NULL, 'health', 60),
  ('Sunglasses', 'packing', 'hot', NULL, 'clothes', 70),
  ('Warm jacket', 'packing', 'cold', NULL, 'clothes', 80),
  ('Gloves and hat', 'packing', 'cold', NULL, 'clothes', 90),
  ('Swimsuits', 'packing', NULL, 'water', 'water', 100),
  ('Beach towels', 'packing', NULL, 'water', 'water', 110),
  ('Tent and stakes', 'packing', NULL, 'camping', 'outdoors', 120),
  ('Sleeping bags', 'packing', NULL, 'camping', 'outdoors', 130),
  ('Rain jacket', 'packing', NULL, 'rain', 'clothes', 140),
  ('Take out the trash', 'house', NULL, NULL, NULL, 1000),
  ('Water the plants', 'house', NULL, NULL, NULL, 1010),
  ('Lock the shed', 'abdul', NULL, NULL, NULL, 2000),
  ('Turn off the outdoor water', 'abdul', NULL, NULL, NULL, 2010);
