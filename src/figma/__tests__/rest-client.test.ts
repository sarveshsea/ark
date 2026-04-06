/**
 * REST Client stress tests — 55 conditions covering token parsing,
 * component mapping, style mapping, error handling, and partial failures.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { extractDesignSystemREST } from "../rest-client.js";

// ── Helpers ──────────────────────────────────────────────

function mockFetch(responses: Array<{ ok: boolean; status?: number; statusText?: string; body?: unknown }>) {
  let callIndex = 0;
  const mockFn = vi.fn(async () => {
    const r = responses[callIndex++] ?? responses[responses.length - 1];
    return {
      ok: r.ok,
      status: r.status ?? (r.ok ? 200 : 500),
      statusText: r.statusText ?? (r.ok ? "OK" : "Internal Server Error"),
      json: async () => r.body,
    };
  });
  vi.stubGlobal("fetch", mockFn);
  return mockFn;
}

function makeVariableResponse(overrides: object = {}) {
  return {
    meta: {
      variables: {
        "v/1": {
          id: "v/1",
          name: "colors/primary",
          resolvedType: "COLOR",
          valuesByMode: { "m1": { r: 0.2, g: 0.4, b: 0.8, a: 1 } },
          ...overrides,
        },
      },
      variableCollections: {
        "c/1": {
          id: "c/1",
          name: "Design Tokens",
          defaultModeId: "m1",
          modes: [{ modeId: "m1", name: "Light" }],
          variableIds: ["v/1"],
        },
      },
    },
  };
}

function makeComponentResponse(components = [
  { key: "abc123", name: "Button", node_id: "1:1", description: "Primary CTA" },
]) {
  return { meta: { components } };
}

function makeStyleResponse(styles = [
  { key: "s1", name: "fill/primary", node_id: "2:1", style_type: "FILL" },
]) {
  return { meta: { styles } };
}

function okAll() {
  return mockFetch([
    { ok: true, body: makeVariableResponse() },
    { ok: true, body: makeComponentResponse() },
    { ok: true, body: makeStyleResponse() },
  ]);
}

// ── Suite ─────────────────────────────────────────────────

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ── Return shape ─────────────────────────────────────────

describe("extractDesignSystemREST — return shape", () => {
  it("returns DesignSystem with tokens, components, styles, lastSync", async () => {
    okAll();
    const ds = await extractDesignSystemREST("file123", "token-abc");
    expect(ds).toHaveProperty("tokens");
    expect(ds).toHaveProperty("components");
    expect(ds).toHaveProperty("styles");
    expect(ds).toHaveProperty("lastSync");
  });

  it("lastSync is a valid ISO date string", async () => {
    okAll();
    const ds = await extractDesignSystemREST("file123", "token-abc");
    expect(() => new Date(ds.lastSync)).not.toThrow();
    expect(new Date(ds.lastSync).toISOString()).toBe(ds.lastSync);
  });

  it("makes exactly 3 fetch calls", async () => {
    const fn = okAll();
    await extractDesignSystemREST("file123", "token-abc");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("hits the correct variable endpoint", async () => {
    const fn = okAll();
    await extractDesignSystemREST("fileXYZ", "my-token");
    const urls = fn.mock.calls.map((c) => c[0] as string);
    expect(urls.some((u) => u.includes("/files/fileXYZ/variables/local"))).toBe(true);
  });

  it("hits the correct components endpoint", async () => {
    const fn = okAll();
    await extractDesignSystemREST("fileXYZ", "my-token");
    const urls = fn.mock.calls.map((c) => c[0] as string);
    expect(urls.some((u) => u.includes("/files/fileXYZ/components"))).toBe(true);
  });

  it("hits the correct styles endpoint", async () => {
    const fn = okAll();
    await extractDesignSystemREST("fileXYZ", "my-token");
    const urls = fn.mock.calls.map((c) => c[0] as string);
    expect(urls.some((u) => u.includes("/files/fileXYZ/styles"))).toBe(true);
  });

  it("sends X-Figma-Token header on all calls", async () => {
    const fn = okAll();
    await extractDesignSystemREST("fileXYZ", "secret-token");
    for (const call of fn.mock.calls) {
      const headers = (call[1] as RequestInit).headers as Record<string, string>;
      expect(headers["X-Figma-Token"]).toBe("secret-token");
    }
  });
});

// ── Token type inference ──────────────────────────────────

describe("extractDesignSystemREST — token type inference", () => {
  async function singleToken(name: string, resolvedType: string) {
    mockFetch([
      { ok: true, body: makeVariableResponse({ name, resolvedType }) },
      { ok: true, body: makeComponentResponse([]) },
      { ok: true, body: makeStyleResponse([]) },
    ]);
    const ds = await extractDesignSystemREST("f", "t");
    return ds.tokens[0];
  }

  it("COLOR resolvedType → type 'color'", async () => {
    expect((await singleToken("primary", "COLOR"))?.type).toBe("color");
  });

  it("FLOAT with 'radius' in name → type 'radius'", async () => {
    expect((await singleToken("border-radius-md", "FLOAT"))?.type).toBe("radius");
  });

  it("FLOAT with 'round' in name → type 'radius'", async () => {
    expect((await singleToken("rounded-full", "FLOAT"))?.type).toBe("radius");
  });

  it("FLOAT with 'space' in name → type 'spacing'", async () => {
    expect((await singleToken("spacing/space-4", "FLOAT"))?.type).toBe("spacing");
  });

  it("FLOAT with 'gap' in name → type 'spacing'", async () => {
    expect((await singleToken("gap-base", "FLOAT"))?.type).toBe("spacing");
  });

  it("FLOAT with 'padding' in name → type 'spacing'", async () => {
    expect((await singleToken("padding-lg", "FLOAT"))?.type).toBe("spacing");
  });

  it("FLOAT with 'margin' in name → type 'spacing'", async () => {
    expect((await singleToken("margin-sm", "FLOAT"))?.type).toBe("spacing");
  });

  it("FLOAT with 'shadow' in name → type 'shadow'", async () => {
    expect((await singleToken("shadow-md", "FLOAT"))?.type).toBe("shadow");
  });

  it("FLOAT with 'elevation' in name → type 'shadow'", async () => {
    expect((await singleToken("elevation-2", "FLOAT"))?.type).toBe("shadow");
  });

  it("FLOAT with 'font' in name → type 'typography'", async () => {
    expect((await singleToken("font-size-base", "FLOAT"))?.type).toBe("typography");
  });

  it("FLOAT with 'text' in name → type 'typography'", async () => {
    expect((await singleToken("text-sm", "FLOAT"))?.type).toBe("typography");
  });

  it("FLOAT with 'line' in name → type 'typography'", async () => {
    expect((await singleToken("line-height-loose", "FLOAT"))?.type).toBe("typography");
  });

  it("FLOAT with unknown name → type 'spacing' (default)", async () => {
    expect((await singleToken("some-value", "FLOAT"))?.type).toBe("spacing");
  });

  it("STRING with 'font' in name → type 'typography'", async () => {
    expect((await singleToken("font-family", "STRING"))?.type).toBe("typography");
  });

  it("STRING with 'text' in name → type 'typography'", async () => {
    expect((await singleToken("text-transform", "STRING"))?.type).toBe("typography");
  });

  it("STRING with unknown name → type 'other'", async () => {
    expect((await singleToken("anything", "STRING"))?.type).toBe("other");
  });

  it("unknown resolvedType → type 'other'", async () => {
    expect((await singleToken("something", "BOOLEAN"))?.type).toBe("other");
  });
});

// ── Token value formatting ────────────────────────────────

describe("extractDesignSystemREST — token value formatting", () => {
  async function singleValue(modeValue: unknown, resolvedType = "COLOR") {
    mockFetch([
      {
        ok: true, body: {
          meta: {
            variables: {
              "v/1": { id: "v/1", name: "test", resolvedType, valuesByMode: { "m1": modeValue } },
            },
            variableCollections: {
              "c/1": { id: "c/1", name: "T", defaultModeId: "m1", modes: [{ modeId: "m1", name: "Light" }], variableIds: ["v/1"] },
            },
          },
        },
      },
      { ok: true, body: makeComponentResponse([]) },
      { ok: true, body: makeStyleResponse([]) },
    ]);
    const ds = await extractDesignSystemREST("f", "t");
    return ds.tokens[0]?.values["Light"];
  }

  it("RGB color object → hex string", async () => {
    const val = await singleValue({ r: 1, g: 0, b: 0 });
    expect(val).toBe("#ff0000");
  });

  it("RGB color with full alpha → hex without alpha", async () => {
    const val = await singleValue({ r: 0, g: 1, b: 0, a: 1 });
    expect(val).toBe("#00ff00");
  });

  it("RGB color with partial alpha → 8-digit hex", async () => {
    const val = await singleValue({ r: 0, g: 0, b: 1, a: 0.5 });
    expect(typeof val).toBe("string");
    expect((val as string).startsWith("#")).toBe(true);
    expect((val as string).length).toBe(9);
  });

  it("numeric value → number", async () => {
    const val = await singleValue(16, "FLOAT");
    expect(val).toBe(16);
  });

  it("string value → string", async () => {
    const val = await singleValue("Inter, sans-serif", "STRING");
    expect(val).toBe("Inter, sans-serif");
  });

  it("unknown value type → JSON.stringify output", async () => {
    const val = await singleValue({ weird: true }, "STRING");
    expect(typeof val).toBe("string");
  });
});

// ── CSS variable generation ───────────────────────────────

describe("extractDesignSystemREST — cssVariable generation", () => {
  async function singleCssVar(name: string) {
    mockFetch([
      {
        ok: true, body: {
          meta: {
            variables: {
              "v/1": { id: "v/1", name, resolvedType: "FLOAT", valuesByMode: { "m1": 8 } },
            },
            variableCollections: {
              "c/1": { id: "c/1", name: "T", defaultModeId: "m1", modes: [{ modeId: "m1", name: "Light" }], variableIds: ["v/1"] },
            },
          },
        },
      },
      { ok: true, body: makeComponentResponse([]) },
      { ok: true, body: makeStyleResponse([]) },
    ]);
    const ds = await extractDesignSystemREST("f", "t");
    return ds.tokens[0]?.cssVariable;
  }

  it("simple name → --name", async () => {
    expect(await singleCssVar("size")).toBe("--size");
  });

  it("slash separators → dashes", async () => {
    expect(await singleCssVar("colors/primary")).toBe("--colors-primary");
  });

  it("spaces → dashes", async () => {
    expect(await singleCssVar("font size")).toBe("--font-size");
  });

  it("uppercase → lowercase", async () => {
    expect(await singleCssVar("BrandColor")).toBe("--brandcolor");
  });
});

// ── Multi-mode variables ──────────────────────────────────

describe("extractDesignSystemREST — multi-mode variables", () => {
  it("maps mode names as keys (not modeIds)", async () => {
    mockFetch([
      {
        ok: true, body: {
          meta: {
            variables: {
              "v/1": {
                id: "v/1", name: "bg", resolvedType: "COLOR",
                valuesByMode: {
                  "m1": { r: 1, g: 1, b: 1 },
                  "m2": { r: 0, g: 0, b: 0 },
                },
              },
            },
            variableCollections: {
              "c/1": {
                id: "c/1", name: "Tokens", defaultModeId: "m1",
                modes: [
                  { modeId: "m1", name: "Light" },
                  { modeId: "m2", name: "Dark" },
                ],
                variableIds: ["v/1"],
              },
            },
          },
        },
      },
      { ok: true, body: makeComponentResponse([]) },
      { ok: true, body: makeStyleResponse([]) },
    ]);
    const ds = await extractDesignSystemREST("f", "t");
    expect(ds.tokens[0].values).toHaveProperty("Light");
    expect(ds.tokens[0].values).toHaveProperty("Dark");
  });

  it("falls back to modeId if mode name not found", async () => {
    mockFetch([
      {
        ok: true, body: {
          meta: {
            variables: {
              "v/1": {
                id: "v/1", name: "size", resolvedType: "FLOAT",
                valuesByMode: { "orphan-mode": 12 },
              },
            },
            variableCollections: {
              "c/1": {
                id: "c/1", name: "T", defaultModeId: "orphan-mode",
                modes: [{ modeId: "known-mode", name: "Default" }],
                variableIds: ["v/1"],
              },
            },
          },
        },
      },
      { ok: true, body: makeComponentResponse([]) },
      { ok: true, body: makeStyleResponse([]) },
    ]);
    const ds = await extractDesignSystemREST("f", "t");
    expect(ds.tokens[0].values).toHaveProperty("orphan-mode");
  });
});

// ── Component parsing ────────────────────────────────────

describe("extractDesignSystemREST — component parsing", () => {
  async function components(list: object[]) {
    mockFetch([
      { ok: true, body: { meta: { variables: {}, variableCollections: {} } } },
      { ok: true, body: { meta: { components: list } } },
      { ok: true, body: makeStyleResponse([]) },
    ]);
    return (await extractDesignSystemREST("f", "t")).components;
  }

  it("maps name", async () => {
    const cs = await components([{ key: "k", name: "Button", node_id: "1:1" }]);
    expect(cs[0].name).toBe("Button");
  });

  it("maps key", async () => {
    const cs = await components([{ key: "abc", name: "X", node_id: "1:1" }]);
    expect(cs[0].key).toBe("abc");
  });

  it("maps node_id to figmaNodeId", async () => {
    const cs = await components([{ key: "k", name: "X", node_id: "5:42" }]);
    expect(cs[0].figmaNodeId).toBe("5:42");
  });

  it("maps description", async () => {
    const cs = await components([{ key: "k", name: "X", node_id: "1:1", description: "A button" }]);
    expect(cs[0].description).toBe("A button");
  });

  it("missing description defaults to empty string", async () => {
    const cs = await components([{ key: "k", name: "X", node_id: "1:1" }]);
    expect(cs[0].description).toBe("");
  });

  it("variants always empty array (REST has no variant data)", async () => {
    const cs = await components([{ key: "k", name: "X", node_id: "1:1" }]);
    expect(cs[0].variants).toEqual([]);
  });

  it("properties always empty object", async () => {
    const cs = await components([{ key: "k", name: "X", node_id: "1:1" }]);
    expect(cs[0].properties).toEqual({});
  });

  it("null components response → empty array", async () => {
    const cs = await components(null as unknown as object[]);
    expect(cs).toEqual([]);
  });

  it("multiple components all parsed", async () => {
    const cs = await components([
      { key: "k1", name: "Button", node_id: "1:1" },
      { key: "k2", name: "Card", node_id: "1:2" },
      { key: "k3", name: "Input", node_id: "1:3" },
    ]);
    expect(cs).toHaveLength(3);
  });
});

// ── Style parsing ─────────────────────────────────────────

describe("extractDesignSystemREST — style parsing", () => {
  async function styles(list: object[]) {
    mockFetch([
      { ok: true, body: { meta: { variables: {}, variableCollections: {} } } },
      { ok: true, body: makeComponentResponse([]) },
      { ok: true, body: { meta: { styles: list } } },
    ]);
    return (await extractDesignSystemREST("f", "t")).styles;
  }

  it("FILL → type 'fill'", async () => {
    expect((await styles([{ key: "s", name: "bg", node_id: "1:1", style_type: "FILL" }]))[0]?.type).toBe("fill");
  });

  it("TEXT → type 'text'", async () => {
    expect((await styles([{ key: "s", name: "body", node_id: "1:1", style_type: "TEXT" }]))[0]?.type).toBe("text");
  });

  it("EFFECT → type 'effect'", async () => {
    expect((await styles([{ key: "s", name: "shadow", node_id: "1:1", style_type: "EFFECT" }]))[0]?.type).toBe("effect");
  });

  it("GRID → type 'grid'", async () => {
    expect((await styles([{ key: "s", name: "layout", node_id: "1:1", style_type: "GRID" }]))[0]?.type).toBe("grid");
  });

  it("unknown style_type → falls back to 'fill'", async () => {
    expect((await styles([{ key: "s", name: "x", node_id: "1:1", style_type: "UNKNOWN" }]))[0]?.type).toBe("fill");
  });

  it("null styles → empty array", async () => {
    expect(await styles(null as unknown as object[])).toEqual([]);
  });

  it("value always empty object (REST has no style value data)", async () => {
    const ss = await styles([{ key: "s", name: "bg", node_id: "1:1", style_type: "FILL" }]);
    expect(ss[0].value).toEqual({});
  });
});

// ── HTTP error handling ───────────────────────────────────

describe("extractDesignSystemREST — HTTP error handling", () => {
  it("403 on any endpoint → throws with token/permissions message", async () => {
    mockFetch([{ ok: false, status: 403, statusText: "Forbidden", body: {} }]);
    await expect(extractDesignSystemREST("f", "t")).rejects.toThrow(
      "Invalid FIGMA_TOKEN or insufficient file permissions"
    );
  });

  it("404 on any endpoint → throws with file key message", async () => {
    mockFetch([{ ok: false, status: 404, statusText: "Not Found", body: {} }]);
    await expect(extractDesignSystemREST("f", "t")).rejects.toThrow(
      "File not found. Check FIGMA_FILE_KEY"
    );
  });

  it("500 on any endpoint → throws with status code", async () => {
    mockFetch([{ ok: false, status: 500, statusText: "Internal Server Error", body: {} }]);
    await expect(extractDesignSystemREST("f", "t")).rejects.toThrow("500");
  });

  it("variables fetch fails → empty tokens but still returns result", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => makeComponentResponse() })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => makeStyleResponse() })
    );
    const ds = await extractDesignSystemREST("f", "t");
    expect(ds.tokens).toEqual([]);
    expect(ds.components.length).toBeGreaterThan(0);
  });

  it("components fetch fails → empty components, tokens/styles still returned", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => makeVariableResponse() })
      .mockRejectedValueOnce(new Error("Timeout"))
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => makeStyleResponse() })
    );
    const ds = await extractDesignSystemREST("f", "t");
    expect(ds.components).toEqual([]);
    expect(ds.tokens.length).toBeGreaterThan(0);
    expect(ds.styles.length).toBeGreaterThan(0);
  });

  it("styles fetch fails → empty styles, tokens/components still returned", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => makeVariableResponse() })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => makeComponentResponse() })
      .mockRejectedValueOnce(new Error("Timeout"))
    );
    const ds = await extractDesignSystemREST("f", "t");
    expect(ds.styles).toEqual([]);
    expect(ds.tokens.length).toBeGreaterThan(0);
  });

  it("all three fail → returns empty DesignSystem (does not throw)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network unreachable")));
    const ds = await extractDesignSystemREST("f", "t");
    expect(ds.tokens).toEqual([]);
    expect(ds.components).toEqual([]);
    expect(ds.styles).toEqual([]);
  });

  it("variables meta missing → empty tokens", async () => {
    mockFetch([
      { ok: true, body: {} },
      { ok: true, body: makeComponentResponse([]) },
      { ok: true, body: makeStyleResponse([]) },
    ]);
    const ds = await extractDesignSystemREST("f", "t");
    expect(ds.tokens).toEqual([]);
  });

  it("variableCollections empty → no tokens", async () => {
    mockFetch([
      { ok: true, body: { meta: { variables: {}, variableCollections: {} } } },
      { ok: true, body: makeComponentResponse([]) },
      { ok: true, body: makeStyleResponse([]) },
    ]);
    const ds = await extractDesignSystemREST("f", "t");
    expect(ds.tokens).toEqual([]);
  });
});
