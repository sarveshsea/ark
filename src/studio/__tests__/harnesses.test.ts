import { mkdtemp, rm, writeFile, mkdir, chmod } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { buildHarnessCommand, listHarnesses } from "../harnesses.js";
import { defaultStudioConfig } from "../config.js";
import type { StudioAgentContext } from "../types.js";

function agentContext(root: string, prompt = "Audit the design system"): StudioAgentContext {
  return {
    workspaceLabel: "Memoire workspace",
    projectRoot: root,
    action: "audit",
    harness: "codex",
    prompt,
    memory: {
      counts: { home: 1, research: 0, spec: 4, system: 7, monitor: 1, changelog: 0 },
      recent: [{ kind: "spec", title: "MetricCard", summary: "Molecule KPI component." }],
    },
    figma: {
      enabled: true,
      status: "disconnected",
      clients: 0,
      port: null,
    },
  };
}

describe("studio harnesses", () => {
  it("builds Memoire native compose command with JSON output", () => {
    const root = "/tmp/project";
    const config = defaultStudioConfig(root);

    const command = buildHarnessCommand(config, {
      harnessId: "memoire",
      cwd: root,
      prompt: "create a dashboard",
    });

    expect(command.args).toEqual(["compose", "create a dashboard", "--json", "--no-figma"]);
    expect(command.cwd).toBe(root);
  });

  it("prefers the local Memoire CLI source when running inside the active repo", async () => {
    const root = await mkdtemp(join(tmpdir(), "memoire-studio-local-cli-"));
    try {
      await mkdir(join(root, "src"), { recursive: true });
      await mkdir(join(root, "node_modules", ".bin"), { recursive: true });
      await writeFile(join(root, "src", "index.ts"), "console.log('local memoire')\n");
      await writeFile(join(root, "node_modules", ".bin", "tsx"), "#!/bin/sh\n");
      await chmod(join(root, "node_modules", ".bin", "tsx"), 0o755);
      const config = defaultStudioConfig(root);

      const command = buildHarnessCommand(config, {
        harnessId: "memoire",
        cwd: root,
        prompt: "create a dashboard",
      });

      expect(command.command).toContain(join(root, "node_modules", ".bin", "tsx"));
      expect(command.args).toEqual(["src/index.ts", "compose", "create a dashboard", "--json", "--no-figma"]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("builds external CLI harness commands without shell interpolation", () => {
    const root = "/tmp/project";
    const config = defaultStudioConfig(root);

    expect(buildHarnessCommand(config, {
      harnessId: "codex",
      cwd: root,
      prompt: "audit the app",
      action: "audit",
      agentContext: agentContext(root, "audit the app"),
    })).toMatchObject({
      command: "codex",
      args: expect.arrayContaining(["exec", "--json", "--sandbox", "workspace-write", "--skip-git-repo-check"]),
      cwd: root,
      outputParser: "codex-jsonl",
    });
    const codex = buildHarnessCommand(config, {
      harnessId: "codex",
      cwd: root,
      prompt: "audit the app",
      action: "audit",
      agentContext: agentContext(root, "audit the app"),
    });
    expect(codex.args.at(-1)).toContain("# Mémoire Studio Agent Task");
    expect(codex.args.at(-1)).toContain("UX research");

    expect(buildHarnessCommand(config, {
      harnessId: "claude-code",
      cwd: root,
      prompt: "fix layout",
      action: "compose",
      agentContext: agentContext(root, "fix layout"),
    })).toMatchObject({
      command: "claude",
      args: expect.arrayContaining(["--print", "--output-format", "stream-json", "--permission-mode", "default", "--append-system-prompt"]),
      cwd: root,
      outputParser: "claude-stream-json",
    });
    const claude = buildHarnessCommand(config, {
      harnessId: "claude-code",
      cwd: root,
      prompt: "fix layout",
      action: "compose",
      agentContext: agentContext(root, "fix layout"),
    });
    expect(claude.args.at(-1)).toContain("# Mémoire Studio Agent Task");
    expect(claude.args[claude.args.indexOf("--append-system-prompt") + 1]).toContain("Mémoire Studio design harness");
  });

  it("enables Hermes toolsets for memory, skills, terminal, and file-backed design work", () => {
    const root = "/tmp/project";
    const config = defaultStudioConfig(root);
    const command = buildHarnessCommand(config, {
      harnessId: "hermes",
      cwd: root,
      prompt: "Synthesize research into specs",
      action: "compose",
      agentContext: agentContext(root, "Synthesize research into specs"),
    });

    expect(command.command).toBe("hermes");
    expect(command.args).toEqual(expect.arrayContaining([
      "--toolsets",
      "terminal,file,memory,skills,todo,session_search,clarify",
      "--oneshot",
    ]));
    expect(command.args.at(-1)).toContain("Project memory");
    expect(command.outputParser).toBe("hermes-text");
  });

  it("blocks shell harness unless explicitly enabled", () => {
    const root = "/tmp/project";
    const config = defaultStudioConfig(root);

    expect(() => buildHarnessCommand(config, {
      harnessId: "shell",
      cwd: root,
      prompt: "echo unsafe",
    })).toThrow(/disabled/i);
  });

  it("marks installed harnesses by PATH lookup", () => {
    const root = "/tmp/project";
    const config = defaultStudioConfig(root);
    const harnesses = listHarnesses(config, {
      resolveCommand: (command) => command === "memi" ? "/usr/local/bin/memi" : null,
    });

    expect(harnesses.find((harness) => harness.id === "memoire")?.installed).toBe(true);
    expect(harnesses.find((harness) => harness.id === "codex")?.installed).toBe(false);
  });

  it("uses install probes instead of only the primary command", () => {
    const root = "/tmp/project";
    const config = defaultStudioConfig(root);
    const harnesses = listHarnesses(config, {
      resolveCommand: (command) => {
        if (command === "memoire") return "/usr/local/bin/memoire";
        if (command === "claude") return "/usr/local/bin/claude";
        if (command === "hermes") return "/usr/local/bin/hermes";
        return null;
      },
    });

    expect(harnesses.find((harness) => harness.id === "memoire")).toMatchObject({
      installed: true,
      resolvedPath: "/usr/local/bin/memoire",
    });
    expect(harnesses.find((harness) => harness.id === "claude-code")?.installed).toBe(true);
    expect(harnesses.find((harness) => harness.id === "hermes")?.installed).toBe(true);
  });
});
