/**
 * `memi go` — Single command that runs the entire pipeline:
 * init → connect → pull → auto-spec → generate → preview
 *
 * Zero friction. One command. Everything happens.
 */

import type { Command } from "commander";
import type { MemoireEngine } from "../engine/core.js";

export interface GoPayload {
  status: "completed" | "partial" | "failed";
  steps: {
    init: boolean;
    figma: { connected: boolean; skipped: boolean; error?: string };
    pull: { completed: boolean; tokens: number; components: number };
    generate: { completed: boolean; skipped: boolean; generated: number; failed: number };
    preview: { started: boolean; skipped: boolean; port?: number };
  };
  elapsedMs: number;
  error?: string;
}

export function registerGoCommand(program: Command, engine: MemoireEngine) {
  program
    .command("go")
    .description("Run the full pipeline: connect → pull → generate → preview")
    .option("--no-preview", "Skip starting the preview server")
    .option("--no-generate", "Skip code generation (pull and auto-spec only)")
    .option("--no-figma", "Skip Figma connection (offline mode — generate from existing specs)")
    .option("-p, --port <port>", "Preview server port", "3333")
    .option("--json", "Output pipeline results as JSON")
    .action(async (opts) => {
      const start = Date.now();
      const json = opts.json as boolean | undefined;
      const steps: GoPayload["steps"] = {
        init: false,
        figma: { connected: false, skipped: false },
        pull: { completed: false, tokens: 0, components: 0 },
        generate: { completed: false, skipped: false, generated: 0, failed: 0 },
        preview: { started: false, skipped: false },
      };

      if (!json) console.log("\n  Mémoire — starting full pipeline\n");

      // 1. Initialize
      await engine.init();
      steps.init = true;
      if (!json) console.log("");

      // 2. Connect to Figma (skip if --no-figma)
      if (opts.figma === false) {
        steps.figma.skipped = true;
        if (!json) console.log("  · Skipping Figma connection (offline mode)\n");
      } else if (!engine.figma.isConnected) {
        try {
          const port = await engine.connectFigma();
          if (!json) {
            console.log(`\n  Waiting for Figma plugin to connect on port ${port}...`);
            console.log("  Open the Mémoire plugin in Figma Desktop.\n");
          }
          await waitForConnection(engine, 120000);
          steps.figma.connected = true;
        } catch (err) {
          steps.figma.error = err instanceof Error ? err.message : String(err);
        }
      } else {
        steps.figma.connected = true;
      }

      // 3. Pull design system (only if Figma connected)
      if (opts.figma !== false && engine.figma.isConnected) {
        if (!json) console.log("");
        await engine.pullDesignSystem();
        const ds = engine.registry.designSystem;
        steps.pull = { completed: true, tokens: ds.tokens.length, components: ds.components.length };
      }

      // 4. Generate code from all specs
      if (opts.generate !== false) {
        if (!json) console.log("");
        const specs = await engine.registry.getAllSpecs();
        let generated = 0;
        let failed = 0;

        for (const spec of specs) {
          if (spec.type === "design" || spec.type === "ia") continue;
          try {
            await engine.generateFromSpec(spec.name);
            generated++;
          } catch (err) {
            failed++;
            if (!json) console.log(`  ! Could not generate ${spec.name}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }

        steps.generate = { completed: true, skipped: false, generated, failed };

        if (!json && generated > 0) {
          console.log(`\n  + Generated code for ${generated} specs\n`);
        }
      } else {
        steps.generate.skipped = true;
      }

      // 5. Start preview
      if (opts.preview !== false && !json) {
        const { PreviewServer } = await import("../preview/server.js");
        const previewPort = parseInt(opts.port, 10) || 3333;
        const preview = new PreviewServer(engine.config.projectRoot, previewPort);
        await preview.buildGallery(engine.registry);
        preview.start();
        steps.preview = { started: true, skipped: false, port: previewPort };
        console.log(`\n  Preview running at http://localhost:${previewPort}`);

        const cleanup = () => {
          console.log("\n  Shutting down...");
          preview.stop();
          if (opts.figma !== false) {
            engine.figma.disconnect();
          }
          process.exit(0);
        };
        process.once("SIGINT", cleanup);
        process.once("SIGTERM", cleanup);
      } else {
        steps.preview.skipped = true;
      }

      const hasError = steps.figma.error || steps.generate.failed > 0;
      const payload: GoPayload = {
        status: hasError ? "partial" : "completed",
        steps,
        elapsedMs: Date.now() - start,
      };

      if (json) {
        console.log(JSON.stringify(payload, null, 2));
        return;
      }

      console.log("  Pipeline complete. Memoire is live.\n");
    });
}

function waitForConnection(engine: MemoireEngine, timeout: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (engine.figma.isConnected) {
      resolve();
      return;
    }

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Timed out waiting for Figma plugin (2 minutes). Make sure the Mémoire plugin is running."));
    }, timeout);

    const onConnect = () => {
      cleanup();
      resolve();
    };

    const cleanup = () => {
      clearTimeout(timer);
      engine.figma.removeListener("plugin-connected", onConnect);
    };

    engine.figma.once("plugin-connected", onConnect);
  });
}
