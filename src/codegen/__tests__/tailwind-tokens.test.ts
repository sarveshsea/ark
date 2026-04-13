import { describe, it, expect } from "vitest";
import {
  generateShadcnTokenMapping,
  exportToStyleDictionary,
} from "../tailwind-tokens.js";
import type { DesignToken } from "../../engine/registry.js";

function makeToken(overrides: Partial<DesignToken> = {}): DesignToken {
  return {
    name: "primary",
    collection: "colors",
    type: "color",
    values: { default: "#3b82f6" },
    cssVariable: "--color-primary",
    ...overrides,
  };
}

describe("generateShadcnTokenMapping", () => {
  it("maps color tokens to CSS custom properties", () => {
    const tokens = [makeToken({ name: "primary", cssVariable: "--color-primary", values: { default: "#3b82f6" } })];
    const result = generateShadcnTokenMapping(tokens);
    expect(result).toContain("--color-primary: #3b82f6");
  });

  it("maps 'primary' token to --primary shadcn variable", () => {
    const tokens = [makeToken({ name: "primary", values: { default: "#3b82f6" } })];
    const result = generateShadcnTokenMapping(tokens);
    expect(result).toContain("--primary:");
  });

  it("maps 'background' token to --background", () => {
    const tokens = [makeToken({ name: "background", cssVariable: "--color-bg", values: { default: "#ffffff" } })];
    const result = generateShadcnTokenMapping(tokens);
    expect(result).toContain("--background:");
  });

  it("includes spacing and radius tokens", () => {
    const tokens = [
      makeToken({ name: "spacing-md", type: "spacing", cssVariable: "--spacing-md", values: { default: 16 } }),
      makeToken({ name: "radius-lg", type: "radius", cssVariable: "--radius-lg", values: { default: "12px" } }),
    ];
    const result = generateShadcnTokenMapping(tokens);
    expect(result).toContain("--spacing-md: 16px");
    expect(result).toContain("--radius-lg: 12px");
  });

  it("generates dark mode overrides when tokens have dark mode values", () => {
    const tokens = [
      makeToken({
        name: "primary",
        cssVariable: "--color-primary",
        values: { default: "#3b82f6", dark: "#60a5fa" },
      }),
    ];
    const result = generateShadcnTokenMapping(tokens);
    expect(result).toContain(".dark {");
    expect(result).toContain("--color-primary: #60a5fa");
  });
});

describe("exportToStyleDictionary", () => {
  it("groups tokens by type (color, spacing, radius)", () => {
    const tokens = [
      makeToken({ name: "primary", type: "color" }),
      makeToken({ name: "md", type: "spacing", values: { default: 16 }, cssVariable: "--spacing-md", collection: "spacing" }),
      makeToken({ name: "lg", type: "radius", values: { default: "12px" }, cssVariable: "--radius-lg", collection: "radii" }),
    ];
    const result = exportToStyleDictionary(tokens);
    expect(result).toHaveProperty("color");
    expect(result).toHaveProperty("spacing");
    expect(result).toHaveProperty("radius");
  });

  it("uses $type and $value DTCG format", () => {
    const tokens = [makeToken({ name: "primary", type: "color", values: { default: "#3b82f6" } })];
    const result = exportToStyleDictionary(tokens) as Record<string, Record<string, unknown>>;
    expect(result.color.$type).toBe("color");
    const entry = result.color.primary as Record<string, unknown>;
    expect(entry.$value).toBe("#3b82f6");
  });

  it("converts numeric spacing values to px strings", () => {
    const tokens = [
      makeToken({ name: "md", type: "spacing", values: { default: 16 }, cssVariable: "--spacing-md", collection: "spacing" }),
    ];
    const result = exportToStyleDictionary(tokens) as Record<string, Record<string, unknown>>;
    const entry = result.spacing.md as Record<string, unknown>;
    expect(entry.$value).toBe("16px");
  });

  it("parses shadow values into structured objects", () => {
    const tokens = [
      makeToken({
        name: "card-shadow",
        type: "shadow",
        values: { default: "0px 4px 6px 0px #00000040" },
        cssVariable: "--shadow-card",
        collection: "shadows",
      }),
    ];
    const result = exportToStyleDictionary(tokens) as Record<string, Record<string, unknown>>;
    const entry = (result.shadow as Record<string, Record<string, unknown>>)["card-shadow"];
    expect(entry.$value).toEqual({
      offsetX: "0px",
      offsetY: "4px",
      blur: "6px",
      spread: "0px",
      color: "#00000040",
    });
  });

  it("excludes empty groups", () => {
    const tokens = [makeToken({ name: "primary", type: "color" })];
    const result = exportToStyleDictionary(tokens);
    // typography group should not exist since no typography tokens were provided
    expect(result).not.toHaveProperty("typography");
    expect(result).not.toHaveProperty("shadow");
  });

  it("handles multi-mode tokens", () => {
    const tokens = [
      makeToken({
        name: "primary",
        type: "color",
        values: { light: "#3b82f6", dark: "#60a5fa" },
        collection: "theme",
      }),
    ];
    const result = exportToStyleDictionary(tokens) as Record<string, Record<string, unknown>>;
    // Multi-mode tokens emit separate entries per mode
    const lightEntry = result.color["primary-light"] as Record<string, unknown>;
    const darkEntry = result.color["primary-dark"] as Record<string, unknown>;
    expect(lightEntry.$value).toBe("#3b82f6");
    expect(darkEntry.$value).toBe("#60a5fa");
  });
});
