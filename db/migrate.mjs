// Applies db/schema.sql to the Neon database at POSTGRES_URL, then seeds
// db/seed.sql if (and only if) the items table is empty.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error("POSTGRES_URL is not set. Run `vercel env pull .env.local` first.");
  process.exit(1);
}

const sql = neon(url);
const here = dirname(fileURLToPath(import.meta.url));

function statements(file) {
  return readFileSync(join(here, file), "utf8")
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n")
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

for (const stmt of statements("schema.sql")) {
  await sql.query(stmt);
}
console.log("schema.sql applied");

const [{ count }] = await sql.query("SELECT count(*)::int AS count FROM items");
if (count === 0) {
  for (const stmt of statements("seed.sql")) {
    await sql.query(stmt);
  }
  console.log("seed.sql applied (items table was empty)");
} else {
  console.log(`seed skipped (${count} items already present)`);
}
