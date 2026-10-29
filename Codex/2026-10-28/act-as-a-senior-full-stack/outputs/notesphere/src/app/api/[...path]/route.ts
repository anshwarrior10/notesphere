import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import path from "node:path";
import { fileTypeFromBuffer } from "file-type";
import nodemailer from "nodemailer";
import { z } from "zod";
import { query, one } from "@/lib/db";
import {
  cloudStorage,
  maxFileMb,
  saveFile,
  getFile,
  removeFile,
  signedFile,
} from "@/lib/storage";
import {
  user,
  requireUser,
  requireAdmin,
  newSession,
  hashPassword,
  verifyPassword,
  hashToken,
  rateLimit,
  checkOrigin,
  HttpError,
  canRead,
} from "@/lib/security";
import {
  registerSchema,
  profileSchema,
  noteSchema,
  reviewSchema,
} from "@/lib/validation";
import { searchNotes, getNote } from "@/lib/notes";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };
const json = (data: any, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
const uuid = (s: string) => z.uuid().parse(s);
async function readable(id: string, u: any) {
  uuid(id);
  const n = await getNote(id, u?.id || null);
  if (!canRead(n, u))
    throw new HttpError(404, "Note not found or unavailable.");
  return n;
}
async function notify(uid: string, message: string, nid: string) {
  await query(
    "INSERT INTO notifications(id,user_id,message,note_id) VALUES ($1,$2,$3,$4)",
    [randomUUID(), uid, message, nid],
  );
}
async function deliverToStudents(nid: string, title: string) {
  await query(
    "INSERT INTO notifications(id,user_id,message,note_id) SELECT gen_random_uuid(),id,$1,$2 FROM users WHERE role='student'",
    [`New PDF available: ${title}`, nid],
  );
}
async function requestApproval(nid: string, title: string) {
  await query(
    "INSERT INTO notifications(id,user_id,message,note_id) SELECT gen_random_uuid(),id,$1,$2 FROM users WHERE role='admin'",
    [`PDF awaiting your approval: ${title}`, nid],
  );
}
async function handle(req: NextRequest, ctx: Context) {
  const segments = (await ctx.params).path;
  const route = segments.join("/");
  const id = segments[1];
  const method = req.method;
  if (method === "POST") checkOrigin(req);
  if (method === "GET") {
    if (route === "config")
      return json({
        app: "notesphere",
        localDemo: !process.env.DATABASE_URL && !process.env.VERCEL,
        maxFileMb: maxFileMb(),
        localInstance: process.env.NOTESPHERE_LOCAL_INSTANCE || null,
      });
    if (route === "me") return json({ user: await user() });
    if (route === "catalog")
      return json({
        departments: await query("SELECT * FROM departments ORDER BY name"),
        courses: await query("SELECT * FROM courses ORDER BY name"),
        subjects: await query("SELECT * FROM subjects ORDER BY name"),
      });
    if (route === "notes") {
      const u = await requireUser();
      if (req.nextUrl.searchParams.get("mode") && !u)
        throw new HttpError(401, "Please sign in.");
      return json(await searchNotes(req.nextUrl.searchParams, u));
    }
    if (segments[0] === "notes" && id) {
      const u = await requireUser();
      const n = await readable(id, u);
      if (segments[2] === "file") {
        await requireUser();
        const f = await one("SELECT * FROM files WHERE note_id=$1", [id]);
        const download = req.nextUrl.searchParams.has("download");
        if (download) {
          await rateLimit("download:" + u.id, 60, 1);
          await query(
            "INSERT INTO events(id,user_id,note_id,kind) VALUES ($1,$2,$3,'download')",
            [randomUUID(), u.id, id],
          );
        }
        if (cloudStorage())
          return NextResponse.redirect(
            await signedFile(
              f.storage_key,
              download ? f.original_name : undefined,
            ),
            { status: 302, headers: { "Cache-Control": "private, no-store" } },
          );
        const bytes = await getFile(f.storage_key);
        return new NextResponse(bytes, {
          headers: {
            "Content-Type": f.mime,
            "Content-Length": String(bytes.length),
            "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(f.original_name)}`,
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
            "Content-Security-Policy": "default-src 'none'; sandbox",
          },
        });
      }
      const order = req.nextUrl.searchParams.get("sort");
      const sort =
        order === "highest"
          ? "r.rating DESC"
          : order === "lowest"
            ? "r.rating ASC"
            : "r.updated_at DESC";
      const reviews = await query(
        `SELECT r.*,u.name,u.avatar FROM reviews r JOIN users u ON u.id=r.user_id WHERE note_id=$1 ORDER BY ${sort} LIMIT 100`,
        [id],
      );
      return json({
        note: n,
        reviews,
        related: (
          await searchNotes(new URLSearchParams({ subject: n.subject_id }), u)
        ).notes
          .filter((r: any) => r.id !== id)
          .slice(0, 3),
      });
    }
    const u = await requireUser();
    if (route === "collections")
      return json({
        collections: await query(
          "SELECT c.*,(SELECT count(*)::int FROM collection_notes cn WHERE cn.collection_id=c.id) note_count FROM collections c WHERE user_id=$1 ORDER BY c.created_at DESC",
          [u.id],
        ),
      });
    if (route === "notifications")
      return json({
        notifications: await query(
          "SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100",
          [u.id],
        ),
      });
    if (route === "dashboard") {
      const stats = await one(
        `SELECT (SELECT count(*)::int FROM notes WHERE user_id=$1) uploads,(SELECT count(*)::int FROM notes WHERE status='approved' AND visibility='public') available,(SELECT count(*)::int FROM bookmarks WHERE user_id=$1) bookmarks,(SELECT count(*)::int FROM events WHERE user_id=$1) reads,(SELECT count(*)::int FROM reviews WHERE user_id=$1) reviews_given,(SELECT count(*)::int FROM reviews r JOIN notes n ON n.id=r.note_id WHERE n.user_id=$1) reviews`,
        [u.id],
      );
      const section = async (p: Record<string, string>) =>
        (await searchNotes(new URLSearchParams(p), u)).notes.slice(0, 4);
      return json({
        stats,
        recent: await section({ sort: "recent" }),
        recommended: await section({
          course: u.course || "",
          semester: String(u.semester),
          sort: "rating",
        }),
        popular: await section({ sort: "views" }),
        topRated: await section({ sort: "rating", rating: "1" }),
        bookmarked: await section({ mode: "bookmarks", sort: "saved" }),
        history: await section({ mode: "history", sort: "history" }),
        activity: await query(
          "SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 5",
          [u.id],
        ),
      });
    }
    if (route === "admin") {
      await requireAdmin();
      return json({
        stats: await one(
          "SELECT (SELECT count(*)::int FROM users WHERE role='student') users,(SELECT count(*)::int FROM notes) notes,(SELECT count(*)::int FROM notes WHERE status='pending') pending,(SELECT count(*)::int FROM events) events",
        ),
        users: await query(
          "SELECT id,name,email,role,is_demo,created_at FROM users ORDER BY created_at DESC LIMIT 100",
        ),
        notes: await query(
          "SELECT n.*,u.name uploader FROM notes n JOIN users u ON u.id=n.user_id ORDER BY CASE WHEN n.status='pending' THEN 0 ELSE 1 END,n.created_at DESC LIMIT 100",
        ),
        reports: await query(
          "SELECT r.*,n.title,u.name reporter FROM reports r JOIN notes n ON n.id=r.note_id JOIN users u ON u.id=r.user_id WHERE r.status='open' ORDER BY created_at DESC",
        ),
      });
    }
    throw new HttpError(404, "Endpoint not found.");
  }
  if (route === "register") {
    const b = registerSchema.parse(await req.json());
    await rateLimit("registration-global", 100, 60);
    await rateLimit("register:" + b.email, 5);
    if (await one("SELECT id FROM users WHERE email=$1", [b.email]))
      throw new HttpError(409, "An account with this email already exists.");
    const uid = randomUUID();
    await query(
      "INSERT INTO users(id,email,password_hash,name) VALUES ($1,$2,$3,$4)",
      [uid, b.email, await hashPassword(b.password), b.name],
    );
    await newSession(uid);
    return json({ ok: true }, 201);
  }
  if (route === "admin/register") {
    const b = registerSchema
      .extend({ inviteCode: z.string().trim().min(20).max(100) })
      .parse(await req.json());
    await rateLimit("admin-register:" + b.email, 5);
    await rateLimit("admin-register-global", 50, 60);
    const created = await one(
      "WITH invitation AS (UPDATE admin_invitations SET used_at=now() WHERE code_hash=$1 AND used_at IS NULL AND expires_at>now() RETURNING id) INSERT INTO users(id,email,password_hash,name,role) SELECT $2,$3,$4,$5,'admin' FROM invitation RETURNING id",
      [
        hashToken(b.inviteCode),
        randomUUID(),
        b.email,
        await hashPassword(b.password),
        b.name,
      ],
    );
    if (!created)
      throw new HttpError(
        400,
        "The admin invitation is invalid, expired or already used.",
      );
    await newSession(created.id);
    return json({ ok: true }, 201);
  }
  if (route === "login") {
    const b = z
      .object({
        email: z.email().transform((v) => v.toLowerCase()),
        password: z.string().max(128),
        portal: z.enum(["student", "admin"]).optional(),
      })
      .parse(await req.json());
    await rateLimit("login:" + b.email, 10);
    await rateLimit("login-global", 300);
    const u = await one(
      "SELECT id,password_hash,role FROM users WHERE email=$1",
      [b.email],
    );
    const fallback = "00000000000000000000000000000000:" + "00".repeat(64);
    const valid = await verifyPassword(
      b.password,
      u?.password_hash || fallback,
    );
    if (!u || !valid)
      throw new HttpError(401, "Email or password is incorrect.");
    if (b.portal && u.role !== b.portal)
      throw new HttpError(
        403,
        `This account belongs to the ${u.role} portal. Please use that sign-in page.`,
      );
    await newSession(u.id);
    return json({ ok: true });
  }
  if (route === "forgot-password") {
    const { email } = z
      .object({ email: z.email().transform((v) => v.toLowerCase()) })
      .parse(await req.json());
    await rateLimit("reset:" + email, 3, 60);
    await rateLimit("reset-global", 50, 60);
    if (!process.env.SMTP_HOST)
      throw new HttpError(
        503,
        "Password recovery requires SMTP configuration. Contact the project administrator.",
      );
    const u = await one("SELECT id FROM users WHERE email=$1", [email]);
    if (u) {
      const token = randomBytes(32).toString("hex");
      await query(
        "INSERT INTO password_resets(token_hash,user_id,expires_at) VALUES ($1,$2,now()+interval '30 minutes')",
        [hashToken(token), u.id],
      );
      const smtp = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_PORT === "465",
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
      await smtp.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: "Reset your NoteSphere password",
        text: `Reset your password within 30 minutes: ${process.env.APP_URL || req.nextUrl.origin}/reset-password?token=${token}`,
      });
    }
    return json({
      message: "If an account exists, a reset link has been emailed.",
    });
  }
  if (route === "reset-password") {
    const b = z
      .object({
        token: z.string().regex(/^[a-f0-9]{64}$/),
        password: registerSchema.shape.password,
      })
      .parse(await req.json());
    await rateLimit("reset-token:" + hashToken(b.token), 5);
    const reset = await one(
      "WITH consumed AS (DELETE FROM password_resets WHERE token_hash=$1 AND expires_at>now() RETURNING user_id), changed AS (UPDATE users SET password_hash=$2,updated_at=now() WHERE id=(SELECT user_id FROM consumed) RETURNING id), revoked AS (DELETE FROM sessions WHERE user_id=(SELECT id FROM changed)), other_tokens AS (DELETE FROM password_resets WHERE user_id=(SELECT id FROM changed) AND token_hash<>$1) SELECT id FROM changed",
      [hashToken(b.token), await hashPassword(b.password)],
    );
    if (!reset) throw new HttpError(400, "Reset link is invalid or expired.");
    return json({ ok: true });
  }
  const u = await requireUser();
  await rateLimit("mutation:" + u.id, 100, 1);
  if (route === "admin/invites") {
    await requireAdmin();
    const code = randomBytes(24).toString("hex");
    await query(
      "INSERT INTO admin_invitations(id,code_hash,created_by,expires_at) VALUES ($1,$2,$3,now()+interval '24 hours')",
      [randomUUID(), hashToken(code), u.id],
    );
    return json({ code, expiresIn: "24 hours" }, 201);
  }
  if (route === "logout") {
    const token = (await cookies()).get("ns_session")?.value;
    await query("DELETE FROM sessions WHERE token_hash=$1", [
      hashToken(token || ""),
    ]);
    (await cookies()).delete("ns_session");
    return json({ ok: true });
  }
  if (route === "profile") {
    const b = profileSchema.parse(await req.json());
    await query(
      "UPDATE users SET name=$1,college=$2,course=$3,branch=$4,semester=$5,interests=$6,avatar=$7,updated_at=now() WHERE id=$8",
      [
        b.name,
        b.college,
        b.course,
        b.branch,
        b.semester,
        b.interests,
        b.avatar,
        u.id,
      ],
    );
    return json({ ok: true });
  }
  if (route === "upload") {
    await rateLimit("upload:" + u.id, 20, 60);
    const max = maxFileMb();
    if (
      Number(req.headers.get("content-length") || 0) >
      (max + 0.25) * 1024 * 1024
    )
      throw new HttpError(413, `Upload must be at most ${max} MB.`);
    const form = await req.formData();
    const b = noteSchema.parse(Object.fromEntries(form));
    const file = form.get("file");
    if (!(file instanceof File) || !file.size || file.size > max * 1024 * 1024)
      throw new HttpError(400, `Choose a PDF file, up to ${max} MB.`);
    if (
      !(await one("SELECT id FROM subjects WHERE id=$1 AND course_id=$2", [
        b.subject_id,
        b.course_id,
      ]))
    )
      throw new HttpError(
        400,
        "Select a subject belonging to the selected course.",
      );
    const bytes = Buffer.from(await file.arrayBuffer());
    let detected;
    try {
      detected = await fileTypeFromBuffer(bytes);
    } catch {
      throw new HttpError(400, "The uploaded file is not a valid PDF.");
    }
    const mime = detected?.mime;
    if (
      mime !== "application/pdf" ||
      !bytes.subarray(0, 1024).includes(Buffer.from("%PDF-")) ||
      !bytes.subarray(-2048).includes(Buffer.from("%%EOF"))
    )
      throw new HttpError(400, "Only valid PDF documents can be uploaded.");
    const hash = createHash("sha256").update(bytes).digest("hex");
    if (
      await one(
        "SELECT f.note_id FROM files f JOIN notes n ON n.id=f.note_id WHERE hash=$1 AND n.user_id=$2",
        [hash, u.id],
      )
    )
      throw new HttpError(409, "You have already uploaded this document.");
    const nid = randomUUID(),
      key = randomUUID();
    await saveFile(key, bytes, mime!);
    try {
      await query(
        `WITH added AS (INSERT INTO notes(id,user_id,title,description,subject_id,course_id,branch,college,semester,topic,academic_year,language,visibility,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id) INSERT INTO files(note_id,storage_key,original_name,mime,size,hash) SELECT id,$15,$16,$17,$18,$19 FROM added`,
        [
          nid,
          u.id,
          b.title,
          b.description,
          b.subject_id,
          b.course_id,
          b.branch,
          b.college,
          b.semester,
          b.topic,
          b.academic_year,
          b.language,
          b.visibility,
          b.status === "draft"
            ? "draft"
            : u.role === "admin"
              ? "approved"
              : "pending",
          key,
          path.basename(file.name).slice(0, 200),
          mime,
          file.size,
          hash,
        ],
      );
      for (const name of [
        ...new Set(
          b.tags
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean),
        ),
      ].slice(0, 10)) {
        const t = await one(
          "INSERT INTO tags(id,name) VALUES ($1,$2) ON CONFLICT(name) DO UPDATE SET name=excluded.name RETURNING id",
          [randomUUID(), name],
        );
        await query(
          "INSERT INTO note_tags VALUES ($1,$2) ON CONFLICT DO NOTHING",
          [nid, t.id],
        );
      }
    } catch (e) {
      await query("DELETE FROM notes WHERE id=$1", [nid]);
      await removeFile(key);
      throw e;
    }
    if (b.status !== "draft") {
      if (u.role !== "admin") await requestApproval(nid, b.title);
      else if (b.visibility === "public") await deliverToStudents(nid, b.title);
    }
    return json(
      {
        id: nid,
        message:
          b.status === "draft"
            ? "Draft saved."
            : u.role !== "admin"
              ? "PDF submitted for admin approval. You can preview it in My uploads."
              : b.visibility === "private"
                ? "Private PDF saved."
                : "PDF published to the student portal.",
      },
      201,
    );
  }
  if (segments[0] === "notes" && id) {
    const n = await readable(id, u);
    const b = await req.json();
    if (segments[2] === "bookmark") {
      const saved = z.boolean().parse(b.saved);
      if (saved)
        await query(
          "INSERT INTO bookmarks(user_id,note_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
          [u.id, id],
        );
      else
        await query("DELETE FROM bookmarks WHERE user_id=$1 AND note_id=$2", [
          u.id,
          id,
        ]);
      return json({ ok: true, saved });
    }
    if (segments[2] === "view") {
      await query(
        "INSERT INTO events(id,user_id,note_id,kind) SELECT $1,$2,$3,'view' WHERE NOT EXISTS(SELECT 1 FROM events WHERE user_id=$2 AND note_id=$3 AND kind='view' AND created_at>now()-interval '30 minutes')",
        [randomUUID(), u.id, id],
      );
      return json({ ok: true });
    }
    if (segments[2] === "review") {
      if (b.action === "delete") {
        await query("DELETE FROM reviews WHERE note_id=$1 AND user_id=$2", [
          id,
          u.id,
        ]);
        return json({ ok: true });
      }
      if (n.user_id === u.id)
        throw new HttpError(403, "You cannot review your own notes.");
      const review = reviewSchema.parse(b);
      await query(
        "INSERT INTO reviews(id,note_id,user_id,rating,content) VALUES ($1,$2,$3,$4,$5) ON CONFLICT(note_id,user_id) DO UPDATE SET rating=excluded.rating,content=excluded.content,updated_at=now()",
        [randomUUID(), id, u.id, review.rating, review.content],
      );
      await notify(n.user_id, `${u.name} reviewed “${n.title}”`, id);
      return json({ ok: true });
    }
    if (segments[2] === "report") {
      const reason = z.string().trim().min(10).max(1000).parse(b.reason);
      const rid = b.review_id ? uuid(b.review_id) : null;
      if (
        rid &&
        !(await one("SELECT id FROM reviews WHERE id=$1 AND note_id=$2", [
          rid,
          id,
        ]))
      )
        throw new HttpError(400, "Review not found.");
      await query(
        "INSERT INTO reports(id,user_id,note_id,review_id,reason) VALUES ($1,$2,$3,$4,$5)",
        [randomUUID(), u.id, id, rid, reason],
      );
      return json({ ok: true });
    }
    if (segments[2] === "delete") {
      if (n.user_id !== u.id && u.role !== "admin")
        throw new HttpError(403, "Only the owner can delete this note.");
      const f = await one("SELECT storage_key FROM files WHERE note_id=$1", [
        id,
      ]);
      await query("DELETE FROM notes WHERE id=$1", [id]);
      await removeFile(f.storage_key).catch(() => {});
      return json({ ok: true });
    }
    if (segments[2] === "publish") {
      if (n.user_id !== u.id)
        throw new HttpError(403, "Only the owner can publish this draft.");
      const published = await one(
        "UPDATE notes SET status=$2,updated_at=now() WHERE id=$1 AND status='draft' RETURNING title,visibility",
        [id, u.role === "admin" ? "approved" : "pending"],
      );
      if (!published) throw new HttpError(400, "Only drafts can be published.");
      if (u.role !== "admin") await requestApproval(id, published.title);
      else if (published.visibility === "public")
        await deliverToStudents(id, published.title);
      return json({
        ok: true,
        status: u.role === "admin" ? "approved" : "pending",
      });
    }
  }
  if (route === "collections") {
    const b = await req.json();
    const name = z.string().trim().min(1).max(60).parse(b.name);
    const collection = await one(
      "INSERT INTO collections(id,user_id,name) VALUES ($1,$2,$3) RETURNING *",
      [randomUUID(), u.id, name],
    );
    return json({ collection }, 201);
  }
  if (segments[0] === "collections" && id) {
    uuid(id);
    if (
      !(await one("SELECT id FROM collections WHERE id=$1 AND user_id=$2", [
        id,
        u.id,
      ]))
    )
      throw new HttpError(404, "Collection not found.");
    const b = await req.json();
    if (b.action === "delete")
      await query("DELETE FROM collections WHERE id=$1 AND user_id=$2", [
        id,
        u.id,
      ]);
    else if (b.action === "rename")
      await query("UPDATE collections SET name=$1 WHERE id=$2 AND user_id=$3", [
        z.string().trim().min(1).max(60).parse(b.name),
        id,
        u.id,
      ]);
    else {
      const nid = uuid(b.note_id);
      await readable(nid, u);
      if (b.action === "remove")
        await query(
          "DELETE FROM collection_notes WHERE collection_id=$1 AND note_id=$2",
          [id, nid],
        );
      else
        await query(
          "INSERT INTO collection_notes VALUES ($1,$2) ON CONFLICT DO NOTHING",
          [id, nid],
        );
    }
    return json({ ok: true });
  }
  if (route === "notifications") {
    await query("UPDATE notifications SET is_read=true WHERE user_id=$1", [
      u.id,
    ]);
    return json({ ok: true });
  }
  if (route === "admin") {
    await requireAdmin();
    const b = await req.json();
    if (b.action === "moderate") {
      const nid = uuid(b.id);
      const status = z.enum(["approved", "rejected"]).parse(b.status);
      const n = await one(
        "UPDATE notes SET status=$1,updated_at=now() WHERE id=$2 AND status<>'draft' AND status<>$1 RETURNING user_id,title,visibility",
        [status, nid],
      );
      if (!n)
        throw new HttpError(
          409,
          "This note is a draft, unavailable, or already has that status.",
        );
      await notify(n.user_id, `Your note “${n.title}” was ${status}.`, nid);
      if (status === "approved" && n.visibility === "public")
        await deliverToStudents(nid, n.title);
    } else if (b.action === "resolve")
      await query("UPDATE reports SET status='resolved' WHERE id=$1", [
        uuid(b.id),
      ]);
    else if (b.action === "remove-review")
      await query("DELETE FROM reviews WHERE id=$1", [uuid(b.id)]);
    else if (b.action === "catalog") {
      const kind = z.enum(["subjects", "courses", "departments"]).parse(b.kind);
      const name = z.string().trim().min(2).max(100).parse(b.name);
      const key = randomUUID();
      if (kind === "subjects")
        await query("INSERT INTO subjects VALUES ($1,$2,$3)", [
          key,
          z.string().min(1).parse(b.parent),
          name,
        ]);
      else if (kind === "courses")
        await query("INSERT INTO courses VALUES ($1,$2,$3)", [
          key,
          z.string().min(1).parse(b.parent),
          name,
        ]);
      else await query("INSERT INTO departments VALUES ($1,$2)", [key, name]);
    } else throw new HttpError(400, "Unknown admin action.");
    return json({ ok: true });
  }
  throw new HttpError(404, "Endpoint not found.");
}
async function handler(req: NextRequest, ctx: Context) {
  try {
    return await handle(req, ctx);
  } catch (e: any) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status);
    if (e instanceof z.ZodError)
      return json(
        {
          error: e.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join(" · "),
        },
        400,
      );
    if (e.code === "23505")
      return json({ error: "This item already exists." }, 409);
    if (e.code === "22P02")
      return json({ error: "Invalid identifier or filter." }, 400);
    console.error("API request failed", {
      path: req.nextUrl.pathname,
      message: e.message,
    });
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
}
export const GET = handler;
export const POST = handler;
