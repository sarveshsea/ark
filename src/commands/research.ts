import type { Command } from "commander";
import type { MemoireEngine } from "../engine/core.js";
import { join } from "path";

type ResearchAction = "from-file" | "from-stickies" | "synthesize" | "report";

interface ResearchArtifacts {
  researchDir: string;
  insightsPath: string;
  notesDir: string;
  reportPath: string;
}

interface ResearchSummary {
  insights: number;
  themes: number;
  personas: number;
  sources: number;
}

interface ResearchCommandPayload {
  action: ResearchAction;
  status: "completed";
  options: {
    json: boolean;
  };
  summary: ResearchSummary;
  artifacts: ResearchArtifacts;
  source?: {
    type: "file";
    path: string;
  };
  stickies?: {
    total: number;
    clusters: number;
    unclustered: number;
    summary: string;
    autoConnected: boolean;
  };
  synthesis?: {
    summary: string;
    themes: number;
    topTheme: string | null;
  };
  report?: {
    path: string;
    bytes: number;
    lines: number;
  };
}

export function registerResearchCommand(program: Command, engine: MemoireEngine) {
  const research = program
    .command("research")
    .description("Research pipeline — process data from multiple sources");

  research
    .command("from-file <path>")
    .description("Parse Excel/CSV research data")
    .option("--json", "Output file import result as JSON")
    .action(async (filePath: string, opts: { json?: boolean }) => {
      const json = Boolean(opts.json);
      await engine.init();
      await engine.research.load();
      if (!json) {
        console.log(`\n  Processing: ${filePath}\n`);
      }
      await engine.research.fromFile(filePath);

      if (json) {
        console.log(JSON.stringify({
          action: "from-file",
          status: "completed",
          options: { json: true },
          source: {
            type: "file",
            path: filePath,
          },
          summary: buildResearchSummary(engine),
          artifacts: buildResearchArtifacts(engine),
        } satisfies ResearchCommandPayload, null, 2));
        return;
      }

      console.log("\n  Done. Insights saved to research/insights.json");
      console.log("  Markdown notes written to research/notes/");
      console.log("  Run `memi preview` to view the research dashboard\n");
    });

  research
    .command("from-stickies")
    .description("Convert FigJam stickies from connected Figma file to research")
    .option("--json", "Output sticky import result as JSON")
    .action(async (opts: { json?: boolean }) => {
      const json = Boolean(opts.json);
      await engine.init();
      await engine.research.load();

      let autoConnected = false;
      if (!engine.figma.isConnected) {
        autoConnected = true;
        if (!json) {
          console.log("\n  Connecting to Figma...\n");
        }
        await engine.connectFigma();
      }

      if (!json) {
        console.log("\n  Reading FigJam stickies...\n");
      }
      const stickies = await engine.figma.extractStickies();
      const result = await engine.research.fromStickies(stickies);

      if (json) {
        console.log(JSON.stringify({
          action: "from-stickies",
          status: "completed",
          options: { json: true },
          summary: buildResearchSummary(engine),
          artifacts: buildResearchArtifacts(engine),
          stickies: {
            total: result.totalStickies,
            clusters: result.clusters.length,
            unclustered: result.unclustered.length,
            summary: result.summary,
            autoConnected,
          },
        } satisfies ResearchCommandPayload, null, 2));
        return;
      }

      console.log(`\n  ${result.summary}`);
      console.log("  Insights saved to research/insights.json");
      console.log("  Markdown notes written to research/notes/");
      console.log("  Run `memi preview` to view the research dashboard\n");
    });

  research
    .command("synthesize")
    .description("Combine all research into unified insights")
    .option("--json", "Output synthesis result as JSON")
    .action(async (opts: { json?: boolean }) => {
      const json = Boolean(opts.json);
      await engine.init();
      await engine.research.load();

      if (!json) {
        console.log("\n  Synthesizing research...\n");
      }
      const { themes, summary } = await engine.research.synthesize();

      if (json) {
        console.log(JSON.stringify({
          action: "synthesize",
          status: "completed",
          options: { json: true },
          summary: buildResearchSummary(engine),
          artifacts: buildResearchArtifacts(engine),
          synthesis: {
            summary,
            themes: themes.length,
            topTheme: themes[0]?.name ?? null,
          },
        } satisfies ResearchCommandPayload, null, 2));
        return;
      }

      console.log(`\n  ${summary}\n`);
    });

  research
    .command("report")
    .description("Generate formatted research report")
    .option("--json", "Output report generation result as JSON")
    .action(async (opts: { json?: boolean }) => {
      const json = Boolean(opts.json);
      await engine.init();
      await engine.research.load();

      if (!json) {
        console.log("\n  Generating report...\n");
      }
      const report = await engine.research.generateReport();

      if (json) {
        const artifacts = buildResearchArtifacts(engine);
        console.log(JSON.stringify({
          action: "report",
          status: "completed",
          options: { json: true },
          summary: buildResearchSummary(engine),
          artifacts,
          report: {
            path: artifacts.reportPath,
            bytes: Buffer.byteLength(report, "utf-8"),
            lines: report.split(/\r?\n/).length,
          },
        } satisfies ResearchCommandPayload, null, 2));
        return;
      }

      console.log("  Report saved to research/reports/report.md");
      console.log("  Run `memi preview` to view the research dashboard\n");
    });
}

function buildResearchArtifacts(engine: MemoireEngine): ResearchArtifacts {
  const researchDir = join(engine.config.projectRoot, "research");
  return {
    researchDir,
    insightsPath: join(researchDir, "insights.json"),
    notesDir: join(researchDir, "notes"),
    reportPath: join(researchDir, "reports", "report.md"),
  };
}

function buildResearchSummary(engine: MemoireEngine): ResearchSummary {
  const store = engine.research.getStore();
  return {
    insights: store.insights.length,
    themes: store.themes.length,
    personas: store.personas.length,
    sources: store.sources.length,
  };
}
