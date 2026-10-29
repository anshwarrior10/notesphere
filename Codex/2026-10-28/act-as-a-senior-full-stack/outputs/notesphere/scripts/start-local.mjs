import { spawn, spawnSync } from "node:child_process";
import {
  existsSync,
  statSync,
  readdirSync,
  mkdirSync,
  appendFileSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, ".data");
const stateFile = path.join(dataDir, "local-instance.json");
const logFile = path.join(dataDir, "local-launch.log");
process.chdir(root);
mkdirSync(dataDir, { recursive: true });
function output(text, error = false) {
  const value = String(text);
  (error ? process.stderr : process.stdout).write(value);
  appendFileSync(logFile, value);
}
function readState() {
  try {
    return JSON.parse(readFileSync(stateFile, "utf8"));
  } catch {
    return null;
  }
}
function available(port) {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.once("error", () => resolve(false));
    probe.listen(port, "127.0.0.1", () => probe.close(() => resolve(true)));
  });
}
async function openBrowser(url) {
  if (process.env.NOTESPHERE_NO_BROWSER) return;
  const command =
    process.platform === "win32"
      ? "cmd.exe"
      : process.platform === "darwin"
        ? "open"
        : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  const opener = spawn(command, args, { windowsHide: true, stdio: "ignore" });
  opener.on("error", () =>
    output(
      "Browser could not open automatically. Open " +
        url +
        " in your browser.\n",
    ),
  );
  opener.on("exit", (code) => {
    if (code)
      output(
        "Browser opener exited with code " +
          code +
          ". Open " +
          url +
          " manually.\n",
      );
  });
  opener.unref();
}
async function existingInstance() {
  const saved = readState();
  if (
    !saved ||
    saved.root !== root ||
    !/^http:\/\/127\.0\.0\.1:30\d\d$/.test(saved.url)
  )
    return null;
  try {
    const response = await fetch(saved.url + "/api/config", {
      signal: AbortSignal.timeout(1500),
    });
    const config = await response.json();
    if (
      response.ok &&
      config.app === "notesphere" &&
      config.localInstance === saved.id
    ) {
      const catalog = await fetch(saved.url + "/api/catalog", {
        signal: AbortSignal.timeout(3000),
      });
      if (catalog.ok) return saved;
    }
  } catch {}
  return null;
}
async function main() {
  output(
    "\n--- NoteSphere local launch " + new Date().toISOString() + " ---\n",
  );
  if (Number(process.versions.node.split(".")[0]) < 24)
    throw new Error("Node.js 24 LTS or newer is required.");
  if (!existsSync(path.join(root, "node_modules/next/dist/bin/next")))
    throw new Error(
      "Dependencies are missing. This offline launcher will not download anything. Install packages once with npm ci, then run this file again.",
    );
  output(
    "Offline mode: local PostgreSQL and private disk storage. Cloud services and telemetry are disabled.\n",
  );
  const running = await existingInstance();
  if (running) {
    output(
      "NoteSphere is already running. Reopening the existing app.\nReady: " +
        running.url +
        "\n",
    );
    await openBrowser(running.url);
    return;
  }
  let port = 3000;
  while (port < 3020 && !(await available(port))) port++;
  if (port === 3020)
    throw new Error(
      "Ports 3000-3019 are unavailable. Close the previous NoteSphere command window and try again.",
    );
  const url = "http://127.0.0.1:" + port,
    id = randomUUID();
  const env = {
    ...process.env,
    NODE_ENV: "development",
    DATABASE_URL: "",
    SUPABASE_URL: "",
    SUPABASE_SERVICE_ROLE_KEY: "",
    SMTP_HOST: "",
    SMTP_USER: "",
    SMTP_PASS: "",
    VERCEL: "",
    NEXT_TELEMETRY_DISABLED: "1",
    NOTESPHERE_LOCAL_INSTANCE: id,
    DATA_DIR: dataDir,
    APP_URL: url,
  };
  env.NOTESPHERE_BUILD_DIR = ".next-local";
  let stopped = false,
    ready = false,
    requestedStop = false;
  const server = spawn(
    process.execPath,
    [
      path.join(root, "node_modules/next/dist/bin/next"),
      "dev",
      "--webpack",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    { cwd: root, env, stdio: ["ignore", "pipe", "pipe"], windowsHide: true },
  );
  server.stdout.on("data", (chunk) => output(chunk));
  server.stderr.on("data", (chunk) => output(chunk, true));
  const stop = () => {
    requestedStop = true;
    server.kill();
  };
  const clearInstance = () => {
    if (readState()?.id === id) {
      try {
        unlinkSync(stateFile);
      } catch {}
    }
  };
  server.once("error", (error) => {
    stopped = true;
    output("Server error: " + error.message + "\n", true);
    process.exitCode = 1;
  });
  server.once("exit", (code) => {
    stopped = true;
    clearInstance();
    if (!requestedStop) process.exitCode = code || (!ready ? 1 : 0);
    if (process.connected) process.disconnect();
  });
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  process.on("message", (message) => {
    if (message?.type === "stop") stop();
  });
  let lastError = "No HTTP response received.";
  for (let attempt = 0; attempt < 45 && !stopped; attempt++) {
    try {
      const response = await fetch(url + "/api/catalog", {
        signal: AbortSignal.timeout(1500),
      });
      if (response.ok) {
        const catalog = await response.json();
        if (Array.isArray(catalog.subjects)) {
          ready = true;
          writeFileSync(
            stateFile,
            JSON.stringify({
              id,
              url,
              root,
              pid: server.pid,
              startedAt: new Date().toISOString(),
            }),
          );
          output(
            "\nReady: " +
              url +
              "\nKeep this command window open while using NoteSphere.\nPress Ctrl+C to stop. Startup log: " +
              logFile +
              "\n",
          );
          await openBrowser(url);
          break;
        }
      }
      lastError = (
        "HTTP " +
        response.status +
        ": " +
        (await response.text())
      ).slice(0, 500);
    } catch (error) {
      lastError = error.cause?.code || error.message;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!ready && !stopped) {
    stop();
    process.exitCode = 1;
    output(
      "\nNoteSphere did not become ready: " +
        lastError +
        "\nSee " +
        logFile +
        ". Close other NoteSphere windows before retrying.\n",
      true,
    );
  }
}
try {
  await main();
} catch (error) {
  output(
    "\nUnable to start NoteSphere: " +
      error.message +
      "\nLog: " +
      logFile +
      "\n",
    true,
  );
  process.exitCode = 1;
  if (process.connected) process.disconnect();
}
