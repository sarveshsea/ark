/**
 * Shared types and helpers for preview HTML generation.
 */

import type { AnySpec } from "../../specs/types.js";
import type { DesignToken } from "../../engine/registry.js";
import type { ResearchStore } from "../../research/engine.js";

export interface PreviewData {
  projectName: string;
  specs: AnySpec[];
  tokens: DesignToken[];
  research: ResearchStore | null;
  generatedAt: string;
}

/** Escape HTML entities */
export function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Sanitize CSS color — only allow known-safe patterns */
export function escColor(val: string): string {
  const safe = val.trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(safe)) return safe;
  if (/^(rgb|hsl)a?\([^)]+\)$/.test(safe)) return safe;
  if (/^[a-zA-Z]{1,20}$/.test(safe)) return safe;
  return "#000";
}
