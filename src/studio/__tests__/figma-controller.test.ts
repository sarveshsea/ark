import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it, vi } from "vitest";
import { StudioFigmaController, type StudioFigmaBridgeLike } from "../figma-controller.js";

function createBridge(): StudioFigmaBridgeLike & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    isConnected: true,
    async connect(port?: number) {
      calls.push(`connect:${port ?? "scan"}`);
      return port ?? 9223;
    },
    async disconnect() {
      calls.push("disconnect");
    },
    getStatus() {
      return {
        running: true,
        port: 9223,
        clients: [{ id: "plugin-1", file: "Design System", editor: "figma", connectedAt: "2026-05-05T00:00:00.000Z" }],
        connectionState: "connected",
        reconnectAttempts: 0,
        lastConnectedAt: "2026-05-05T00:00:00.000Z",
        lastDisconnectedAt: null,
      };
    },
    async getSelection() {
      calls.push("getSelection");
      return { count: 1 };
    },
    async extractDesignSystem() {
      calls.push("extractDesignSystem");
      return { tokens: [{ name: "ink" }], components: [{ name: "Button" }], styles: [{ name: "Body" }], lastSync: "now" };
    },
    async extractStickies() {
      calls.push("extractStickies");
      return [{ id: "sticky-1", text: "Need stronger IA" }];
    },
    async getPageTree() {
      calls.push("getPageTree");
      return { fileKey: "abc", fileName: "Design System", pages: [] };
    },
    async getWidgetSnapshot() {
      calls.push("getWidgetSnapshot");
      return { protocol: "memoire.widget.v2" };
    },
    async captureScreenshot() {
      calls.push("captureScreenshot");
      return { base64: "abc", format: "PNG", scale: 2, byteLength: 3 };
    },
    async pushTokens(tokens) {
      calls.push(`pushTokens:${tokens.length}`);
    },
  };
}

describe("studio figma controller", () => {
  it("starts and stops the existing bridge while reporting connected clients", async () => {
    const root = await mkdtemp(join(tmpdir(), "memoire-figma-controller-"));
    const bridge = createBridge();
    try {
      const controller = new StudioFigmaController({ projectRoot: root, bridgeFactory: () => bridge });

      const connected = await controller.connect({ preferredPort: 9223 });
      const stopped = await controller.disconnect();

      expect(bridge.calls).toEqual(["connect:9223", "disconnect"]);
      expect(connected).toMatchObject({ running: true, port: 9223, connectionState: "connected" });
      expect(connected.clients[0]).toMatchObject({ file: "Design System" });
      expect(stopped.running).toBe(false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("routes allowlisted actions through the bridge and records events", async () => {
    const root = await mkdtemp(join(tmpdir(), "memoire-figma-controller-"));
    const bridge = createBridge();
    const onEvent = vi.fn();
    try {
      const controller = new StudioFigmaController({ projectRoot: root, bridgeFactory: () => bridge, onEvent });
      await controller.connect({ preferredPort: 9223 });

      const selection = await controller.runAction({ action: "inspectSelection" });
      const fullSync = await controller.runAction({ action: "fullSync" });
      await controller.runAction({ action: "pullStickies" });
      await controller.runAction({ action: "widgetSnapshot" });

      expect(selection.result).toEqual({ count: 1 });
      expect(fullSync.result).toMatchObject({ tokens: [{ name: "ink" }] });
      expect(bridge.calls).toEqual([
        "connect:9223",
        "getSelection",
        "extractDesignSystem",
        "extractStickies",
        "getWidgetSnapshot",
        "extractStickies",
        "getWidgetSnapshot",
      ]);
      expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({ type: "figma_action_started" }));
      expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({ type: "figma_action_completed" }));
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rejects unsupported actions before they reach the bridge", async () => {
    const root = await mkdtemp(join(tmpdir(), "memoire-figma-controller-"));
    try {
      const controller = new StudioFigmaController({ projectRoot: root, bridgeFactory: createBridge });
      await expect(controller.runAction({ action: "executeRaw" as never })).rejects.toThrow(/unsupported/i);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
