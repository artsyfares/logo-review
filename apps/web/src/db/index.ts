import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

let _db: NeonHttpDatabase<typeof schema> | undefined;

/**
 * Lazily initialized so importing this module (e.g. during `next build`'s
 * page-data collection) doesn't require DATABASE_URL to be set — only
 * actually querying the DB does.
 */
function getDb(): NeonHttpDatabase<typeof schema> {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set — see .env.example");
    }
    _db = drizzle(neon(process.env.DATABASE_URL), { schema });
  }
  return _db;
}

export const db: NeonHttpDatabase<typeof schema> = new Proxy(
  {} as NeonHttpDatabase<typeof schema>,
  {
    get(_target, prop, receiver) {
      return Reflect.get(getDb(), prop, receiver);
    },
  },
);
