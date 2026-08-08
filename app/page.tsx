import { getItems, getKnownPacks, getTrip } from "@/lib/items";
import { PackApp } from "./_components/PackApp";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [items, trip, knownPacks] = await Promise.all([
    getItems(),
    getTrip(),
    getKnownPacks(),
  ]);
  return <PackApp initialItems={items} initialTrip={trip} knownPacks={knownPacks} />;
}
