/**
 * Naming utilities — shared helpers for identifier sanitisation and
 * atomic-level → output-folder resolution used across codegen and commands.
 */

/**
 * Convert a human-readable component name into a valid TypeScript identifier.
 * Strips non-alphanumeric characters and PascalCases each word.
 *
 * @example
 * toIdentifier("my component") // "MyComponent"
 * toIdentifier("card-header")  // "CardHeader"
 * toIdentifier("Button")       // "Button"
 */
export function toIdentifier(name: string): string {
  return name
    .replace(/[^A-Za-z0-9\s_-]/g, "")
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

/**
 * Map an Atomic Design level to its output folder path fragment.
 * Follows the Mémoire convention:
 *   atom     → components/ui
 *   molecule → components/molecules
 *   organism → components/organisms
 *   template → components/templates
 *
 * Falls back to "components" for unknown levels.
 */
export function atomicLevelToFolder(level: string): string {
  switch (level) {
    case "atom":
      return "components/ui";
    case "molecule":
      return "components/molecules";
    case "organism":
      return "components/organisms";
    case "template":
      return "components/templates";
    default:
      return "components";
  }
}

/**
 * Infer the most appropriate Atomic Design level from a component name
 * using a simple heuristic.
 *
 * Rules (in priority order):
 *  1. Name ends with "Page"               → template
 *  2. Name contains organism keywords     → organism
 *  3. Name contains atom keywords         → atom
 *  4. Fallback                            → molecule
 */
export function inferAtomicLevel(name: string): "atom" | "molecule" | "organism" | "template" {
  if (/page$/i.test(name)) return "template";

  const organismKeywords = /card|form|header|nav|footer|sidebar/i;
  if (organismKeywords.test(name)) return "organism";

  const atomKeywords = /input|button|badge|tag|avatar|icon|label|chip/i;
  if (atomKeywords.test(name)) return "atom";

  return "molecule";
}
