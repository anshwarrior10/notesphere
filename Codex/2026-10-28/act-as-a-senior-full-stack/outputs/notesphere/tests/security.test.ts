import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  verifyPassword,
  canRead,
  hashToken,
  checkOrigin,
} from "../src/lib/security";
import {
  noteSchema,
  reviewSchema,
  registerSchema,
} from "../src/lib/validation";
test("scrypt hashes are salted and authenticate only the correct password", async () => {
  const a = await hashPassword("a long private passphrase");
  const b = await hashPassword("a long private passphrase");
  assert.notEqual(a, b);
  assert.ok(!a.includes("passphrase"));
  assert.equal(await verifyPassword("a long private passphrase", a), true);
  assert.equal(await verifyPassword("wrong", a), false);
  assert.equal(hashToken("x").length, 64);
});
test("private, pending and draft notes cannot be read by another student", () => {
  for (const visibility of ["public", "private"])
    for (const status of ["pending", "draft", "rejected"]) {
      const note = { user_id: "owner", visibility, status };
      assert.equal(canRead(note, { id: "other", role: "student" }), false);
      assert.equal(canRead(note, { id: "owner" }), true);
      assert.equal(canRead(note, { role: "admin" }), true);
    }
  assert.equal(!!canRead(null, null), false);
  assert.equal(
    canRead(
      { user_id: "owner", status: "approved", visibility: "private" },
      { id: "other" },
    ),
    false,
  );
  assert.equal(
    canRead(
      { user_id: "owner", status: "approved", visibility: "public" },
      null,
    ),
    false,
  );
});
test("review and credential validation rejects invalid input", () => {
  assert.equal(
    reviewSchema.safeParse({ rating: 6, content: "too short" }).success,
    false,
  );
  assert.equal(
    reviewSchema.safeParse({
      rating: 5,
      content: "Clear and useful explanations.",
    }).success,
    true,
  );
  assert.equal(
    registerSchema.safeParse({
      name: "Student",
      email: "student@example.com",
      password: "short",
    }).success,
    false,
  );
});
test("origin checking rejects missing and cross-site origins", () => {
  const original = process.env.APP_URL;
  delete process.env.APP_URL;
  try {
    assert.throws(() =>
      checkOrigin(new Request("http://localhost:3000/api/upload")),
    );
    assert.throws(() =>
      checkOrigin(
        new Request("http://localhost:3000/api/upload", {
          headers: { origin: "https://evil.example" },
        }),
      ),
    );
    assert.doesNotThrow(() =>
      checkOrigin(
        new Request("http://localhost:3000/api/upload", {
          headers: { origin: "http://localhost:3000" },
        }),
      ),
    );
  } finally {
    if (original) process.env.APP_URL = original;
    else delete process.env.APP_URL;
  }
});
