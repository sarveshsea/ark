import type { WidgetJob, WidgetSelectionNodeSnapshot } from "../shared/contracts.js";
import { findFirst, padStart2 } from "../shared/compat.js";

export interface JobsOverview {
  active: WidgetJob[];
  completedCount: number;
  failedCount: number;
  disconnectedCount: number;
  runningCount: number;
  latestFailure: WidgetJob | null;
  latestCompleted: WidgetJob | null;
}

export interface SelectionNodeFacts {
  chips: string[];
  fillHex: string | null;
  variantPairs: string[];
  styleIds: string[];
  variableBindings: string[];
  layoutFacts: string[];
  propertyFacts: string[];
  stateFacts: string[];
}

export function buildJobsOverview(jobs: WidgetJob[]): JobsOverview {
  const active = jobs.filter((job) => job.status === "running" || job.status === "queued");
  const latestFailure = findFirst(jobs, (job) => job.status === "failed");
  const latestCompleted = findFirst(jobs, (job) => job.status === "completed");

  return {
    active,
    completedCount: jobs.filter((job) => job.status === "completed").length,
    failedCount: jobs.filter((job) => job.status === "failed").length,
    disconnectedCount: jobs.filter((job) => job.status === "disconnected").length,
    runningCount: jobs.filter((job) => job.status === "running").length,
    latestFailure,
    latestCompleted,
  };
}

export function describeSelectionNode(node: WidgetSelectionNodeSnapshot): SelectionNodeFacts {
  const chips = [
    node.type,
    node.component?.isVariant ? "variant" : "",
    node.layout?.layoutMode && node.layout.layoutMode !== "NONE" ? node.layout.layoutMode.toLowerCase() : "",
  ].filter(Boolean);

  const variantPairs = node.component?.variantProperties
    ? Object.entries(node.component.variantProperties).map(([key, value]) => `${key}: ${value}`)
    : [];

  const styleIds = [node.fillStyleId, node.strokeStyleId, node.textStyleId].filter(Boolean) as string[];
  const variableBindings = Object.keys(node.boundVariables || {});
  const layoutFacts = [
    node.layout?.itemSpacing !== null && node.layout?.itemSpacing !== undefined ? `gap ${Math.round(node.layout.itemSpacing)}` : "",
    node.layout?.paddingTop !== null && node.layout?.paddingTop !== undefined ? `pt ${Math.round(node.layout.paddingTop)}` : "",
    node.layout?.paddingRight !== null && node.layout?.paddingRight !== undefined ? `pr ${Math.round(node.layout.paddingRight)}` : "",
    node.layout?.paddingBottom !== null && node.layout?.paddingBottom !== undefined ? `pb ${Math.round(node.layout.paddingBottom)}` : "",
    node.layout?.paddingLeft !== null && node.layout?.paddingLeft !== undefined ? `pl ${Math.round(node.layout.paddingLeft)}` : "",
  ].filter(Boolean);
  const propertyFacts = Object.keys(node.component?.componentProperties || {}).map((key) => {
    const property = node.component?.componentProperties?.[key];
    return `${key}: ${property?.type || "unknown"}`;
  });
  const stateFacts = [
    node.visible ? "visible" : "hidden",
    node.opacity !== undefined ? `opacity ${Math.round(node.opacity * 100)}%` : "",
    node.rotation !== undefined && node.rotation !== 0 ? `rotation ${Math.round(node.rotation)}°` : "",
    node.cornerRadius !== undefined ? `radius ${Math.round(node.cornerRadius)}` : "",
    node.childCount !== undefined ? `${node.childCount} children` : "",
  ].filter(Boolean);

  return {
    chips,
    fillHex: node.fills?.[0]?.color ? rgbToHex(node.fills[0].color) : null,
    variantPairs,
    styleIds,
    variableBindings,
    layoutFacts,
    propertyFacts,
    stateFacts,
  };
}

export function formatElapsedTime(job: WidgetJob, now = Date.now()): string {
  const end = job.finishedAt ?? now;
  const durationMs = Math.max(0, end - job.startedAt);
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }
  const seconds = Math.floor(durationMs / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${remainder}s`;
}

function rgbToHex(color: { r: number; g: number; b: number; a?: number }): string {
  const values = [color.r, color.g, color.b].map((value) => padStart2(Math.round(value * 255).toString(16)));
  return `#${values.join("")}`;
}
