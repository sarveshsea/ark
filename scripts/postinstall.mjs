#!/usr/bin/env node

/**
 * Mémoire postinstall — copies the Figma plugin to a user-accessible
 * location and prints PATH guidance if the `memi` binary isn't reachable.
 */

import { existsSync, mkdirSync, cpSync } from "fs";
import { join, dirname, resolve } from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, "..");

// ── 1. Copy Figma plugin to ~/.memoire/plugin ───────────────────

const pluginSrc = join(packageRoot, "plugin");
const home = process.env.HOME || process.env.USERPROFILE || "";
const pluginDest = join(home, ".memoire", "plugin");

if (existsSync(pluginSrc) && home) {
  try {
    mkdirSync(pluginDest, { recursive: true });
    cpSync(pluginSrc, pluginDest, { recursive: true });
    console.log(`  + Figma plugin copied to ${pluginDest}`);
    console.log(`    Use this path when importing the plugin manifest in Figma.`);
  } catch {
    // Non-fatal — user can still import from the package directory
  }
}

// ── 2. Check if memi is reachable via PATH ──────────────────────

try {
  execSync("which memi", { stdio: "ignore" });
} catch {
  // memi not in PATH — detect npm global bin and suggest fix
  try {
    const npmBin = execSync("npm config get prefix", { encoding: "utf-8" }).trim();
    const binDir = join(npmBin, "bin");
    const shell = process.env.SHELL || "/bin/zsh";
    const rcFile = shell.includes("zsh") ? "~/.zshrc" : "~/.bashrc";

    console.log(`
  ! The "memi" command is not in your PATH.
    Add this to ${rcFile}:

      export PATH="${binDir}:$PATH"

    Then restart your terminal or run: source ${rcFile}
`);
  } catch {
    // Can't determine — skip silently
  }
}
