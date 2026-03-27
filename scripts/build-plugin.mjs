import { build } from "vite";
import { access, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export async function buildPluginBundle(options = {}) {
  const rootDir = options.rootDir ? resolve(options.rootDir) : defaultRoot;
  const outDir = options.outDir ? resolve(options.outDir) : resolve(rootDir, "plugin");
  const uiSourceDir = resolve(rootDir, "src", "plugin", "ui");
  const uiEntry = resolve(uiSourceDir, "index.html");
  const mainEntry = resolve(rootDir, "src", "plugin", "main", "index.ts");
  const tempRoot = await mkdtemp(join(tmpdir(), "memoire-plugin-"));
  const uiOutDir = join(tempRoot, "ui");

  await build({
    configFile: false,
    root: rootDir,
    publicDir: false,
    build: {
      target: "es2020",
      minify: false,
      emptyOutDir: false,
      outDir,
      lib: {
        entry: mainEntry,
        formats: ["iife"],
        name: "MemoirePluginMain",
        fileName: () => "code.js",
      },
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
        },
      },
    },
  });

  const bareMainOutput = join(outDir, "code");
  try {
    await access(bareMainOutput);
    await rm(join(outDir, "code.js"), { force: true });
    await rename(bareMainOutput, join(outDir, "code.js"));
  } catch {
    // Vite emitted code.js directly.
  }

  await build({
    configFile: false,
    root: uiSourceDir,
    publicDir: false,
    build: {
      target: "es2020",
      minify: false,
      emptyOutDir: true,
      outDir: uiOutDir,
      rollupOptions: {
        input: uiEntry,
        output: {
          entryFileNames: "assets/[name].js",
          chunkFileNames: "assets/[name].js",
          assetFileNames: "assets/[name][extname]",
        },
      },
    },
  });

  const html = await readFile(join(uiOutDir, "index.html"), "utf-8");
  const inlined = await inlineAssets(html, uiOutDir);
  await writeFile(join(outDir, "ui.html"), inlined, "utf-8");
  await rm(tempRoot, { recursive: true, force: true });

  return {
    outDir,
    codePath: join(outDir, "code.js"),
    htmlPath: join(outDir, "ui.html"),
  };
}

export const buildPlugin = buildPluginBundle;

async function inlineAssets(html, outDir) {
  let result = html;

  const scriptMatches = [...html.matchAll(/<script[^>]+src="([^"]+)"[^>]*><\/script>/g)];
  for (const match of scriptMatches) {
    const assetPath = join(outDir, match[1]);
    const source = await readFile(assetPath, "utf-8");
    result = result.replace(match[0], `<script>${source}</script>`);
  }

  const styleMatches = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/g)];
  for (const match of styleMatches) {
    const assetPath = join(outDir, match[1]);
    const source = await readFile(assetPath, "utf-8");
    result = result.replace(match[0], `<style>\n${source}\n</style>`);
  }

  return result;
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (invokedPath === import.meta.url) {
  await buildPluginBundle();
}
