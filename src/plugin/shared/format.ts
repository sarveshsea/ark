import { padStart2 } from "./compat.js";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatDuration(startedAt: number, finishedAt?: number | null): string {
  const end = finishedAt ?? Date.now();
  const seconds = Math.max(0, Math.floor((end - startedAt) / 1000));

  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${padStart2(remainder)}s`;
}

export function rgbaToHex(color: { r: number; g: number; b: number }): string {
  return `#${[color.r, color.g, color.b]
    .map((channel) => padStart2(Math.round(channel * 255).toString(16)))
    .join("")}`;
}
