import { accessSync, constants, existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { delimiter, join, resolve } from "node:path";
import type {
  StudioEvent,
  StudioEventType,
  StudioVideoAdapterId,
  StudioVideoManifest,
} from "./types.js";

export interface VideoResolverOptions {
  resolveCommand?: (command: string) => string | null;
  resolvePackage?: (pkg: string) => string | null;
}

export interface StudioVideoProjectResult extends StudioVideoManifest {
  projectDir: string;
  events: StudioEvent[];
}

export interface StudioVideoAdapterStatus {
  remotion: { available: boolean; command: string | null; message: string };
  hyperframes: { available: boolean; command: string | null; message: string };
}

export interface StudioVideoOperationResult {
  id: string;
  adapter: StudioVideoAdapterId;
  status: "ready" | "missing-adapter";
  command: string[];
  message: string;
  events: StudioEvent[];
}

const require = createRequire(import.meta.url);

export async function createVideoProject(
  projectRoot: string,
  input: { title: string; prompt?: string; adapter?: StudioVideoAdapterId },
): Promise<StudioVideoProjectResult> {
  const title = input.title.trim();
  if (!title) throw new Error("Video title is required");
  const id = slugify(title);
  const adapter = input.adapter ?? "remotion";
  const projectDir = videoProjectDir(projectRoot, id);
  const createdAt = new Date().toISOString();
  const manifest: StudioVideoManifest = {
    schemaVersion: 1,
    id,
    title,
    prompt: input.prompt?.trim() || title,
    adapter,
    status: "created",
    createdAt,
    updatedAt: createdAt,
    files: ["video.json", "README.md", "src/Storyboard.tsx"],
  };

  await mkdir(join(projectDir, "src"), { recursive: true });
  await writeFile(join(projectDir, "video.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf-8");
  await writeFile(join(projectDir, "README.md"), readmeFor(manifest), "utf-8");
  await writeFile(join(projectDir, "src", "Storyboard.tsx"), storyboardFor(manifest), "utf-8");

  return {
    ...manifest,
    projectDir,
    events: [videoEvent(id, "video_project_created", `Created ${adapter} video project ${id}`, manifest)],
  };
}

export function getVideoAdapterStatus(options: VideoResolverOptions = {}): StudioVideoAdapterStatus {
  const resolveCommand = options.resolveCommand ?? resolveCommandFromPath;
  const resolvePackage = options.resolvePackage ?? resolvePackageDefault;
  const npx = resolveCommand("npx");
  const remotion = resolveCommand("remotion") ?? (npx ? `${npx} remotion` : null);
  const hyperframes = resolveCommand("hyperframes") ?? resolvePackage("hyperframes") ?? resolvePackage("@hyperframes/core");

  return {
    remotion: {
      available: Boolean(remotion),
      command: remotion,
      message: remotion ? "Remotion available" : "Install remotion or use npx remotion",
    },
    hyperframes: {
      available: Boolean(hyperframes),
      command: hyperframes,
      message: hyperframes ? "HyperFrames available" : "Install hyperframes or @hyperframes/core",
    },
  };
}

export async function previewVideoProject(
  projectRoot: string,
  id: string,
  options: VideoResolverOptions = {},
): Promise<StudioVideoOperationResult> {
  const manifest = await readVideoManifest(projectRoot, id);
  const status = getVideoAdapterStatus(options)[manifest.adapter];
  if (!status.available) return missingAdapterResult(manifest, "preview");
  const command = manifest.adapter === "remotion"
    ? ["npx", "remotion", "studio", videoProjectDir(projectRoot, id)]
    : ["hyperframes", "dev", videoProjectDir(projectRoot, id)];
  return {
    id,
    adapter: manifest.adapter,
    status: "ready",
    command,
    message: `Preview ${manifest.title}`,
    events: [videoEvent(id, "video_render_started", `Preview ready for ${id}`, { command })],
  };
}

export async function renderVideoProject(
  projectRoot: string,
  id: string,
  options: VideoResolverOptions = {},
): Promise<StudioVideoOperationResult> {
  const manifest = await readVideoManifest(projectRoot, id);
  const status = getVideoAdapterStatus(options)[manifest.adapter];
  if (!status.available) return missingAdapterResult(manifest, "render");
  const command = manifest.adapter === "remotion"
    ? ["npx", "remotion", "render", videoProjectDir(projectRoot, id)]
    : ["hyperframes", "render", videoProjectDir(projectRoot, id)];
  return {
    id,
    adapter: manifest.adapter,
    status: "ready",
    command,
    message: `Render command ready for ${manifest.title}`,
    events: [
      videoEvent(id, "video_render_started", `Render ready for ${id}`, { command }),
      videoEvent(id, "video_render_completed", `Render command prepared for ${id}`, { command }),
    ],
  };
}

async function readVideoManifest(projectRoot: string, id: string): Promise<StudioVideoManifest> {
  return JSON.parse(await readFile(join(videoProjectDir(projectRoot, id), "video.json"), "utf-8")) as StudioVideoManifest;
}

function missingAdapterResult(manifest: StudioVideoManifest, operation: "preview" | "render"): StudioVideoOperationResult {
  const install = manifest.adapter === "remotion" ? "Install remotion or use npx remotion" : "Install hyperframes or @hyperframes/core";
  return {
    id: manifest.id,
    adapter: manifest.adapter,
    status: "missing-adapter",
    command: [],
    message: `${install} to ${operation} ${manifest.title}.`,
    events: [videoEvent(manifest.id, "video_render_failed", `${manifest.adapter} adapter missing`, { operation })],
  };
}

function videoProjectDir(projectRoot: string, id: string): string {
  return join(resolve(projectRoot), ".memoire", "videos", id);
}

function videoEvent(sessionId: string, type: StudioEventType, message: string, data?: unknown): StudioEvent {
  return {
    id: `${type}-${Date.now().toString(36)}`,
    sessionId: `video:${sessionId}`,
    type,
    timestamp: new Date().toISOString(),
    message,
    data,
  };
}

function readmeFor(manifest: StudioVideoManifest): string {
  const preview = manifest.adapter === "remotion"
    ? "npx remotion studio"
    : "npx hyperframes dev";
  const render = manifest.adapter === "remotion"
    ? "npx remotion render"
    : "npx hyperframes render";
  return [
    `# ${manifest.title}`,
    "",
    manifest.prompt,
    "",
    `Adapter: ${manifest.adapter}`,
    "",
    "## Preview",
    "",
    `\`${preview}\``,
    "",
    "## Render",
    "",
    `\`${render}\``,
    "",
  ].join("\n");
}

function storyboardFor(manifest: StudioVideoManifest): string {
  return [
    "export const storyboard = {",
    `  title: ${JSON.stringify(manifest.title)},`,
    `  prompt: ${JSON.stringify(manifest.prompt)},`,
    `  adapter: ${JSON.stringify(manifest.adapter)},`,
    "  scenes: [",
    "    { id: 'open', label: 'Problem', duration: 90 },",
    "    { id: 'system', label: 'System', duration: 120 },",
    "    { id: 'handoff', label: 'Handoff', duration: 90 },",
    "  ],",
    "};",
    "",
  ].join("\n");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "video";
}

function resolvePackageDefault(pkg: string): string | null {
  try {
    return require.resolve(`${pkg}/package.json`);
  } catch {
    return null;
  }
}

function resolveCommandFromPath(command: string): string | null {
  const entries = (process.env.PATH ?? "").split(delimiter).filter(Boolean);
  for (const entry of entries) {
    const candidate = join(entry, command);
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      // Continue.
    }
  }
  return existsSync(command) ? command : null;
}
