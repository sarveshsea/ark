import { describe, it, expect } from "vitest";
import { generatePage } from "../page-generator.js";
import type { PageSpec } from "../../specs/types.js";
import type { CodegenContext } from "../generator.js";

function makePageSpec(overrides: Partial<PageSpec> = {}): PageSpec {
  return {
    name: "DashboardPage",
    type: "page",
    layout: "full-width",
    sections: [
      {
        name: "Hero Section",
        component: "HeroBlock",
        layout: "full-width",
        repeat: 1,
        props: { title: "Welcome" },
      },
    ],
    responsive: {
      mobile: "stack",
      tablet: "grid-2",
      desktop: "grid-3",
    },
    meta: { title: "Dashboard", description: "Main dashboard" },
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  } as PageSpec;
}

function makeCtx(): CodegenContext {
  return {
    project: {
      name: "test-project",
      root: "/tmp/test",
      framework: "next",
      hasTypescript: true,
      hasTailwind: true,
      hasShadcn: true,
      packageManager: "npm",
      detectedAt: new Date().toISOString(),
    },
    designSystem: {
      tokens: [],
      components: [],
      styles: [],
      lastSync: "",
    },
  } as CodegenContext;
}

describe("generatePage", () => {
  it("generates valid TSX for a full-width layout", () => {
    const spec = makePageSpec({ layout: "full-width" });
    const { page } = generatePage(spec, makeCtx());
    expect(page).toContain("export function DashboardPage");
    expect(page).toContain("min-h-screen");
    expect(page).toContain("container mx-auto");
  });

  it("uses sidebar-main layout template when spec.layout = 'sidebar-main'", () => {
    const spec = makePageSpec({ layout: "sidebar-main" });
    const { page } = generatePage(spec, makeCtx());
    expect(page).toContain("SidebarProvider");
    expect(page).toContain("SidebarInset");
    expect(page).toContain("AppSidebar");
    expect(page).toContain("SidebarTrigger");
  });

  it("imports referenced section components", () => {
    const spec = makePageSpec({
      sections: [
        { name: "Stats", component: "StatsPanel", layout: "full-width", repeat: 1, props: {} },
        { name: "Chart", component: "RevenueChart", layout: "full-width", repeat: 1, props: {} },
      ],
    });
    const { page } = generatePage(spec, makeCtx());
    expect(page).toContain('import { StatsPanel } from "@/generated/components/StatsPanel"');
    expect(page).toContain('import { RevenueChart } from "@/generated/components/RevenueChart"');
  });

  it("includes responsive classes from spec.responsive", () => {
    const spec = makePageSpec({
      responsive: { mobile: "stack", tablet: "grid-2", desktop: "grid-3" },
      sections: [
        { name: "Grid", component: "GridItem", layout: "half", repeat: 3, props: {} },
      ],
    });
    const { page } = generatePage(spec, makeCtx());
    expect(page).toContain("max-sm:flex max-sm:flex-col");
    expect(page).toContain("sm:grid-cols-2");
    expect(page).toContain("lg:grid-cols-3");
  });

  it("generates correct props interface with derived data props", () => {
    const spec = makePageSpec({
      sections: [
        { name: "Content", component: "Content", layout: "full-width", repeat: 1, props: { heading: "Hello", count: 42 } },
      ],
      meta: { title: "Test" },
    });
    const { page } = generatePage(spec, makeCtx());
    expect(page).toContain("export interface DashboardPageProps");
    expect(page).toContain("heading?: string");
    expect(page).toContain("count?: number");
    expect(page).toContain("pageTitle?: string");
    expect(page).toContain("pageDescription?: string");
  });

  it("barrel exports the page component and types", () => {
    const spec = makePageSpec();
    const { barrel } = generatePage(spec, makeCtx());
    expect(barrel).toContain('export { DashboardPage } from "./DashboardPage"');
    expect(barrel).toContain('export type { DashboardPageProps } from "./DashboardPage"');
  });

  it("produces no section JSX when sections are empty", () => {
    const spec = makePageSpec({ sections: [] });
    const { page } = generatePage(spec, makeCtx());
    expect(page).toContain("export function DashboardPage");
    expect(page).not.toContain("<section");
    expect(page).not.toContain("HeroBlock");
  });
});
