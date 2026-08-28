import "server-only";
import { sql } from "@/lib/db";
import type { Item, Section, Trip, TripPhase, TripWeather, Weather } from "@/lib/types";

export type { Item, Section, Trip, TripWeather, Weather };

type ItemRow = {
  id: number;
  title: string;
  section: Section;
  weather: Weather | null;
  pack: string | null;
  category: string | null;
  day_of: boolean;
  day_of_trip: boolean;
  checked: boolean;
  skipped: boolean;
  repacked: boolean;
  position: number;
  archived_at: string | null;
};

function toItem(row: ItemRow): Item {
  return {
    id: row.id,
    title: row.title,
    section: row.section,
    weather: row.weather,
    pack: row.pack,
    category: row.category,
    dayOf: row.day_of,
    dayOfTrip: row.day_of_trip,
    checked: row.checked,
    skipped: row.skipped,
    repacked: row.repacked,
    position: row.position,
    archivedAt: row.archived_at,
  };
}

export async function getItems(): Promise<Item[]> {
  const rows = (await sql().query(
    `SELECT id, title, section, weather, pack, category, day_of, day_of_trip,
            checked, skipped, repacked, position, archived_at
     FROM items WHERE NOT archived
     ORDER BY position, id`,
  )) as ItemRow[];
  return rows.map(toItem);
}

export async function getArchivedItems(): Promise<Item[]> {
  const rows = (await sql().query(
    `SELECT id, title, section, weather, pack, category, day_of, day_of_trip,
            checked, skipped, repacked, position, archived_at
     FROM items WHERE archived
     ORDER BY archived_at DESC NULLS LAST, id`,
  )) as ItemRow[];
  return rows.map(toItem);
}

export async function getTrip(): Promise<Trip> {
  const rows = (await sql().query(
    `SELECT weather, packs, phase, started_at, destination,
            starts_on::text AS starts_on, nights, weather_stats
     FROM trip WHERE id = 1`,
  )) as {
    weather: TripWeather;
    packs: string[];
    phase: TripPhase;
    started_at: string;
    destination: string | null;
    starts_on: string | null;
    nights: number | null;
    weather_stats: Trip["stats"];
  }[];
  const row = rows[0];
  return {
    weather: row?.weather ?? "mixed",
    packs: row?.packs ?? [],
    phase: row?.phase ?? "packing",
    startedAt: row?.started_at ?? "",
    destination: row?.destination ?? null,
    startsOn: row?.starts_on ?? null,
    nights: row?.nights ?? null,
    stats: row?.weather_stats ?? null,
  };
}

/** Every distinct pack tag in use, including on archived items. */
export async function getKnownPacks(): Promise<string[]> {
  const rows = (await sql().query(
    `SELECT DISTINCT pack FROM items WHERE pack IS NOT NULL ORDER BY pack`,
  )) as { pack: string }[];
  return rows.map((r) => r.pack);
}
