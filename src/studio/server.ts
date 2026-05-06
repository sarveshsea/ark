import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir, stat, readFile, writeFile } from "node:fs/promises";
import { basename, join, relative, resolve, sep } from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildHarnessCommand, harnessProbeCacheAgeMs, listHarnesses } from "./harnesses.js";
import { loadStudioConfig, saveStudioConfig } from "./config.js";
import { redactSecrets } from "./redact.js";
import { StudioSessionStore } from "./session-store.js";
import {
  createStudioOutputNormalizer,
  flushStudioOutputNormalizer,
  normalizeStudioOutputChunk,
} from "./output-normalizer.js";
import { indexProjectMemory, refreshProjectMemory } from "./project-memory.js";
import { StudioFigmaController } from "./figma-controller.js";
import { installMarketplaceNote, listMarketplaceNotes, removeMarketplaceNote } from "./marketplace.js";
import type {
  StudioConfig,
  StudioEvent,
  StudioEventType,
  StudioFigmaActionRequest,
  StudioFigmaOpenRequest,
  StudioRuntimeInfo,
  StudioSession,
  StudioHarnessId,
  StudioRunAction,
  StudioAgentContext,
} from "./types.js";

interface StudioRuntimeServerOptions {
  projectRoot: string;
  port?: number;
  host?: string;
  figma?: StudioFigmaController;
}

interface SessionClient {
  sessionId: string;
  res: ServerResponse;
}

export class StudioRuntimeServer {
  private readonly projectRoot: string;
  private readonly requestedPort: number;
  private readonly host: string;
  private server: ReturnType<typeof createServer> | null = null;
  private config: StudioConfig | null = null;
  private sessions = new Map<string, StudioSession>();
  private processes = new Map<string, ChildProcessWithoutNullStreams>();
  private clients = new Set<SessionClient>();
  private readonly sessionStore: StudioSessionStore;
  private readonly figma: StudioFigmaController;
  private readonly startedAt = Date.now();
  private readonly activeStreams = new Set<string>();
  private eventBufferSize = 0;
  private readonly maxInMemoryEvents = 400;

  constructor(options: StudioRuntimeServerOptions) {
    this.projectRoot = resolve(options.projectRoot);
    this.requestedPort = options.port ?? 8765;
    this.host = options.host ?? "127.0.0.1";
    this.sessionStore = new StudioSessionStore(this.projectRoot);
    this.figma = options.figma ?? new StudioFigmaController({
      projectRoot: this.projectRoot,
      onEvent: (event) => {
        this.eventBufferSize = Math.min(200_000, this.eventBufferSize + event.message.length);
      },
    });
  }

  async start(): Promise<StudioRuntimeInfo> {
    if (this.server) return this.runtimeInfo();
    this.config = await loadStudioConfig(this.projectRoot);
    this.sessionStore.init();
    this.server = createServer((req, res) => {
      void this.handle(req, res).catch((error: unknown) => {
        this.sendJSON(res, 500, { error: error instanceof Error ? error.message : String(error) });
      });
    });

    await new Promise<void>((resolveStart, rejectStart) => {
      if (!this.server) return rejectStart(new Error("Studio server not initialized"));
      this.server.once("error", rejectStart);
      this.server.listen(this.requestedPort, this.host, () => {
        this.server?.off("error", rejectStart);
        resolveStart();
      });
    });

    return this.runtimeInfo();
  }

  async stop(): Promise<void> {
    for (const child of this.processes.values()) child.kill("SIGTERM");
    this.processes.clear();
    for (const client of this.clients) client.res.end();
    this.clients.clear();
    if (!this.server) return;
    await new Promise<void>((resolveStop) => this.server?.close(() => resolveStop()));
    this.server = null;
  }

  getSession(id: string): StudioSession | null {
    return this.sessions.get(id) ?? null;
  }

