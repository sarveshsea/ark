/**
 * Vue Component Generator — Generates Vue 3 SFC (.vue) components from ComponentSpecs.
 *
 * Uses Composition API with <script setup lang="ts"> and Tailwind classes.
 * Maps shadcn/ui to shadcn-vue equivalents.
 */

import type { ComponentSpec } from "../specs/types.js";
import type { DesignToken } from "../engine/registry.js";

export interface VueComponentCode {
  component: string;
  barrel: string;
}

const SHADCN_VUE_IMPORTS: Record<string, string> = {
  Button: `import { Button } from "@/components/ui/button"`,
  Card: `import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"`,
  Badge: `import { Badge } from "@/components/ui/badge"`,
  Input: `import { Input } from "@/components/ui/input"`,
  Label: `import { Label } from "@/components/ui/label"`,
  Avatar: `import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"`,
  Dialog: `import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"`,
  Select: `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"`,
};

function mapPropType(type: string): string {
  const base = type.replace("?", "");
  switch (base) {
    case "string": return "String";
    case "number": return "Number";
    case "boolean": return "Boolean";
    case "ReactNode": return "String"; // Vue uses slots instead
    default: return "String";
  }
}

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

export function generateVueComponent(spec: ComponentSpec, tokens: DesignToken[] = []): VueComponentCode {
  const lines: string[] = [];

  // Template
  lines.push("<template>");

  const roleAttr = spec.accessibility?.role ? ` role="${spec.accessibility.role}"` : "";
  const ariaAttr = spec.accessibility?.ariaLabel === "required"
    ? ` :aria-label="${Object.keys(spec.props).find(p => /label|title|name/i.test(p)) || 'name'}"`
    : "";

  if (spec.shadcnBase.includes("Card")) {
    lines.push(`  <Card :class="cn(props.class)"${roleAttr}${ariaAttr}>`);
    lines.push("    <CardHeader>");
    const titleProp = Object.keys(spec.props).find(p => /title|name|heading/i.test(p));
    if (titleProp) lines.push(`      <CardTitle>{{ ${titleProp} }}</CardTitle>`);
    const descProp = Object.keys(spec.props).find(p => /desc|subtitle|sub/i.test(p));
    if (descProp) lines.push(`      <CardDescription>{{ ${descProp} }}</CardDescription>`);
    lines.push("    </CardHeader>");
    lines.push("    <CardContent>");
    for (const [name, type] of Object.entries(spec.props)) {
      if (name === titleProp || name === descProp) continue;
      if (type === "boolean" || type === "boolean?") {
        lines.push(`      <span v-if="${name}">{{ ${name} }}</span>`);
      } else {
        lines.push(`      <span>{{ ${name} }}</span>`);
      }
    }
    lines.push("    </CardContent>");
    lines.push("  </Card>");
  } else if (spec.shadcnBase.includes("Button")) {
    const labelProp = Object.keys(spec.props).find(p => /label|text|children/i.test(p));
    const variantAttr = spec.variants.length > 1 ? ` :variant="variant"` : "";
    lines.push(`  <Button :class="cn(props.class)"${variantAttr}${roleAttr}${ariaAttr}>`);
    if (labelProp) lines.push(`    {{ ${labelProp} }}`);
    else lines.push("    <slot />");
    lines.push("  </Button>");
  } else {
    lines.push(`  <div :class="cn(props.class)"${roleAttr}${ariaAttr}>`);
    for (const [name, type] of Object.entries(spec.props)) {
      if (type === "boolean" || type === "boolean?") {
        lines.push(`    <div v-if="${name}" class="text-sm">{{ ${name} }}</div>`);
      } else {
        lines.push(`    <div>{{ ${name} }}</div>`);
      }
    }
    lines.push("  </div>");
  }

  lines.push("</template>");
  lines.push("");

  // Script
  lines.push(`<script setup lang="ts">`);

  // Imports
  for (const base of spec.shadcnBase) {
    const imp = SHADCN_VUE_IMPORTS[base];
    if (imp) lines.push(imp);
  }
  lines.push(`import { cn } from "@/lib/utils"`);
  lines.push("");

  // Props
  if (spec.variants.length > 1) {
    const variants = spec.variants.map(v => `"${v}"`).join(" | ");
    lines.push(`type ${spec.name}Variant = ${variants}`);
    lines.push("");
  }

  lines.push("const props = withDefaults(defineProps<{");
  for (const [name, type] of Object.entries(spec.props)) {
    const optional = type.endsWith("?") ? "?" : "";
    lines.push(`  ${name}${optional}: ${mapTsType(type)}`);
  }
  if (spec.variants.length > 1) {
    lines.push(`  variant?: ${spec.name}Variant`);
  }
  lines.push("  class?: string");
  lines.push("}>(), {");
  if (spec.variants.length > 1) {
    lines.push(`  variant: "default",`);
  }
  lines.push("})");
  lines.push("</script>");

  const barrel = `export { default as ${spec.name} } from "./${spec.name}.vue"\n`;

  return { component: lines.join("\n"), barrel };
}
