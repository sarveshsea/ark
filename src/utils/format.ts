/**
 * Shared formatting utilities for CLI output.
 */

/**
 * Format an elapsed duration in milliseconds to a human-readable string.
 *
 * Examples:
 *   formatElapsed(0)      → "0ms"
 *   formatElapsed(450)    → "450ms"
 *   formatElapsed(1200)   → "1.2s"
 *   formatElapsed(65000)  → "65.0s"
 *
 * @param ms  Duration in milliseconds.
 * @returns   Human-readable elapsed string.
 */
export function formatElapsed(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
