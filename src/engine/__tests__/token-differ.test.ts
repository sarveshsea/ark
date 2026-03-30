import { describe, it, expect } from "vitest";
import {
  entityHash,
  tokenHash,
  componentHash,
  styleHash,
  diffDesignSystem,
  diffTokens,
  diffComponents,
  diffStyles,
  detectConflicts,
  type SyncEntity,
} from "../token-differ.js";
import type { DesignToken, DesignComponent, DesignStyle, DesignSystem } from "../registry.js";

function makeToken(overrides: Partial<DesignToken> = {}): DesignToken {
  return {
    name: "primary-color",
    collection: "colors",
    type: "color",
    values: { Light: "#000000" },
    cssVariable: "--primary-color",
    ...overrides,
  };
}

function makeComponent(overrides: Partial<DesignComponent> = {}): DesignComponent {
  return {
    name: "Button",
    key: "btn-001",
    description: "Primary button",
    variants: ["default", "outline"],
    properties: {},
    figmaNodeId: "1:2",
    ...overrides,
  };
}

function makeStyle(overrides: Partial<DesignStyle> = {}): DesignStyle {
  return {
    name: "heading-1",
    type: "text",
    value: { fontSize: 32 },
    ...overrides,
  };
}

function makeDS(overrides: Partial<DesignSystem> = {}): DesignSystem {
  return {
    tokens: [],
    components: [],
    styles: [],
    lastSync: new Date().toISOString(),
    ...overrides,
  };
}

describe("entityHash", () => {
  it("produces consistent hashes for the same input", () => {
    const a = entityHash({ name: "test", value: 42 });
    const b = entityHash({ name: "test", value: 42 });
    expect(a).toBe(b);
  });

  it("produces different hashes for different inputs", () => {
    const a = entityHash({ name: "test", value: 42 });
    const b = entityHash({ name: "test", value: 43 });
    expect(a).not.toBe(b);
  });

  it("returns a 16-char hex string", () => {
    const hash = entityHash({ foo: "bar" });
    expect(hash).toMatch(/^[a-f0-9]{16}$/);
  });
});

describe("tokenHash", () => {
  it("hashes by name, collection, type, and values", () => {
    const t1 = makeToken();
    const t2 = makeToken({ values: { Light: "#FFFFFF" } });
    expect(tokenHash(t1)).not.toBe(tokenHash(t2));
  });

  it("ignores cssVariable changes", () => {
    const t1 = makeToken({ cssVariable: "--a" });
    const t2 = makeToken({ cssVariable: "--b" });
    expect(tokenHash(t1)).toBe(tokenHash(t2));
  });
});

describe("componentHash", () => {
  it("detects variant changes", () => {
    const c1 = makeComponent();
    const c2 = makeComponent({ variants: ["default"] });
    expect(componentHash(c1)).not.toBe(componentHash(c2));
  });
});

describe("styleHash", () => {
  it("detects value changes", () => {
    const s1 = makeStyle();
    const s2 = makeStyle({ value: { fontSize: 24 } });
    expect(styleHash(s1)).not.toBe(styleHash(s2));
  });
});

describe("diffTokens", () => {
  it("detects added tokens", () => {
    const before: DesignToken[] = [];
    const after = [makeToken()];
    const changes = diffTokens(before, after);
    expect(changes).toHaveLength(1);
    expect(changes[0].type).toBe("added");
    expect(changes[0].name).toBe("primary-color");
  });

  it("detects removed tokens", () => {
    const before = [makeToken()];
    const after: DesignToken[] = [];
    const changes = diffTokens(before, after);
    expect(changes).toHaveLength(1);
    expect(changes[0].type).toBe("removed");
  });

  it("detects modified tokens", () => {
    const before = [makeToken()];
    const after = [makeToken({ values: { Light: "#FFFFFF" } })];
    const changes = diffTokens(before, after);
    expect(changes).toHaveLength(1);
    expect(changes[0].type).toBe("modified");
  });

  it("returns empty for identical tokens", () => {
    const tokens = [makeToken()];
    const changes = diffTokens(tokens, tokens);
    expect(changes).toHaveLength(0);
  });
});

