import { describe, expect, it } from "vitest";
import { PreviewWidgetStateCache } from "../widget-state-cache.js";
import type {
  AgentBoxState,
  WidgetConnectionState,
  WidgetJob,
  WidgetSelectionSnapshot,
} from "../../plugin/shared/contracts.js";

describe("PreviewWidgetStateCache", () => {
  it("tracks jobs, selection, agents, and connection state in a single snapshot", () => {
    const cache = new PreviewWidgetStateCache();

    const connection: WidgetConnectionState = {
      stage: "connected",
      port: 9223,
      name: "Mémoire Control Plane",
      latencyMs: 17,
      fileName: "Design System",
      fileKey: "file-key",
      pageName: "Home",
      pageId: "page-1",
      editorType: "figma",
      connectedAt: 123,
      reconnectDelayMs: null,
    };

    const selection: WidgetSelectionSnapshot = {
      count: 1,
      pageName: "Home",
      pageId: "page-1",
      updatedAt: 124,
      nodes: [{
        id: "10:20",
        name: "Button",
        type: "FRAME",
        visible: true,
        pageName: "Home",
      }],
    };

    const job: WidgetJob = {
      id: "job-1",
      runId: "run-1",
      kind: "sync",
      label: "Sync Design System",
      status: "running",
      startedAt: 10,
      updatedAt: 20,
      progressText: "Running",
    };

    const agent: AgentBoxState = {
      runId: "run-1",
      taskId: "task-1",
      role: "figma-executor",
      title: "Sync Design System",
      status: "busy",
      summary: "Working",
      healRound: 2,
      elapsedMs: 1200,
    };

    cache.updateConnection(connection);
    cache.updateSelection(selection);
    cache.upsertJob(job);
    cache.upsertAgent(agent);
    cache.mergeSync({ tokens: 2, components: 1, styles: 3, partialFailures: ["styles timeout"] });
    cache.updateHeal({ round: 2, healed: false, issueCount: 1, issues: ["raw hex"] });

    expect(cache.getConnection()).toEqual(connection);
    expect(cache.getSelection()).toEqual(selection);
    expect(cache.getJobs()).toEqual([job]);
    expect(cache.getAgents()).toEqual([agent]);

    const snapshot = cache.snapshot({
      running: true,
      port: 9223,
      clients: [{ id: "plugin-1", file: "Design System", editor: "figma", connectedAt: "2026-03-27T00:00:00.000Z" }],
    });

    expect(snapshot).toMatchObject({
      connected: true,
      port: 9223,
      clients: [{ id: "plugin-1" }],
      connection,
      selection,
      jobs: [job],
      agents: [agent],
      sync: {
        tokens: 2,
        components: 1,
        styles: 3,
        partialFailures: ["styles timeout"],
      },
      heal: {
        round: 2,
        healed: false,
        issueCount: 1,
        issues: ["raw hex"],
      },
      counts: {
        jobs: {
          total: 1,
          running: 1,
          completed: 0,
          failed: 0,
          disconnected: 0,
        },
        agents: {
          total: 1,
          idle: 0,
          busy: 1,
          done: 0,
          error: 0,
        },
      },
    });
  });
});
