import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { StudioRuntimeServer } from "../server.js";

const servers: StudioRuntimeServer[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.stop()));
});

describe("studio runtime server", () => {
  it("serves status and harness metadata as localhost JSON", async () => {
    const root = await mkdtemp(join(tmpdir(), "memoire-studio-server-"));
    try {
      const server = new StudioRuntimeServer({ projectRoot: root, port: 0 });
      servers.push(server);
      const runtime = await server.start();

      const status = await fetch(`${runtime.url}/api/status`).then((res) => res.json());
      const harnesses = await fetch(`${runtime.url}/api/harnesses`).then((res) => res.json());

      expect(status.status).toBe("running");
      expect(status.projectRoot).toBe(root);
      expect(status.config.defaultHarness).toBe("memoire");
      expect(harnesses.harnesses.map((harness: { id: string }) => harness.id)).toContain("codex");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rejects session starts outside configured workspace roots", async () => {
    const root = await mkdtemp(join(tmpdir(), "memoire-studio-server-"));
    try {
      const server = new StudioRuntimeServer({ projectRoot: root, port: 0 });
      servers.push(server);
      const runtime = await server.start();

      const response = await fetch(`${runtime.url}/api/sessions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          harness: "memoire",
          cwd: "/tmp",
          prompt: "hello",
        }),
      });

      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({ error: expect.stringMatching(/workspace/i) });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
