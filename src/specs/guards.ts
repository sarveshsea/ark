/**
 * Spec Type Guards — Centralised type narrowing functions for AnySpec.
 *
 * Import these instead of writing inline `spec.type === "component"` checks.
 * Each guard is a proper TypeScript type predicate so the compiler narrows
 * the union correctly.
 */

import type {
  AnySpec,
  ComponentSpec,
  PageSpec,
  DataVizSpec,
  DesignSpec,
  IASpec,
} from "./types.js";

/** Narrow an AnySpec to ComponentSpec. */
export function isComponentSpec(spec: AnySpec): spec is ComponentSpec {
  return spec.type === "component";
}

/** Narrow an AnySpec to PageSpec. */
export function isPageSpec(spec: AnySpec): spec is PageSpec {
  return spec.type === "page";
}

/** Narrow an AnySpec to DataVizSpec. */
export function isDataVizSpec(spec: AnySpec): spec is DataVizSpec {
  return spec.type === "dataviz";
}

/** Narrow an AnySpec to DesignSpec. */
export function isDesignSpec(spec: AnySpec): spec is DesignSpec {
  return spec.type === "design";
}

/** Narrow an AnySpec to IASpec. */
export function isIASpec(spec: AnySpec): spec is IASpec {
  return spec.type === "ia";
}
