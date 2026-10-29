import { createClient } from "@supabase/supabase-js";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { dataDir } from "./db";
export const cloudStorage = () => !!process.env.SUPABASE_URL;
export const maxFileMb = () => (process.env.VERCEL ? 4 : 20);
function bucket() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    throw new Error("Supabase Storage credentials are missing.");
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  ).storage.from(process.env.STORAGE_BUCKET || "notesphere");
}
export async function saveFile(key: string, bytes: Buffer, mime: string) {
  if (cloudStorage()) {
    const { error } = await bucket().upload(key, bytes, {
      contentType: mime,
      upsert: false,
    });
    if (error)
      throw new Error(
        "Cloud upload failed. Check the private storage bucket configuration.",
      );
  } else {
    await mkdir(path.join(dataDir, "files"), { recursive: true });
    await writeFile(path.join(dataDir, "files", key), bytes, { flag: "wx" });
  }
}
export async function getFile(key: string) {
  return readFile(path.join(dataDir, "files", key));
}
export async function removeFile(key: string) {
  if (cloudStorage()) {
    const { error } = await bucket().remove([key]);
    if (error) throw new Error("Cloud file deletion failed.");
  } else await unlink(path.join(dataDir, "files", key));
}
export async function signedFile(key: string, download?: string) {
  const { data, error } = await bucket().createSignedUrl(
    key,
    60,
    download ? { download } : {},
  );
  if (error) throw new Error("Unable to authorize this download.");
  return data.signedUrl;
}
