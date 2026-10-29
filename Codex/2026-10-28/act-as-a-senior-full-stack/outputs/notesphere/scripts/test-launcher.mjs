import { spawn, execFileSync } from "node:child_process";
import assert from "node:assert/strict";
const child = spawn(process.execPath, ["scripts/start-local.mjs"], {
  cwd: process.cwd(),
  env: { ...process.env, NOTESPHERE_NO_BROWSER: "1" },
  stdio: ["ignore", "pipe", "pipe", "ipc"],
});
let output = "";
child.stdout.on("data", (b) => (output += b.toString()));
child.stderr.on("data", (b) => (output += b.toString()));
try {
  let url = "";
  for (let i = 0; i < 240; i++) {
    const match = output.match(/Ready: (http:\/\/127\.0\.0\.1:\d+)/);
    if (match) {
      url = match[1];
      break;
    }
    if (child.exitCode !== null) throw new Error(output);
    await new Promise((r) => setTimeout(r, 500));
  }
  assert.ok(url, "Launcher did not become ready. " + output);
  const home = await fetch(url);
  assert.equal(home.status, 200);
  assert.match(await home.text(), /Your College Notes/);
  const catalog = await fetch(url + "/api/catalog");
  assert.ok((await catalog.json()).subjects.length > 0);
  const config = await fetch(url + "/api/config");
  const settings = await config.json();
  assert.equal(settings.maxFileMb, 20);
  assert.equal(settings.app, "notesphere");
  assert.ok(settings.localInstance);
  const second = execFileSync(process.execPath, ["scripts/start-local.mjs"], {
    cwd: process.cwd(),
    env: { ...process.env, NOTESPHERE_NO_BROWSER: "1" },
    encoding: "utf8",
    timeout: 15000,
    windowsHide: true,
  });
  assert.ok(
    second.includes("already running"),
    "Second launch should reuse the same server.",
  );
  assert.ok(second.includes("Ready: " + url));
  const worker = await fetch(url + "/pdf.worker.min.mjs");
  assert.equal(worker.status, 200);
  const dashboard = await fetch(url + "/dashboard", { redirect: "manual" });
  if (dashboard.status === 307)
    assert.equal(dashboard.headers.get("location"), "/student/login");
  else {
    assert.equal(dashboard.status, 200);
    const body = await dashboard.text();
    assert.ok(
      body.includes("/login") &&
        /NEXT_REDIRECT|http-equiv="refresh"/.test(body),
      "Expected a streamed sign-in redirect.",
    );
  }
  console.log(
    "PASS offline local launch, database readiness, duplicate-launch reuse, landing response, PDF worker, 20 MB limit and sign-in redirect.",
  );
} finally {
  if (child.connected) child.send({ type: "stop" });
  await new Promise((resolve) => {
    if (child.exitCode !== null) return resolve();
    child.once("exit", resolve);
    setTimeout(() => {
      child.kill();
      resolve();
    }, 4000).unref();
  });
}
