#!/usr/bin/env node

import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

if (!await exists(join(root, ".git"))) {
  process.exit(0);
}

if (process.env.npm_config_dry_run === "true") {
  process.exit(0);
}

const exitCode = await new Promise((resolve, reject) => {
  const child = spawn("npm", ["run", "build"], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  child.on("error", reject);
  child.on("exit", (code) => resolve(code ?? 1));
});

process.exit(exitCode);

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
