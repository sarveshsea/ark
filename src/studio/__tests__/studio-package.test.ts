import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("studio package compatibility", () => {
  it("copies the built Studio web app into the root package dist", async () => {
    const buildScript = await readFile(join(process.cwd(), "scripts", "build.mjs"), "utf-8");

    expect(buildScript).toContain("npm --prefix apps/studio run build");
    expect(buildScript).toContain("apps\", \"studio\", \"dist");
    expect(buildScript).toContain("studio-web");
  });

  it("serves packaged Studio web assets outside the source checkout", async () => {
    const serverSource = await readFile(join(process.cwd(), "src", "studio", "server.ts"), "utf-8");
    const commandSource = await readFile(join(process.cwd(), "src", "commands", "studio.ts"), "utf-8");

    expect(serverSource).toContain("candidateStudioAssetRoots");
    expect(serverSource).toContain("studio-web");
    expect(commandSource).toContain("servePackagedStudioWeb");
  });
});
