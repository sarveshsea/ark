import { describe, it, expect } from "vitest";
import { generateDataViz } from "../dataviz-generator.js";
import type { DataVizSpec } from "../../specs/types.js";
import type { CodegenContext } from "../generator.js";

function makeDataVizSpec(overrides: Partial<DataVizSpec> = {}): DataVizSpec {
  return {
    name: "RevenueChart",
    type: "dataviz",
    chartType: "line",
    library: "recharts",
    dataShape: {
      x: "month",
      y: "value",
      series: ["revenue"],
    },
    interactions: ["hover-tooltip"],
    responsive: {
      mobile: { height: 200 },
      tablet: { height: 300 },
      desktop: { height: 400 },
    },
    accessibility: {
      dataTableFallback: false,
      ariaLabel: "Revenue Chart",
    },
    sampleData: undefined,
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  } as DataVizSpec;
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

describe("generateDataViz", () => {
  it("generates valid TSX for a line chart", () => {
    const spec = makeDataVizSpec({ chartType: "line" });
    const { chart } = generateDataViz(spec, makeCtx());
    expect(chart).toContain("export function RevenueChart");
    expect(chart).toContain("LineChart");
    expect(chart).toContain("<Line");
  });

  it("includes Recharts imports for the correct chart type", () => {
    const spec = makeDataVizSpec({ chartType: "bar" });
    const { chart } = generateDataViz(spec, makeCtx());
    expect(chart).toContain("BarChart");
    expect(chart).toContain("Bar,");
    expect(chart).toContain("from \"recharts\"");
  });

  it("generates data point interface from dataShape", () => {
    const spec = makeDataVizSpec({
      dataShape: { x: "month", y: "value", series: ["revenue", "profit"] },
    });
    const { chart } = generateDataViz(spec, makeCtx());
    expect(chart).toContain("export interface RevenueChartDataPoint");
    expect(chart).toContain("month: string");
    expect(chart).toContain("value: number");
    expect(chart).toContain("revenue?: number");
    expect(chart).toContain("profit?: number");
  });

  it("includes sample data when provided", () => {
    const spec = makeDataVizSpec({
      sampleData: [
        { month: "Jan", value: 100, revenue: 80 },
        { month: "Feb", value: 200, revenue: 150 },
      ],
    });
    const { chart } = generateDataViz(spec, makeCtx());
    expect(chart).toContain("SAMPLE_DATA");
    expect(chart).toContain('"Jan"');
    expect(chart).toContain('"Feb"');
    expect(chart).toContain("data = SAMPLE_DATA");
  });

  it("includes data table fallback when accessibility.dataTableFallback = true", () => {
    const spec = makeDataVizSpec({
      accessibility: { dataTableFallback: true, ariaLabel: "Chart" },
    });
    const { chart } = generateDataViz(spec, makeCtx());
    expect(chart).toContain("<details");
    expect(chart).toContain("View data table");
    expect(chart).toContain("<table");
    expect(chart).toContain("<thead>");
  });

  it("wraps chart in Card component", () => {
    const spec = makeDataVizSpec();
    const { chart } = generateDataViz(spec, makeCtx());
    expect(chart).toContain("import { Card,");
    expect(chart).toContain("<Card");
    expect(chart).toContain("<CardContent>");
  });

  it("throws for unsupported chart type with recharts library", () => {
    const spec = makeDataVizSpec({
      chartType: "treemap" as never,
      library: "recharts",
    });
    expect(() => generateDataViz(spec, makeCtx())).toThrow(
      "Unsupported chart type for recharts: treemap"
    );
  });

  it("barrel exports correctly", () => {
    const spec = makeDataVizSpec();
    const { barrel } = generateDataViz(spec, makeCtx());
    expect(barrel).toContain('export { RevenueChart } from "./RevenueChart"');
    expect(barrel).toContain('export type { RevenueChartProps } from "./RevenueChart"');
  });
});
