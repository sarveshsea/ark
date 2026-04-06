/**
 * WA-506 — Accessibility assertion tests for the gallery HTML output.
 *
 * All tests operate on the generated HTML string directly — no browser
 * or DOM runtime required.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { generatePreviewHTML } from "../templates/gallery-page.js";
import type { PreviewData } from "../templates/types.js";

// Minimal PreviewData fixture — satisfies the type without loading real data.
const mockData: PreviewData = {
  projectName: "Test Project",
  specs: [],
  tokens: [],
  research: null,
  generatedAt: "2026-01-01T00:00:00.000Z",
};

let html: string;

beforeAll(() => {
  html = generatePreviewHTML(mockData);
});

describe("WA-501: skip-to-content link", () => {
  it("contains a skip link with href #main-content", () => {
    expect(html).toContain('href="#main-content"');
  });

  it("skip link has class skip-link", () => {
    expect(html).toContain('class="skip-link"');
  });

  it("skip link appears before any other meaningful content (early in body)", () => {
    const bodyIndex = html.indexOf("<body>");
    const skipIndex = html.indexOf('class="skip-link"');
    expect(skipIndex).toBeGreaterThan(bodyIndex);
    // Skip link should appear within the first 500 chars after <body>
    expect(skipIndex - bodyIndex).toBeLessThan(500);
  });
});

describe("WA-502: semantic landmarks", () => {
  it("contains exactly one <main> element", () => {
    const matches = html.match(/<main[\s>]/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBe(1);
  });

  it("main content area has id=main-content", () => {
    expect(html).toContain('id="main-content"');
  });

  it("main content area has tabindex=-1", () => {
    // tabindex="-1" on the <main> element
    expect(html).toMatch(/tabindex="-1"/);
  });

  it("contains a <nav> element with aria-label", () => {
    expect(html).toMatch(/<nav\s[^>]*aria-label/);
  });

  it("nav aria-label references Mémoire navigation", () => {
    expect(html).toContain('aria-label="Mémoire navigation"');
  });

  it("contains a <footer> element", () => {
    expect(html).toMatch(/<footer[\s>]/);
  });

  it("contains a <header> element", () => {
    expect(html).toMatch(/<header[\s>]/);
  });
});

describe("WA-503: heading hierarchy", () => {
  it("contains exactly one <h1> element", () => {
    const matches = html.match(/<h1[\s>]/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBe(1);
  });

  it("contains at least one <h2> for section headings", () => {
    const matches = html.match(/<h2[\s>]/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(1);
  });
});

describe("WA-504: aria-live regions", () => {
  it("contains aria-live=polite", () => {
    expect(html).toContain('aria-live="polite"');
  });

  it("contains aria-atomic=true on a status region", () => {
    expect(html).toContain('aria-atomic="true"');
  });

  it("contains role=status on a dynamic container", () => {
    expect(html).toContain('role="status"');
  });

  it("pipeline-status element is present with live region attributes", () => {
    expect(html).toContain('id="pipeline-status"');
    // Verify it has both role=status and aria-live on same element (within 200 chars)
    const idx = html.indexOf('id="pipeline-status"');
    const chunk = html.slice(Math.max(0, idx - 50), idx + 200);
    expect(chunk).toContain('role="status"');
    expect(chunk).toContain('aria-live="polite"');
  });

  it("figma-bar has live region attributes", () => {
    const idx = html.indexOf('id="figma-bar"');
    expect(idx).toBeGreaterThan(-1);
    const chunk = html.slice(idx, idx + 150);
    expect(chunk).toContain('aria-live="polite"');
  });
});

describe("WA-505: focus indicators", () => {
  it("CSS contains :focus-visible rule", () => {
    expect(html).toContain(":focus-visible");
  });

  it(":focus-visible sets outline to #0066cc", () => {
    expect(html).toContain("#0066cc");
  });

  it("does not use outline: none without a replacement focus style", () => {
    // The CSS block should not contain a bare "outline:none" or "outline: none"
    // without an associated :focus or :focus-visible rule immediately following.
    // We verify the raw absence of the exact pattern used before the fix.
    const cssStart = html.indexOf("<style>");
    const cssEnd = html.indexOf("</style>");
    const cssBlock = cssStart >= 0 && cssEnd > cssStart
      ? html.slice(cssStart, cssEnd)
      : html;
    expect(cssBlock).not.toMatch(/outline\s*:\s*none(?![^}]*:focus)/);
  });
});
