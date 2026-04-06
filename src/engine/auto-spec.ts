/**
 * Auto-Spec Engine — Automatically creates ComponentSpecs from
 * pulled Figma DesignComponents. Zero manual spec writing needed.
 *
 * Infers:
 * - Atomic level from component name/structure
 * - shadcn base components from name matching
 * - Props from Figma component properties
 * - Code Connect mapping from figmaNodeId
 */

import type { DesignComponent, DesignSystem } from "./registry.js";
import type { ComponentSpec, AtomicLevel } from "../specs/types.js";

// ── shadcn name patterns ────────────────────────────────────

const SHADCN_PATTERNS: [RegExp, string][] = [
  [/button/i, "Button"],
  [/card/i, "Card"],
  [/badge/i, "Badge"],
  [/input/i, "Input"],
  [/label/i, "Label"],
  [/table/i, "Table"],
  [/tab/i, "Tabs"],
  [/dialog|modal|popup/i, "Dialog"],
  [/select|dropdown|combobox/i, "Select"],
  [/avatar/i, "Avatar"],
  [/separator|divider/i, "Separator"],
  [/skeleton|loading/i, "Skeleton"],
  [/tooltip/i, "Tooltip"],
  [/menu/i, "DropdownMenu"],
  [/sheet|drawer/i, "Sheet"],
  [/scroll/i, "ScrollArea"],
  [/switch|toggle/i, "Switch"],
  [/checkbox|check/i, "Checkbox"],
  [/textarea/i, "Textarea"],
  [/progress/i, "Progress"],
  [/sidebar|nav/i, "Sidebar"],
];

// ── Atomic level inference ──────────────────────────────────

const ATOM_PATTERNS = /^(button|icon|badge|label|input|checkbox|radio|switch|avatar|separator|divider|tag|chip|indicator|dot|spinner|skeleton)$/i;
const MOLECULE_PATTERNS = /^(form.?field|search.?bar|card|stat|metric|tooltip|popover|dropdown|select|date.?picker|color.?picker|file.?upload|toggle.?group)$/i;
const ORGANISM_PATTERNS = /^(header|footer|sidebar|navbar|nav.?bar|toolbar|form|table|data.?table|list|modal|dialog|sheet|drawer|panel|section|hero|pricing|testimonial)$/i;
const TEMPLATE_PATTERNS = /^(layout|template|page.?layout|dashboard.?layout|auth.?layout|app.?shell)$/i;

function inferAtomicLevel(name: string, properties: Record<string, unknown>, variants: string[]): AtomicLevel {
  const baseName = name.replace(/[-_./\\]/g, " ").trim().split(/\s+/).pop() ?? name;

  if (TEMPLATE_PATTERNS.test(baseName)) return "template";
  if (ORGANISM_PATTERNS.test(baseName)) return "organism";
  if (MOLECULE_PATTERNS.test(baseName)) return "molecule";
  if (ATOM_PATTERNS.test(baseName)) return "atom";

  // Heuristic: more properties/variants → higher complexity
  const propCount = Object.keys(properties).length;
  const variantCount = variants.length;

  if (propCount >= 6 || variantCount >= 5) return "organism";
  if (propCount >= 3 || variantCount >= 2) return "molecule";
  return "atom";
}

function inferShadcnBase(name: string, description: string): string[] {
  const matches: string[] = [];
  const text = `${name} ${description}`.toLowerCase();

  for (const [pattern, shadcn] of SHADCN_PATTERNS) {
    if (pattern.test(text) && !matches.includes(shadcn)) {
      matches.push(shadcn);
    }
  }

  // If nothing matched but it's complex, default to Card
  if (matches.length === 0) {
    matches.push("Card");
  }

  return matches;
}

function figmaPropToTsType(prop: { type: string; defaultValue?: string }): string {
  switch (prop.type.toUpperCase()) {
    case "BOOLEAN": return "boolean";
    case "TEXT":
    case "INSTANCE_SWAP":
    case "VARIANT": return "string";
    default: return "string";
  }
}

