import { describe, it, expect, beforeEach } from "vitest";
import { BidirectionalSync } from "../sync.js";
import type { DesignToken, DesignSystem } from "../registry.js";
import { EventEmitter } from "events";

function makeToken(name: string, value: string): DesignToken {
  return {
    name,
    collection: "colors",
    type: "color",
    values: { Light: value },
    cssVariable: `--${name}`,
  };
}

function makeDS(tokens: DesignToken[] = []): DesignSystem {
  return {
    tokens,
    components: [],
    styles: [],
    lastSync: new Date().toISOString(),
  };
}

function makeMockEngine(ds?: DesignSystem) {
  const registry = new EventEmitter() as EventEmitter & {
    designSystem: DesignSystem;
    updateToken: (name: string, token: DesignToken) => void;
    removeToken: (name: string) => boolean;
  };
  registry.designSystem = ds ?? makeDS();
  registry.updateToken = (name: string, token: DesignToken) => {
    const idx = registry.designSystem.tokens.findIndex((t) => t.name === name);
    if (idx >= 0) registry.designSystem.tokens[idx] = token;
    else registry.designSystem.tokens.push(token);
  };
  registry.removeToken = (name: string) => {
    const idx = registry.designSystem.tokens.findIndex((t) => t.name === name);
    if (idx >= 0) { registry.designSystem.tokens.splice(idx, 1); return true; }
    return false;
  };

  return {
    config: { projectRoot: "/tmp/memoire-sync-test" },
    registry,
    figma: { isConnected: false, pushTokens: async () => {} },
  };
}

let sync: BidirectionalSync;
let engine: ReturnType<typeof makeMockEngine>;

beforeEach(() => {
  engine = makeMockEngine(makeDS([makeToken("primary", "#000")]));
  sync = new BidirectionalSync(engine as never, { persistState: false });
});

describe("BidirectionalSync", () => {
  it("can be constructed", () => {
    expect(sync).toBeDefined();
    expect(sync.isGuarded).toBe(false);
  });

  it("enableGuard / disableGuard toggles the guard", () => {
    expect(sync.isGuarded).toBe(false);
    sync.enableGuard();
    expect(sync.isGuarded).toBe(true);
    sync.disableGuard();
    expect(sync.isGuarded).toBe(false);
  });

  it("getConflicts returns empty initially", () => {
    expect(sync.getConflicts()).toHaveLength(0);
  });

  it("sync completes without errors on fresh state", async () => {
    const result = await sync.sync();
    expect(result.direction).toBe("bidirectional");
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it("rejects concurrent sync calls", async () => {
    // Start a sync and immediately try another
    const first = sync.sync();
    await expect(sync.sync()).rejects.toThrow("Sync already in progress");
    await first;
  });

  it("emits sync-completed event", async () => {
    const events: unknown[] = [];
    sync.on("sync-completed", (result) => events.push(result));
    await sync.sync();
    expect(events).toHaveLength(1);
  });

  it("onVariableChanged tracks figma-side entity", () => {
    const events: unknown[] = [];
    sync.on("entity-updated", (data) => events.push(data));

    sync.onVariableChanged({
      name: "primary",
      collection: "colors",
      values: { Light: "#FFF" },
      updatedAt: Date.now(),
    });

    expect(events).toHaveLength(1);
    expect((events[0] as { source: string }).source).toBe("figma");
  });

  it("onVariableChanged is suppressed when guard is active", () => {
    const events: unknown[] = [];
    sync.on("entity-updated", (data) => events.push(data));

    sync.enableGuard();
    sync.onVariableChanged({
      name: "primary",
      collection: "colors",
      values: { Light: "#FFF" },
      updatedAt: Date.now(),
    });

    expect(events).toHaveLength(0);
  });

  it("onCodeTokenChanged tracks code-side entity", () => {
    const events: unknown[] = [];
    sync.on("entity-updated", (data) => events.push(data));

    sync.onCodeTokenChanged(makeToken("primary", "#333"));
    expect(events).toHaveLength(1);
    expect((events[0] as { source: string }).source).toBe("code");
  });

  it("resolveConflict marks a conflict as resolved", async () => {
    // Manually add a conflict to test resolution
    (sync as any).state.conflicts.push({
      entityType: "token",
      name: "primary",
      figmaHash: "aaa",
      codeHash: "bbb",
      figmaUpdatedAt: Date.now(),
      codeUpdatedAt: Date.now(),
      detectedAt: new Date().toISOString(),
      resolved: false,
    });

    expect(sync.getConflicts()).toHaveLength(1);
    const resolved = sync.resolveConflict("primary", "figma-wins");
    expect(resolved).toBe(true);
    expect(sync.getConflicts()).toHaveLength(0);
  });

  it("resolveConflict returns false for unknown conflicts", () => {
    expect(sync.resolveConflict("nonexistent", "code-wins")).toBe(false);
  });
});
