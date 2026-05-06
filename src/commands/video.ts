import type { Command } from "commander";
import type { MemoireEngine } from "../engine/core.js";
import {
  createVideoProject,
  getVideoAdapterStatus,
  previewVideoProject,
  renderVideoProject,
} from "../studio/video.js";
import type { StudioVideoAdapterId } from "../studio/types.js";
import { ui } from "../tui/format.js";

export function registerVideoCommand(program: Command, engine: MemoireEngine): void {
  const video = program
    .command("video")
    .description("Create, preview, and render Mémoire motion/video projects");

  video
    .command("create <title>")
    .description("Create a filesystem-first video project in .memoire/videos")
    .option("--prompt <text>", "Motion/design prompt")
    .option("--adapter <adapter>", "Video adapter: remotion or hyperframes", "remotion")
    .option("--json", "Output JSON")
    .action(async (title: string, opts: { prompt?: string; adapter?: StudioVideoAdapterId; json?: boolean }) => {
      await engine.init("minimal");
      const result = await createVideoProject(engine.config.projectRoot, {
        title,
        prompt: opts.prompt,
        adapter: normalizeAdapter(opts.adapter),
      });
      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }
      console.log(ui.ok(`Created video project ${result.id}`));
      console.log(ui.dots("Adapter", result.adapter));
      console.log(ui.dots("Path", result.projectDir));
    });

  video
    .command("preview <id>")
    .description("Show the preview command for a video project")
    .option("--json", "Output JSON")
    .action(async (id: string, opts: { json?: boolean }) => {
      await engine.init("minimal");
      const result = await previewVideoProject(engine.config.projectRoot, id);
      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }
      printOperation(result);
    });

  video
    .command("render <id>")
    .description("Show the render command for a video project")
    .option("--json", "Output JSON")
    .action(async (id: string, opts: { json?: boolean }) => {
      await engine.init("minimal");
      const result = await renderVideoProject(engine.config.projectRoot, id);
      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }
      printOperation(result);
    });

  video
    .command("status")
    .description("Show optional Remotion and HyperFrames availability")
    .option("--json", "Output JSON")
    .action(async (opts: { json?: boolean }) => {
      await engine.init("minimal");
      const status = getVideoAdapterStatus();
      if (opts.json) {
        console.log(JSON.stringify(status, null, 2));
        return;
      }
      console.log(ui.section("VIDEO ADAPTERS"));
      console.log(ui.dots("Remotion", status.remotion.message));
      console.log(ui.dots("HyperFrames", status.hyperframes.message));
    });
}

function normalizeAdapter(value: StudioVideoAdapterId | undefined): StudioVideoAdapterId {
  if (value === "remotion" || value === "hyperframes") return value;
  throw new Error(`Unsupported video adapter: ${value}`);
}

function printOperation(result: Awaited<ReturnType<typeof previewVideoProject>>): void {
  if (result.status === "missing-adapter") {
    console.log(ui.warn(result.message));
    return;
  }
  console.log(ui.ok(result.message));
  console.log(ui.dots("Command", result.command.join(" ")));
}
