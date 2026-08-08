"use server";

import { revalidatePath } from "next/cache";
import { assertAuthenticated } from "@/lib/auth";
import { sql } from "@/lib/db";
import { lookupTripWeather } from "@/lib/weather";
import type {
  Section,
  TripMeta,
  TripStats,
  TripWeather,
  Weather,
  WeatherLookup,
} from "@/lib/types";

const SECTIONS: Section[] = ["packing", "house", "abdul"];
const WEATHERS: Weather[] = ["hot", "cold"];
const TRIP_WEATHERS: TripWeather[] = ["hot", "cold", "mixed"];

function cleanTitle(value: unknown): string {
  if (typeof value !== "string") throw new Error("Invalid title");
  const title = value.trim().slice(0, 200);
  if (!title) throw new Error("Empty title");
  return title;
}

function cleanSection(value: unknown): Section {
  if (SECTIONS.includes(value as Section)) return value as Section;
  throw new Error("Invalid section");
}

function cleanWeather(value: unknown): Weather | null {
  if (value === null || value === "") return null;
  if (WEATHERS.includes(value as Weather)) return value as Weather;
  throw new Error("Invalid weather");
}

function cleanPack(value: unknown): string | null {
  if (value === null || value === "") return null;
  if (typeof value !== "string") throw new Error("Invalid pack");
  const pack = value.trim().toLowerCase().slice(0, 24);
  return pack || null;
}

function cleanCategory(value: unknown): string | null {
  if (value === null || value === "") return null;
  if (typeof value !== "string") throw new Error("Invalid category");
  const category = value.trim().toLowerCase().slice(0, 24);
  return category || null;
}

function cleanPacks(value: unknown): string[] {
  if (!Array.isArray(value)) throw new Error("Invalid packs");
  return [...new Set(value.map(cleanPack).filter((p): p is string => p !== null))];
}

export async function toggleItem(id: number, checked: boolean): Promise<void> {
  await assertAuthenticated();
  await sql().query(`UPDATE items SET checked = $2 WHERE id = $1`, [
    id,
    Boolean(checked),
  ]);
  revalidatePath("/");
}

export async function addItem(
  title: unknown,
  section: unknown,
): Promise<{ id: number; position: number }> {
  await assertAuthenticated();
  const rows = (await sql().query(
    `INSERT INTO items (title, section, position)
     VALUES ($1, $2, COALESCE((SELECT max(position) FROM items WHERE section = $2), 0) + 10)
     RETURNING id, position`,
    [cleanTitle(title), cleanSection(section)],
  )) as { id: number; position: number }[];
  revalidatePath("/");
  return rows[0];
}

export async function updateItem(
  id: number,
  fields: {
    title: unknown;
    section: unknown;
    weather: unknown;
    pack: unknown;
    category: unknown;
  },
): Promise<void> {
  await assertAuthenticated();
  await sql().query(
    `UPDATE items SET title = $2, section = $3, weather = $4, pack = $5, category = $6 WHERE id = $1`,
    [
      id,
      cleanTitle(fields.title),
      cleanSection(fields.section),
      cleanWeather(fields.weather),
      cleanPack(fields.pack),
      cleanCategory(fields.category),
    ],
  );
  revalidatePath("/");
}

export async function archiveItem(id: number): Promise<void> {
  await assertAuthenticated();
  await sql().query(
    `UPDATE items SET archived = TRUE, archived_at = now() WHERE id = $1`,
    [id],
  );
  revalidatePath("/");
  revalidatePath("/archive");
}

export async function restoreItem(id: number): Promise<void> {
  await assertAuthenticated();
  await sql().query(
    `UPDATE items SET archived = FALSE, archived_at = NULL, checked = FALSE WHERE id = $1`,
    [id],
  );
  revalidatePath("/");
  revalidatePath("/archive");
}

/** Change the current trip's weather/packs without touching checkboxes. */
export async function setTrip(weather: unknown, packs: unknown): Promise<void> {
  await assertAuthenticated();
  if (!TRIP_WEATHERS.includes(weather as TripWeather)) {
    throw new Error("Invalid trip weather");
  }
  await sql().query(`UPDATE trip SET weather = $1, packs = $2 WHERE id = 1`, [
    weather,
    cleanPacks(packs),
  ]);
  revalidatePath("/");
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function cleanNights(value: unknown): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 60) throw new Error("Invalid nights");
  return n;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function cleanStats(value: unknown): TripStats | null {
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  if (typeof o.place !== "string") return null;
  const avgHigh = num(o.avgHigh);
  const maxHigh = num(o.maxHigh);
  if (avgHigh === null || maxHigh === null) return null;
  return {
    place: o.place.slice(0, 80),
    avgHigh,
    avgLow: num(o.avgLow),
    maxHigh,
    minLow: num(o.minLow),
    precipAvg: num(o.precipAvg),
    precipMax: num(o.precipMax),
    daysCovered: num(o.daysCovered) ?? 0,
    daysTotal: num(o.daysTotal) ?? 0,
  };
}

/** Look up the NWS forecast for a destination over the trip window. */
export async function lookupWeatherAction(
  destination: unknown,
  startsOn: unknown,
  nights: unknown,
): Promise<WeatherLookup> {
  await assertAuthenticated();
  if (typeof destination !== "string" || !destination.trim()) {
    return { ok: false, error: "Enter a destination." };
  }
  if (typeof startsOn !== "string" || !DATE_RE.test(startsOn)) {
    return { ok: false, error: "Invalid departure date." };
  }
  try {
    return await lookupTripWeather(
      destination.trim().slice(0, 80),
      startsOn,
      cleanNights(nights),
    );
  } catch {
    return { ok: false, error: "Weather lookup failed — try again in a minute." };
  }
}

/** Start a fresh trip: save meta, set weather/packs, uncheck every item. */
export async function startNewTrip(
  weather: unknown,
  packs: unknown,
  meta?: Partial<TripMeta>,
): Promise<void> {
  await assertAuthenticated();
  if (!TRIP_WEATHERS.includes(weather as TripWeather)) {
    throw new Error("Invalid trip weather");
  }
  const destination =
    typeof meta?.destination === "string" && meta.destination.trim()
      ? meta.destination.trim().slice(0, 80)
      : null;
  const startsOn =
    typeof meta?.startsOn === "string" && DATE_RE.test(meta.startsOn)
      ? meta.startsOn
      : null;
  const nights = meta?.nights == null ? null : cleanNights(meta.nights);
  const stats = cleanStats(meta?.stats);
  await sql().query(
    `UPDATE trip
     SET weather = $1, packs = $2, destination = $3, starts_on = $4,
         nights = $5, weather_stats = $6::jsonb, started_at = now()
     WHERE id = 1`,
    [
      weather,
      cleanPacks(packs),
      destination,
      startsOn,
      nights,
      stats ? JSON.stringify(stats) : null,
    ],
  );
  await sql().query(`UPDATE items SET checked = FALSE`);
  revalidatePath("/");
}
