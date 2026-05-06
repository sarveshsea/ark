import type { Command } from "commander";
import type { MemoireEngine } from "../engine/core.js";
import {
  openMermaidJamTarget,
  resolveMermaidJamIntegration,
  type MermaidJamOpenTarget,
} from "../integrations/mermaid-jam.js";
import { ui } from "../tui/format.js";

export function registerMermaidJamCommand(program: Command, engine: MemoireEngine): void {
  const mermaidJam = program
    .command("mermaid-jam")
    .alias("mermaid")
    .description("Open and inspect the native Mermaid Jam FigJam integration");

  mermaidJam
    .command("status")
    .description("Show Mermaid Jam install links, local manifest path, and FigJam readiness")
    .option("--json", "Output as JSON")
    .action(async (opts: { json?: boolean }) => {
      await engine.init("minimal");
      const integration = await resolveMermaidJamIntegration({ projectRoot: engine.config.projectRoot });
      const payload = { status: statusFor(integration), integration };

      if (opts.json) {
        console.log(JSON.stringify(payload, null, 2));
        return;
      }

      console.log();
      console.log(ui.section("MERMAID JAM"));
      console.log(ui.dots("Status", payload.status));
      console.log(ui.dots("Community", integration.communityUrl));
      console.log(ui.dots("Repository", integration.repositoryUrl));
      console.log(ui.dots("Local manifest", integration.local.manifestPath ?? "not found"));
      for (const step of integration.install.nextSteps) console.log(`  ${ui.promptPrefix()} ${step}`);
      console.log();
    });

  mermaidJam
    .command("open")
    .description("Open Mermaid Jam on Figma Community, GitHub, or the local manifest")
    .option("--target <target>", "community, repository, or local-manifest", "community")
    .option("--json", "Output as JSON")
    .action(async (opts: { target?: MermaidJamOpenTarget; json?: boolean }) => {
      await engine.init("minimal");
      const target = parseTarget(opts.target ?? "community");
      const integration = await resolveMermaidJamIntegration({ projectRoot: engine.config.projectRoot });
      const result = await openMermaidJamTarget(integration, target);
      const payload = { status: "opened", result, integration };

      if (opts.json) {
        console.log(JSON.stringify(payload, null, 2));
        return;
      }

      console.log();
      console.log(ui.ok(`Opened ${result.opened}`));
      console.log();
    });
}

function statusFor(integration: Awaited<ReturnType<typeof resolveMermaidJamIntegration>>): "ready" | "needs-build" | "available" {
  if (integration.local.ready) return "ready";
  if (integration.local.found) return "needs-build";
  return "available";
}

function parseTarget(value: string): MermaidJamOpenTarget {
  if (value === "community" || value === "repository" || value === "local-manifest") return value;
  throw Object.assign(new Error(`Unsupported Mermaid Jam target: ${value}`), { statusCode: 400 });
}
