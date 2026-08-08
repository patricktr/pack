"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  Item,
  Section,
  Trip,
  TripMeta,
  TripStats,
  TripWeather,
  Weather,
  WeatherLookup,
} from "@/lib/types";
import {
  addItem,
  archiveItem,
  lookupWeatherAction,
  setTrip,
  startNewTrip,
  toggleItem,
  updateItem,
} from "@/app/actions";

const HIDE_PACKED_KEY = "pack:hidePacked";

function visibleForTrip(item: Item, trip: Trip): boolean {
  if (item.section !== "packing") return true;
  if (item.weather && trip.weather !== "mixed" && item.weather !== trip.weather) {
    return false;
  }
  if (item.pack && !trip.packs.includes(item.pack)) return false;
  return true;
}

function chipClass(kind: "hot" | "cold" | "pack"): string {
  const base =
    "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide";
  if (kind === "hot")
    return `${base} bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400`;
  if (kind === "cold")
    return `${base} bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400`;
  return `${base} bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400`;
}

function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const WEATHER_ICONS: Record<TripWeather, string> = {
  hot: "☀️",
  cold: "❄️",
  mixed: "🌦",
};

export function PackApp({
  initialItems,
  initialTrip,
  knownPacks,
}: {
  initialItems: Item[];
  initialTrip: Trip;
  knownPacks: string[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [trip, setTripState] = useState(initialTrip);
  const [packs, setPacks] = useState(() =>
    [...new Set([...knownPacks, ...initialItems.map((i) => i.pack).filter(Boolean) as string[]])].sort(),
  );
  const [hidePacked, setHidePacked] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    setHidePacked(localStorage.getItem(HIDE_PACKED_KEY) === "1");
  }, []);

  const fail = () => router.refresh();

  function toggleHidePacked() {
    const next = !hidePacked;
    setHidePacked(next);
    localStorage.setItem(HIDE_PACKED_KEY, next ? "1" : "0");
  }

  function handleToggle(item: Item) {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i)),
    );
    toggleItem(item.id, !item.checked).catch(fail);
  }

  function handleTripChange(weather: TripWeather, tripPacks: string[]) {
    setTripState((prev) => ({ ...prev, weather, packs: tripPacks }));
    setTrip(weather, tripPacks).catch(fail);
  }

  function handleStartTrip(
    weather: TripWeather,
    tripPacks: string[],
    meta: TripMeta,
  ) {
    setItems((prev) => prev.map((i) => ({ ...i, checked: false })));
    setTripState((prev) => ({ ...prev, ...meta, weather, packs: tripPacks }));
    startNewTrip(weather, tripPacks, meta).catch(fail);
  }

  function handleSave(item: Item, draft: Draft) {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, ...draft } : i)),
    );
    if (draft.pack && !packs.includes(draft.pack)) {
      setPacks((prev) => [...prev, draft.pack as string].sort());
    }
    updateItem(item.id, draft).catch(fail);
    setEditingId(null);
  }

  function handleArchive(item: Item) {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    archiveItem(item.id).catch(fail);
    setEditingId(null);
  }

  async function handleAdd(title: string, section: Section) {
    try {
      const { id, position } = await addItem(title, section);
      setItems((prev) => [
        ...prev,
        {
          id,
          title,
          section,
          weather: null,
          pack: null,
          checked: false,
          position,
          archivedAt: null,
        },
      ]);
    } catch {
      fail();
    }
  }

  const packing = useMemo(
    () => items.filter((i) => i.section === "packing"),
    [items],
  );
  const packingVisible = packing.filter((i) => visibleForTrip(i, trip));
  const hiddenCount = packing.length - packingVisible.length;
  const house = items.filter((i) => i.section === "house");
  const abdul = items.filter((i) => i.section === "abdul");

  const allVisible = [...packingVisible, ...house, ...abdul];
  const packed = allVisible.filter((i) => i.checked).length;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col pb-24">
      <header className="sticky top-0 z-10 border-b border-black/5 bg-neutral-50/95 backdrop-blur dark:border-white/10 dark:bg-neutral-950/95">
        <div className="flex items-baseline justify-between px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-1">
          <h1 className="text-xl font-bold tracking-tight">Pack</h1>
          <p className="text-sm tabular-nums text-neutral-500 dark:text-neutral-400">
            {packed} / {allVisible.length} packed
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 pb-2.5">
          <button
            onClick={toggleHidePacked}
            aria-pressed={hidePacked}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
              hidePacked
                ? "bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900"
                : "bg-black/5 text-neutral-600 dark:bg-white/10 dark:text-neutral-300"
            }`}
          >
            Hide packed
          </button>
          <Link
            href="/archive"
            className="shrink-0 rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold text-neutral-600 transition active:scale-95 dark:bg-white/10 dark:text-neutral-300"
          >
            Archive
          </Link>
        </div>
      </header>

      <TripCard
        trip={trip}
        packs={packs}
        onChange={handleTripChange}
        onStart={handleStartTrip}
      />

      <SectionBlock
        title="Packing"
        items={packingVisible}
        hidePacked={hidePacked}
        editingId={editingId}
        packs={packs}
        onToggle={handleToggle}
        onEdit={setEditingId}
        onSave={handleSave}
        onArchive={handleArchive}
        onAdd={(title) => handleAdd(title, "packing")}
        footnote={
          hiddenCount > 0
            ? `${hiddenCount} item${hiddenCount === 1 ? "" : "s"} hidden for this trip`
            : undefined
        }
      />

      <SectionBlock
        title="Before you leave"
        items={house}
        hidePacked={hidePacked}
        editingId={editingId}
        packs={packs}
        onToggle={handleToggle}
        onEdit={setEditingId}
        onSave={handleSave}
        onArchive={handleArchive}
        onAdd={(title) => handleAdd(title, "house")}
      />

      <SectionBlock
        title="Abdul"
        items={abdul}
        hidePacked={hidePacked}
        editingId={editingId}
        packs={packs}
        onToggle={handleToggle}
        onEdit={setEditingId}
        onSave={handleSave}
        onArchive={handleArchive}
        onAdd={(title) => handleAdd(title, "abdul")}
      />
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
      {children}
    </p>
  );
}

function WeatherChips({
  value,
  suggested,
  onChange,
}: {
  value: TripWeather;
  suggested?: TripWeather | null;
  onChange: (w: TripWeather) => void;
}) {
  const weathers: TripWeather[] = ["hot", "cold", "mixed"];
  return (
    <div className="flex gap-1.5">
      {weathers.map((w) => (
        <button
          key={w}
          onClick={() => onChange(w)}
          aria-pressed={value === w}
          className={`relative flex-1 rounded-lg px-3 py-2 text-sm font-semibold capitalize transition active:scale-95 ${
            value === w
              ? "bg-sky-600 text-white shadow-sm"
              : "bg-black/5 text-neutral-600 dark:bg-white/10 dark:text-neutral-300"
          }`}
        >
          {WEATHER_ICONS[w]} {w}
          {suggested === w ? (
            <span className="absolute -top-1.5 right-1 rounded bg-teal-600 px-1 text-[9px] font-bold uppercase text-white">
              nws
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

function PackToggles({
  packs,
  active,
  suggested,
  onChange,
}: {
  packs: string[];
  active: string[];
  suggested?: string[];
  onChange: (packs: string[]) => void;
}) {
  if (packs.length === 0) {
    return (
      <p className="text-xs text-neutral-500">
        No pack tags yet — add one from any item&apos;s editor.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {packs.map((p) => {
        const on = active.includes(p);
        return (
          <button
            key={p}
            onClick={() =>
              onChange(on ? active.filter((x) => x !== p) : [...active, p])
            }
            aria-pressed={on}
            className={`relative rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition active:scale-95 ${
              on
                ? "bg-teal-600 text-white shadow-sm"
                : "bg-black/5 text-neutral-600 dark:bg-white/10 dark:text-neutral-300"
            }`}
          >
            {p}
            {suggested?.includes(p) ? (
              <span className="absolute -top-1.5 -right-1 rounded bg-teal-600 px-1 text-[9px] font-bold uppercase text-white ring-2 ring-white dark:ring-neutral-900">
                nws
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function StatsBlock({ stats }: { stats: TripStats }) {
  const deg = (n: number | null) => (n === null ? "—" : `${n}°`);
  return (
    <div className="rounded-lg bg-sky-50 px-3 py-2 text-[13px] leading-relaxed dark:bg-sky-950/30">
      <p className="font-semibold">{stats.place}</p>
      <p>
        Avg {deg(stats.avgHigh)} / {deg(stats.avgLow)} · Hottest{" "}
        {deg(stats.maxHigh)} · Coldest night {deg(stats.minLow)}
      </p>
      <p>
        {stats.precipMax === null
          ? "No precipitation data"
          : `Rain chance: peaks ${stats.precipMax}%, avg ${stats.precipAvg}%`}
      </p>
      {stats.daysCovered < stats.daysTotal ? (
        <p className="text-neutral-500 dark:text-neutral-400">
          Forecast covers the first {stats.daysCovered} of {stats.daysTotal} days
        </p>
      ) : null}
    </div>
  );
}

function TripCard({
  trip,
  packs,
  onChange,
  onStart,
}: {
  trip: Trip;
  packs: string[];
  onChange: (weather: TripWeather, packs: string[]) => void;
  onStart: (weather: TripWeather, packs: string[], meta: TripMeta) => void;
}) {
  const [newOpen, setNewOpen] = useState(false);

  const dates =
    trip.startsOn && trip.nights != null
      ? `${fmtDate(trip.startsOn)} – ${fmtDate(addDays(trip.startsOn, trip.nights))} · ${trip.nights} night${trip.nights === 1 ? "" : "s"}`
      : null;

  return (
    <section className="px-2 pt-3">
      <div className="flex flex-col gap-2.5 rounded-xl bg-white p-3 shadow-sm dark:bg-neutral-900">
        {newOpen ? (
          <NewTripForm
            packs={packs}
            currentWeather={trip.weather}
            onStart={(w, p, meta) => {
              onStart(w, p, meta);
              setNewOpen(false);
            }}
            onCancel={() => setNewOpen(false)}
          />
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-2">
              <p className="min-w-0 truncate text-[15px] font-bold">
                {trip.destination ?? "Current trip"}
              </p>
              {dates ? (
                <p className="shrink-0 text-xs text-neutral-500 dark:text-neutral-400">
                  {dates}
                </p>
              ) : null}
            </div>
            {trip.stats ? <StatsBlock stats={trip.stats} /> : null}
            <Label>Trip weather</Label>
            <WeatherChips
              value={trip.weather}
              onChange={(w) => onChange(w, trip.packs)}
            />
            <Label>Packs</Label>
            <PackToggles
              packs={packs}
              active={trip.packs}
              onChange={(p) => onChange(trip.weather, p)}
            />
            <button
              onClick={() => setNewOpen(true)}
              className="mt-1 w-full rounded-lg border border-sky-300 px-3 py-2 text-sm font-semibold text-sky-700 transition active:scale-95 dark:border-sky-800 dark:text-sky-400"
            >
              Start new trip…
            </button>
          </>
        )}
      </div>
    </section>
  );
}

function NewTripForm({
  packs,
  currentWeather,
  onStart,
  onCancel,
}: {
  packs: string[];
  currentWeather: TripWeather;
  onStart: (weather: TripWeather, packs: string[], meta: TripMeta) => void;
  onCancel: () => void;
}) {
  const [destination, setDestination] = useState("");
  const [leaveDate, setLeaveDate] = useState(tomorrowISO());
  const [nights, setNights] = useState(3);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<WeatherLookup | null>(null);
  const [weather, setWeather] = useState<TripWeather>(currentWeather);
  const [selPacks, setSelPacks] = useState<string[]>([]);

  async function lookup() {
    if (!destination.trim() || busy) return;
    setBusy(true);
    try {
      const r = await lookupWeatherAction(destination.trim(), leaveDate, nights);
      setResult(r);
      if (r.ok) {
        setWeather(r.suggested);
        // Auto-add the rain pack when the peak rain chance crosses the
        // set point (SETPOINTS.RAIN_PACK_PCT in lib/weather.ts).
        if (r.rainLikely && packs.includes("rain")) {
          setSelPacks((prev) => (prev.includes("rain") ? prev : [...prev, "rain"]));
        }
      }
    } catch {
      setResult({ ok: false, error: "Lookup failed — try again." });
    }
    setBusy(false);
  }

  function start() {
    onStart(weather, selPacks, {
      destination: destination.trim() || null,
      startsOn: leaveDate,
      nights,
      stats: result?.ok ? result.stats : null,
    });
  }

  const inputClass =
    "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-[15px] outline-none focus:border-sky-500 dark:border-white/10 dark:bg-neutral-900 dark:[color-scheme:dark]";

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-[15px] font-bold">New trip</p>
      <Label>Where are you going?</Label>
      <input
        autoFocus
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && lookup()}
        placeholder="Bar Harbor, ME"
        aria-label="Destination"
        className={inputClass}
      />
      <div className="flex gap-2">
        <div className="flex-1">
          <Label>Leaving</Label>
          <input
            type="date"
            value={leaveDate}
            onChange={(e) => setLeaveDate(e.target.value)}
            aria-label="Departure date"
            className={`${inputClass} mt-1`}
          />
        </div>
        <div className="w-24">
          <Label>Nights</Label>
          <input
            type="number"
            min={0}
            max={60}
            value={nights}
            onChange={(e) => setNights(Math.max(0, Number(e.target.value) || 0))}
            aria-label="Nights away"
            className={`${inputClass} mt-1`}
          />
        </div>
      </div>
      <button
        onClick={lookup}
        disabled={busy || !destination.trim()}
        className="w-full rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-40"
      >
        {busy ? "Checking NWS…" : "Look up weather"}
      </button>
      {result && !result.ok ? (
        <p className="text-xs text-red-600 dark:text-red-400">{result.error}</p>
      ) : null}
      {result?.ok ? <StatsBlock stats={result.stats} /> : null}
      <Label>Trip weather{result?.ok ? " (NWS suggested)" : ""}</Label>
      <WeatherChips
        value={weather}
        suggested={result?.ok ? result.suggested : null}
        onChange={setWeather}
      />
      <Label>
        Packs
        {result?.ok && result.rainLikely && packs.includes("rain")
          ? ` — rain added (peak ${result.stats.precipMax}%)`
          : ""}
      </Label>
      <PackToggles
        packs={packs}
        active={selPacks}
        suggested={result?.ok && result.rainLikely ? ["rain"] : undefined}
        onChange={setSelPacks}
      />
      <div className="mt-1 flex items-center gap-2">
        <button
          onClick={start}
          className="flex-1 rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition active:scale-95"
        >
          Start trip — clears all checks
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg px-3 py-2 text-sm font-semibold text-neutral-500 transition active:scale-95 dark:text-neutral-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function SectionBlock({
  title,
  items,
  hidePacked,
  editingId,
  packs,
  onToggle,
  onEdit,
  onSave,
  onArchive,
  onAdd,
  footnote,
}: {
  title: string;
  items: Item[];
  hidePacked: boolean;
  editingId: number | null;
  packs: string[];
  onToggle: (item: Item) => void;
  onEdit: (id: number | null) => void;
  onSave: (item: Item, draft: Draft) => void;
  onArchive: (item: Item) => void;
  onAdd: (title: string) => void;
  footnote?: string;
}) {
  const checked = items.filter((i) => i.checked).length;
  const shown = hidePacked ? items.filter((i) => !i.checked) : items;

  return (
    <section className="px-2 pt-4">
      <div className="flex items-baseline justify-between px-2 pb-1">
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          {title}
        </h2>
        <p className="text-xs tabular-nums text-neutral-400 dark:text-neutral-500">
          {checked} / {items.length}
        </p>
      </div>
      <ul className="overflow-hidden rounded-xl bg-white shadow-sm dark:bg-neutral-900">
        {shown.map((item) => (
          <li
            key={item.id}
            className="border-b border-black/5 last:border-b-0 dark:border-white/5"
          >
            {editingId === item.id ? (
              <ItemEditor
                item={item}
                packs={packs}
                onSave={onSave}
                onArchive={onArchive}
                onCancel={() => onEdit(null)}
              />
            ) : (
              <div className="flex min-h-11 items-center">
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 py-2 pl-3">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => onToggle(item)}
                    className="size-5 shrink-0 accent-sky-600"
                  />
                  <span
                    className={`min-w-0 flex-1 text-[15px] leading-snug ${
                      item.checked
                        ? "text-neutral-400 line-through dark:text-neutral-600"
                        : ""
                    }`}
                  >
                    {item.title}
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    {item.weather ? (
                      <span className={chipClass(item.weather)}>{item.weather}</span>
                    ) : null}
                    {item.pack ? (
                      <span className={chipClass("pack")}>{item.pack}</span>
                    ) : null}
                  </span>
                </label>
                <button
                  onClick={() => onEdit(item.id)}
                  aria-label={`Edit ${item.title}`}
                  className="flex h-11 w-10 shrink-0 items-center justify-center text-neutral-300 transition hover:text-sky-600 dark:text-neutral-600 dark:hover:text-sky-400"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                </button>
              </div>
            )}
          </li>
        ))}
        <li>
          <AddRow onAdd={onAdd} />
        </li>
      </ul>
      {footnote ? (
        <p className="px-2 pt-1.5 text-xs text-neutral-400 dark:text-neutral-500">
          {footnote}
        </p>
      ) : null}
    </section>
  );
}

function AddRow({ onAdd }: { onAdd: (title: string) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  function submit() {
    const value = title.trim();
    if (value) onAdd(value);
    setTitle("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex min-h-11 w-full items-center gap-3 px-3 py-2 text-[15px] text-neutral-400 transition hover:text-sky-600 dark:text-neutral-500 dark:hover:text-sky-400"
      >
        <span className="flex size-5 items-center justify-center text-lg leading-none">
          +
        </span>
        Add item
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex items-center gap-2 px-3 py-2"
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => (title.trim() ? submit() : setOpen(false))}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        placeholder="New item"
        aria-label="New item title"
        className="min-w-0 flex-1 rounded-lg border border-black/10 bg-transparent px-3 py-1.5 text-[15px] outline-none focus:border-sky-500 dark:border-white/10"
      />
      <button
        type="submit"
        className="shrink-0 rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white transition active:scale-95"
      >
        Add
      </button>
    </form>
  );
}

type Draft = {
  title: string;
  section: Section;
  weather: Weather | null;
  pack: string | null;
};

function ItemEditor({
  item,
  packs,
  onSave,
  onArchive,
  onCancel,
}: {
  item: Item;
  packs: string[];
  onSave: (item: Item, draft: Draft) => void;
  onArchive: (item: Item) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Draft>({
    title: item.title,
    section: item.section,
    weather: item.weather,
    pack: item.pack,
  });
  const [newPack, setNewPack] = useState("");

  const weatherOptions: { label: string; value: Weather | null }[] = [
    { label: "Any weather", value: null },
    { label: "☀️ Hot", value: "hot" },
    { label: "❄️ Cold", value: "cold" },
  ];
  const sectionOptions: { label: string; value: Section }[] = [
    { label: "Packing", value: "packing" },
    { label: "House", value: "house" },
    { label: "Abdul", value: "abdul" },
  ];
  const packOptions = [...new Set([...packs, ...(item.pack ? [item.pack] : [])])];

  const pill = (active: boolean) =>
    `rounded-full px-2.5 py-1 text-xs font-semibold capitalize transition active:scale-95 ${
      active
        ? "bg-sky-600 text-white shadow-sm"
        : "bg-black/5 text-neutral-600 dark:bg-white/10 dark:text-neutral-300"
    }`;

  return (
    <div className="flex flex-col gap-2.5 bg-sky-50/50 px-3 py-3 dark:bg-sky-950/20">
      <input
        value={draft.title}
        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        aria-label="Item title"
        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-[15px] outline-none focus:border-sky-500 dark:border-white/10 dark:bg-neutral-900"
      />
      <div className="flex flex-wrap gap-1.5">
        {weatherOptions.map((o) => (
          <button
            key={o.label}
            onClick={() => setDraft({ ...draft, weather: o.value })}
            aria-pressed={draft.weather === o.value}
            className={pill(draft.weather === o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setDraft({ ...draft, pack: null })}
          aria-pressed={draft.pack === null}
          className={pill(draft.pack === null)}
        >
          No pack
        </button>
        {packOptions.map((p) => (
          <button
            key={p}
            onClick={() => setDraft({ ...draft, pack: p })}
            aria-pressed={draft.pack === p}
            className={pill(draft.pack === p)}
          >
            {p}
          </button>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const value = newPack.trim().toLowerCase();
            if (value) setDraft({ ...draft, pack: value });
            setNewPack("");
          }}
          className="flex items-center gap-1"
        >
          <input
            value={newPack}
            onChange={(e) => setNewPack(e.target.value)}
            placeholder="new pack…"
            aria-label="New pack tag"
            className="w-24 rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs outline-none focus:border-sky-500 dark:border-white/10 dark:bg-neutral-900"
          />
        </form>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {sectionOptions.map((o) => (
          <button
            key={o.value}
            onClick={() => setDraft({ ...draft, section: o.value })}
            aria-pressed={draft.section === o.value}
            className={pill(draft.section === o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <button
          onClick={() => onSave(item, { ...draft, title: draft.title.trim() || item.title })}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition active:scale-95"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg px-3 py-2 text-sm font-semibold text-neutral-500 transition active:scale-95 dark:text-neutral-400"
        >
          Cancel
        </button>
        <button
          onClick={() => onArchive(item)}
          className="ml-auto rounded-lg px-3 py-2 text-sm font-semibold text-red-600 transition active:scale-95 dark:text-red-400"
        >
          Archive
        </button>
      </div>
    </div>
  );
}
