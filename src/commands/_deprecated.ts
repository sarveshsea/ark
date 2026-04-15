/**
 * Deprecation helper — emits a warning for commands slated for removal
 * in v0.12.0. Respects --json mode (silent to stderr only) and
 * MEMOIRE_SILENCE_DEPRECATIONS env var.
 */

export function warnDeprecated(commandName: string, replacement?: string): void {
  if (process.env.MEMOIRE_SILENCE_DEPRECATIONS === "1") return;
  const isJson = process.argv.includes("--json");
  const msg = replacement
    ? `[deprecated] \`memi ${commandName}\` will be removed in v0.12.0. Use \`memi ${replacement}\` instead.`
    : `[deprecated] \`memi ${commandName}\` will be removed in v0.12.0.`;
  // Always go to stderr so --json stdout stays clean
  console.error(`\n  ${msg}\n  Silence with MEMOIRE_SILENCE_DEPRECATIONS=1\n`);
}
