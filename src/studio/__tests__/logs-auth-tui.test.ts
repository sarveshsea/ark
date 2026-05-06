import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { defaultStudioConfig } from "../config.js";
import { listHarnesses } from "../harnesses.js";
import { StudioRuntimeServer } from "../server.js";
import { StudioSessionStore } from "../session-store.js";
import { renderStudioTuiSnapshot } from "../tui.js";
import type { StudioEvent, StudioSession } from "../types.js";

const servers: StudioRuntimeServer[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.stop()));
});

describe("studio logs, auth, and TUI visibility", () => {
  it("reads persisted JSONL events and serves them through /api/logs", async () => {
    const root = await mkdtemp(join(tmpdir(), "memoire-studio-logs-"));
    try {
      const store = new StudioSessionStore(root);
      store.init();
      const session = makeSession(root);
      store.appendEvent(session, makeEvent(session.id, "session_started", "Started codex"));
      store.appendEvent(session, makeEvent(session.id, "harness_log", "codex login status: signed in"));
      store.appendEvent(session, makeEvent(session.id, "session_result", "Ready"));

      expect(store.readSessionEvents(session.id).map((event) => event.type)).toEqual([
        "session_started",
        "harness_log",
        "session_result",
      ]);

      const server = new StudioRuntimeServer({ projectRoot: root, port: 0 });
      servers.push(server);
      const runtime = await server.start();

      const logs = await fetch(`${runtime.url}/api/logs`).then((res) => res.json());
      const detail = await fetch(`${runtime.url}/api/logs/${session.id}`).then((res) => res.json());

      expect(logs.sessions[0]).toMatchObject({ id: session.id, harness: "codex" });
      expect(detail.session).toMatchObject({ id: session.id });
      expect(detail.events.map((event: StudioEvent) => event.type)).toContain("harness_log");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("surfaces Codex and Claude auth status without executing a harness run", () => {
    const config = defaultStudioConfig("/tmp/memoire");
    const harnesses = listHarnesses(config, {
      resolveCommand: (command) => {
        if (command === "codex") return "/usr/local/bin/codex";
        if (command === "claude") return "/usr/local/bin/claude";
        if (command === "memi") return "/usr/local/bin/memi";
        return null;
      },
      probeAuth: (harness) => {
        if (harness.id === "codex") return { authStatus: "signed_in", authMessage: "Logged in using ChatGPT" };
        if (harness.id === "claude-code") return { authStatus: "needs_login", authMessage: "Run claude auth login" };
        return { authStatus: "ready", authMessage: "No auth required" };
      },
    });

    expect(harnesses.find((harness) => harness.id === "codex")).toMatchObject({
      installed: true,
      authStatus: "signed_in",
      authMessage: "Logged in using ChatGPT",
    });
    expect(harnesses.find((harness) => harness.id === "claude-code")).toMatchObject({
      installed: true,
      authStatus: "needs_login",
    });
  });

  it("renders a compact terminal TUI snapshot for live logs and harnesses", async () => {
    const root = await mkdtemp(join(tmpdir(), "memoire-studio-tui-"));
    try {
      const store = new StudioSessionStore(root);
      store.init();
      const session = makeSession(root);
      store.appendEvent(session, makeEvent(session.id, "session_started", "Started claude-code"));
      store.appendEvent(session, makeEvent(session.id, "tool_call", "Read specs/Button.json"));
      store.appendEvent(session, makeEvent(session.id, "session_result", "Button spec updated"));

      const snapshot = renderStudioTuiSnapshot({
        workspaceLabel: "Memoire workspace",
        sessions: store.listSessions(),
        events: store.readSessionEvents(session.id),
        harnesses: [
          { id: "claude-code", label: "Claude Code", installed: true, authStatus: "signed_in" },
          { id: "codex", label: "Codex", installed: true, authStatus: "signed_in" },
        ],
        figma: { connectionState: "disconnected", clients: [], port: null },
      });

      expect(snapshot).toContain("Mémoire Studio TUI");
      expect(snapshot).toContain("Claude Code");
      expect(snapshot).toContain("Button spec updated");
      expect(snapshot).toContain("Figma disconnected");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

function makeSession(root: string): StudioSession {
  return {
    id: "studio-test-session",
    harness: "codex",
    action: "raw",
    cwd: root,
    prompt: "show logs",
    status: "completed",
    startedAt: "2026-05-05T00:00:00.000Z",
    completedAt: "2026-05-05T00:00:01.000Z",
    exitCode: 0,
    activeStreamId: null,
    pendingPrompt: null,
    events: [],
  };
}

function makeEvent(sessionId: string, type: StudioEvent["type"], message: string): StudioEvent {
  return {
    id: `${type}-1`,
    sessionId,
    type,
    timestamp: "2026-05-05T00:00:00.000Z",
    message,
  };
}