  async startSession(input: { harness: StudioHarnessId; cwd: string; prompt: string; action?: StudioRunAction }): Promise<StudioSession> {
    const config = await this.getConfig();
    const cwd = resolve(input.cwd || this.projectRoot);
    if (!isInWorkspace(cwd, config.workspaceRoots)) {
      throw Object.assign(new Error(`Workspace path is not allowed: ${cwd}`), { statusCode: 403 });
    }
    if (!input.prompt.trim()) throw Object.assign(new Error("Prompt is required"), { statusCode: 400 });
    const action = input.action ?? (input.harness === "memoire" ? "compose" : "raw");
    const agentContext = await this.buildAgentContext({
      harness: input.harness,
      action,
      cwd,
      prompt: input.prompt,
      config,
    });
    const commandSpec = buildHarnessCommand(config, {
      harnessId: input.harness,
      cwd,
      prompt: input.prompt,
      action,
      agentContext,
    });

    const session: StudioSession = {
      id: `studio-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`,
      harness: input.harness,
      action,
      cwd,
      prompt: input.prompt,
      status: "running",
      startedAt: new Date().toISOString(),
      completedAt: null,
      exitCode: null,
      activeStreamId: randomUUID(),
      pendingPrompt: input.prompt,
      events: [],
    };
    this.sessions.set(session.id, session);
    this.activeStreams.add(session.id);
    const outputNormalizer = createStudioOutputNormalizer(commandSpec.outputParser);
    this.addEvent(session.id, "session_started", `Started ${input.harness}`, { cwd, prompt: input.prompt });

    const child = spawn(commandSpec.command, commandSpec.args, {
      cwd: commandSpec.cwd,
      env: commandSpec.env,
      shell: false,
    });
    this.processes.set(session.id, child);
    child.stdin.on("error", () => {
      // Some CLIs close stdin eagerly. Studio is non-interactive here, so this is safe to ignore.
    });
    child.stdin.end();
    let finalized = false;

    child.stdout.on("data", (chunk: Buffer) => {
      for (const event of normalizeStudioOutputChunk(outputNormalizer, "stdout", redactSecrets(chunk.toString("utf-8")))) {
        this.addEvent(session.id, event.type, event.message, event.data);
      }
    });
    child.stderr.on("data", (chunk: Buffer) => {
      for (const event of normalizeStudioOutputChunk(outputNormalizer, "stderr", redactSecrets(chunk.toString("utf-8")))) {
        this.addEvent(session.id, event.type, event.message, event.data);
      }
    });
    child.on("error", (error) => {
      if (finalized) return;
      finalized = true;
      for (const event of flushStudioOutputNormalizer(outputNormalizer)) {
        this.addEvent(session.id, event.type, event.message, event.data);
      }
      session.status = "failed";
      session.completedAt = new Date().toISOString();
      session.activeStreamId = null;
      session.pendingPrompt = null;
      this.addEvent(session.id, "session_error", redactSecrets(error.message));
      this.processes.delete(session.id);
      this.activeStreams.delete(session.id);
      this.sessionStore.upsertSession(session);
    });
    child.on("close", (code) => {
      if (finalized) return;
      finalized = true;
      for (const event of flushStudioOutputNormalizer(outputNormalizer)) {
        this.addEvent(session.id, event.type, event.message, event.data);
      }
      session.exitCode = code;
      session.completedAt = new Date().toISOString();
      session.activeStreamId = null;
      session.pendingPrompt = null;
      if (session.status === "cancelled") {
        this.addEvent(session.id, "session_done", "Session cancelled", { exitCode: code });
      } else if (code === 0) {
        session.status = "completed";
        this.addEvent(session.id, "session_done", "Session completed", { exitCode: code });
      } else {
        session.status = "failed";
        this.addEvent(session.id, "session_error", `Session exited with code ${code}`, { exitCode: code });
      }
      this.processes.delete(session.id);
      this.activeStreams.delete(session.id);
      this.sessionStore.upsertSession(session);
    });

    return session;
  }

  cancelSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    session.status = "cancelled";
    session.completedAt = new Date().toISOString();
    session.activeStreamId = null;
    session.pendingPrompt = null;
    const child = this.processes.get(sessionId);
    if (child) child.kill("SIGTERM");
    this.addEvent(sessionId, "session_done", "Cancellation requested");
    this.activeStreams.delete(sessionId);
    this.sessionStore.upsertSession(session);
    return true;
  }

  private async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url ?? "/", `http://${this.host}`);
    this.setBaseHeaders(res);

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/status") {
      const config = await this.getConfig();
      this.sendJSON(res, 200, {
        status: "running",
        projectRoot: this.projectRoot,
        runtime: this.runtimeInfo(),
        config,
        sessions: Array.from(this.sessions.values()).map(summarySession),
        indexedSessions: this.sessionStore.listSessions(),
        metrics: this.metrics(config),
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/harnesses") {
      this.sendJSON(res, 200, { harnesses: listHarnesses(await this.getConfig()) });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/logs") {
      this.sendJSON(res, 200, { sessions: this.sessionStore.listSessions() });
      return;
    }

    const logMatch = url.pathname.match(/^\/api\/logs\/([^/]+)$/);
    if (req.method === "GET" && logMatch) {
      const sessionId = decodeURIComponent(logMatch[1]);
      const session = this.sessionStore.getSession(sessionId);
      if (!session) {
        this.sendJSON(res, 404, { error: `Unknown log session: ${sessionId}` });
        return;
      }
      const limit = parseLimit(url.searchParams.get("limit"));
      this.sendJSON(res, 200, { session, events: this.sessionStore.readSessionEvents(sessionId, { limit }) });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/marketplace/notes") {
      this.sendJSON(res, 200, await listMarketplaceNotes(this.projectRoot));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/marketplace/notes/install") {
      try {
        this.sendJSON(res, 200, await installMarketplaceNote(
          this.projectRoot,
          await readJSON<{ noteId?: string; source?: string }>(req),
        ));
      } catch (error) {
        const statusCode = typeof (error as { statusCode?: unknown }).statusCode === "number"
          ? (error as { statusCode: number }).statusCode
          : 500;
        this.sendJSON(res, statusCode, { error: error instanceof Error ? error.message : String(error) });
      }
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/marketplace/notes/remove") {
      try {
        this.sendJSON(res, 200, await removeMarketplaceNote(
          this.projectRoot,
          await readJSON<{ name?: string }>(req),
        ));
      } catch (error) {
        const statusCode = typeof (error as { statusCode?: unknown }).statusCode === "number"
          ? (error as { statusCode: number }).statusCode
          : 500;
        this.sendJSON(res, statusCode, { error: error instanceof Error ? error.message : String(error) });
      }
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/project-memory") {
      this.sendJSON(res, 200, await indexProjectMemory(this.projectRoot));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/project-memory/refresh") {
      this.sendJSON(res, 200, await refreshProjectMemory(this.projectRoot));
      return;
    }

    const memoryItemMatch = url.pathname.match(/^\/api\/project-memory\/(.+)$/);
    if (req.method === "GET" && memoryItemMatch) {
      const index = await indexProjectMemory(this.projectRoot);
      const id = decodeURIComponent(memoryItemMatch[1]);
      const item = index.items.find((candidate) => candidate.id === id);
      if (!item) {
        this.sendJSON(res, 404, { error: `Unknown project memory item: ${id}` });
        return;
      }
      this.sendJSON(res, 200, { item });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/figma/status") {
      this.sendJSON(res, 200, await this.figma.status());
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/figma/connect") {
      const body = await readJSON<{ preferredPort?: number | null }>(req);
      this.sendJSON(res, 200, await this.figma.connect({ preferredPort: body.preferredPort ?? null }));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/figma/disconnect") {
      this.sendJSON(res, 200, await this.figma.disconnect());
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/figma/open") {
      const body = await readJSON<StudioFigmaOpenRequest>(req);
      this.sendJSON(res, 200, await this.figma.openFigma(body));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/figma/action") {
      const body = await readJSON<StudioFigmaActionRequest>(req);
      try {
        this.sendJSON(res, 200, await this.figma.runAction(body));
      } catch (error) {
        const statusCode = typeof (error as { statusCode?: unknown }).statusCode === "number"
          ? (error as { statusCode: number }).statusCode
          : 500;
        this.sendJSON(res, statusCode, { error: error instanceof Error ? error.message : String(error) });
      }
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/config") {
      this.sendJSON(res, 200, { config: await this.getConfig() });
      return;
    }

    if (req.method === "PUT" && url.pathname === "/api/config") {
      const body = await readJSON<StudioConfig>(req);
      await saveStudioConfig(this.projectRoot, body);
      this.config = await loadStudioConfig(this.projectRoot);
      this.sendJSON(res, 200, { config: this.config });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/sessions") {
      this.sendJSON(res, 200, { sessions: Array.from(this.sessions.values()).map(summarySession) });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/sessions") {
      const body = await readJSON<{ harness?: StudioHarnessId; cwd?: string; prompt?: string; action?: StudioRunAction }>(req);
      try {
        const session = await this.startSession({
          harness: body.harness ?? (await this.getConfig()).defaultHarness,
          cwd: body.cwd ?? this.projectRoot,
          prompt: body.prompt ?? "",
          action: body.action,
        });
        this.sendJSON(res, 201, { session: summarySession(session) });
      } catch (error) {
        const statusCode = typeof (error as { statusCode?: unknown }).statusCode === "number"
          ? (error as { statusCode: number }).statusCode
          : 500;
        this.sendJSON(res, statusCode, { error: error instanceof Error ? error.message : String(error) });
      }
      return;
    }

    const sessionEventsMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)\/events$/);
    if (req.method === "GET" && sessionEventsMatch) {
      this.handleSessionEvents(sessionEventsMatch[1], res);
      return;
    }

    const sessionCancelMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)\/cancel$/);
    if (req.method === "POST" && sessionCancelMatch) {
      this.sendJSON(res, 200, { cancelled: this.cancelSession(sessionCancelMatch[1]) });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/workspace") {
      await this.handleWorkspace(url, res);
      return;
    }

    if (req.method === "GET" && !url.pathname.startsWith("/api/")) {
      await this.serveStudioAsset(url.pathname, res);
      return;
    }

    this.sendJSON(res, 404, { error: "Not found" });
  }

  private async handleWorkspace(url: URL, res: ServerResponse): Promise<void> {
    const config = await this.getConfig();
    const requested = resolve(url.searchParams.get("path") ?? this.projectRoot);
    if (!isInWorkspace(requested, config.workspaceRoots)) {
      this.sendJSON(res, 403, { error: `Workspace path is not allowed: ${requested}` });
      return;
    }
    const itemStat = await stat(requested);
    if (!itemStat.isDirectory()) {
      this.sendJSON(res, 200, {
        path: requested,
        type: "file",
        name: basename(requested),
        content: await readFile(requested, "utf-8"),
      });
      return;
    }
    const entries = await readdir(requested, { withFileTypes: true });
    this.sendJSON(res, 200, {
      path: requested,
      type: "directory",
      entries: entries
        .filter((entry) => !entry.name.startsWith(".git") && entry.name !== "node_modules")
        .slice(0, 200)
        .map((entry) => ({
          name: entry.name,
          path: join(requested, entry.name),
          type: entry.isDirectory() ? "directory" : "file",
        })),
    });
  }

  private async serveStudioAsset(pathname: string, res: ServerResponse): Promise<void> {
    const appRoot = resolveStudioAssetRoot(this.projectRoot);
    const path = pathname === "/" ? "/index.html" : pathname;
    const filePath = resolve(appRoot, `.${path}`);
    if (!isSubpath(filePath, appRoot)) {
      this.sendJSON(res, 403, { error: "Asset path is not allowed" });
      return;
    }
    try {
      const body = await readFile(filePath);
      res.writeHead(200, { "content-type": contentTypeFor(filePath) });
      res.end(body);
    } catch {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(defaultStudioHTML(this.runtimeInfo().url));
    }
  }

  private handleSessionEvents(sessionId: string, res: ServerResponse): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      this.sendJSON(res, 404, { error: `Unknown session: ${sessionId}` });
      return;
    }

    res.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    });
    for (const event of session.events) writeSSE(res, event);
    const client = { sessionId, res };
    this.clients.add(client);
    res.on("close", () => this.clients.delete(client));
  }

  private addEvent(sessionId: string, type: StudioEventType, message: string, data?: unknown): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    const event: StudioEvent = {
      id: randomUUID(),
      sessionId,
      type,
      timestamp: new Date().toISOString(),
      message,
      data,
    };
    session.events.push(event);
    if (session.events.length > this.maxInMemoryEvents) session.events.splice(0, session.events.length - this.maxInMemoryEvents);
    this.eventBufferSize = Math.min(200_000, this.eventBufferSize + event.message.length);
    this.sessionStore.appendEvent(session, event);
    for (const client of this.clients) {
      if (client.sessionId === sessionId) writeSSE(client.res, event);
    }
  }

  private async getConfig(): Promise<StudioConfig> {
    if (!this.config) this.config = await loadStudioConfig(this.projectRoot);
    return this.config;
  }

  private async buildAgentContext(input: {
    harness: StudioHarnessId;
    action: StudioRunAction;
    cwd: string;
    prompt: string;
    config: StudioConfig;
  }): Promise<StudioAgentContext> {
    const [memory, figmaStatus] = await Promise.all([
      indexProjectMemory(this.projectRoot).catch(() => null),
      this.figma.status().catch(() => null),
    ]);
    return {
      workspaceLabel: "Memoire workspace",
      projectRoot: this.projectRoot,
      harness: input.harness,
      action: input.action,
      prompt: input.prompt,
      memory: {
        counts: memory?.counts ?? { home: 0, research: 0, spec: 0, system: 0, monitor: 0, changelog: 0 },
        recent: (memory?.items ?? []).slice(0, 8).map((item) => ({
          kind: item.kind,
          title: item.title,
          summary: item.summary,
        })),
      },
      figma: {
        enabled: input.config.enabledTools.figma,
        status: figmaStatus?.connectionState ?? "disconnected",
        clients: figmaStatus?.clients.length ?? 0,
        port: figmaStatus?.port ?? input.config.figma?.preferredPort ?? null,
      },
    };
  }

  private runtimeInfo(): StudioRuntimeInfo {
    if (!this.server) throw new Error("Studio runtime is not running");
    const address = this.server.address();
    const port = typeof address === "object" && address ? address.port : this.requestedPort;
    return { host: this.host, port, url: `http://${this.host}:${port}` };
  }

  private metrics(config: StudioConfig) {
    return {
      uptimeMs: Math.max(0, Date.now() - this.startedAt),
      indexedSessions: this.sessionStore.indexedSessionCount,
      activeProcesses: this.processes.size,
      activeStreams: this.activeStreams.size,
      eventBufferSize: this.eventBufferSize,
      harnessProbeCacheAgeMs: harnessProbeCacheAgeMs(),
      enabledHarnesses: config.harnesses.filter((harness) => harness.enabled).length,
    };
  }

  private setBaseHeaders(res: ServerResponse): void {
    res.setHeader("access-control-allow-origin", "*");
    res.setHeader("access-control-allow-methods", "GET,POST,PUT,OPTIONS");
    res.setHeader("access-control-allow-headers", "content-type");
    res.setHeader("x-content-type-options", "nosniff");
  }

  private sendJSON(res: ServerResponse, statusCode: number, payload: unknown): void {
    res.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(payload, null, 2));
  }
}

