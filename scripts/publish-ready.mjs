#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const registry = process.env.NPM_CONFIG_REGISTRY || "https://registry.npmjs.org/";
const skipAuth = process.env.MEMOIRE_PUBLISH_READY_SKIP_AUTH === "1";
const skipGit = process.env.MEMOIRE_PUBLISH_READY_SKIP_GIT === "1";
const failures = [];
const notes = [];

const packageJson = await readJson("package.json");
const serverJson = await readJson("server.json");

check(packageJson.name === "@sarveshsea/memoire", `package name is ${packageJson.name}`);
check(packageJson.version === serverJson.version, `server.json version ${serverJson.version} does not match package.json ${packageJson.version}`);
check(packageJson.mcpName === "io.github.sarveshsea/memoire", `package.json mcpName is ${packageJson.mcpName}`);
check(serverJson.name === packageJson.mcpName, `server.json name ${serverJson.name} does not match package.json mcpName ${packageJson.mcpName}`);

const npmPackage = serverJson.packages?.find((entry) => entry.registryType === "npm");
check(!!npmPackage, "server.json is missing npm package entry");
if (npmPackage) {
  check(npmPackage.identifier === packageJson.name, `server.json npm identifier is ${npmPackage.identifier}`);
  check(npmPackage.version === packageJson.version, `server.json npm version ${npmPackage.version} does not match package.json ${packageJson.version}`);
  check(npmPackage.transport?.type === "stdio", "server.json npm transport must be stdio");
  check(npmPackage.packageArguments?.some((arg) => arg.type === "positional" && arg.value === "mcp"), "server.json npm package must pass the mcp argument");
}

if (!skipGit && await hasGitRepository()) {
  const status = run("git", ["status", "--short"]);
  check(status.ok, status.stderr || "git status failed");
  if (status.ok) {
    const dirtyLines = status.stdout.trim().split("\n").filter(Boolean);
    check(dirtyLines.length === 0, `git worktree is dirty:\n${dirtyLines.join("\n")}`);
  }
}

if (!skipAuth) {
  const whoami = run("npm", ["whoami", `--registry=${registry}`]);
  check(whoami.ok, "npm is not logged in. Run `npm login --registry=https://registry.npmjs.org/`.");
  if (whoami.ok) notes.push(`npm user: ${whoami.stdout.trim()}`);
}

const latest = run("npm", ["view", packageJson.name, "version", "mcpName", "--json", `--registry=${registry}`]);
if (latest.ok) {
  const metadata = parseNpmView(latest.stdout);
  if (metadata.version) {
    check(compareVersions(packageJson.version, metadata.version) > 0, `package.json version ${packageJson.version} is not newer than npm latest ${metadata.version}`);
    notes.push(`npm latest: ${metadata.version}`);
  }
  if (metadata.mcpName) {
    notes.push(`npm mcpName: ${metadata.mcpName}`);
  }
} else if (!/E404|404/.test(latest.stderr)) {
  check(false, latest.stderr || "npm view failed");
}

const pack = run("npm", ["pack", "--dry-run", "--ignore-scripts", "--json"]);
check(pack.ok, pack.stderr || "npm pack dry-run failed");
if (pack.ok) {
  const payload = JSON.parse(pack.stdout);
  const summary = Array.isArray(payload) ? payload[0] : payload;
  const files = Array.isArray(summary.files) ? summary.files.map((file) => file.path) : [];
  check(summary.version === packageJson.version, `pack version ${summary.version} does not match package.json ${packageJson.version}`);
  check(files.includes("server.json"), "npm pack is missing server.json");
  check(files.includes("package.json"), "npm pack is missing package.json");
  check(files.includes("dist/index.js"), "npm pack is missing dist/index.js; run `npm run build`");
  notes.push(`pack: ${summary.filename} (${summary.size} bytes, ${files.length} files)`);
}

if (failures.length > 0) {
  console.error("\nMemoire publish readiness failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  console.error("");
  process.exit(1);
}

console.log(`Memoire ${packageJson.version} is ready to publish.`);
for (const note of notes) console.log(`- ${note}`);
console.log("\nNext:");
console.log("  npm publish --access public");
console.log("  mcp-publisher publish");

async function readJson(path) {
  return JSON.parse(await readFile(join(root, path), "utf-8"));
}

async function hasGitRepository() {
  const result = run("git", ["rev-parse", "--is-inside-work-tree"]);
  return result.ok && result.stdout.trim() === "true";
}

function check(condition, message) {
  if (!condition) failures.push(message);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf-8",
    env: {
      ...process.env,
      npm_config_ignore_scripts: "true",
    },
    maxBuffer: 1024 * 1024 * 5,
  });
  return {
    ok: result.status === 0,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function parseNpmView(stdout) {
  const trimmed = stdout.trim();
  if (!trimmed) return {};
  const parsed = JSON.parse(trimmed);
  if (typeof parsed === "string") return { version: parsed };
  return parsed && typeof parsed === "object" ? parsed : {};
}

function compareVersions(a, b) {
  const left = a.split(".").map((part) => Number.parseInt(part, 10));
  const right = b.split(".").map((part) => Number.parseInt(part, 10));
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const delta = (left[index] ?? 0) - (right[index] ?? 0);
    if (delta !== 0) return delta;
  }
  return 0;
}
