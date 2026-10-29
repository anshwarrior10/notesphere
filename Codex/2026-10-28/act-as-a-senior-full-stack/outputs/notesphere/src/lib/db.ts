import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { migrationSql } from "./migrations";
export const dataDir = path.resolve(process.env.DATA_DIR || ".data");
type DB = {
  query: (sql: string, params?: any[]) => Promise<{ rows: any[] }>;
  exec?: (sql: string) => Promise<any>;
  close?: () => Promise<void>;
  end?: () => Promise<void>;
};
const state = globalThis as unknown as {
  nsdb?: Promise<DB>;
  nsPortalsReady?: Promise<void>;
};
async function connect(): Promise<DB> {
  if (process.env.DATABASE_URL)
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      options: "-c search_path=notesphere,public",
    });
  if (process.env.VERCEL)
    throw new Error(
      "Configure DATABASE_URL before running NoteSphere on Vercel.",
    );
  await mkdir(dataDir, { recursive: true });
  const db: DB = new PGlite(path.join(dataDir, "postgres"));
  const sql = await readFile(
    path.join(process.cwd(), "db/001_initial.sql"),
    "utf8",
  );
  if (db.exec) await db.exec(sql);
  else await db.query(sql);
  await db.query(
    "INSERT INTO migrations(id) VALUES ('001_initial') ON CONFLICT DO NOTHING",
  );
  return db;
}
export async function query<T = any>(
  sql: string,
  params: any[] = [],
): Promise<T[]> {
  state.nsdb ??= connect();
  if (!process.env.DATABASE_URL) {
    state.nsPortalsReady ??= (async () => {
      const db = await state.nsdb!;
      for (const sql of [
        ...(await migrationSql()),
        await readFile(
          path.join(process.cwd(), "db/demo-accounts.sql"),
          "utf8",
        ),
      ]) {
        if (db.exec) await db.exec(sql);
        else await db.query(sql);
      }
    })();
    await state.nsPortalsReady.catch((error) => {
      delete state.nsPortalsReady;
      throw error;
    });
  }
  return (await (await state.nsdb).query(sql, params)).rows as T[];
}
export async function one<T = any>(
  sql: string,
  params: any[] = [],
): Promise<T | undefined> {
  return (await query<T>(sql, params))[0];
}
export async function closeDb() {
  if (state.nsdb) {
    const db = await state.nsdb;
    if (db.close) await db.close();
    else if (db.end) await db.end();
    delete state.nsdb;
    delete state.nsPortalsReady;
  }
}