async function readJSON<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf-8");
  if (!raw.trim()) return {} as T;
  return JSON.parse(raw) as T;
}

function writeSSE(res: ServerResponse, event: StudioEvent): void {
  res.write(`event: ${event.type}\n`);
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

function parseLimit(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function isInWorkspace(path: string, roots: string[]): boolean {
  return roots.some((root) => isSubpath(path, root));
}

function isSubpath(path: string, root: string): boolean {
  const normalizedPath = resolve(path);
  const normalizedRoot = resolve(root);
  const rel = relative(normalizedRoot, normalizedPath);
  return rel === "" || (!rel.startsWith("..") && !rel.includes(`..${sep}`) && rel !== "..");
}

function summarySession(session: StudioSession): Omit<StudioSession, "events"> & { eventCount: number } {
  const { events: _events, ...rest } = session;
  return { ...rest, eventCount: session.events.length };
}

function contentTypeFor(filePath: string): string {
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  return "text/html; charset=utf-8";
}

function resolveStudioAssetRoot(projectRoot: string): string {
  const roots = candidateStudioAssetRoots(projectRoot);
  return roots.find((root) => existsSync(join(root, "index.html"))) ?? roots[0];
}

function candidateStudioAssetRoots(projectRoot: string): string[] {
  return [
    resolve(projectRoot, "apps", "studio", "dist"),
    fileURLToPath(new URL("../studio-web/", import.meta.url)),
    fileURLToPath(new URL("../../apps/studio/dist/", import.meta.url)),
  ];
}

function defaultStudioHTML(runtimeUrl: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Mémoire Studio</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #000; color: #fff; font: 14px ui-monospace, SFMono-Regular, Menlo, monospace; }
    main { max-width: 560px; border: 1px solid rgba(255,255,255,.12); border-radius: 6px; padding: 16px; background: #0b0b0b; }
    h1 { margin: 0 0 12px; font: 400 28px Inter, ui-sans-serif, system-ui; }
    code { color: #007eed; }
  </style>
</head>
<body><main><h1>Mémoire Studio runtime</h1><p>The desktop shell is not built yet. Runtime API is available at <code>${runtimeUrl}/api/status</code>.</p></main></body>
</html>`;
}

export function studioRuntimeUrl(info: StudioRuntimeInfo): URL {
  return new URL(info.url);
}

export function studioRuntimeFileUrl(path: string): string {
  return pathToFileURL(path).toString();
}
