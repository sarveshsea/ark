/**
 * Variation expansion — turns a spec's `variantAxes` declaration into a
 * concrete list of variants with stable hashes for caching.
 *
 * v1: cartesian product only. Sparse / budget-capped / random sampling modes
 * are deferred — they will plug into `expandAxes` without touching callers.
 */

import { createHash } from "node:crypto";
import type { ComponentSpec } from "./types.js";

export interface VariantDescriptor {
  /** Canonical id (e.g. "sm-neutral"). Stable across runs. */
  id: string;
  /** User-facing display name, identical to id in v1. */
  name: string;
  /** Per-axis values for this variant. */
  axisValues: Record<string, string>;
  /** Content hash — changes when spec, axis values, or tokens change. */
  hash: string;
}

/**
 * Returns true when `axisValues` satisfies every forbid-rule in `constraint`.
 * A forbid rule matches when EVERY key in the rule equals the variant's value
 * for that axis. Axes not mentioned in the rule are wildcards.
 */
function isForbidden(
  axisValues: Record<string, string>,
  forbid: Array<Record<string, string>>,
): boolean {
  for (const rule of forbid) {
    let matchesAll = true;
    for (const k of Object.keys(rule)) {
      if (axisValues[k] !== rule[k]) {
        matchesAll = false;
        break;
      }
    }
    if (matchesAll) return true;
  }
  return false;
}

/** Expand `variantAxes` as a full cartesian product, minus any `variantConstraints.forbid` combos. */
export function expandAxes(spec: ComponentSpec, tokenVersion = ""): VariantDescriptor[] {
  const axes = spec.variantAxes;
  if (!axes || Object.keys(axes).length === 0) return [];

  const axisNames = Object.keys(axes).sort();
  const axisValueLists = axisNames.map((name) => axes[name]);
  const forbid = spec.variantConstraints?.forbid ?? [];

  const combos: Record<string, string>[] = [];
  const walk = (i: number, acc: Record<string, string>) => {
    if (i === axisNames.length) {
      if (!isForbidden(acc, forbid)) combos.push({ ...acc });
      return;
    }
    for (const v of axisValueLists[i]) {
      acc[axisNames[i]] = v;
      walk(i + 1, acc);
    }
  };
  walk(0, {});

  const specHash = hashSpecShape(spec);
  return combos.map((axisValues) => {
    const id = axisNames.map((n) => axisValues[n]).join("-");
    return {
      id,
      name: id,
      axisValues,
      hash: hashVariant(specHash, axisValues, tokenVersion),
    };
  });
}

/** Stable hash for a variant — drives on-disk cache keying. */
export function hashVariant(
  specHash: string,
  axisValues: Record<string, string>,
  tokenVersion: string,
): string {
  const sortedAxes = Object.keys(axisValues)
    .sort()
    .map((k) => `${k}=${axisValues[k]}`)
    .join("|");
  return createHash("sha256")
    .update(`${specHash}\0${sortedAxes}\0${tokenVersion}`)
    .digest("hex")
    .slice(0, 12);
}

/**
 * Hash only the fields of a spec that affect generated output.
 * `updatedAt`, `createdAt`, and provenance are excluded so timestamp
 * churn doesn't bust every variant.
 */
export function hashSpecShape(spec: ComponentSpec): string {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    createdAt, updatedAt, __memoireSource, ...rest
  } = spec;
  const canonical = JSON.stringify(rest, Object.keys(rest).sort());
  return createHash("sha256").update(canonical).digest("hex").slice(0, 16);
}
