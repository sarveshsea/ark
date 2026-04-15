import { describe, expect, it } from "vitest";
import { expandAxes, hashVariant, hashSpecShape } from "../variations.js";
import { ComponentSpecSchema } from "../types.js";
import type { ComponentSpec } from "../types.js";

function makeSpec(overrides: Partial<ComponentSpec> = {}): ComponentSpec {
  return ComponentSpecSchema.parse({
    name: "Button",
    type: "component",
    purpose: "Primary action",
    ...overrides,
  });
}

describe("expandAxes", () => {
  it("returns [] when variantAxes is absent", () => {
    expect(expandAxes(makeSpec())).toEqual([]);
  });

  it("returns [] when variantAxes is empty", () => {
    expect(expandAxes(makeSpec({ variantAxes: {} }))).toEqual([]);
  });

  it("expands a single axis", () => {
    const variants = expandAxes(makeSpec({ variantAxes: { size: ["sm", "md", "lg"] } }));
    expect(variants.map(v => v.id)).toEqual(["sm", "md", "lg"]);
  });

  it("expands two axes as cartesian product", () => {
    const variants = expandAxes(makeSpec({
      variantAxes: { size: ["sm", "lg"], tone: ["neutral", "brand"] },
    }));
    expect(variants).toHaveLength(4);
    const ids = variants.map(v => v.id).sort();
    expect(ids).toEqual(["lg-brand", "lg-neutral", "sm-brand", "sm-neutral"]);
  });

  it("expands three axes", () => {
    const variants = expandAxes(makeSpec({
      variantAxes: { size: ["sm", "md"], tone: ["a", "b"], density: ["x", "y"] },
    }));
    expect(variants).toHaveLength(8);
  });

  it("assigns axisValues correctly per variant", () => {
    const variants = expandAxes(makeSpec({
      variantAxes: { size: ["sm", "lg"], tone: ["brand"] },
    }));
    const smBrand = variants.find(v => v.id === "sm-brand");
    expect(smBrand?.axisValues).toEqual({ size: "sm", tone: "brand" });
  });

  it("hashes are unique per combo", () => {
    const variants = expandAxes(makeSpec({
      variantAxes: { size: ["sm", "md", "lg"], tone: ["neutral", "brand"] },
    }));
    const hashes = new Set(variants.map(v => v.hash));
    expect(hashes.size).toBe(variants.length);
  });

  it("ids are deterministic across runs regardless of axis declaration order", () => {
    const a = expandAxes(makeSpec({ variantAxes: { size: ["sm"], tone: ["brand"] } }));
    const b = expandAxes(makeSpec({ variantAxes: { tone: ["brand"], size: ["sm"] } }));
    expect(a[0].id).toBe(b[0].id);
    expect(a[0].hash).toBe(b[0].hash);
  });
});

describe("hashVariant", () => {
  it("is stable for identical inputs", () => {
    const a = hashVariant("spec123", { size: "sm", tone: "brand" }, "tokens-v1");
    const b = hashVariant("spec123", { size: "sm", tone: "brand" }, "tokens-v1");
    expect(a).toBe(b);
  });

  it("changes when token version changes", () => {
    const a = hashVariant("spec123", { size: "sm" }, "tokens-v1");
    const b = hashVariant("spec123", { size: "sm" }, "tokens-v2");
    expect(a).not.toBe(b);
  });

  it("changes when spec hash changes", () => {
    const a = hashVariant("spec123", { size: "sm" }, "t");
    const b = hashVariant("spec456", { size: "sm" }, "t");
    expect(a).not.toBe(b);
  });

  it("is order-independent over axisValues keys", () => {
    const a = hashVariant("s", { size: "sm", tone: "brand" }, "t");
    const b = hashVariant("s", { tone: "brand", size: "sm" }, "t");
    expect(a).toBe(b);
  });
});

describe("hashSpecShape", () => {
  it("excludes timestamps so clock churn doesn't bust cache", () => {
    const a = hashSpecShape(makeSpec({ createdAt: "2020-01-01" }));
    const b = hashSpecShape(makeSpec({ createdAt: "2026-04-15" }));
    expect(a).toBe(b);
  });

  it("changes when a meaningful field changes", () => {
    const a = hashSpecShape(makeSpec({ purpose: "x" }));
    const b = hashSpecShape(makeSpec({ purpose: "y" }));
    expect(a).not.toBe(b);
  });
});

describe("back-compat", () => {
  it("a spec without variantAxes behaves as today (expandAxes returns [])", () => {
    const spec = makeSpec({ variants: ["default", "primary", "ghost"] });
    expect(spec.variantAxes).toBeUndefined();
    expect(expandAxes(spec)).toEqual([]);
  });
});

describe("variantConstraints", () => {
  it("prunes combos listed in forbid", () => {
    const variants = expandAxes(makeSpec({
      variantAxes: { size: ["sm", "md", "lg"], tone: ["neutral", "brand"] },
      variantConstraints: { forbid: [{ size: "sm", tone: "brand" }] },
    }));
    expect(variants).toHaveLength(5);
    expect(variants.find(v => v.axisValues.size === "sm" && v.axisValues.tone === "brand")).toBeUndefined();
  });

  it("supports partial-rule matching — rule over one axis drops every combo with that value", () => {
    const variants = expandAxes(makeSpec({
      variantAxes: { size: ["sm", "md"], tone: ["a", "b", "c"] },
      variantConstraints: { forbid: [{ tone: "c" }] },
    }));
    expect(variants).toHaveLength(4);
    expect(variants.every(v => v.axisValues.tone !== "c")).toBe(true);
  });

  it("multiple forbid rules compose (OR)", () => {
    const variants = expandAxes(makeSpec({
      variantAxes: { size: ["sm", "md", "lg"], tone: ["a", "b"] },
      variantConstraints: { forbid: [{ size: "sm" }, { tone: "b" }] },
    }));
    // drops sm-a, sm-b, md-b, lg-b → leaves md-a, lg-a
    expect(variants.map(v => v.id).sort()).toEqual(["lg-a", "md-a"]);
  });

  it("empty forbid list is a no-op", () => {
    const variants = expandAxes(makeSpec({
      variantAxes: { size: ["sm", "md"] },
      variantConstraints: { forbid: [] },
    }));
    expect(variants).toHaveLength(2);
  });
});
