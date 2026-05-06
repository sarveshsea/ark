import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Command } from "commander";
import type { MemoireEngine } from "../engine/core.js";
import { loadStudioConfig } from "../studio/config.js";
import { listHarnesses } from "../studio/harnesses.js";
import { StudioRuntimeServer } from "../studio/server.js";
import { StudioSessionStore } from "../studio/session-store.js";
import { renderStudioTuiSnapshot } from "../studio/tui.js";
import type { StudioEvent, StudioHarnessId, StudioRunAction, StudioSession } from "../studio/types.js";
import { ui } from "../tui/format.js";

export function registerStudioCommand(program: Command, engine: MemoireEngine): void {
  const studio = program
    .command("studio")
    .description("Run Mémoire Studio: desktop/web agent design shell runtime");

  studio
    .command("status")
    .description("Show Studio config, harnesses, and runtime readiness")
    .option("--json", "Output as JSON")
    .action(async (opts: { json?: boolean }) => {
      await engine.init("minimal");
      const config = await loadStudioConfig(engine.config.projectRoot);
      const harnesses = listHarnesses(config);
      const payload = {
        status: "ready",
        projectRoot: engine.config.projectRoot,
        config,
        harnesses,
      };

      if (opts.json) {
        console.log(JSON.stringify(payload, null, 2));
        return;
      }

      console.log();
      console.log(ui.section("MÉMOIRE STUDIO"));
      console.log(ui.dots("Project", engine.config.projectRoot));
      console.log(ui.dots("Default harness", config.defaultHarness));
      console.log(ui.dots("Harnesses", `${harnesses.filter((harness) => harness.installed).length}/${harnesses.length} installed`));
      console.log();
    });

  studio
    .command("serve")
    .description("Start the localhost-only Studio JSON/SSE runtime")
    .option("-p, --port <port>", "Studio runtime port", "8765")
    .option("--json", "Output runtime metadata as JSON")
    .option("--once", "Start and stop immediately after printing metadata (test/helper mode)")
    .action(async (opts: { port?: string; json?: boolean; once?: boolean }) => {
      await engine.init("minimal");
      const server = new StudioRuntimeServer({
        projectRoot: engine.config.projectRoot,
        port: parsePort(opts.port ?? "8765"),
      });
      const runtime = await server.start();
      const payload = { status: "running", runtime, projectRoot: engine.config.projectRoot };

      if (opts.json) {
        console.log(JSON.stringify(payload, null, 2));
      } else {
        console.log();
        console.log(ui.ok(`Mémoire Studio runtime listening at ${runtime.url}`));
        console.log(ui.dots("Status", `${runtime.url}/api/status`));
        console.log(ui.dots("Harnesses", `${runtime.url}/api/harnesses`));
        console.log();
      }

      if (opts.once) {
        await server.stop();
        return;
      }

      process.once("SIGINT", () => {
        void server.stop().finally(() => process.exit(0));
      });
      process.once("SIGTERM", () => {
        void server.stop().finally(() => process.exit(0));
      });
    });

  studio
    .command("run")
    .description("Run a Studio harness once and stream normalized events")
    .requiredOption("--prompt <text>", "Prompt for the harness")
    .option("--harness <id>", "Harness id")
    .option("--action <action>", "Studio action: compose, design-doc, audit, references, video, raw", "compose")
    .option("--cwd <path>", "Working directory")
    .option("--json", "Output final session as JSON")
    .action(async (opts: { prompt: string; harness?: StudioHarnessId; action?: StudioRunAction; cwd?: string; json?: boolean }) => {
      await engine.init("minimal");
      const config = await loadStudioConfig(engine.config.projectRoot);
      const server = new StudioRuntimeServer({ projectRoot: engine.config.projectRoot, port: 0 });
      await server.start();

      try {
        const session = await server.startSession({
          harness: opts.harness ?? config.defaultHarness,
          cwd: opts.cwd ?? engine.config.projectRoot,
          prompt: opts.prompt,
          action: opts.action ?? "compose",
        });
        const finalSession = await waitForSession(server, session.id);
        if (opts.json) {
          console.log(JSON.stringify(finalSession, null, 2));
          return;
        }
        for (const event of finalSession.events) {
          if (event.type === "stdout" || event.type === "stderr") process.stdout.write(event.message);
        }
        console.log();
        console.log(finalSession.status === "completed" ? ui.ok("Studio run completed") : ui.fail(`Studio run ${finalSession.status}`));
      } finally {
        await server.stop();
      }
    });

  studio
    .command("logs")
    .description("Read persisted Studio session logs from .memoire/studio/sessions")
    .option("--session <id>", "Session id to read")
    .option("--limit <count>", "Limit events for a session")
    .option("--follow", "Keep polling for new events")
    .option("--json", "Output logs as JSON")
    .action(async (opts: { session?: string; limit?: string; follow?: boolean; json?: boolean }) => {
      await engine.init("minimal");
      const store = new StudioSessionStore(engine.config.projectRoot);
      store.init();
      const limit = parseOptionalInt(opts.limit);

      if (!opts.session) {
        const payload = { sessions: store.listSessions() };
        if (opts.json) console.log(JSON.stringify(payload, null, 2));
        else printSessionList(payload.sessions);
        return;
      }

      const session = store.getSession(opts.session);
      const payload = {
        session,
        events: store.readSessionEvents(opts.session, { limit }),
      };
      if (opts.json) {
        console.log(JSON.stringify(payload, null, 2));
      } else {
        if (!session) console.log(ui.warn(`No indexed session for ${opts.session}`));
        printEvents(payload.events);
      }
      if (opts.follow) await followSessionLogs(store, opts.session, payload.events.length);
    });

  studio
    .command("tui")
    .description("Open the Mémoire Studio terminal dashboard")
    .option("--runtime <url>", "Attach to a running Studio runtime URL")
    .option("--session <id>", "Session id to focus")
    .option("--once", "Render one snapshot and exit")
    .action(async (opts: { runtime?: string; session?: string; once?: boolean }) => {
      await engine.init("minimal");
      if (opts.runtime) {
        const snapshot = await remoteTuiSnapshot(opts.runtime, opts.session);
        console.log(snapshot);
        return;
      }

      const render = async () => {
        const store = new StudioSessionStore(engine.config.projectRoot);
        store.init();
        const config = await loadStudioConfig(engine.config.projectRoot);
        const harnesses = listHarnesses(config);
        const sessions = store.listSessions();
        const selectedSession = opts.session ?? sessions[0]?.id;
        return renderStudioTuiSnapshot({
          workspaceLabel: "Memoire workspace",
          sessions,
          events: selectedSession ? store.readSessionEvents(selectedSession, { limit: 80 }) : [],
          harnesses,
          figma: { connectionState: "disconnected", clients: [], port: config.figma?.preferredPort ?? null },
        });
      };

      console.log(await render());
      if (opts.once || !process.stdin.isTTY) return;
      const timer = setInterval(() => {
        process.stdout.write("\x1b[2J\x1b[H");
        void render().then((snapshot) => process.stdout.write(`${snapshot}\n`));
      }, 2000);
      process.stdin.setRawMode?.(true);
      process.stdin.resume();
      process.stdin.on("data", (chunk: Buffer) => {
        if (chunk.toString("utf-8") === "q" || chunk[0] === 3) {
          clearInterval(timer);
          process.stdin.setRawMode?.(false);
          process.exit(0);
        }
      });
    });

  studio
    .command("web")
    .description("Start the Studio web trial UI backed by the local runtime")
    .option("-p, --port <port>", "Studio web UI port", "1420")
    .option("--runtime-port <port>", "Studio runtime API port", "8765")
    .action(async (opts: { port?: string; runtimePort?: string }) => {
      await engine.init("minimal");
      const appDir = join(engine.config.projectRoot, "apps", "studio");

      if (!existsSync(join(appDir, "package.json"))) {
        await servePackagedStudioWeb(engine.config.projectRoot, opts);
        return;
      }

      const runtime = new StudioRuntimeServer({
        projectRoot: engine.config.projectRoot,
        port: parsePort(opts.runtimePort ?? "8765"),
      });
      const runtimeInfo = await runtime.start();

      console.log(ui.ok(`Studio runtime listening at ${runtimeInfo.url}`));
      console.log(ui.active("Starting Studio web trial..."));
      const child = spawn("npm", ["--prefix", appDir, "run", "dev", "--", "--host", "127.0.0.1", "--port", String(parsePort(opts.port ?? "1420"))], {
        stdio: "inherit",
        env: { ...process.env, VITE_MEMOIRE_STUDIO_RUNTIME: runtimeInfo.url },
        shell: false,
      });

      const shutdown = () => {
        child.kill("SIGTERM");
        void runtime.stop().finally(() => process.exit(0));
      };
      process.once("SIGINT", shutdown);
      process.once("SIGTERM", shutdown);
      child.on("exit", () => {
        void runtime.stop().finally(() => process.exit(0));
      });
    });
}