describe("diffComponents", () => {
  it("detects added and removed components", () => {
    const before = [makeComponent({ name: "Old" })];
    const after = [makeComponent({ name: "New" })];
    const changes = diffComponents(before, after);
    expect(changes).toHaveLength(2);
    expect(changes.find((c) => c.type === "removed")?.name).toBe("Old");
    expect(changes.find((c) => c.type === "added")?.name).toBe("New");
  });
});

describe("diffStyles", () => {
  it("detects style modifications", () => {
    const before = [makeStyle()];
    const after = [makeStyle({ value: { fontSize: 48 } })];
    const changes = diffStyles(before, after);
    expect(changes).toHaveLength(1);
    expect(changes[0].type).toBe("modified");
  });
});

describe("diffDesignSystem", () => {
  it("returns hasChanges: false for identical systems", () => {
    const ds = makeDS({ tokens: [makeToken()], components: [makeComponent()] });
    const diff = diffDesignSystem(ds, ds);
    expect(diff.hasChanges).toBe(false);
    expect(diff.summary).toBe("No changes");
  });

  it("returns summary with counts for changes", () => {
    const before = makeDS();
    const after = makeDS({ tokens: [makeToken()], components: [makeComponent()] });
    const diff = diffDesignSystem(before, after);
    expect(diff.hasChanges).toBe(true);
    expect(diff.summary).toContain("1 token");
    expect(diff.summary).toContain("1 component");
  });

  it("handles mixed add/remove/modify across entity types", () => {
    const before = makeDS({
      tokens: [makeToken({ name: "a" }), makeToken({ name: "b" })],
      components: [makeComponent({ name: "X" })],
    });
    const after = makeDS({
      tokens: [makeToken({ name: "a", values: { Light: "#111" } }), makeToken({ name: "c" })],
      components: [],
    });
    const diff = diffDesignSystem(before, after);
    expect(diff.hasChanges).toBe(true);
    // b removed, a modified, c added = 3 token changes
    expect(diff.tokens).toHaveLength(3);
    // X removed = 1 component change
    expect(diff.components).toHaveLength(1);
  });
});

describe("detectConflicts", () => {
  it("detects conflicts when both sides changed within the time window", () => {
    const now = Date.now();
    const figma = new Map<string, SyncEntity>([
      ["color", { name: "color", hash: "aaa", updatedAt: now, source: "figma" }],
    ]);
    const code = new Map<string, SyncEntity>([
      ["color", { name: "color", hash: "bbb", updatedAt: now + 500, source: "code" }],
    ]);

    const conflicts = detectConflicts(figma, code, 1000);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].name).toBe("color");
    expect(conflicts[0].resolved).toBe(false);
  });

  it("ignores changes outside the time window", () => {
    const figma = new Map<string, SyncEntity>([
      ["color", { name: "color", hash: "aaa", updatedAt: 1000, source: "figma" }],
    ]);
    const code = new Map<string, SyncEntity>([
      ["color", { name: "color", hash: "bbb", updatedAt: 5000, source: "code" }],
    ]);

    const conflicts = detectConflicts(figma, code, 1000);
    expect(conflicts).toHaveLength(0);
  });

  it("ignores matching hashes", () => {
    const now = Date.now();
    const figma = new Map<string, SyncEntity>([
      ["color", { name: "color", hash: "same", updatedAt: now, source: "figma" }],
    ]);
    const code = new Map<string, SyncEntity>([
      ["color", { name: "color", hash: "same", updatedAt: now, source: "code" }],
    ]);

    const conflicts = detectConflicts(figma, code, 1000);
    expect(conflicts).toHaveLength(0);
  });
});
