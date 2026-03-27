import { afterEach, describe, expect, it, vi } from "vitest";
import { Command } from "commander";
import { join } from "path";
import { registerResearchCommand } from "../research.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("research --json", () => {
  it("emits structured output for from-file --json", async () => {
    const logs = captureLogs();
    const program = new Command();
    const engine = makeResearchEngine();

    registerResearchCommand(program, engine as never);
    await program.parseAsync(["research", "from-file", "inputs/research.xlsx", "--json"], { from: "user" });

    const payload = JSON.parse(lastLog(logs));
    expect(payload).toMatchObject({
      action: "from-file",
      status: "completed",
      options: { json: true },
      source: {
        type: "file",
        path: "inputs/research.xlsx",
      },
      summary: {
        insights: 2,
        themes: 0,
        personas: 0,
        sources: 1,
      },
      artifacts: {
        researchDir: join("/tmp/memoire-project", "research"),
        insightsPath: join("/tmp/memoire-project", "research", "insights.json"),
        notesDir: join("/tmp/memoire-project", "research", "notes"),
        reportPath: join("/tmp/memoire-project", "research", "reports", "report.md"),
      },
    });
  });

  it("emits structured output for from-stickies --json", async () => {
    const logs = captureLogs();
    const program = new Command();
    const engine = makeResearchEngine({ figmaConnected: false });

    registerResearchCommand(program, engine as never);
    await program.parseAsync(["research", "from-stickies", "--json"], { from: "user" });

    const payload = JSON.parse(lastLog(logs));
    expect(payload).toMatchObject({
      action: "from-stickies",
      status: "completed",
      options: { json: true },
      summary: {
        insights: 3,
        themes: 0,
        personas: 0,
        sources: 1,
      },
      stickies: {
        total: 3,
        clusters: 1,
        unclustered: 1,
        summary: "3 stickies parsed into 1 clusters (1 unclustered). Colors used: 1",
        autoConnected: true,
      },
    });
    expect(engine.connectFigma).toHaveBeenCalledTimes(1);
  });

  it("emits structured output for synthesize --json", async () => {
    const logs = captureLogs();
    const program = new Command();
    const engine = makeResearchEngine();

    registerResearchCommand(program, engine as never);
    await program.parseAsync(["research", "synthesize", "--json"], { from: "user" });

    const payload = JSON.parse(lastLog(logs));
    expect(payload).toMatchObject({
      action: "synthesize",
      status: "completed",
      options: { json: true },
      summary: {
        insights: 1,
        themes: 1,
        personas: 0,
        sources: 1,
      },
      synthesis: {
        summary: "Synthesized 1 insights into 1 themes.",
        themes: 1,
        topTheme: "workflow",
      },
    });
  });

  it("emits structured output for report --json", async () => {
    const logs = captureLogs();
    const program = new Command();
    const engine = makeResearchEngine();

    registerResearchCommand(program, engine as never);
    await program.parseAsync(["research", "report", "--json"], { from: "user" });

    const payload = JSON.parse(lastLog(logs));
    expect(payload).toMatchObject({
      action: "report",
      status: "completed",
      options: { json: true },
      summary: {
        insights: 1,
        themes: 0,
        personas: 0,
        sources: 1,
      },
      report: {
        path: join("/tmp/memoire-project", "research", "reports", "report.md"),
      },
    });
    expect(payload.report.bytes).toBeGreaterThan(0);
    expect(payload.report.lines).toBeGreaterThan(0);
  });
});

function makeResearchEngine(opts: { figmaConnected?: boolean } = {}) {
  const store = {
    insights: [{ id: "insight-1" }],
    personas: [],
    themes: [],
    sources: [{ name: "baseline", type: "seed", processedAt: "2026-03-27T12:00:00.000Z" }],
  };

  const engine = {
    config: { projectRoot: "/tmp/memoire-project" },
    figma: {
      isConnected: opts.figmaConnected ?? true,
      async extractStickies() {
        return [
          { id: "a", text: "Need faster onboarding", position: { x: 0, y: 0 }, color: "yellow" },
          { id: "b", text: "Sharing flows are confusing", position: { x: 10, y: 20 }, color: "yellow" },
          { id: "c", text: "Export settings are hard to find", position: { x: 500, y: 500 } },
        ];
      },
    },
    connectFigma: vi.fn(async () => {
      engine.figma.isConnected = true;
      return 9223;
    }),
    async init() {},
    research: {
      async load() {},
      async fromFile(filePath: string) {
        store.insights = [{ id: "insight-1" }, { id: "insight-2" }];
        store.themes = [];
        store.sources = [{ name: filePath, type: "excel", processedAt: "2026-03-27T12:00:00.000Z" }];
      },
      async fromStickies() {
        store.insights = [{ id: "insight-1" }, { id: "insight-2" }, { id: "insight-3" }];
        store.themes = [];
        store.sources = [{ name: "figjam-stickies", type: "figjam", processedAt: "2026-03-27T12:00:00.000Z" }];
        return {
          clusters: [{ id: "cluster-1" }],
          unclustered: [{ id: "c" }],
          totalStickies: 3,
          summary: "3 stickies parsed into 1 clusters (1 unclustered). Colors used: 1",
        };
      },
      async synthesize() {
        store.themes = [{
          name: "workflow",
          description: "Workflow friction",
          insights: ["insight-1"],
          frequency: 1,
        }];
        return {
          themes: store.themes,
          summary: "Synthesized 1 insights into 1 themes.",
        };
      },
      async generateReport() {
        return "# Research Report\n\nGenerated for testing.\n";
      },
      getStore() {
        return store;
      },
    },
  };

  return engine;
}

function captureLogs(): string[] {
  const logs: string[] = [];
  vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
    logs.push(args.join(" "));
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
  return logs;
}

function lastLog(logs: string[]): string {
  const value = logs.at(-1);
  if (!value) throw new Error("Expected a console.log call");
  return value;
}
