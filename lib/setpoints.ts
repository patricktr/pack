// ── Set points — tune to taste ───────────────────────────────────────
// (Client-importable: no server-only dependency.)
//
// Each forecast day is classified by its daytime high (°F):
//   high ≥ HOT_DAY_F  → a hot day
//   high ≤ COLD_DAY_F → a cold day
// Suggestion: only hot days → hot · only cold days → cold ·
// both kinds, or everything in between → mixed.
//
// RAIN_PACK_PCT: when the peak precipitation chance during the stay is at
// or above this percentage, the "rain" pack (rain jacket etc.) is
// auto-added to the trip — at lookup time, again server-side when the
// trip starts, and surfaced as a one-tap suggestion on the trip card if
// the pack is ever off while the stored forecast crosses the threshold.
export const SETPOINTS = {
  HOT_DAY_F: 75,
  COLD_DAY_F: 58,
  RAIN_PACK_PCT: 30,
} as const;
