import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Command } from "commander";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { registerMermaidJamCommand } from "../mermaid-jam.js";
import { captureLogs, lastLog } from "./test-helpers.js";

let projectRoot: string;
let mermaidJamRoot: string;
let originalMermaidJamRoot: string | undefined;

beforeEach(async () => {
  projectRoot = join(tmpdir(), `memoire-mermaid-jam-command-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mermaidJamRoot = join(projectRoot, "unicornjam");
  await mkdir(join(mermaidJamRoot, "plugin"), { recursive: true });
  await writeFile(join(mermaidJamRoot, "package.json"), JSON.stringify({
    name: "mermaid-jam",
    homepage: "https://www.figma.com/community/plugin/1631708567749401678",
    repository: { type: "git", url: "https://github.com/sarveshsea/mermaid-jam.git" },
  }), "utf-8");
  await writeFile(join(mermaidJamRoot, "plugin", "manifest.json"), JSON.stringify({
    name: "Mermaid Jam",
    id: "1631708567749401678",
    editorType: ["figjam"],
    main: "code.js",
    ui: "ui.html",
  }), "utf-8");
  await writeFile(join(mermaidJamRoot, "plugin", "code.js"), "figma.showUI(__html__);\n", "utf-8");
  await writeFile(join(mermaidJamRoot, "plugin", "ui.html"), "<div>Mermaid Jam</div>\n", "utf-8");
  originalMermaidJamRoot = process.env.MEMOIRE_MERMAID_JAM_ROOT;
  process.env.MEMOIRE_MERMAID_JAM_ROOT = mermaidJamRoot;
});

afterEach(async () => {
  if (originalMermaidJamRoot === undefined) delete process.env.MEMOIRE_MERMAID_JAM_ROOT;
  else process.env.MEMOIRE_MERMAID_JAM_ROOT = originalMermaidJamRoot;
  await rm(projectRoot, { recursive: true, force: true });
});

describe("mermaid-jam command", () => {
  it("prints the native FigJam bridge metadata in JSON mode", async () => {
    const logs = captureLogs();
    const program = new Command();

    registerMermaidJamCommand(program, makeEngine(projectRoot) as never);
    await program.parseAsync(["mermaid-jam", "status", "--json"], { from: "user" });

    const payload = JSON.parse(lastLog(logs));
    expect(payload.status).toBe("ready");
    expect(payload.integration).toMatchObject({
      id: "mermaid-jam",
      kind: "figjam-plugin",
      local: {
        found: true,
        manifestPath: join(mermaidJamRoot, "plugin", "manifest.json"),
      },
    });
    expect(payload.integration.install.quickLinks[0]).toMatchObject({
      kind: "community",
      href: "https://www.figma.com/community/plugin/1631708567749401678",
    });
  });
});

function makeEngine(root: string) {
  return {
    config: { projectRoot: root },
    async init() {},
  };
}
