export type Weather = "hot" | "cold";
export type TripWeather = "hot" | "cold" | "mixed";
export type Section = "packing" | "house" | "abdul";

export type Item = {
  id: number;
  title: string;
  section: Section;
  weather: Weather | null;
  pack: string | null;
  checked: boolean;
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
  startedAt: string;
};