function sanitizeSpecName(name: string): string {
  // Convert "Sidebar / Nav Item" → "SidebarNavItem"
  return name
    .replace(/[/\\]/g, " ")
    .replace(/[^A-Za-z0-9\s-_]/g, "")
    .trim()
    .split(/[\s-_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

// ── Accessibility defaults inference ─────────────────────────

const INTERACTIVE_PATTERNS = /button|link|input|select|checkbox|radio|switch|toggle|slider|menu|tab|dialog|modal|drawer|dropdown|combobox|popover|tooltip|accordion/i;
const NAVIGATION_PATTERNS = /nav|menu|tab|sidebar|breadcrumb|pagination|stepper/i;
const FORM_PATTERNS = /input|select|checkbox|radio|switch|toggle|slider|textarea|form|search|combobox|datepicker/i;
const LIVE_CONTENT_PATTERNS = /toast|notification|alert|snackbar|banner|status|counter|badge|progress|spinner|skeleton/i;
const MOTION_PATTERNS = /carousel|slider|accordion|drawer|modal|dialog|popover|tooltip|dropdown|collapse|expand|animate/i;

function inferAccessibilityDefaults(
  name: string,
  level: AtomicLevel,
  shadcnBase: string[],
  props: Record<string, string>,
): ComponentSpec["accessibility"] {
  const lowerName = name.toLowerCase();
  const allNames = [lowerName, ...shadcnBase.map(s => s.toLowerCase())].join(" ");

  const isInteractive = INTERACTIVE_PATTERNS.test(allNames);
  const isNavigation = NAVIGATION_PATTERNS.test(allNames);
  const isForm = FORM_PATTERNS.test(allNames);
  const isLiveContent = LIVE_CONTENT_PATTERNS.test(allNames);
  const hasMotion = MOTION_PATTERNS.test(allNames);

  // Infer ARIA role from component type
  let role: string | undefined;
  if (/button/i.test(allNames)) role = "button";
  else if (/dialog|modal/i.test(allNames)) role = "dialog";
  else if (/alert/i.test(allNames)) role = "alert";
  else if (/tab(?!le)/i.test(allNames)) role = "tablist";
  else if (/menu/i.test(allNames)) role = "menu";
  else if (/nav|breadcrumb/i.test(allNames)) role = "navigation";
  else if (/search/i.test(allNames)) role = "search";
  else if (/progress/i.test(allNames)) role = "progressbar";
  else if (/slider/i.test(allNames)) role = "slider";
  else if (/switch|toggle/i.test(allNames)) role = "switch";
  else if (/checkbox/i.test(allNames)) role = "checkbox";
  else if (/radio/i.test(allNames)) role = "radio";
  else if (/combobox/i.test(allNames)) role = "combobox";

  return {
    role,
    ariaLabel: isInteractive || isForm ? "required" : "optional",
    keyboardNav: isInteractive || isNavigation || isForm,
    focusStyle: isInteractive ? "outline" : "none",
    focusWidth: "2px",
    touchTarget: isInteractive ? "min-44" : "default",
    reducedMotion: hasMotion,
    liveRegion: isLiveContent ? "polite" : "off",
    colorIndependent: true,
  };
}

// ── Main auto-spec function ─────────────────────────────────

export interface AutoSpecResult {
  specs: ComponentSpec[];
  skipped: string[];
}

export function autoSpecFromDesignSystem(
  ds: DesignSystem,
  existingSpecNames: Set<string>
): AutoSpecResult {
  const specs: ComponentSpec[] = [];
  const skipped: string[] = [];

  for (const comp of ds.components) {
    const specName = sanitizeSpecName(comp.name);

    // Skip if name is invalid or already exists
    if (!specName || !/^[A-Za-z]/.test(specName)) {
      skipped.push(comp.name);
      continue;
    }

    if (existingSpecNames.has(specName)) {
      skipped.push(comp.name);
      continue;
    }

    const level = inferAtomicLevel(comp.name, comp.properties, comp.variants);
    const shadcnBase = inferShadcnBase(comp.name, comp.description);

    // Convert Figma properties to TypeScript props
    const props: Record<string, string> = {};
    for (const [propName, propDef] of Object.entries(comp.properties)) {
      const cleanName = propName.replace(/[^A-Za-z0-9]/g, "");
      if (cleanName) {
        props[cleanName] = figmaPropToTsType(propDef);
      }
    }

    const now = new Date().toISOString();

    const spec: ComponentSpec = {
      name: specName,
      type: "component",
      level,
      purpose: comp.description || `${comp.name} component from Figma design system`,
      researchBacking: [],
      designTokens: {
        source: "figma",
        mapped: true,
      },
      variants: comp.variants.length > 0 ? comp.variants : ["default"],
      props,
      shadcnBase,
      composesSpecs: [],
      codeConnect: {
        figmaNodeId: comp.figmaNodeId,
        codebasePath: "",
        props: {},
        mapped: false,
      },
      accessibility: inferAccessibilityDefaults(comp.name, level, shadcnBase, props),
      dataviz: null,
      tags: ["auto-generated", "figma-pull"],
      createdAt: now,
      updatedAt: now,
    };

    specs.push(spec);
  }

  return { specs, skipped };
}
