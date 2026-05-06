import { mkdtemp, rm, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { defaultStudioConfig, loadStudioConfig, saveStudioConfig, studioConfigPath } from "../config.js";

describe("studio config", () => {
  it("loads default desktop-first config when no config file exists", async () => {
    const root = await mkdtemp(join(tmpdir(), "memoire-studio-config-"));
    try {
      const config = await loadStudioConfig(root);

      expect(studioConfigPath(root)).toBe(join(root, ".memoire", "studio", "config.json"));
      expect(config.defaultHarness).toBe("memoire");
      expect(config.workspaceRoots).toEqual([root]);
      expect(config.harnesses.map((harness) => harness.id)).toEqual([
        "memoire",
        "claude-code",
        "codex",
        "opencode",
        "gemini",
        "ollama",
        "hermes",
        "shell",
      ]);
      expect(config.enabledTools.shell).toBe(false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("saves merged config without dropping default harness definitions", async () => {
    const root = await mkdtemp(join(tmpdir(), "memoire-studio-config-"));
    try {
      await saveStudioConfig(root, {
        ...defaultStudioConfig(root),
        defaultHarness: "codex",
        workspaceRoots: [root, join(root, "client")],
      });

      const raw = JSON.parse(await readFile(studioConfigPath(root), "utf-8"));
      const loaded = await loadStudioConfig(root);

      expect(raw.defaultHarness).toBe("codex");
      expect(loaded.defaultHarness).toBe("codex");
      expect(loaded.workspaceRoots).toEqual([root, join(root, "client")]);
      expect(loaded.harnesses.find((harness) => harness.id === "memoire")?.command).toBe("memi");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
