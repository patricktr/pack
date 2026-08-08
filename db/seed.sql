-- Example starter list. Replace with your own items — this only runs when
-- the items table is empty (enforced by db/migrate.mjs), so an already
-- seeded database is never touched.
--
-- weather: NULL = every trip · 'hot' = hot/mixed trips · 'cold' = cold/mixed.
-- pack: optional tag ('water', 'camping', 'rain', ...); the item only shows
-- when that pack is toggled on for the trip. The 'rain' pack is auto-added
-- when the NWS forecast crosses SETPOINTS.RAIN_PACK_PCT (lib/weather.ts).
-- section: 'packing' is the filtered main list; 'house' and 'abdul' rows
-- always show in the "Before you leave" area.
INSERT INTO items (title, section, weather, pack, position) VALUES
  ('Phone charger', 'packing', NULL, NULL, 10),
  ('Toiletries', 'packing', NULL, NULL, 20),
  ('Medications', 'packing', NULL, NULL, 30),
  ('Headphones', 'packing', NULL, NULL, 40),
  ('Books / e-reader', 'packing', NULL, NULL, 50),
  ('Sunscreen', 'packing', 'hot', NULL, 60),
  ('Sunglasses', 'packing', 'hot', NULL, 70),
  ('Warm jacket', 'packing', 'cold', NULL, 80),
  ('Gloves and hat', 'packing', 'cold', NULL, 90),
  ('Swimsuits', 'packing', NULL, 'water', 100),
  ('Beach towels', 'packing', NULL, 'water', 110),
  ('Tent and stakes', 'packing', NULL, 'camping', 120),
  ('Sleeping bags', 'packing', NULL, 'camping', 130),
  ('Rain jacket', 'packing', NULL, 'rain', 140),
  ('Take out the trash', 'house', NULL, NULL, 1000),
  ('Water the plants', 'house', NULL, NULL, 1010),
  ('Lock the shed', 'abdul', NULL, NULL, 2000),
  ('Turn off the outdoor water', 'abdul', NULL, NULL, 2010);
