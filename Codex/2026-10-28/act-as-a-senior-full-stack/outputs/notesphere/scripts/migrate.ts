import { query, closeDb } from "../src/lib/db";
import { migrationSql } from "../src/lib/migrations";
if (process.env.DATABASE_URL)
  for (const sql of await migrationSql()) await query(sql);
await query("SELECT 1");
console.log("Database schema and reference catalog ready.");
await closeDb();
process.exit(0);
