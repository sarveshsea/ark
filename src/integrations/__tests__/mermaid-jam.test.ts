import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveMermaidJamIntegration } from "../mermaid-jam.js";

let root: string;
let mermaidJamRoot: string;

beforeEach(async () => {
  root = join(tmpdir(), `memoire-mermaid-jam-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mermaidJamRoot = join(root, "unicornjam");
  await mkdir(join(mermaidJamRoot, "plugin"), { recursive: true });
  await writeFile(join(mermaidJamRoot, "package.json"), JSON.stringify({
    name: "mermaid-jam",
    version: "0.1.0",
    homepage: "https://www.figma.com/community/plugin/1631708567749401678",
    repository: { type: "git", url: "https://github.com/sarveshsea/mermaid-jam.git" },
  }), "utf-8");
  await writeFile(join(mermaidJamRoot, "plugin", "manifest.json"), JSON.stringify({
    name: "Mermaid Jam",
    id: "1631708567749401678",
    editorType: ["figma", "figjam"],
    main: "code.js",
    ui: "ui.html",
  }), "utf-8");
  await writeFile(join(mermaidJamRoot, "plugin", "code.js"), "figma.showUI(__html__);\n", "utf-8");
  await writeFile(join(mermaidJamRoot, "plugin", "ui.html"), "<div>Mermaid Jam</div>\n", "utf-8");
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("mermaid jam integration", () => {
  it("resolves a native FigJam integration from an explicit local checkout", async () => {
    const integration = await resolveMermaidJamIntegration({
      projectRoot: root,
      env: { MEMOIRE_MERMAID_JAM_ROOT: mermaidJamRoot },
    });

    expect(integration).toMatchObject({
      id: "mermaid-jam",
      name: "Mermaid Jam",
      kind: "figjam-plugin",
      communityUrl: "https://www.figma.com/community/plugin/1631708567749401678",
      repositoryUrl: "https://github.com/sarveshsea/mermaid-jam",
      local: {
        found: true,
        root: mermaidJamRoot,
        manifestPath: join(mermaidJamRoot, "plugin", "manifest.json"),
        ready: true,
        source: "env",
        manifestId: "1631708567749401678",
        editorTypes: ["figma", "figjam"],
      },
    });
    expect(integration.supportedInputs).toEqual(["mermaid", "markdown"]);
    expect(integration.install.quickLinks.map((link) => link.kind)).toEqual(["community", "repository", "local-manifest"]);
    expect(integration.install.nextSteps[0]).toContain("Open Mermaid Jam from a FigJam board");
  });
});
