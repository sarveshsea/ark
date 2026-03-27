import { describe, expect, it } from "vitest";
import { buildJobsOverview, describeSelectionNode, formatElapsedTime } from "../ui/presenters.js";
import type { WidgetJob, WidgetSelectionNodeSnapshot } from "../shared/contracts.js";

describe("plugin ui presenters", () => {
  it("builds operator-facing job summaries", () => {
    const jobs: WidgetJob[] = [
      {
        id: "1",
        runId: "run-a",
        kind: "sync",
        label: "Sync tokens",
        status: "running",
        startedAt: 10,
        updatedAt: 15,
      },
      {
        id: "2",
        runId: "run-b",
        kind: "system",
        label: "Inspect page tree",
        status: "failed",
        startedAt: 20,
        updatedAt: 25,
        error: "boom",
      },
      {
        id: "3",
        runId: "run-c",
        kind: "capture",
        label: "Capture node",
        status: "completed",
        startedAt: 30,
        updatedAt: 40,
        finishedAt: 40,
      },
    ];

    expect(buildJobsOverview(jobs)).toMatchObject({
      runningCount: 1,
      failedCount: 1,
      completedCount: 1,
      disconnectedCount: 0,
      latestFailure: jobs[1],
      latestCompleted: jobs[2],
    });
  });

  it("describes selection nodes with layout, style, and variable facts", () => {
    const node: WidgetSelectionNodeSnapshot = {
      id: "1:2",
      name: "Metric Card",
      type: "FRAME",
      visible: true,
      pageName: "Dashboard",
      width: 320,
      height: 180,
      fills: [{ type: "SOLID", color: { r: 1, g: 0.5, b: 0, a: 1 } }],
      fillStyleId: "fill/primary",
      textStyleId: "text/body",
      component: {
        key: "metric-card",
        description: "Metric card component",
        isVariant: true,
        variantProperties: { state: "success" },
        componentProperties: { tone: { type: "VARIANT" } },
      },
      layout: {
        layoutMode: "VERTICAL",
        itemSpacing: 16,
        paddingLeft: 24,
        paddingRight: 24,
        paddingTop: 20,
        paddingBottom: 20,
      },
      boundVariables: {
        fill: { id: "color/surface" },
        radius: { id: "radius/md" },
      },
    };

    expect(describeSelectionNode(node)).toEqual({
      chips: ["FRAME", "variant", "vertical"],
      fillHex: "#ff8000",
      variantPairs: ["state: success"],
      styleIds: ["fill/primary", "text/body"],
      variableBindings: ["fill", "radius"],
      layoutFacts: ["gap 16", "pt 20", "pr 24", "pb 20", "pl 24"],
      propertyFacts: ["tone: VARIANT"],
      stateFacts: ["visible"],
    });
  });

  it("formats elapsed time for active and completed jobs", () => {
    expect(formatElapsedTime({
      id: "1",
      runId: "run-a",
      kind: "sync",
      label: "Sync",
      status: "running",
      startedAt: 0,
      updatedAt: 0,
    }, 1_500)).toBe("1s");

    expect(formatElapsedTime({
      id: "2",
      runId: "run-b",
      kind: "system",
      label: "Inspect",
      status: "completed",
      startedAt: 0,
      updatedAt: 0,
      finishedAt: 65_000,
    })).toBe("1m 5s");
  });
});
