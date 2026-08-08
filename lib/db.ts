import "server-only";
import { neon } from "@neondatabase/serverless";

let client: ReturnType<typeof neon> | null = null;

export function sql(): ReturnType<typeof neon> {
  if (!client) {
    const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
    if (!url) throw new Error("POSTGRES_URL is not set in the environment.");
    client = neon(url);
  }
  return client;
}
