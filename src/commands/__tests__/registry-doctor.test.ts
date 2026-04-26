import { describe, expect, it } from "vitest";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { doctorRegistryRef } from "../registry.js";

const registry = {
  name: "@test/ds",
  version: "1.0.0",
  tokens: { href: "./tokens/tokens.json", format: "w3c-dtcg" },
  components: [
    {
      name: "Button",
      href: "./components/Button.json",
      level: "atom",
      framework: "react",
      code: { href: "./components/code/react/Button.tsx", framework: "react" },
    },
  ],
  meta: { extractedAt: "2026-04-26T00:00:00.000Z", memoireVersion: "0.13.1" },
};

describe("registry doctor", () => {
  it("passes a complete local registry", async () => {
    const dir = await mkdtemp(join(tmpdir(), "memoire-doctor-"));
    try {
      await writeRegistryFixture(dir);
      const result = await doctorRegistryRef(dir, dir);
      expect(result.status).toBe("passed");
      expect(result.registry).toBe("@test/ds");
      expect(result.checks.map((check) => check.name)).toContain("tokens");
      expect(result.checks.map((check) => check.name)).toContain("component:Button");
      expect(result.checks.map((check) => check.name)).toContain("code:Button");
      expect(result.checks.map((check) => check.name)).toContain("package.json");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("fails when referenced component code is missing", async () => {
    const dir = await mkdtemp(join(tmpdir(), "memoire-doctor-"));
    try {
      await writeRegistryFixture(dir, { omitCode: true });
      const result = await doctorRegistryRef(dir, dir);
      expect(result.status).toBe("failed");
      expect(result.checks.find((check) => check.name === "code:Button")?.status).toBe("failed");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("validates catalog aliases from repo source paths", async () => {
    const result = await doctorRegistryRef("ai-chat");
    expect(result.status).toBe("passed");
    expect(result.registry).toBe("@memoire-examples/ai-chat");
    expect(result.checks.find((check) => check.name === "install-command")?.status).toBe("passed");
  });
});

async function writeRegistryFixture(dir: string, opts: { omitCode?: boolean } = {}): Promise<void> {
  await mkdir(join(dir, "tokens"), { recursive: true });
  await mkdir(join(dir, "components", "code", "react"), { recursive: true });
  await writeFile(join(dir, "registry.json"), JSON.stringify(registry));
  await writeFile(join(dir, "package.json"), JSON.stringify({
    name: "@test/ds",
    version: "1.0.0",
    memoire: { registry: true },
  }));
  await writeFile(join(dir, "tokens", "tokens.json"), JSON.stringify({ color: { primary: { $value: "oklch(50% 0.2 240)" } } }));
  await writeFile(join(dir, "components", "Button.json"), JSON.stringify({ name: "Button", type: "component" }));
  if (!opts.omitCode) {
    await writeFile(join(dir, "components", "code", "react", "Button.tsx"), "export function Button(){ return <button /> }\n");
  }
}
