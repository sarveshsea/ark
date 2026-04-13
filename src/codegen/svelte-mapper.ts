/**
 * Svelte Component Generator — Generates Svelte 5 (.svelte) components from ComponentSpecs.
 *
 * Uses runes ($props, $state) and Tailwind classes.
 * Maps shadcn/ui to shadcn-svelte equivalents.
 */

import type { ComponentSpec } from "../specs/types.js";
import type { DesignToken } from "../engine/registry.js";

export interface SvelteComponentCode {
  component: string;
  barrel: string;
}

const SHADCN_SVELTE_IMPORTS: Record<string, string> = {
  Button: `import { Button } from "$lib/components/ui/button"`,
  Card: `import * as Card from "$lib/components/ui/card"`,
  Badge: `import { Badge } from "$lib/components/ui/badge"`,
  Input: `import { Input } from "$lib/components/ui/input"`,
  Label: `import { Label } from "$lib/components/ui/label"`,
  Avatar: `import * as Avatar from "$lib/components/ui/avatar"`,
  Dialog: `import * as Dialog from "$lib/components/ui/dialog"`,
  Select: `import * as Select from "$lib/components/ui/select"`,
};

function mapTsType(type: string): string {
  const base = type.replace("?", "");
  switch (base) {
    case "string": return "string";
    case "number": return "number";
    case "boolean": return "boolean";
    case "ReactNode": return "string";
    default: return "string";
  }
}

export function generateSvelteComponent(spec: ComponentSpec, tokens: DesignToken[] = []): SvelteComponentCode {
  const lines: string[] = [];

  // Script
  lines.push(`<script lang="ts">`);

  // Imports
  for (const base of spec.shadcnBase) {
    const imp = SHADCN_SVELTE_IMPORTS[base];
    if (imp) lines.push(`  ${imp}`);
  }
  lines.push(`  import { cn } from "$lib/utils"`);
  lines.push("");

  // Props interface
  if (spec.variants.length > 1) {
    const variants = spec.variants.map(v => `"${v}"`).join(" | ");
    lines.push(`  type ${spec.name}Variant = ${variants}`);
    lines.push("");
  }

  lines.push("  interface Props {");
  for (const [name, type] of Object.entries(spec.props)) {
    const optional = type.endsWith("?") ? "?" : "";
    lines.push(`    ${name}${optional}: ${mapTsType(type)};`);
  }
  if (spec.variants.length > 1) {
    lines.push(`    variant?: ${spec.name}Variant;`);
  }
  lines.push("    class?: string;");
  lines.push("  }");
  lines.push("");

  // Props destructuring with runes
  const propDefaults: string[] = [];
  if (spec.variants.length > 1) {
    propDefaults.push(`variant = "default"`);
  }
  propDefaults.push(`class: className = ""`);
  propDefaults.push("...restProps");

  const propEntries = Object.keys(spec.props).join(", ");
  lines.push(`  let { ${propEntries}${propEntries ? ", " : ""}${propDefaults.join(", ")} }: Props = $props();`);
  lines.push("</script>");
  lines.push("");

  // Template
  const roleAttr = spec.accessibility?.role ? ` role="${spec.accessibility.role}"` : "";
  const ariaAttr = spec.accessibility?.ariaLabel === "required"
    ? ` aria-label={${Object.keys(spec.props).find(p => /label|title|name/i.test(p)) || `"${spec.name}"`}}`
    : "";

  if (spec.shadcnBase.includes("Card")) {
    lines.push(`<Card.Root class={cn(className)}${roleAttr}${ariaAttr} {...restProps}>`);
    lines.push("  <Card.Header>");
    const titleProp = Object.keys(spec.props).find(p => /title|name|heading/i.test(p));
    if (titleProp) lines.push(`    <Card.Title>{${titleProp}}</Card.Title>`);
    const descProp = Object.keys(spec.props).find(p => /desc|subtitle|sub/i.test(p));
    if (descProp) lines.push(`    <Card.Description>{${descProp}}</Card.Description>`);
    lines.push("  </Card.Header>");
    lines.push("  <Card.Content>");
    for (const [name, type] of Object.entries(spec.props)) {
      if (name === titleProp || name === descProp) continue;
      if (type === "boolean" || type === "boolean?") {
        lines.push(`    {#if ${name}}<span>{${name}}</span>{/if}`);
      } else {
        lines.push(`    <span>{${name}}</span>`);
      }
    }
    lines.push("  </Card.Content>");
    lines.push("</Card.Root>");
  } else if (spec.shadcnBase.includes("Button")) {
    const labelProp = Object.keys(spec.props).find(p => /label|text|children/i.test(p));
    const variantAttr = spec.variants.length > 1 ? ` {variant}` : "";
    lines.push(`<Button class={cn(className)}${variantAttr}${roleAttr}${ariaAttr} {...restProps}>`);
    if (labelProp) lines.push(`  {${labelProp}}`);
    else lines.push("  <slot />");
    lines.push("</Button>");
  } else {
    lines.push(`<div class={cn(className)}${roleAttr}${ariaAttr} {...restProps}>`);
    for (const [name, type] of Object.entries(spec.props)) {
      if (type === "boolean" || type === "boolean?") {
        lines.push(`  {#if ${name}}<div class="text-sm">{${name}}</div>{/if}`);
      } else {
        lines.push(`  <div>{${name}}</div>`);
      }
    }
    lines.push("</div>");
  }

  const barrel = `export { default as ${spec.name} } from "./${spec.name}.svelte"\n`;

  return { component: lines.join("\n"), barrel };
}
