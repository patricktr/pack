export type Weather = "hot" | "cold";
export type TripWeather = "hot" | "cold" | "mixed";
export type Section = "packing" | "house" | "abdul";
// 'packing' = getting ready to leave; 'return' = repacking to head home.
export type TripPhase = "packing" | "return";

export type Item = {
  id: number;
  title: string;
  section: Section;
  weather: Weather | null;
  pack: string | null;
  category: string | null;
  checked: boolean;
  skipped: boolean;
  repacked: boolean;
  position: number;
  archivedAt: string | null;
};

export type TripStats = {
  place: string;
  avgHigh: number;
  avgLow: number | null;
  maxHigh: number;
  minLow: number | null;
  precipAvg: number | null;
  precipMax: number | null;
  daysCovered: number;
  daysTotal: number;
};

export type WeatherLookup =
  | { ok: true; stats: TripStats; suggested: TripWeather; rainLikely: boolean }
  | { ok: false; error: string };

export type TripMeta = {
  destination: string | null;
  startsOn: string | null; // YYYY-MM-DD
  nights: number | null;
  stats: TripStats | null;
};

export type Trip = TripMeta & {
  weather: TripWeather;
  packs: string[];
  phase: TripPhase;
  startedAt: string;
};
