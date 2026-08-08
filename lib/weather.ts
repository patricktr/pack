import "server-only";
import type { TripStats, TripWeather, WeatherLookup } from "@/lib/types";

import { SETPOINTS } from "@/lib/setpoints";

export { SETPOINTS };

const NWS_HEADERS = {
  "User-Agent": "pack.rousseau.nyc (https://github.com/patricktr/pack)",
  Accept: "application/geo+json",
};

type Period = {
  startTime: string;
  isDaytime: boolean;
  temperature: number;
  probabilityOfPrecipitation?: { value: number | null };
};

const US_STATES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan",
  MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
  NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota",
  OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  PR: "Puerto Rico", VI: "U.S. Virgin Islands", GU: "Guam",
  AS: "American Samoa", MP: "Northern Mariana Islands",
};

const STATE_NAMES = new Set(Object.values(US_STATES).map((s) => s.toLowerCase()));

// "North Adams MA", "North Adams, MA", "North Adams, Massachusetts", and
// "North Adams Massachusetts" all parse to name "North Adams" + region
// "Massachusetts". A bare state name ("New York") stays a name.
function parseDestination(input: string): { name: string; region: string | null } {
  const cleaned = input.trim().replace(/\s+/g, " ");
  const comma = cleaned.indexOf(",");
  if (comma > 0) {
    const region = cleaned.slice(comma + 1).replace(/,/g, " ").trim();
    return {
      name: cleaned.slice(0, comma).trim(),
      region: region ? (US_STATES[region.toUpperCase()] ?? region) : null,
    };
  }
  const words = cleaned.split(" ");
  if (words.length >= 2) {
    const last = words[words.length - 1].toUpperCase();
    if (US_STATES[last]) {
      return { name: words.slice(0, -1).join(" "), region: US_STATES[last] };
    }
    for (const take of [2, 1]) {
      if (words.length > take) {
        const suffix = words.slice(-take).join(" ");
        if (STATE_NAMES.has(suffix.toLowerCase())) {
          return { name: words.slice(0, -take).join(" "), region: suffix };
        }
      }
    }
  }
  return { name: cleaned, region: null };
}

type GeoHit = {
  name: string;
  admin1?: string;
  country?: string;
  country_code?: string;
  latitude: number;
  longitude: number;
};

async function geocode(destination: string): Promise<GeoHit | null> {
  const { name, region } = parseDestination(destination);
  const queries = name === destination.trim() ? [name] : [name, destination.trim()];
  for (const query of queries) {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`,
    );
    if (!res.ok) continue;
    const results: GeoHit[] = (await res.json()).results ?? [];
    if (!results.length) continue;
    if (region) {
      const want = region.toLowerCase();
      const match = results.find(
        (r) =>
          r.admin1?.toLowerCase() === want ||
          r.country?.toLowerCase() === want ||
          r.country_code?.toLowerCase() === want,
      );
      if (match) return match;
    }
    // No region given, or nothing in that region — best remaining guess; the
    // resolved place is shown in the stats card so a wrong pick is visible.
    return results[0];
  }
  return null;
}

function tripDates(startsOn: string, nights: number): Set<string> {
  const start = new Date(`${startsOn}T00:00:00Z`).getTime();
  return new Set(
    Array.from({ length: nights + 1 }, (_, i) =>
      new Date(start + i * 86_400_000).toISOString().slice(0, 10),
    ),
  );
}

export async function lookupTripWeather(
  destination: string,
  startsOn: string,
  nights: number,
): Promise<WeatherLookup> {
  // Geocode with Open-Meteo (free, keyless) — NWS itself has no geocoder.
  const geo = await geocode(destination);
  if (!geo) {
    return { ok: false, error: `Couldn't find “${destination}” — try “City, State”.` };
  }
  const label = [
    geo.name,
    geo.admin1,
    geo.country_code === "US" ? null : geo.country,
  ]
    .filter(Boolean)
    .join(", ");

  const pointRes = await fetch(
    `https://api.weather.gov/points/${geo.latitude.toFixed(4)},${geo.longitude.toFixed(4)}`,
    { headers: NWS_HEADERS },
  );
  if (!pointRes.ok) {
    return {
      ok: false,
      error: `${label} looks outside NWS coverage (US only) — set the trip weather manually.`,
    };
  }
  const forecastUrl = (await pointRes.json()).properties?.forecast;
  if (!forecastUrl) {
    return { ok: false, error: `NWS has no forecast for ${label} — set the trip weather manually.` };
  }

  const fRes = await fetch(forecastUrl, { headers: NWS_HEADERS });
  if (!fRes.ok) {
    return { ok: false, error: "NWS forecast fetch failed — try again in a minute." };
  }
  const periods: Period[] = (await fRes.json()).properties?.periods ?? [];

  const dates = tripDates(startsOn, nights);
  const inWindow = periods.filter((p) => dates.has(p.startTime.slice(0, 10)));
  const highs = inWindow.filter((p) => p.isDaytime).map((p) => p.temperature);
  const lows = inWindow.filter((p) => !p.isDaytime).map((p) => p.temperature);
  const pops = inWindow
    .map((p) => p.probabilityOfPrecipitation?.value)
    .filter((v): v is number => typeof v === "number");

  if (highs.length === 0) {
    return {
      ok: false,
      error:
        "NWS forecasts only reach about a week out — no forecast for those dates yet. Set the trip weather manually.",
    };
  }

  const avg = (ns: number[]) => Math.round(ns.reduce((a, b) => a + b, 0) / ns.length);
  const stats: TripStats = {
    place: label,
    avgHigh: avg(highs),
    avgLow: lows.length ? avg(lows) : null,
    maxHigh: Math.max(...highs),
    minLow: lows.length ? Math.min(...lows) : null,
    precipAvg: pops.length ? avg(pops) : null,
    precipMax: pops.length ? Math.max(...pops) : null,
    daysCovered: highs.length,
    daysTotal: nights + 1,
  };

  const hasHot = highs.some((h) => h >= SETPOINTS.HOT_DAY_F);
  const hasCold = highs.some((h) => h <= SETPOINTS.COLD_DAY_F);
  const suggested: TripWeather =
    hasHot && !hasCold ? "hot" : hasCold && !hasHot ? "cold" : "mixed";
  const rainLikely =
    stats.precipMax !== null && stats.precipMax >= SETPOINTS.RAIN_PACK_PCT;

  return { ok: true, stats, suggested, rainLikely };
}
