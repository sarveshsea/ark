import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { getHarnessManifest } from "./harnesses.js";
import type { StudioConfig } from "./types.js";

export function studioConfigPath(projectRoot: string): string {
  return join(projectRoot, ".memoire", "studio", "config.json");
}

export function defaultStudioConfig(projectRoot: string): StudioConfig {
  const root = resolve(projectRoot);
  return {
    schemaVersion: 1,
    workspaceRoots: [root],
    defaultHarness: "memoire",
    defaultModel: null,
    providers: {
      anthropic: { enabled: true, envKey: "ANTHROPIC_API_KEY" },
      openai: { enabled: true, envKey: "OPENAI_API_KEY" },
      openaiCompatible: { enabled: false, baseUrl: null, envKey: null },
      ollama: { enabled: true, baseUrl: "http://127.0.0.1:11434", defaultModel: "llama3.1:8b" },
    },
    harnesses: getHarnessManifest().harnesses.map((harness) => ({
      ...harness,
      enabled: harness.enabledByDefault,
      command: harness.id === "shell" ? (process.env.SHELL || harness.command) : harness.command,
    })),
    enabledTools: {
      shell: false,
      browser: true,
      figma: true,
      mcp: true,
    },
    figma: {
      autoStartBridge: false,
      preferredPort: 9223,
      portRange: [9223, 9232],
      lastFileKey: null,
      lastConnectedAt: null,
    },
  };
}

export async function loadStudioConfig(projectRoot: string): Promise<StudioConfig> {
  const defaults = defaultStudioConfig(projectRoot);
  try {
    const raw = JSON.parse(await readFile(studioConfigPath(projectRoot), "utf-8")) as Partial<StudioConfig>;
    return mergeStudioConfig(defaults, raw);
  } catch {
    return defaults;
  }
}

export async function saveStudioConfig(projectRoot: string, config: StudioConfig): Promise<void> {
  const path = studioConfigPath(projectRoot);
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, JSON.stringify(mergeStudioConfig(defaultStudioConfig(projectRoot), config), null, 2) + "\n");
}

function mergeStudioConfig(defaults: StudioConfig, raw: Partial<StudioConfig>): StudioConfig {
  const overrideHarnesses = new Map((raw.harnesses ?? []).map((harness) => [harness.id, harness]));
  return {
    ...defaults,
    ...raw,
    schemaVersion: 1,
    workspaceRoots: (raw.workspaceRoots ?? defaults.workspaceRoots).map((root) => resolve(root)),
    providers: {
      ...defaults.providers,
      ...(raw.providers ?? {}),
      anthropic: { ...defaults.providers.anthropic, ...(raw.providers?.anthropic ?? {}) },
      openai: { ...defaults.providers.openai, ...(raw.providers?.openai ?? {}) },
      openaiCompatible: { ...defaults.providers.openaiCompatible, ...(raw.providers?.openaiCompatible ?? {}) },
      ollama: { ...defaults.providers.ollama, ...(raw.providers?.ollama ?? {}) },
    },
    enabledTools: {
      ...defaults.enabledTools,
      ...(raw.enabledTools ?? {}),
    },
    figma: {
      autoStartBridge: raw.figma?.autoStartBridge ?? defaults.figma?.autoStartBridge ?? false,
      preferredPort: raw.figma?.preferredPort ?? defaults.figma?.preferredPort ?? null,
      portRange: raw.figma?.portRange ?? defaults.figma?.portRange ?? [9223, 9232],
      lastFileKey: raw.figma?.lastFileKey ?? defaults.figma?.lastFileKey ?? null,
      lastConnectedAt: raw.figma?.lastConnectedAt ?? defaults.figma?.lastConnectedAt ?? null,
    },
    harnesses: defaults.harnesses.map((harness) => ({
      ...harness,
      ...(overrideHarnesses.get(harness.id) ?? {}),
    })),
  };
}
