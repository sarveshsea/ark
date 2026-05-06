import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Command } from "commander";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { registerStudioCommand } from "../studio.js";
import { registerVideoCommand } from "../video.js";
import { StudioSessionStore } from "../../studio/session-store.js";
import type { StudioEvent, StudioSession } from "../../studio/types.js";
import { captureLogs, lastLog } from "./test-helpers.js";

let projectRoot: string;

beforeEach(async () => {
  projectRoot = await mkdtemp(join(tmpdir(), "memoire-studio-command-"));
});

afterEach(async () => {
  vi.restoreAllMocks();
  await rm(projectRoot, { recursive: true, force: true });
});

describe("studio logs and video commands", () => {
  it("prints persisted Studio logs as JSON", async () => {
    const store = new StudioSessionStore(projectRoot);
    store.init();
    const session = makeSession(projectRoot);
    store.appendEvent(session, makeEvent(session.id, "harness_log", "Claude Code signed in"));
    const logs = captureLogs();
    const program = new Command();

    registerStudioCommand(program, makeEngine(projectRoot) as never);
    await program.parseAsync(["studio", "logs", "--session", session.id, "--json"], { from: "user" });

    const payload = JSON.parse(lastLog(logs));
    expect(payload.session).toMatchObject({ id: session.id });
    expect(payload.events[0]).toMatchObject({ type: "harness_log" });
  });

  it("registers a first-class terminal TUI command", () => {
    const program = new Command();

    registerStudioCommand(program, makeEngine(projectRoot) as never);
    const studio = program.commands.find((candidate) => candidate.name() === "studio");

    expect(studio?.commands.map((command) => command.name())).toContain("tui");
    expect(studio?.commands.find((command) => command.name() === "tui")?.options.map((option) => option.long)).toContain("--runtime");
  });

  it("creates video projects through memi video create", async () => {
    const logs = captureLogs();
    const program = new Command();

    registerVideoCommand(program, makeEngine(projectRoot) as never);
    await program.parseAsync([
      "video",
      "create",
      "Launch story",
      "--prompt",
      "Motion system for product launch",
      "--adapter",
      "remotion",
      "--json",
    ], { from: "user" });

    const payload = JSON.parse(lastLog(logs));
    expect(payload.id).toBe("launch-story");
    expect(payload.adapter).toBe("remotion");
    expect(payload.projectDir).toContain(join(".memoire", "videos", "launch-story"));
  });
});

function makeEngine(root: string) {
  return {
    config: { projectRoot: root },
    async init() {},
  };
}

function makeSession(root: string): StudioSession {
  return {
    id: "studio-command-session",
    harness: "claude-code",
    action: "raw",
    cwd: root,
    prompt: "logs",
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
