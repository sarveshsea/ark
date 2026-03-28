import type { Command } from "commander";
import type { MemoireEngine } from "../engine/core.js";

export interface SyncPayload {
  status: "completed" | "partial" | "failed";
  figma: {
    connected: boolean;
    cached: boolean;
    error?: string;
  };
  designSystem: {
    tokens: number;
    components: number;
    styles: number;
  };
  specs: {
    regenerated: number;
    total: number;
  };
  elapsedMs: number;
  error?: string;
}

export function registerSyncCommand(program: Command, engine: MemoireEngine) {
  program
    .command("sync")
    .description("Full sync: Figma → design system → regenerate all specs → preview")
    .option("--json", "Output sync results as JSON")
    .action(async (opts: { json?: boolean }) => {
      const start = Date.now();
      await engine.init();

      if (!opts.json) console.log("\n  Starting full sync...\n");

      // Step 1: Connect to Figma if not connected
      let figmaError: string | undefined;
      try {
        await engine.ensureFigmaConnected(15000);
      } catch (err) {
        figmaError = err instanceof Error ? err.message : String(err);
        if (!opts.json) {
          console.log("  Figma not available — syncing from cached design system.\n");
        }
      }

      // Step 2: Pull design system (if connected)
      if (engine.figma.isConnected) {
        await engine.pullDesignSystem();
      }

      // Step 3: Regenerate all specs
      const specs = await engine.registry.getAllSpecs();
      let regenerated = 0;
      for (const spec of specs) {
        try {
          await engine.generateFromSpec(spec.name);
          regenerated++;
        } catch {
          // individual spec failures don't halt the sync
        }
      }

      const ds = engine.registry.designSystem;
      const usedCache = !engine.figma.isConnected;

      const payload: SyncPayload = {
        status: figmaError ? "partial" : "completed",
        figma: {
          connected: engine.figma.isConnected,
          cached: usedCache,
          ...(figmaError ? { error: figmaError } : {}),
        },
        designSystem: {
          tokens: ds.tokens.length,
          components: ds.components.length,
          styles: ds.styles.length,
        },
        specs: {
          regenerated,
          total: specs.length,
        },
        elapsedMs: Date.now() - start,
      };

      if (opts.json) {
        console.log(JSON.stringify(payload, null, 2));
        return;
      }

      console.log("\n  Full sync complete.\n");
    });
}
