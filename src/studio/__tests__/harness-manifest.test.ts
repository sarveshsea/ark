import { describe, expect, it } from "vitest";
import { defaultStudioConfig } from "../config.js";
import { buildHarnessCommand, getHarnessManifest } from "../harnesses.js";

describe("studio harness manifest", () => {
  it("loads shared harness definitions with execution metadata", () => {
    const manifest = getHarnessManifest();

    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.harnesses.map((harness) => harness.id)).toEqual([
      "memoire",
      "claude-code",
      "codex",
      "opencode",
      "gemini",
      "ollama",
      "hermes",
      "shell",
    ]);
    expect(manifest.harnesses.find((harness) => harness.id === "codex")).toMatchObject({
      provider: "openai",
      supportsCancel: true,
      workspacePolicy: "workspace-required",
      outputParser: "codex-jsonl",
    });
  });

  it("defines Hermes one-shot and local model harness metadata", () => {
    const manifest = getHarnessManifest();

    expect(manifest.harnesses.find((harness) => harness.id === "hermes")).toMatchObject({
      label: "Hermes",
      command: "hermes",
      provider: "local",
      outputParser: "hermes-text",
      supportsCancel: true,
    });
    expect(manifest.harnesses.find((harness) => harness.id === "hermes")?.commandTemplates.raw).toEqual([
      "--toolsets",
      "terminal,file,memory,skills,todo,session_search,clarify",
      "--oneshot",
      "{{promptEnvelope}}",
    ]);
    expect(manifest.harnesses.find((harness) => harness.id === "ollama")?.defaultModel).toBe("llama3.1:8b");
  });

  it("builds Memoire commands for design-first actions", () => {
    const root = "/tmp/project";
    const config = defaultStudioConfig(root);

    expect(buildHarnessCommand(config, {
      harnessId: "memoire",
      cwd: root,
      prompt: "https://memoire.cv",
      action: "design-doc",
    })).toMatchObject({
      args: ["design-doc", "https://memoire.cv", "--json"],
      action: "design-doc",
    });

    expect(buildHarnessCommand(config, {
      harnessId: "memoire",
      cwd: root,
      prompt: "column",
      action: "references",
    })).toMatchObject({
      args: ["references", "search", "column", "--json"],
      action: "references",
    });
  });

  it("blocks hardline shell commands even when shell is enabled", () => {
    const root = "/tmp/project";
    const config = {
      ...defaultStudioConfig(root),
      enabledTools: {
        ...defaultStudioConfig(root).enabledTools,
        shell: true,
      },
      harnesses: defaultStudioConfig(root).harnesses.map((harness) => (
        harness.id === "shell" ? { ...harness, enabled: true } : harness
      )),
    };

    expect(() => buildHarnessCommand(config, {
      harnessId: "shell",
      cwd: root,
      prompt: "rm -rf /",
      action: "raw",
    })).toThrow(/blocked/i);
  });
});
