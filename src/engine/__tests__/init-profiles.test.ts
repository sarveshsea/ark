import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { MemoireEngine } from "../core.js";

const roots: string[] = [];

async function makeRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "memoire-init-profile-"));
  roots.push(root);
  return root;
}

async function writeComponentSpec(root: string): Promise<void> {
  const dir = join(root, "specs", "components");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "Button.json"), JSON.stringify({
    name: "Button",
    type: "component",
  }));
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("MemoireEngine init profiles", () => {
  it("loads project context without registry work in minimal profile", async () => {
    const root = await makeRoot();
    await writeComponentSpec(root);
    const engine = new MemoireEngine({ projectRoot: root });

    await engine.init("minimal");

    expect(engine.project).not.toBeNull();
    expect(await engine.registry.getAllSpecs()).toEqual([]);
  });

  it("upgrades from minimal to registry without requiring full agent startup", async () => {
    const root = await makeRoot();
    await writeComponentSpec(root);
    const engine = new MemoireEngine({ projectRoot: root });

    await engine.init("minimal");
    await engine.init("registry");

    const specs = await engine.registry.getAllSpecs();
    expect(specs.map((spec) => spec.name)).toEqual(["Button"]);
  });
});
