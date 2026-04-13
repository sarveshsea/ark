import { describe, it, expect } from "vitest";
import { autoSpecFromDesignSystem } from "../auto-spec.js";
import type { DesignComponent, DesignSystem } from "../registry.js";

function makeComponent(overrides: Partial<DesignComponent> = {}): DesignComponent {
  return {
    name: "TestComponent",
    key: "comp:1",
    description: "",
    variants: [],
    properties: {},
    figmaNodeId: "1:1",
    ...overrides,
  };
}

function makeDesignSystem(components: DesignComponent[]): DesignSystem {
  return {
    tokens: [],
    components,
    styles: [],
    lastSync: new Date().toISOString(),
  };
}

describe("autoSpecFromDesignSystem", () => {
  it("sanitizes component names correctly", () => {
    const ds = makeDesignSystem([
      makeComponent({ name: "Sidebar / Nav Item", key: "k1" }),
    ]);
    const { specs } = autoSpecFromDesignSystem(ds, new Set());
    expect(specs).toHaveLength(1);
    expect(specs[0].name).toBe("SidebarNavItem");
  });

  it("infers atom level for Button", () => {
    const ds = makeDesignSystem([
      makeComponent({ name: "Button", key: "k1" }),
    ]);
    const { specs } = autoSpecFromDesignSystem(ds, new Set());
    expect(specs[0].level).toBe("atom");
  });

  it("infers molecule level for SearchBar", () => {
    const ds = makeDesignSystem([
      makeComponent({ name: "SearchBar", key: "k2" }),
    ]);
    const { specs } = autoSpecFromDesignSystem(ds, new Set());
    expect(specs[0].level).toBe("molecule");
  });

  it("infers organism level for Header", () => {
    const ds = makeDesignSystem([
      makeComponent({ name: "Header", key: "k3" }),
    ]);
    const { specs } = autoSpecFromDesignSystem(ds, new Set());
    expect(specs[0].level).toBe("organism");
  });

  it("infers template level for PageLayout", () => {
    const ds = makeDesignSystem([
      makeComponent({ name: "PageLayout", key: "k4" }),
    ]);
    const { specs } = autoSpecFromDesignSystem(ds, new Set());
    expect(specs[0].level).toBe("template");
  });

  it("infers shadcn base Button from LoginButton name", () => {
    const ds = makeDesignSystem([
      makeComponent({ name: "LoginButton", key: "k1" }),
    ]);
    const { specs } = autoSpecFromDesignSystem(ds, new Set());
    expect(specs[0].shadcnBase).toContain("Button");
  });

  it("infers shadcn base Card from ProfileCard name", () => {
    const ds = makeDesignSystem([
      makeComponent({ name: "ProfileCard", key: "k2" }),
    ]);
    const { specs } = autoSpecFromDesignSystem(ds, new Set());
    expect(specs[0].shadcnBase).toContain("Card");
  });

  it("skips components that already exist in existingSpecNames", () => {
    const ds = makeDesignSystem([
      makeComponent({ name: "Button", key: "k1" }),
      makeComponent({ name: "Card", key: "k2" }),
    ]);
    const existing = new Set(["Button"]);
    const { specs, skipped } = autoSpecFromDesignSystem(ds, existing);
    expect(specs).toHaveLength(1);
    expect(specs[0].name).toBe("Card");
    expect(skipped).toContain("Button");
  });

  it("skips components with empty names", () => {
    const ds = makeDesignSystem([
      makeComponent({ name: "", key: "k1" }),
    ]);
    const { specs, skipped } = autoSpecFromDesignSystem(ds, new Set());
    expect(specs).toHaveLength(0);
    expect(skipped).toContain("");
  });

  it("skips components with names starting with a number", () => {
    const ds = makeDesignSystem([
      makeComponent({ name: "3DViewer", key: "k1" }),
    ]);
    const { specs, skipped } = autoSpecFromDesignSystem(ds, new Set());
    expect(specs).toHaveLength(0);
    expect(skipped).toContain("3DViewer");
  });

  it("infers accessibility role 'button' and ariaLabel 'required' for button components", () => {
    const ds = makeDesignSystem([
      makeComponent({ name: "SubmitButton", key: "k1" }),
    ]);
    const { specs } = autoSpecFromDesignSystem(ds, new Set());
    expect(specs[0].accessibility.role).toBe("button");
    expect(specs[0].accessibility.ariaLabel).toBe("required");
  });

  it("infers ariaLabel 'optional' for non-interactive card components", () => {
    const ds = makeDesignSystem([
      makeComponent({ name: "InfoCard", key: "k1" }),
    ]);
    const { specs } = autoSpecFromDesignSystem(ds, new Set());
    // Card is not interactive, so ariaLabel should be optional
    expect(specs[0].accessibility.ariaLabel).toBe("optional");
  });

  it("returns empty specs array for empty design system", () => {
    const ds = makeDesignSystem([]);
    const { specs, skipped } = autoSpecFromDesignSystem(ds, new Set());
    expect(specs).toHaveLength(0);
    expect(skipped).toHaveLength(0);
  });
});
