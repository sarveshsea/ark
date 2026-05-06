import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it, vi } from "vitest";
import { StudioFigmaController, type StudioFigmaBridgeLike } from "../figma-controller.js";
import {
  createVideoProject,
  getVideoAdapterStatus,
  previewVideoProject,
  renderVideoProject,
} from "../video.js";

describe("studio video workflows and Figma launcher", () => {
  it("creates a filesystem-first Remotion video project without hard dependencies", async () => {
    const root = await mkdtemp(join(tmpdir(), "memoire-video-"));
    try {
      const created = await createVideoProject(root, {
        title: "Launch narrative",
        prompt: "Create a motion story for the Memoire Studio launch",
        adapter: "remotion",
      });

      expect(created.id).toBe("launch-narrative");
      expect(created.adapter).toBe("remotion");
      expect(created.events.map((event) => event.type)).toContain("video_project_created");
      expect(JSON.parse(await readFile(join(created.projectDir, "video.json"), "utf-8"))).toMatchObject({
        id: "launch-narrative",
        adapter: "remotion",
      });
      expect(await readFile(join(created.projectDir, "README.md"), "utf-8")).toContain("npx remotion studio");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("reports optional Remotion and HyperFrames adapter availability", () => {
    const status = getVideoAdapterStatus({
      resolveCommand: (command) => command === "npx" ? "/usr/local/bin/npx" : null,
      resolvePackage: (pkg) => pkg === "hyperframes" ? "/repo/node_modules/hyperframes" : null,
    });

    expect(status).toMatchObject({
      remotion: { available: true },
      hyperframes: { available: true },
    });
  });

  it("returns actionable preview and render events when an optional adapter is missing", async () => {
    const root = await mkdtemp(join(tmpdir(), "memoire-video-missing-"));
    try {
      const created = await createVideoProject(root, {
        title: "Missing adapter",
        prompt: "Render a demo",
        adapter: "hyperframes",
      });
      const preview = await previewVideoProject(root, created.id, {
        resolveCommand: () => null,
        resolvePackage: () => null,
      });
      const render = await renderVideoProject(root, created.id, {
        resolveCommand: () => null,
        resolvePackage: () => null,
      });

      expect(preview.status).toBe("missing-adapter");
      expect(render.events.map((event) => event.type)).toContain("video_render_failed");
      expect(render.message).toContain("Install hyperframes");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("opens Figma with a file context through the native launcher boundary", async () => {
    const root = await mkdtemp(join(tmpdir(), "memoire-figma-open-"));
    const opened: string[] = [];
    try {
      const controller = new StudioFigmaController({
        projectRoot: root,
        bridgeFactory: createBridge,
        openApp: async (target) => {
          opened.push(target);
        },
      });

      const result = await controller.openFigma({ fileKey: "abc123" });

      expect(result).toMatchObject({ status: "opened", target: "figma://file/abc123" });
      expect(opened).toEqual(["figma://file/abc123"]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

function createBridge(): StudioFigmaBridgeLike {
  return {
    isConnected: false,
    async connect() { return 9223; },
    async disconnect() {},
    getStatus() {
      return {
        running: false,
        port: null,
        clients: [],
        connectionState: "disconnected",
        reconnectAttempts: 0,
        lastConnectedAt: null,
        lastDisconnectedAt: null,
      };
    },
    async getSelection() { return {}; },
    async extractDesignSystem() { return {}; },
    async extractStickies() { return []; },
    async getPageTree() { return {}; },
    async getWidgetSnapshot() { return {}; },
    async captureScreenshot() { return {}; },
    async pushTokens() {},
  };
}
