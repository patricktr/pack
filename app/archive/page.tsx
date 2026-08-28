import Link from "next/link";
import { getArchivedItems } from "@/lib/items";
import { restoreItem } from "@/app/actions";

export const dynamic = "force-dynamic";

const SECTION_LABELS: Record<string, string> = {
  packing: "Packing",
  house: "House",
  abdul: "Abdul",
};

export default async function ArchivePage() {
  const items = await getArchivedItems();

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col pb-24">
      <header className="sticky top-0 z-10 border-b border-black/5 bg-neutral-50/95 backdrop-blur dark:border-white/10 dark:bg-neutral-950/95">
        <div className="flex items-baseline justify-between px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-2.5">
          <div className="flex items-baseline gap-3">
            <Link
              href="/"
              className="text-sm font-semibold text-sky-600 dark:text-sky-400"
            >
              ← Pack
            </Link>
            <h1 className="text-xl font-bold tracking-tight">Archive</h1>
          </div>
          <p className="text-sm tabular-nums text-neutral-500 dark:text-neutral-400">
            {items.length} item{items.length === 1 ? "" : "s"}
          </p>
        </div>
      </header>

      <section className="px-2 pt-4">
        {items.length === 0 ? (
          <p className="px-2 text-sm text-neutral-500 dark:text-neutral-400">
            Nothing archived yet. Archived items are kept here forever — restore
            one any time.
          </p>
        ) : (
          <ul className="overflow-hidden rounded-xl bg-white shadow-sm dark:bg-neutral-900">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex min-h-11 items-center gap-3 border-b border-black/5 py-2 pl-3 pr-2 last:border-b-0 dark:border-white/5"
              >
                <div className="min-w-0 flex-1">
                  <p className="break-words text-[15px] leading-snug">{item.title}</p>
                  <p className="break-words text-xs text-neutral-400 dark:text-neutral-500">
                    {SECTION_LABELS[item.section] ?? item.section}
                    {item.category ? ` · ${item.category}` : ""}
                    {item.weather ? ` · ${item.weather}` : ""}
                    {item.pack ? ` · ${item.pack}` : ""}
                    {item.dayOf ? " · day of" : ""}
                    {item.archivedAt
                      ? ` · archived ${new Date(item.archivedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                      : ""}
                  </p>
                </div>
                <form
                  action={async () => {
                    "use server";
                    await restoreItem(item.id);
                  }}
                >
                  <button
                    type="submit"
                    className="shrink-0 rounded-lg bg-black/5 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition active:scale-95 dark:bg-white/10 dark:text-neutral-200"
                  >
                    Restore
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
