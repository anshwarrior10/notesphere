import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
export async function migrationSql() {
  const directory = path.join(process.cwd(), "db");
  const files = (await readdir(directory))
    .filter((name) => /^\d+_.*\.sql$/.test(name))
    .sort();
  return Promise.all(
    files.map((name) => readFile(path.join(directory, name), "utf8")),
  );
}
