import "server-only";

import { neon } from "@neondatabase/serverless";

let database: ReturnType<typeof neon> | null = null;

export function getSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL ontbreekt.");
  if (!database) database = neon(databaseUrl);
  return database;
}

