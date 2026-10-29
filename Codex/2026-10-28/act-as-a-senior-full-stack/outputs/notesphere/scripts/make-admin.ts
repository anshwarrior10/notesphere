import { query, closeDb } from "../src/lib/db";
const email = process.argv[2]?.toLowerCase();
if (!email)
  throw new Error("Usage: npx tsx scripts/make-admin.ts student@example.com");
const rows = await query(
  "UPDATE users SET role='admin' WHERE email=$1 RETURNING email",
  [email],
);
console.log(
  rows.length
    ? "Administrator assigned."
    : "No registered account has that email.",
);
await closeDb();
process.exit(rows.length ? 0 : 1);
