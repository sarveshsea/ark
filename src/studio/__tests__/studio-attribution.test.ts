import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("studio open-source attribution", () => {
  it("credits Hermes and the MIT Warp UI framework boundary", async () => {
    const readme = await readFile(join(process.cwd(), "README.md"), "utf-8");
    const notice = await readFile(join(process.cwd(), "NOTICE"), "utf-8");

    expect(readme).toContain("Studio interface references and adapted components");
    expect(readme).toContain("Hermes WebUI");
    expect(readme).toContain("warpui_core");
    expect(notice).toContain("Hermes WebUI");
    expect(notice).toContain("Hermes Agent");
    expect(notice).toContain("Warp UI framework");
    expect(notice).toContain("AGPL application/client code is not copied");
  });
});
