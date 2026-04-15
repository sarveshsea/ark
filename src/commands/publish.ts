/**
 * `memi publish` — Take the current design system and write a publishable
 * registry package to disk. The user then runs `npm publish` themselves.
 *
 * Examples:
 *   memi publish --name @acme/design-system
 *   memi publish --name @acme/ds --version 1.0.0 --dir ./dist-registry
 *   memi publish --figma <url> --name @acme/ds   (pulls first)
 */

import type { Command } from "commander";
import type { MemoireEngine } from "../engine/core.js";
import { resolve as resolvePath } from "path";
import ora from "ora";
import { ui } from "../tui/format.js";
import { publishRegistry } from "../registry/publisher.js";
import type { ComponentSpec } from "../specs/types.js";
import { formatElapsed } from "../utils/format.js";

export interface PublishPayload {
  status: "published" | "failed";
  name: string;
  version: string;
  outDir: string;
  tokens: number;
  components: number;
  filesWritten: string[];
  elapsedMs: number;
  error?: string;
}

export function registerPublishCommand(program: Command, engine: MemoireEngine) {
  program
    .command("publish")
    .description("Build a distributable design system registry package (ready for `npm publish`)")
    .requiredOption("--name <name>", "npm package name (e.g. @acme/design-system)")
    .option("--version <version>", "Package version", "0.1.0")
    .option("--dir <dir>", "Output directory (default: ./<name-slug>)")
    .option("--description <text>", "Package description")
    .option("--homepage <url>", "Homepage URL (often your Figma file URL)")
    .option("--license <spdx>", "License identifier", "MIT")
    .option("--figma <url>", "Figma file URL (triggers REST pull before publish)")
    .option("--json", "Output results as JSON")
    .action(async (opts: {
      name: string;
      version: string;
      dir?: string;
      description?: string;
      homepage?: string;
      license?: string;
      figma?: string;
      json?: boolean;
    }) => {
      const start = Date.now();
      await engine.init();

      // Optional pre-pull from Figma REST
      if (opts.figma) {
        const m = opts.figma.match(/figma\.com\/design\/([a-zA-Z0-9]+)/);
        if (m && m[1]) process.env.FIGMA_FILE_KEY = m[1];
        if (!opts.json) console.log(ui.dots("Pulling", "Figma REST → registry"));
        try {
          await engine.pullDesignSystemREST();
        } catch (err) {
          handleFail(opts, start, `Figma pull failed: ${(err as Error).message}`);
          return;
        }
      }

      const ds = engine.registry.designSystem;
      if (ds.tokens.length === 0 && (await engine.registry.getAllSpecs()).length === 0) {
        handleFail(opts, start, "No tokens or specs to publish. Run `memi pull` first.");
        return;
      }

      const baseName = opts.name.replace(/^@[^/]+\//, "");
      const outDir = opts.dir ? resolvePath(opts.dir) : resolvePath(engine.config.projectRoot, baseName);
      const pkgVersion = (await import("../../package.json", { with: { type: "json" } })).default.version;

      const spinner = opts.json ? null : ora({ text: "Building registry...", indent: 2, color: "cyan" }).start();

      try {
        const componentSpecs = (await engine.registry.getAllSpecs())
          .filter((s): s is ComponentSpec => s.type === "component");

        const result = await publishRegistry({
          name: opts.name,
          version: opts.version,
          description: opts.description,
          homepage: opts.homepage ?? opts.figma,
          license: opts.license,
          outDir,
          designSystem: ds,
          specs: componentSpecs,
          memoireVersion: pkgVersion,
          sourceFigmaUrl: opts.figma,
        });
        spinner?.stop();

        const payload: PublishPayload = {
          status: "published",
          name: opts.name,
          version: opts.version,
          outDir: result.outDir,
          tokens: ds.tokens.length,
          components: componentSpecs.length,
          filesWritten: result.filesWritten,
          elapsedMs: Date.now() - start,
        };

        if (opts.json) {
          console.log(JSON.stringify(payload, null, 2));
          return;
        }

        console.log();
        console.log(ui.brand("REGISTRY PUBLISHED"));
        console.log(ui.ok(`${opts.name}@${opts.version}`));
        console.log(ui.dots("Output", result.outDir));
        console.log(ui.dots("Files", `${result.filesWritten.length}`));
        console.log(ui.dots("Tokens", `${ds.tokens.length}`));
        console.log(ui.dots("Components", `${componentSpecs.length}`));
        console.log(ui.dim(`  (${formatElapsed(Date.now() - start)})`));
        console.log();
        console.log(ui.dim("  Next steps:"));
        console.log(`    cd ${result.outDir}`);
        console.log("    npm publish --access public");
        console.log();
        console.log(ui.dim("  Then from any project:"));
        console.log(`    memi add <Component> --from ${opts.name}`);
        console.log();
      } catch (err) {
        spinner?.stop();
        handleFail(opts, start, err instanceof Error ? err.message : String(err));
      }
    });
}

function handleFail(opts: { json?: boolean; name?: string; version?: string }, start: number, msg: string): void {
  const payload = {
    status: "failed" as const,
    name: opts.name ?? "",
    version: opts.version ?? "",
    outDir: "",
    tokens: 0,
    components: 0,
    filesWritten: [],
    elapsedMs: Date.now() - start,
    error: msg,
  };
  if (opts.json) console.log(JSON.stringify(payload, null, 2));
  else console.log(`\n  ${ui.fail(msg)}\n`);
  process.exitCode = 1;
}
