import {
  randomBytes,
  scrypt as sc,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { one, query } from "./db";
const scrypt = promisify(sc);
export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return (
    salt + ":" + ((await scrypt(password, salt, 64)) as Buffer).toString("hex")
  );
}
export async function verifyPassword(password: string, encoded: string) {
  const [salt, key] = encoded.split(":");
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(key, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function user() {
  const token = (await cookies()).get("ns_session")?.value;
  if (!token) return null;
  return (
    (await one(
      "SELECT u.id,u.email,u.name,u.college,u.course,u.branch,u.semester,u.interests,u.avatar,u.role,u.created_at FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=$1 AND s.expires_at>now()",
      [hashToken(token)],
    )) || null
  );
}
export async function requireUser() {
  const u = await user();
  if (!u) throw new HttpError(401, "Please sign in to continue.");
  return u;
}
export async function requireAdmin() {
  const u = await requireUser();
  if (u.role !== "admin")
    throw new HttpError(403, "Administrator access required.");
  return u;
}
export async function newSession(id: string) {
  const token = randomBytes(32).toString("hex");
  await query(
    "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES ($1,$2,now()+interval '7 days')",
    [hashToken(token), id],
  );
  (await cookies()).set("ns_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure:
      process.env.NODE_ENV === "production" &&
      !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(
        process.env.APP_URL || "",
      ),
    path: "/",
    maxAge: 604800,
  });
}
export async function rateLimit(key: string, limit: number, minutes = 15) {
  const r = await one(
    `INSERT INTO rate_limits(key,hits,expires_at) VALUES ($1,1,now()+($2 || ' minutes')::interval) ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN rate_limits.expires_at<now() THEN 1 ELSE rate_limits.hits+1 END, expires_at=CASE WHEN rate_limits.expires_at<now() THEN excluded.expires_at ELSE rate_limits.expires_at END RETURNING hits`,
    [key, String(minutes)],
  );
  if (r.hits > limit)
    throw new HttpError(429, "Too many attempts. Please try again later.");
}
export function checkOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const allowed = process.env.APP_URL || new URL(req.url).origin;
  if (!origin || origin !== new URL(allowed).origin)
    throw new HttpError(403, "Invalid request origin.");
}
export function canRead(note: any, u: any) {
  return (
    !!u &&
    note &&
    (note.user_id === u?.id ||
      u?.role === "admin" ||
      (note.status === "approved" && note.visibility === "public"))
  );
}
