import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { randomUUID, randomBytes, scryptSync, createHash } from "node:crypto";
import { zipSync, strToU8 } from "fflate";
import { migrationSql } from "../src/lib/migrations";

await mkdir("../../work/test-data", { recursive: true });
const directory = await mkdtemp(path.resolve("../../work/test-data/portals-"));
const database = new PGlite(path.join(directory, "postgres"));
for (const sql of await migrationSql()) await database.exec(sql);
await database.exec(await readFile("db/demo-accounts.sql", "utf8"));
const password = randomBytes(18).toString("base64url"),
  salt = randomBytes(16).toString("hex");
const encoded = salt + ":" + scryptSync(password, salt, 64).toString("hex");
await database.query("UPDATE users SET password_hash=$1 WHERE is_demo=true", [
  encoded,
]);
const adminId = randomUUID(),
  resetToken = randomBytes(32).toString("hex");
await database.query(
  "INSERT INTO users(id,email,password_hash,name,role) VALUES ($1,'admin@test.invalid',$2,'Test Administrator','admin')",
  [adminId, encoded],
);
await database.query(
  "INSERT INTO password_resets VALUES ($1,$2,now()+interval '30 minutes')",
  [createHash("sha256").update(resetToken).digest("hex"), adminId],
);
await database.close();
const base = "http://127.0.0.1:3101";
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "dev",
    "--webpack",
    "-p",
    "3101",
    "-H",
    "127.0.0.1",
  ],
  {
    env: {
      ...process.env,
      NODE_ENV: "development",
      DATABASE_URL: "",
      SUPABASE_URL: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
      SMTP_HOST: "",
      VERCEL: "",
      NEXT_TELEMETRY_DISABLED: "1",
      NOTESPHERE_BUILD_DIR: ".next-role-tests",
      DATA_DIR: directory,
      APP_URL: base,
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let logs = "";
server.stdout.on("data", (chunk) => (logs += chunk));
server.stderr.on("data", (chunk) => (logs += chunk));
type Session = { cookie: string };
const guest: Session = { cookie: "" },
  admin: Session = { cookie: "" },
  alice: Session = { cookie: "" },
  bob: Session = { cookie: "" };
const results: string[] = [];
const named = [
  ["Sparsh Dwiwedi", "sparsh.dwiwedi@notesphere.test"],
  ["Kundan Pathak", "kundan.pathak@notesphere.test"],
  ["Shreshth Sharma", "shreshth.sharma@notesphere.test"],
  ["Aahaan Jain", "aahaan.jain@notesphere.test"],
];
const students: Session[] = named.map(() => ({ cookie: "" }));
async function check(name: string, run: () => Promise<void>) {
  await run();
  results.push(name);
  console.log("PASS " + name);
}
async function request(
  route: string,
  session = guest,
  body?: any,
  status = 200,
) {
  const form = body instanceof FormData;
  const response = await fetch(base + "/api/" + route, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      ...(session.cookie ? { cookie: session.cookie } : {}),
      ...(body !== undefined
        ? {
            origin: base,
            ...(form ? {} : { "Content-Type": "application/json" }),
          }
        : {}),
    },
    body: body === undefined ? undefined : form ? body : JSON.stringify(body),
    signal: AbortSignal.timeout(25000),
  });
  const text = await response.text();
  assert.equal(response.status, status, route + ": " + text.slice(0, 500));
  const cookie = response.headers.get("set-cookie");
  if (cookie) session.cookie = cookie.split(";")[0];
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
function pdf(text: string) {
  const stream = "BT /F1 20 Tf 40 750 Td (" + text + ") Tj ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Length " + stream.length + " >>\nstream\n" + stream + "\nendstream",
  ];
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((object, i) => {
    offsets.push(Buffer.byteLength(out));
    out += i + 1 + " 0 obj\n" + object + "\nendobj\n";
  });
  const start = Buffer.byteLength(out);
  return (
    out +
    "xref\n0 6\n0000000000 65535 f \n" +
    offsets
      .map((offset) => String(offset).padStart(10, "0") + " 00000 n \n")
      .join("") +
    "trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n" +
    start +
    "\n%%EOF\n"
  );
}
function upload(
  title: string,
  visibility = "public",
  status = "pending",
  bytes?: Uint8Array | string,
  name = "lecture.pdf",
) {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    title,
    description:
      "Original PDF notes on binary trees, traversals and worked academic examples.",
    subject_id: "dsa",
    course_id: "btech-cs",
    branch: "Computer Science",
    college: "Test College",
    semester: "3",
    topic: "Binary trees",
    academic_year: "2026-2027",
    language: "English",
    visibility,
    status,
    tags: "revision,algorithms",
  }))
    form.set(key, value);
  form.set(
    "file",
    new File(
      [
        typeof bytes === "string"
          ? bytes
          : bytes
            ? new Uint8Array(bytes).buffer
            : pdf(title),
      ],
      name,
      { type: "application/pdf" },
    ),
  );
  return form;
}
try {
  for (let attempt = 0; attempt < 90; attempt++) {
    try {
      if (
        (
          await fetch(base + "/api/catalog", {
            signal: AbortSignal.timeout(1500),
          })
        ).ok
      )
        break;
    } catch {}
    if (server.exitCode !== null || attempt === 89)
      throw new Error("Server failed: " + logs);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  await check(
    "Separate admin/student sign-up and sign-in pages retain NoteSphere styling",
    async () => {
      for (const route of [
        "/student/login",
        "/student/register",
        "/admin/login",
        "/admin/register",
      ]) {
        const response = await fetch(base + route);
        assert.equal(response.status, 200);
        const html = await response.text();
        assert.ok(
          html.includes("auth-layout") && html.includes("portal-switch"),
        );
      }
      assert.match(
        await (await fetch(base + "/admin/register")).text(),
        /invitation code/,
      );
    },
  );
  await check(
    "Student registration cannot self-assign administrator privileges",
    async () => {
      await request(
        "register",
        alice,
        {
          name: "Test Alice",
          email: "alice@test.invalid",
          password,
          role: "admin",
        },
        201,
      );
      assert.equal((await request("me", alice)).user.role, "student");
      await request(
        "register",
        bob,
        { name: "Test Bob", email: "bob@test.invalid", password },
        201,
      );
    },
  );
  await check(
    "Portal sign-in checks the account role and password",
    async () => {
      await request(
        "login",
        guest,
        { email: "alice@test.invalid", password, portal: "admin" },
        403,
      );
      await request(
        "login",
        guest,
        { email: "admin@test.invalid", password, portal: "student" },
        403,
      );
      await request(
        "login",
        guest,
        {
          email: "alice@test.invalid",
          password: "incorrect",
          portal: "student",
        },
        401,
      );
      await request("login", admin, {
        email: "admin@test.invalid",
        password,
        portal: "admin",
      });
    },
  );
  await check(
    "All four named demo students can sign in to their own accounts",
    async () => {
      for (let index = 0; index < named.length; index++) {
        await request("login", students[index], {
          email: named[index][1],
          password,
          portal: "student",
        });
        assert.equal(
          (await request("me", students[index])).user.name,
          named[index][0],
        );
      }
      assert.equal(new Set(students.map((s) => s.cookie)).size, 4);
    },
  );
  await check(
    "Admin account creation requires an expiring single-use invitation",
    async () => {
      await request(
        "admin/register",
        guest,
        {
          name: "Uninvited Admin",
          email: "no-invite@test.invalid",
          password,
          inviteCode: "x".repeat(48),
        },
        400,
      );
      await request("admin/invites", bob, {}, 403);
      const invitation = await request("admin/invites", admin, {}, 201);
      const invited: Session = { cookie: "" };
      await request(
        "admin/register",
        invited,
        {
          name: "Invited Admin",
          email: "invited@test.invalid",
          password,
          inviteCode: invitation.code,
        },
        201,
      );
      assert.equal((await request("me", invited)).user.role, "admin");
      await request(
        "admin/register",
        guest,
        {
          name: "Replay Admin",
          email: "replay@test.invalid",
          password,
          inviteCode: invitation.code,
        },
        400,
      );
    },
  );
  await check(
    "Guests cannot search, inspect, download or upload notes; students cannot use admin APIs",
    async () => {
      await request("notes", guest, undefined, 401);
      await request("notes/" + randomUUID(), guest, undefined, 401);
      await request("admin", bob, undefined, 403);
      await request("upload", guest, upload("Forbidden guest upload"), 401);
    },
  );
  await check(
    "Students can complete their profiles without changing role",
    async () => {
      await request("profile", bob, {
        name: "Test Bob",
        college: "Test College",
        course: "btech-cs",
        branch: "Computer Science",
        semester: 3,
        interests: "Algorithms",
        avatar: "",
        role: "admin",
      });
      assert.equal((await request("me", bob)).user.role, "student");
    },
  );
  await check(
    "Admin uploads reject disguised executables and genuine non-PDF documents",
    async () => {
      await request(
        "upload",
        admin,
        upload("Invalid executable PDF", "public", "pending", "MZ not a PDF"),
        400,
      );
      const office = zipSync({
        "[Content_Types].xml": strToU8("<Types/>"),
        "word/document.xml": strToU8("<document/>"),
      });
      await request(
        "upload",
        admin,
        upload(
          "Wrong format document",
          "public",
          "pending",
          office,
          "lecture.docx",
        ),
        400,
      );
    },
  );
  await check(
    "Student upload pages are available with review guidance and My uploads navigation",
    async () => {
      for (const route of ["/upload", "/uploads", "/student"]) {
        const response = await fetch(base + route, {
          headers: { cookie: students[0].cookie },
          redirect: "manual",
        });
        assert.equal(response.status, 200);
        const html = await response.text();
        assert.ok(html.includes("My uploads"));
        if (route === "/upload") {
          assert.ok(html.includes("Submit for approval"));
          assert.ok(html.includes("after admin approval"));
        }
      }
    },
  );
  await check(
    "Student PDFs stay pending with owner/admin preview and cannot bypass approval",
    async () => {
      const forged = upload("Forged approved upload", "public", "approved");
      await request("upload", students[0], forged, 400);
      const form = upload("Student Submission For Review");
      form.set("role", "admin");
      const result = await request("upload", students[0], form, 201);
      const id = result.id;
      assert.ok(result.message.includes("approval"));
      assert.equal(
        (await request("notes/" + id, students[0])).note.status,
        "pending",
      );
      assert.ok(
        (await request("notes/" + id + "/file", students[0])).startsWith(
          "%PDF-",
        ),
      );
      assert.equal(
        (await request("notes/" + id, admin)).note.status,
        "pending",
      );
      assert.ok(
        (await request("admin", admin)).notes.some(
          (n: any) => n.id === id && n.status === "pending",
        ),
      );
      assert.ok(
        (await request("notifications", admin)).notifications.some(
          (n: any) => n.note_id === id && n.message.includes("approval"),
        ),
      );
      assert.ok(
        (
          await request("notes?mode=uploads&status=pending", students[0])
        ).notes.some((n: any) => n.id === id),
      );
      await request("notes/" + id, students[1], undefined, 404);
      await request(
        "notes/" + id + "/file?download=1",
        students[1],
        undefined,
        404,
      );
      await request(
        "notes/" + id + "/bookmark",
        students[1],
        { saved: true },
        404,
      );
      assert.equal(
        (
          await request(
            "notes?q=Student+Submission+For+Review&status=pending",
            students[1],
          )
        ).total,
        0,
      );
      assert.equal(
        (await request("dashboard", students[1])).stats.available,
        0,
      );
      assert.ok(
        !(await request("notifications", students[1])).notifications.some(
          (n: any) => n.note_id === id,
        ),
      );
      await request(
        "admin",
        students[0],
        { action: "moderate", id, status: "approved" },
        403,
      );
      await request("notes/" + id + "/publish", students[0], {}, 400);
      await request("admin", admin, {
        action: "moderate",
        id,
        status: "approved",
      });
      for (const student of students) {
        assert.equal(
          (await request("notes/" + id, student)).note.status,
          "approved",
        );
        assert.ok(
          (await request("notes/" + id + "/file", student)).startsWith("%PDF-"),
        );
        assert.ok(
          (await request("notifications", student)).notifications.some(
            (n: any) => n.note_id === id && n.message.includes("New PDF"),
          ),
        );
      }
      assert.ok(
        (await request("notifications", students[0])).notifications.some(
          (n: any) => n.note_id === id && n.message.includes("was approved"),
        ),
      );
      const before = (
        await request("notifications", students[1])
      ).notifications.filter((n: any) => n.note_id === id).length;
      await request(
        "admin",
        admin,
        { action: "moderate", id, status: "approved" },
        409,
      );
      assert.equal(
        (await request("notifications", students[1])).notifications.filter(
          (n: any) => n.note_id === id,
        ).length,
        before,
      );
      await request("notes/" + id + "/delete", students[0], {});
    },
  );
  await check(
    "Rejected student notes remain hidden and their uploader receives the decision",
    async () => {
      const id = (
        await request(
          "upload",
          students[0],
          upload("Rejected Student PDF"),
          201,
        )
      ).id;
      await request("admin", admin, {
        action: "moderate",
        id,
        status: "rejected",
      });
      assert.equal(
        (await request("notes/" + id, students[0])).note.status,
        "rejected",
      );
      await request("notes/" + id, students[1], undefined, 404);
      await request("notes/" + id + "/file", students[1], undefined, 404);
      assert.ok(
        (await request("notifications", students[0])).notifications.some(
          (n: any) => n.note_id === id && n.message.includes("rejected"),
        ),
      );
      await request("notes/" + id + "/delete", students[0], {});
    },
  );
  await check(
    "Student drafts submit for approval and approval never exposes private PDFs",
    async () => {
      const id = (
        await request(
          "upload",
          students[0],
          upload("Private Student Draft", "private", "draft"),
          201,
        )
      ).id;
      await request(
        "admin",
        admin,
        { action: "moderate", id, status: "approved" },
        409,
      );
      await request("notes/" + id + "/publish", students[1], {}, 404);
      await request("notes/" + id + "/publish", students[0], {});
      assert.equal(
        (await request("notes/" + id, students[0])).note.status,
        "pending",
      );
      await request("notes/" + id + "/publish", students[0], {}, 400);
      await request("admin", admin, {
        action: "moderate",
        id,
        status: "approved",
      });
      assert.equal(
        (await request("notes/" + id, students[0])).note.status,
        "approved",
      );
      await request("notes/" + id, students[1], undefined, 404);
      assert.ok(
        !(await request("notifications", students[1])).notifications.some(
          (n: any) => n.note_id === id,
        ),
      );
      await request("notes/" + id + "/delete", students[0], {});
    },
  );
  let note = "";
  await check(
    "Admin PDF publication immediately delivers to all four student portals",
    async () => {
      note = (
        await request(
          "upload",
          admin,
          upload("Binary Tree Traversal Notes"),
          201,
        )
      ).id;
      assert.equal(
        (await request("notes/" + note, admin)).note.status,
        "approved",
      );
      for (const student of students) {
        assert.equal(
          (await request("notes?q=traversal&subject=dsa&semester=3", student))
            .notes[0].id,
          note,
        );
        assert.ok(
          (await request("notifications", student)).notifications.some(
            (n: any) => n.note_id === note && n.message.includes("New PDF"),
          ),
        );
        assert.equal((await request("dashboard", student)).stats.available, 1);
      }
    },
  );
  await check(
    "Only authenticated students/admins can preview and download published PDF bytes",
    async () => {
      await request("notes/" + note + "/file", guest, undefined, 401);
      await request("notes/" + note, guest, undefined, 401);
      for (const student of students)
        assert.ok(
          (await request("notes/" + note + "/file", student)).startsWith(
            "%PDF-",
          ),
        );
      await request("notes/" + note + "/view", bob, {});
      await request("notes/" + note + "/view", bob, {});
      await request("notes/" + note + "/file?download=1", bob);
      const detail = (await request("notes/" + note, admin)).note;
      assert.equal(detail.views, 1);
      assert.equal(detail.downloads, 1);
    },
  );
  await check(
    "Private PDFs and unpublished drafts are withheld from students",
    async () => {
      const privateId = (
        await request(
          "upload",
          admin,
          upload("Private Faculty PDF", "private"),
          201,
        )
      ).id;
      await request("notes/" + privateId, students[0], undefined, 404);
      await request(
        "notes/" + privateId + "/file",
        students[0],
        undefined,
        404,
      );
      const draft = (
        await request(
          "upload",
          admin,
          upload("Draft Class PDF", "public", "draft"),
          201,
        )
      ).id;
      await request("notes/" + draft, students[0], undefined, 404);
      await request("notes/" + draft + "/publish", admin, {});
      for (const student of students)
        assert.ok(
          (await request("notifications", student)).notifications.some(
            (n: any) => n.note_id === draft,
          ),
        );
      await request("notes/" + privateId + "/delete", admin, {});
      await request("notes/" + draft + "/delete", admin, {});
    },
  );
  await check(
    "Duplicate PDF uploads and forged cross-site mutations are rejected",
    async () => {
      await request(
        "upload",
        admin,
        upload("Binary Tree Traversal Notes"),
        409,
      );
      const response = await fetch(base + "/api/collections", {
        method: "POST",
        headers: {
          cookie: bob.cookie,
          origin: "https://evil.invalid",
          "Content-Type": "application/json",
        },
        body: '{"name":"Forged"}',
      });
      assert.equal(response.status, 403);
    },
  );
  let collection = "";
  await check(
    "Student bookmarks and private collections persist with enforced ownership",
    async () => {
      await request("notes/" + note + "/bookmark", bob, { saved: true });
      await request("notes/" + note + "/bookmark", bob, { saved: true });
      assert.equal((await request("notes?mode=bookmarks", bob)).total, 1);
      collection = (
        await request("collections", bob, { name: "Exam revision" }, 201)
      ).collection.id;
      await request("collections/" + collection, bob, { note_id: note });
      assert.equal(
        (await request("notes?collection=" + collection, bob)).total,
        1,
      );
      await request(
        "collections/" + collection,
        alice,
        { action: "rename", name: "Not mine" },
        404,
      );
      const old = { ...bob };
      await request("logout", bob, {});
      assert.equal((await request("me", old)).user, null);
      await request("login", bob, {
        email: "bob@test.invalid",
        password,
        portal: "student",
      });
      assert.equal((await request("notes?mode=bookmarks", bob)).total, 1);
    },
  );
  await check(
    "Student reviews update ratings and notify the uploading admin",
    async () => {
      await request(
        "notes/" + note + "/review",
        admin,
        { rating: 5, content: "Trying to review my own PDF." },
        403,
      );
      await request("notes/" + note + "/review", bob, {
        rating: 5,
        content: "Very clear and helpful worked examples.",
      });
      await request("notes/" + note + "/review", bob, {
        rating: 4,
        content: "Updated feedback with useful revision suggestions.",
      });
      const details = await request("notes/" + note, admin);
      assert.equal(details.note.rating, 4);
      assert.equal(details.reviews.length, 1);
      assert.ok(
        (await request("notifications", admin)).notifications.some((n: any) =>
          n.message.includes("reviewed"),
        ),
      );
    },
  );
  await check(
    "The admin roster identifies all four named demo students",
    async () => {
      const roster = (await request("admin", admin)).users;
      for (const [name] of named)
        assert.ok(
          roster.some(
            (u: any) => u.name === name && u.role === "student" && u.is_demo,
          ),
        );
    },
  );
  await check(
    "Content reports, review deletion and collection cleanup remain functional",
    async () => {
      const review = (await request("notes/" + note, bob)).reviews[0];
      await request("notes/" + note + "/report", bob, {
        reason: "Test moderation report with sufficient detail.",
        review_id: review.id,
      });
      const report = (await request("admin", admin)).reports[0];
      await request("admin", admin, { action: "resolve", id: report.id });
      await request("notes/" + note + "/review", bob, { action: "delete" });
      assert.equal((await request("notes/" + note, admin)).note.rating, 0);
      await request("collections/" + collection, bob, {
        action: "rename",
        name: "Finals",
      });
      await request("collections/" + collection, bob, { action: "delete" });
      await request("notes/" + note + "/delete", bob, {}, 403);
      await request("notes/" + note + "/delete", admin, {});
      await request("notes/" + note, bob, undefined, 404);
    },
  );
  await check(
    "Password reset remains single-use and revokes old administrator sessions",
    async () => {
      const old = { ...admin };
      await request("reset-password", guest, {
        token: resetToken,
        password: randomBytes(20).toString("base64url"),
      });
      await request(
        "reset-password",
        guest,
        { token: resetToken, password },
        400,
      );
      assert.equal((await request("me", old)).user, null);
    },
  );
  await writeFile(
    "docs/TEST-RESULTS.md",
    "# Verified portal tests\n\nExecuted " +
      new Date().toISOString() +
      " against an isolated local Next.js development server and on-disk PostgreSQL (PGlite). No cloud project or live user database was used.\n\n" +
      results.map((name) => "- PASS: " + name).join("\n") +
      "\n\nThese HTTP/database assertions do not establish browser rendering or cloud/email delivery. Demo passwords are randomized inside this isolated test database; application passwords are stored only as hashes.\n",
  );
  console.log("\n" + results.length + " portal integration checks passed.");
} catch (error) {
  console.error(logs);
  throw error;
} finally {
  server.kill();
}
