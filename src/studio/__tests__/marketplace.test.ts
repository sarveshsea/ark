import { mkdtemp, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { StudioRuntimeServer } from "../server.js";

const servers: StudioRuntimeServer[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.stop()));
});

describe("studio marketplace", () => {
  it("lists built-in and installed Memoire Notes for the Studio marketplace", async () => {
    const root = await mkdtemp(join(tmpdir(), "memoire-studio-marketplace-"));
    try {
      const server = new StudioRuntimeServer({ projectRoot: root, port: 0 });
      servers.push(server);
      const runtime = await server.start();

      const payload = await fetch(`${runtime.url}/api/marketplace/notes`).then((res) => res.json());
      const note = payload.notes.find((candidate: { id: string }) => candidate.id === "design-systems");

      expect(payload.summary.total).toBeGreaterThan(10);
      expect(payload.summary.builtIn).toBeGreaterThan(0);
      expect(note).toMatchObject({
        id: "design-systems",
        name: "design-systems",
        category: "craft",
        installed: false,
        builtIn: true,
        installable: true,
      });
      expect(note.tags).toEqual(expect.any(Array));
      expect(note.sourcePath).toEqual(expect.stringContaining("notes/design-systems"));
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("installs and removes installable notes through marketplace endpoints", async () => {
    const root = await mkdtemp(join(tmpdir(), "memoire-studio-marketplace-"));
    try {
      const server = new StudioRuntimeServer({ projectRoot: root, port: 0 });
      servers.push(server);
      const runtime = await server.start();

      const installResponse = await fetch(`${runtime.url}/api/marketplace/notes/install`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ noteId: "design-systems" }),
      });
      expect(installResponse.status).toBe(200);
      const installedPayload = await installResponse.json();
      const installedNote = installedPayload.notes.find((candidate: { id: string }) => candidate.id === "design-systems");
      expect(installedNote.installed).toBe(true);
      await expect(stat(join(root, ".memoire", "notes", "design-systems", "note.json"))).resolves.toBeTruthy();

      const removeResponse = await fetch(`${runtime.url}/api/marketplace/notes/remove`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "design-systems" }),
      });
      expect(removeResponse.status).toBe(200);
      const removedPayload = await removeResponse.json();
      const removedNote = removedPayload.notes.find((candidate: { id: string }) => candidate.id === "design-systems");
      expect(removedNote.installed).toBe(false);
      await expect(stat(join(root, ".memoire", "notes", "design-systems", "note.json"))).rejects.toThrow();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