async function servePackagedStudioWeb(projectRoot: string, opts: { port?: string; runtimePort?: string }): Promise<void> {
  const server = new StudioRuntimeServer({
    projectRoot,
    port: parsePort(opts.port ?? opts.runtimePort ?? "1420"),
  });
  const runtime = await server.start();

  console.log(ui.ok(`Studio web trial available at ${runtime.url}`));
  console.log(ui.dots("Mode", "packaged static app"));
  console.log(ui.dots("Runtime", `${runtime.url}/api/status`));

  process.once("SIGINT", () => {
    void server.stop().finally(() => process.exit(0));
  });
  process.once("SIGTERM", () => {
    void server.stop().finally(() => process.exit(0));
  });
}

function parsePort(value: string): number {
  const port = Number.parseInt(value, 10);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`Invalid port: ${value}`);
  }
  return port;
}

async function waitForSession(server: StudioRuntimeServer, sessionId: string): Promise<StudioSession> {
  for (;;) {
    const session = server.getSession(sessionId);
    if (!session) throw new Error(`Unknown Studio session: ${sessionId}`);
    if (session.status !== "running") return session;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

function parseOptionalInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function printSessionList(sessions: ReturnType<StudioSessionStore["listSessions"]>): void {
  console.log(ui.section("STUDIO LOGS"));
  if (sessions.length === 0) {
    console.log(ui.skip("No Studio sessions indexed"));
    return;
  }
  for (const session of sessions.slice(0, 20)) {
    console.log(ui.dots(`${session.harness} / ${session.action}`, `${session.id} (${session.status})`));
  }
}

function printEvents(events: StudioEvent[]): void {
  for (const event of events) {
    const symbol = event.type === "session_error" || event.type === "stderr" ? "x" : event.type === "session_done" ? "+" : "·";
    console.log(ui.event(symbol, event.type, event.message.replace(/\s+/g, " ").trim()));
  }
}

async function followSessionLogs(store: StudioSessionStore, sessionId: string, offset: number): Promise<void> {
  let seen = offset;
  await new Promise<void>((resolveFollow) => {
    const timer = setInterval(() => {
      const events = store.readSessionEvents(sessionId);
      const next = events.slice(seen);
      seen = events.length;
      printEvents(next);
    }, 1000);
    process.once("SIGINT", () => {
      clearInterval(timer);
      resolveFollow();
    });
    process.once("SIGTERM", () => {
      clearInterval(timer);
      resolveFollow();
    });
  });
}

async function remoteTuiSnapshot(runtimeUrl: string, sessionId?: string): Promise<string> {
  const base = runtimeUrl.replace(/\/$/, "");
  const [status, harnesses, logs] = await Promise.all([
    fetch(`${base}/api/status`).then((res) => res.json()),
    fetch(`${base}/api/harnesses`).then((res) => res.json()),
    fetch(`${base}/api/logs`).then((res) => res.json()),
  ]);
  const selectedSession = sessionId ?? logs.sessions?.[0]?.id;
  const detail = selectedSession
    ? await fetch(`${base}/api/logs/${encodeURIComponent(selectedSession)}?limit=80`).then((res) => res.ok ? res.json() : { events: [] })
    : { events: [] };
  return renderStudioTuiSnapshot({
    workspaceLabel: "Memoire workspace",
    sessions: logs.sessions ?? [],
    events: detail.events ?? [],
    harnesses: harnesses.harnesses ?? [],
    figma: {
      connectionState: status.config?.figma ? "disconnected" : "disconnected",
      clients: [],
      port: status.config?.figma?.preferredPort ?? null,
    },
  });
}
