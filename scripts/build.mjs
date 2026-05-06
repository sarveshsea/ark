import { spawn } from "node:child_process";
import { access, readdir, rm, copyFile, mkdir, cp } from "node:fs/promises";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildPluginBundle } from "./build-plugin.mjs";
import { syncChangelogPreview } from "./build-changelog-preview.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(root, "dist");
const tscBin = resolve(root, "node_modules", "typescript", "bin", "tsc");
const buildInfo = resolve(root, "tsconfig.build.tsbuildinfo");
const studioAppDir = resolve(root, "apps", "studio");
const studioDistSrc = resolve(root, "apps", "studio", "dist");
const studioDistPackage = resolve(distDir, "studio-web");

const distExists = await pathExists(distDir);
if (!distExists) {
  await rm(buildInfo, { force: true });
} else {
  await removeMapFiles(distDir);
}

const exitCode = await new Promise((resolveExit, reject) => {
  const child = spawn(
    process.execPath,
    [tscBin, "-p", resolve(root, "tsconfig.build.json"), "--pretty", "false"],
    {
      cwd: root,
      stdio: "inherit",
    },
  );

  child.on("error", reject);
  child.on("exit", (code) => resolveExit(code ?? 1));
});

if (exitCode !== 0) process.exit(exitCode);

const studioExitCode = await runCommand("npm --prefix apps/studio run build", [
  "npm",
  ["--prefix", studioAppDir, "run", "build"],
]);
if (studioExitCode !== 0) process.exit(studioExitCode);

// Copy non-TS assets that tsc doesn't handle (CSS, client JS, HTML, shared manifests)
const templateSrc = resolve(root, "src", "preview", "templates");
const templateDist = resolve(distDir, "preview", "templates");
await mkdir(templateDist, { recursive: true });

const assetExtensions = [".css", ".js", ".html"];
const templateFiles = await readdir(templateSrc);
await Promise.all(
  templateFiles
    .filter((f) => assetExtensions.some((ext) => f.endsWith(ext)))
    .map((f) => copyFile(join(templateSrc, f), join(templateDist, f))),
);

await mkdir(resolve(distDir, "studio"), { recursive: true });
await copyFile(
  resolve(root, "src", "studio", "harness-manifest.json"),
  resolve(distDir, "studio", "harness-manifest.json"),
);

await rm(studioDistPackage, { recursive: true, force: true });
await cp(studioDistSrc, studioDistPackage, { recursive: true });

await buildPluginBundle({ rootDir: root, outDir: resolve(root, "plugin") });
await syncChangelogPreview({
  changelogPath: resolve(root, "CHANGELOG.md"),
  outputPath: resolve(root, "preview", "changelog.html"),
});

process.exit(0);

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function runCommand(label, [command, args]) {
  console.log(`\n> ${label}`);
  return new Promise((resolveExit, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: "inherit",
      shell: false,
    });

    child.on("error", reject);
    child.on("exit", (code) => resolveExit(code ?? 1));
  });
}

async function removeMapFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });

  await Promise.all(entries.map(async (entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await removeMapFiles(fullPath);
      return;
    }

    if (entry.name.endsWith(".map")) {
      await rm(fullPath, { force: true });
    }
  }));
}
