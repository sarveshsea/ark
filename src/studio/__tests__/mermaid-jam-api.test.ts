import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { StudioRuntimeServer } from "../server.js";

const servers: StudioRuntimeServer[] = [];
let projectRoot: string;
let mermaidJamRoot: string;
let originalMermaidJamRoot: string | undefined;

beforeEach(async () => {
  projectRoot = join(tmpdir(), `memoire-mermaid-jam-api-${Date.now()}-${Math.random().toString(36).slice(2)}`);
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
  await Promise.all(servers.splice(0).map((server) => server.stop()));
  await rm(projectRoot, { recursive: true, force: true });
});

describe("studio mermaid jam api", () => {
  it("serves Mermaid Jam as a native Studio integration", async () => {
    const server = new StudioRuntimeServer({ projectRoot, port: 0 });
    servers.push(server);
    const runtime = await server.start();

    const response = await fetch(`${runtime.url}/api/integrations/mermaid-jam`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.integration).toMatchObject({
      id: "mermaid-jam",
      kind: "figjam-plugin",
      local: {
        found: true,
        ready: true,
        manifestPath: join(mermaidJamRoot, "plugin", "manifest.json"),
      },
    });
  });
});
