---
skill: Token Architecture
description: >
  Design token architecture for production systems — three-tier token model,
  semantic naming, multi-theme support, CSS custom properties, Tailwind integration,
  Figma variable sync, and migration patterns.
activateOn: component-creation
freedomLevel: high
version: 1.0.0
category: craft
tags:
  - design-tokens
  - theming
  - css-variables
  - tailwind
  - figma-variables
  - semantic-tokens
---

# Token Architecture

Design tokens are the single source of truth for every visual decision in a system.
They replace magic numbers, hex codes, and arbitrary values with named, structured,
versionable units that flow from design tools to production code without manual
translation. This skill defines the architecture for building, naming, organizing,
and distributing tokens across Figma, Tailwind, and component code.


## 1. The Three-Tier Token Model

Tokens are organized into three tiers. Each tier has a distinct role, and tokens
in a higher tier always reference tokens in the tier below — never raw values.

```
┌─────────────────────────────────────────────────┐
│  COMPONENT TOKENS   (tier 3 — scoped)           │
│  --button-bg, --card-radius, --input-border     │
│  References: semantic tokens                     │
├─────────────────────────────────────────────────┤
│  SEMANTIC TOKENS    (tier 2 — purpose-driven)    │
│  --color-text-primary, --color-surface-elevated  │
│  References: primitive tokens                    │
├─────────────────────────────────────────────────┤
│  PRIMITIVE TOKENS   (tier 1 — raw values)        │
│  --blue-500, --spacing-4, --font-size-base       │
│  Contains: actual CSS values                     │
└─────────────────────────────────────────────────┘
```

### Why three tiers?

- **Primitives** give you a constrained palette. Without them, designers and
  developers pick arbitrary values and the system drifts.
- **Semantics** encode intent. `--color-text-primary` survives a rebrand;
  `--gray-900` does not.
- **Component tokens** let you override a single component without touching
  the global system. They are optional — only create them when a component
  genuinely needs to deviate from semantic defaults.


## 2. Primitive Tokens

Primitive tokens are the raw material. They hold actual CSS values and are
never used directly in component code. They exist only to be referenced by
semantic tokens.

### 2.1 Color Primitives

Define a full color ramp for each hue. Use 50-950 scale (matching Tailwind
convention) with consistent lightness distribution.

```css
:root {
  /* --- Gray --- */
  --gray-50:  #fafafa;
  --gray-100: #f5f5f5;
  --gray-200: #e5e5e5;
  --gray-300: #d4d4d4;
  --gray-400: #a3a3a3;
  --gray-500: #737373;
  --gray-600: #525252;
  --gray-700: #404040;
  --gray-800: #262626;
  --gray-900: #171717;
  --gray-950: #0a0a0a;

  /* --- Blue (brand primary) --- */
  --blue-50:  #eff6ff;
  --blue-100: #dbeafe;
  --blue-200: #bfdbfe;
  --blue-300: #93c5fd;
  --blue-400: #60a5fa;
  --blue-500: #3b82f6;
  --blue-600: #2563eb;
  --blue-700: #1d4ed8;
  --blue-800: #1e40af;
  --blue-900: #1e3a8a;
  --blue-950: #172554;

  /* --- Red (danger) --- */
  --red-50:  #fef2f2;
  --red-100: #fee2e2;
  --red-200: #fecaca;
  --red-300: #fca5a5;
  --red-400: #f87171;
  --red-500: #ef4444;
  --red-600: #dc2626;
  --red-700: #b91c1c;
  --red-800: #991b1b;
  --red-900: #7f1d1d;
  --red-950: #450a0a;

  /* --- Green (success) --- */
  --green-50:  #f0fdf4;
  --green-100: #dcfce7;
  --green-200: #bbf7d0;
  --green-300: #86efac;
  --green-400: #4ade80;
  --green-500: #22c55e;
  --green-600: #16a34a;
  --green-700: #15803d;
  --green-800: #166534;
  --green-900: #14532d;
  --green-950: #052e16;

  /* --- Amber (warning) --- */
  --amber-50:  #fffbeb;
  --amber-100: #fef3c7;
  --amber-200: #fde68a;
  --amber-300: #fcd34d;
  --amber-400: #fbbf24;
  --amber-500: #f59e0b;
  --amber-600: #d97706;
  --amber-700: #b45309;
  --amber-800: #92400e;
  --amber-900: #78350f;
  --amber-950: #451a03;

  /* --- White and black --- */
  --white: #ffffff;
  --black: #000000;
}
```

### 2.2 Spacing Primitives

Use a 4px base grid. Every spacing value is a multiple of 4.

```css
:root {
  --spacing-0:   0px;
  --spacing-0-5: 2px;
  --spacing-1:   4px;
  --spacing-1-5: 6px;
  --spacing-2:   8px;
  --spacing-2-5: 10px;
  --spacing-3:   12px;
  --spacing-3-5: 14px;
  --spacing-4:   16px;
  --spacing-5:   20px;
  --spacing-6:   24px;
  --spacing-7:   28px;
  --spacing-8:   32px;
  --spacing-9:   36px;
  --spacing-10:  40px;
  --spacing-11:  44px;
  --spacing-12:  48px;
  --spacing-14:  56px;
  --spacing-16:  64px;
  --spacing-20:  80px;
  --spacing-24:  96px;
  --spacing-28:  112px;
  --spacing-32:  128px;
  --spacing-36:  144px;
  --spacing-40:  160px;
  --spacing-44:  176px;
  --spacing-48:  192px;
  --spacing-52:  208px;
  --spacing-56:  224px;
  --spacing-60:  240px;
  --spacing-64:  256px;
}
```

### 2.3 Font Size Primitives

```css
:root {
  --font-size-xs:   0.75rem;   /* 12px */
  --font-size-sm:   0.875rem;  /* 14px */
  --font-size-base: 1rem;      /* 16px */
  --font-size-lg:   1.125rem;  /* 18px */
  --font-size-xl:   1.25rem;   /* 20px */
  --font-size-2xl:  1.5rem;    /* 24px */
  --font-size-3xl:  1.875rem;  /* 30px */
  --font-size-4xl:  2.25rem;   /* 36px */
  --font-size-5xl:  3rem;      /* 48px */
  --font-size-6xl:  3.75rem;   /* 60px */
  --font-size-7xl:  4.5rem;    /* 72px */
  --font-size-8xl:  6rem;      /* 96px */
  --font-size-9xl:  8rem;      /* 128px */
}
```

### 2.4 Border Radius Primitives

```css
:root {
  --radius-none: 0px;
  --radius-sm:   2px;
  --radius-md:   6px;
  --radius-lg:   8px;
  --radius-xl:   12px;
  --radius-2xl:  16px;
  --radius-3xl:  24px;
  --radius-full: 9999px;
}
```

### 2.5 Font Weight Primitives

```css
:root {
  --font-weight-thin:       100;
  --font-weight-extralight: 200;
  --font-weight-light:      300;
  --font-weight-normal:     400;
  --font-weight-medium:     500;
  --font-weight-semibold:   600;
  --font-weight-bold:       700;
  --font-weight-extrabold:  800;
  --font-weight-black:      900;
}
```


## 3. Semantic Tokens

Semantic tokens encode purpose. They reference primitive tokens and are the
primary tokens consumed by component code. When the theme changes, only
semantic token assignments change — primitives stay the same.

### 3.1 Color Semantics

```css
/* --- Light theme (default) --- */
:root, [data-theme="light"] {
  /* Text */
  --color-text-primary:     var(--gray-900);
  --color-text-secondary:   var(--gray-600);
  --color-text-tertiary:    var(--gray-400);
  --color-text-disabled:    var(--gray-300);
  --color-text-inverse:     var(--white);
  --color-text-brand:       var(--blue-600);
  --color-text-danger:      var(--red-600);
  --color-text-success:     var(--green-600);
  --color-text-warning:     var(--amber-600);
  --color-text-link:        var(--blue-600);
  --color-text-link-hover:  var(--blue-700);

  /* Surfaces */
  --color-surface-default:    var(--white);
  --color-surface-subtle:     var(--gray-50);
  --color-surface-elevated:   var(--white);
  --color-surface-sunken:     var(--gray-100);
  --color-surface-overlay:    var(--white);
  --color-surface-disabled:   var(--gray-100);
  --color-surface-brand:      var(--blue-50);
  --color-surface-danger:     var(--red-50);
  --color-surface-success:    var(--green-50);
  --color-surface-warning:    var(--amber-50);

  /* Borders */
  --color-border-default:   var(--gray-200);
  --color-border-subtle:    var(--gray-100);
  --color-border-strong:    var(--gray-400);
  --color-border-brand:     var(--blue-500);
  --color-border-danger:    var(--red-500);
  --color-border-success:   var(--green-500);
  --color-border-focus:     var(--blue-500);

  /* Interactive */
  --color-interactive-default:  var(--blue-600);
  --color-interactive-hover:    var(--blue-700);
  --color-interactive-active:   var(--blue-800);
  --color-interactive-disabled: var(--gray-300);

  /* Backgrounds (full-page / layout-level) */
  --color-bg-page:     var(--white);
  --color-bg-canvas:   var(--gray-50);
}
```

### 3.2 Typography Semantics

```css
:root {
  /* Font families */
  --font-family-sans:  'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-family-mono:  'JetBrains Mono', ui-monospace, 'Cascadia Code', monospace;
  --font-family-serif: 'Merriweather', ui-serif, Georgia, serif;

  /* Heading scale */
  --text-heading-1-size:     var(--font-size-4xl);
  --text-heading-1-weight:   var(--font-weight-bold);
  --text-heading-1-leading:  1.1;
  --text-heading-1-tracking: -0.02em;

  --text-heading-2-size:     var(--font-size-3xl);
  --text-heading-2-weight:   var(--font-weight-semibold);
  --text-heading-2-leading:  1.2;
  --text-heading-2-tracking: -0.015em;

  --text-heading-3-size:     var(--font-size-2xl);
  --text-heading-3-weight:   var(--font-weight-semibold);
  --text-heading-3-leading:  1.25;
  --text-heading-3-tracking: -0.01em;

  --text-heading-4-size:     var(--font-size-xl);
  --text-heading-4-weight:   var(--font-weight-medium);
  --text-heading-4-leading:  1.3;
  --text-heading-4-tracking: 0em;

  /* Body scale */
  --text-body-lg-size:    var(--font-size-lg);
  --text-body-lg-weight:  var(--font-weight-normal);
  --text-body-lg-leading: 1.6;

  --text-body-base-size:    var(--font-size-base);
  --text-body-base-weight:  var(--font-weight-normal);
  --text-body-base-leading: 1.5;

  --text-body-sm-size:    var(--font-size-sm);
  --text-body-sm-weight:  var(--font-weight-normal);
  --text-body-sm-leading: 1.45;

  /* Caption / overline */
  --text-caption-size:     var(--font-size-xs);
  --text-caption-weight:   var(--font-weight-medium);
  --text-caption-leading:  1.4;
  --text-caption-tracking: 0.04em;

  /* Line heights (standalone) */
  --leading-none:    1;
  --leading-tight:   1.25;
  --leading-snug:    1.375;
  --leading-normal:  1.5;
  --leading-relaxed: 1.625;
  --leading-loose:   2;

  /* Letter spacing (standalone) */
  --tracking-tighter: -0.05em;
  --tracking-tight:   -0.025em;
  --tracking-normal:  0em;
  --tracking-wide:    0.025em;
  --tracking-wider:   0.05em;
  --tracking-widest:  0.1em;
}
```

### 3.3 Spacing Semantics (T-Shirt Sizing)

Map semantic names to spacing primitives for layout-level decisions.

```css
:root {
  --space-xs:    var(--spacing-1);   /* 4px  — tight icon gaps */
  --space-sm:    var(--spacing-2);   /* 8px  — inline element gaps */
  --space-md:    var(--spacing-4);   /* 16px — standard padding */
  --space-lg:    var(--spacing-6);   /* 24px — section padding */
  --space-xl:    var(--spacing-8);   /* 32px — card padding */
  --space-2xl:   var(--spacing-12);  /* 48px — section gaps */
  --space-3xl:   var(--spacing-16);  /* 64px — page-level spacing */
  --space-4xl:   var(--spacing-24);  /* 96px — hero sections */
}
```

### 3.4 Shadow Tokens (Elevation System)

Shadows encode elevation. Higher elevation = more shadow = closer to the user.

```css
:root {
  --shadow-none: none;
  --shadow-xs:   0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-sm:   0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md:   0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg:   0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl:   0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --shadow-2xl:  0 25px 50px -12px rgb(0 0 0 / 0.25);
  --shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);

  /* Semantic elevation */
  --elevation-surface:  var(--shadow-none);
  --elevation-raised:   var(--shadow-sm);
  --elevation-card:     var(--shadow-md);
  --elevation-dropdown: var(--shadow-lg);
  --elevation-modal:    var(--shadow-xl);
  --elevation-toast:    var(--shadow-2xl);
}
```

### 3.5 Animation Tokens

```css
:root {
  /* Duration */
  --duration-instant:  0ms;
  --duration-fast:     100ms;
  --duration-normal:   200ms;
  --duration-moderate: 300ms;
  --duration-slow:     500ms;
  --duration-slower:   700ms;

  /* Easing */
  --ease-default:    cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in:         cubic-bezier(0.4, 0, 1, 1);
  --ease-out:        cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out:     cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce:     cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-spring:     cubic-bezier(0.22, 1.2, 0.36, 1);

  /* Combined transitions */
  --transition-colors:   color var(--duration-normal) var(--ease-default),
                         background-color var(--duration-normal) var(--ease-default),
                         border-color var(--duration-normal) var(--ease-default);
  --transition-opacity:  opacity var(--duration-normal) var(--ease-default);
  --transition-transform: transform var(--duration-normal) var(--ease-default);
  --transition-all:      all var(--duration-normal) var(--ease-default);
}
```

### 3.6 Breakpoint Tokens

Breakpoints are not CSS custom properties (media queries cannot use them),
but they must still be tokenized for consistency across Tailwind config,
JavaScript, and documentation.

```
Token Name         Value     Tailwind Key    Usage
─────────────────  ────────  ──────────────  ─────────────────────
--breakpoint-sm    640px     sm              Mobile landscape
--breakpoint-md    768px     md              Tablet portrait
--breakpoint-lg    1024px    lg              Tablet landscape
--breakpoint-xl    1280px    xl              Desktop
--breakpoint-2xl   1536px    2xl             Wide desktop
```

Define them as a JS/TS constant map for programmatic use:

```typescript
export const breakpoints = {
  sm:  640,
  md:  768,
  lg:  1024,
  xl:  1280,
  '2xl': 1536,
} as const;
```


## 4. Component Tokens

Component tokens are scoped overrides. They let a single component deviate
from the semantic system without polluting the global namespace. Create them
only when needed — most components should consume semantic tokens directly.

### 4.1 When to Create Component Tokens

- The component has interactive states that require distinct values
  (e.g., button hover background differs from the semantic interactive color).
- The component is a complex organism with many internal parts that need
  consistent internal theming (e.g., a data table with header, row, cell tokens).
- The component is white-labeled and needs per-brand overrides.

### 4.2 Examples

```css
/* --- Button --- */
.button, [data-component="button"] {
  --button-bg:           var(--color-interactive-default);
  --button-bg-hover:     var(--color-interactive-hover);
  --button-bg-active:    var(--color-interactive-active);
  --button-bg-disabled:  var(--color-interactive-disabled);
  --button-text:         var(--color-text-inverse);
  --button-text-disabled: var(--color-text-disabled);
  --button-border:       transparent;
  --button-radius:       var(--radius-md);
  --button-padding-x:    var(--space-md);
  --button-padding-y:    var(--space-sm);
  --button-font-size:    var(--text-body-sm-size);
  --button-font-weight:  var(--font-weight-medium);
}

/* --- Card --- */
.card, [data-component="card"] {
  --card-bg:       var(--color-surface-elevated);
  --card-border:   var(--color-border-default);
  --card-radius:   var(--radius-lg);
  --card-padding:  var(--space-lg);
  --card-shadow:   var(--elevation-card);
}

/* --- Input --- */
.input, [data-component="input"] {
  --input-bg:             var(--color-surface-default);
  --input-bg-disabled:    var(--color-surface-disabled);
  --input-border:         var(--color-border-default);
  --input-border-focus:   var(--color-border-focus);
  --input-border-error:   var(--color-border-danger);
  --input-text:           var(--color-text-primary);
  --input-placeholder:    var(--color-text-tertiary);
  --input-radius:         var(--radius-md);
  --input-padding-x:      var(--space-sm);
  --input-padding-y:      var(--spacing-2-5);
  --input-font-size:      var(--text-body-base-size);
}

/* --- Badge --- */
.badge, [data-component="badge"] {
  --badge-bg:         var(--color-surface-brand);
  --badge-text:       var(--color-text-brand);
  --badge-radius:     var(--radius-full);
  --badge-padding-x:  var(--space-sm);
  --badge-padding-y:  var(--spacing-0-5);
  --badge-font-size:  var(--text-caption-size);
  --badge-font-weight: var(--font-weight-medium);
}
```


## 5. Multi-Theme Architecture

### 5.1 Data Attribute Switching

Use `[data-theme]` on the root element. This is superior to class-based
switching because it works with attribute selectors, is easily queryable
from JavaScript, and avoids specificity conflicts.

```html
<html data-theme="light">
<!-- or -->
<html data-theme="dark">
```

### 5.2 Dark Theme

Override semantic tokens only. Primitives remain unchanged.

```css
[data-theme="dark"] {
  /* Text */
  --color-text-primary:     var(--gray-50);
  --color-text-secondary:   var(--gray-400);
  --color-text-tertiary:    var(--gray-500);
  --color-text-disabled:    var(--gray-600);
  --color-text-inverse:     var(--gray-900);
  --color-text-brand:       var(--blue-400);
  --color-text-danger:      var(--red-400);
  --color-text-success:     var(--green-400);
  --color-text-warning:     var(--amber-400);
  --color-text-link:        var(--blue-400);
  --color-text-link-hover:  var(--blue-300);

  /* Surfaces */
  --color-surface-default:    var(--gray-900);
  --color-surface-subtle:     var(--gray-800);
  --color-surface-elevated:   var(--gray-800);
  --color-surface-sunken:     var(--gray-950);
  --color-surface-overlay:    var(--gray-800);
  --color-surface-disabled:   var(--gray-800);
  --color-surface-brand:      var(--blue-950);
  --color-surface-danger:     var(--red-950);
  --color-surface-success:    var(--green-950);
  --color-surface-warning:    var(--amber-950);

  /* Borders */
  --color-border-default:   var(--gray-700);
  --color-border-subtle:    var(--gray-800);
  --color-border-strong:    var(--gray-500);
  --color-border-brand:     var(--blue-400);
  --color-border-danger:    var(--red-400);
  --color-border-success:   var(--green-400);
  --color-border-focus:     var(--blue-400);

  /* Interactive */
  --color-interactive-default:  var(--blue-500);
  --color-interactive-hover:    var(--blue-400);
  --color-interactive-active:   var(--blue-300);
  --color-interactive-disabled: var(--gray-700);

  /* Backgrounds */
  --color-bg-page:     var(--gray-950);
  --color-bg-canvas:   var(--gray-900);

  /* Shadows in dark mode need lighter opacity or colored glow */
  --elevation-surface:  none;
  --elevation-raised:   0 1px 3px 0 rgb(0 0 0 / 0.3);
  --elevation-card:     0 4px 6px -1px rgb(0 0 0 / 0.4);
  --elevation-dropdown: 0 10px 15px -3px rgb(0 0 0 / 0.5);
  --elevation-modal:    0 20px 25px -5px rgb(0 0 0 / 0.6);
  --elevation-toast:    0 25px 50px -12px rgb(0 0 0 / 0.7);
}
```

### 5.3 Brand Themes (White-Label)

For white-label systems, override primitive color tokens per brand while
keeping semantic and component tokens untouched.

```css
[data-theme="brand-acme"] {
  /* Override primitives — the entire semantic layer follows automatically */
  --blue-500: #6366f1;   /* Acme uses indigo as primary */
  --blue-600: #4f46e5;
  --blue-700: #4338ca;
  --blue-800: #3730a3;
  --blue-400: #818cf8;
  --blue-300: #a5b4fc;
  --blue-50:  #eef2ff;
  --blue-950: #1e1b4b;

  --radius-md: 12px;     /* Acme prefers rounder corners */
  --radius-lg: 16px;
}

[data-theme="brand-helios"] {
  --blue-500: #f97316;   /* Helios uses orange as primary */
  --blue-600: #ea580c;
  --blue-700: #c2410c;
  --blue-800: #9a3412;
  --blue-400: #fb923c;
  --blue-300: #fdba74;
  --blue-50:  #fff7ed;
  --blue-950: #431407;
}
```

### 5.4 High Contrast / Accessibility Theme

```css
[data-theme="high-contrast"] {
  --color-text-primary:     var(--black);
  --color-text-secondary:   var(--gray-800);
  --color-text-tertiary:    var(--gray-700);
  --color-text-disabled:    var(--gray-500);

  --color-surface-default:  var(--white);
  --color-surface-elevated: var(--white);

  --color-border-default:   var(--black);
  --color-border-subtle:    var(--gray-600);
  --color-border-strong:    var(--black);
  --color-border-focus:     var(--black);

  --color-interactive-default: var(--blue-800);
  --color-interactive-hover:   var(--blue-900);

  /* Force visible focus rings */
  --focus-ring-width: 3px;
  --focus-ring-offset: 2px;
  --focus-ring-color: var(--black);
}
```

### 5.5 Theme Switching in JavaScript

```typescript
function setTheme(theme: string): void {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('user-theme', theme);
}

function getTheme(): string {
  return localStorage.getItem('user-theme')
    ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  setTheme(getTheme());
});

// Listen for system preference changes
window.matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', (e) => {
    if (!localStorage.getItem('user-theme')) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  });
```


## 6. Tailwind Integration

### 6.1 Extending Theme with CSS Variables

In `tailwind.config.ts`, reference CSS custom properties so Tailwind classes
resolve to your token system.

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        text: {
          primary:   'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary:  'var(--color-text-tertiary)',
          disabled:  'var(--color-text-disabled)',
          inverse:   'var(--color-text-inverse)',
          brand:     'var(--color-text-brand)',
          danger:    'var(--color-text-danger)',
          success:   'var(--color-text-success)',
          warning:   'var(--color-text-warning)',
          link:      'var(--color-text-link)',
        },
        surface: {
          DEFAULT:   'var(--color-surface-default)',
          subtle:    'var(--color-surface-subtle)',
          elevated:  'var(--color-surface-elevated)',
          sunken:    'var(--color-surface-sunken)',
          overlay:   'var(--color-surface-overlay)',
          disabled:  'var(--color-surface-disabled)',
          brand:     'var(--color-surface-brand)',
          danger:    'var(--color-surface-danger)',
          success:   'var(--color-surface-success)',
          warning:   'var(--color-surface-warning)',
        },
        border: {
          DEFAULT:   'var(--color-border-default)',
          subtle:    'var(--color-border-subtle)',
          strong:    'var(--color-border-strong)',
          brand:     'var(--color-border-brand)',
          danger:    'var(--color-border-danger)',
          success:   'var(--color-border-success)',
          focus:     'var(--color-border-focus)',
        },
        interactive: {
          DEFAULT:   'var(--color-interactive-default)',
          hover:     'var(--color-interactive-hover)',
          active:    'var(--color-interactive-active)',
          disabled:  'var(--color-interactive-disabled)',
        },
      },
      fontFamily: {
        sans:  'var(--font-family-sans)',
        mono:  'var(--font-family-mono)',
        serif: 'var(--font-family-serif)',
      },
      borderRadius: {
        none: 'var(--radius-none)',
        sm:   'var(--radius-sm)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        none:    'var(--shadow-none)',
        xs:      'var(--shadow-xs)',
        sm:      'var(--shadow-sm)',
        md:      'var(--shadow-md)',
        lg:      'var(--shadow-lg)',
        xl:      'var(--shadow-xl)',
        '2xl':   'var(--shadow-2xl)',
        inner:   'var(--shadow-inner)',
      },
      transitionDuration: {
        instant:  'var(--duration-instant)',
        fast:     'var(--duration-fast)',
        normal:   'var(--duration-normal)',
        moderate: 'var(--duration-moderate)',
        slow:     'var(--duration-slow)',
      },
      transitionTimingFunction: {
        default: 'var(--ease-default)',
        bounce:  'var(--ease-bounce)',
        spring:  'var(--ease-spring)',
      },
    },
  },
  plugins: [],
};

export default config;
```

### 6.2 Usage in Components

With this config, Tailwind classes map to semantic tokens automatically:

```tsx
// bg-surface uses --color-surface-default
// text-text-primary uses --color-text-primary
// border-border uses --color-border-default
// rounded-lg uses --radius-lg
// shadow-md uses --shadow-md

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface-elevated border border-border rounded-lg shadow-md p-6">
      {children}
    </div>
  );
}
```

No raw hex values. No magic numbers. Theme changes propagate automatically.


## 7. Figma Variable Sync

### 7.1 Collection Structure

Organize Figma variables into collections that mirror the three-tier model:

```
Figma Variable Collections
├── Primitives
│   ├── Colors (gray/50 through gray/950, blue/50 through blue/950, ...)
│   ├── Spacing (0, 0.5, 1, 1.5, 2, ..., 64)
│   ├── Radii (none, sm, md, lg, xl, 2xl, 3xl, full)
│   └── Font Sizes (xs, sm, base, lg, xl, 2xl, ...)
├── Semantic / Light
│   ├── Text (primary, secondary, tertiary, disabled, inverse, ...)
│   ├── Surface (default, subtle, elevated, sunken, overlay, ...)
│   ├── Border (default, subtle, strong, brand, danger, ...)
│   └── Interactive (default, hover, active, disabled)
├── Semantic / Dark
│   └── (same structure, different resolved values)
└── Components
    ├── Button (bg, bg-hover, bg-active, text, radius, ...)
    ├── Card (bg, border, radius, padding, shadow)
    └── Input (bg, border, border-focus, text, radius, ...)
```

### 7.2 Mode Mapping

Figma variable modes map directly to `[data-theme]` values:

| Figma Mode      | CSS Selector            | Purpose                |
|-----------------|-------------------------|------------------------|
| Light (default) | `:root`, `[data-theme="light"]` | Default light theme  |
| Dark            | `[data-theme="dark"]`   | Dark theme             |
| High Contrast   | `[data-theme="high-contrast"]` | Accessibility theme  |
| Brand: Acme     | `[data-theme="brand-acme"]` | White-label override |

### 7.3 Figma Variables to CSS Pipeline

Use Mémoire's `memi tokens` command to extract Figma variables and generate
CSS custom properties.

```
Figma Variables ──(WebSocket bridge)──> Mémoire Engine
     │
     ▼
Token Registry (.memoire/tokens.json)
     │
     ├──> primitives.css     (tier 1)
     ├──> semantic-light.css (tier 2, light mode)
     ├──> semantic-dark.css  (tier 2, dark mode)
     ├──> components.css     (tier 3)
     └──> tailwind.config.ts (theme extension)
```

The pipeline preserves the reference chain: component tokens reference
semantic tokens, semantic tokens reference primitives. No flattening occurs —
the generated CSS uses `var()` references, not resolved values.

### 7.4 Keeping Figma and Code in Sync

- Run `memi tokens` after every design system update in Figma.
- Use `memi watch` to auto-regenerate tokens when the bridge detects changes.
- Store `.memoire/tokens.json` in version control as the canonical token record.
- In CI, validate that the generated CSS matches the committed token file.


## 8. Token Naming Conventions

### 8.1 Rules

1. **kebab-case always** — `--color-text-primary`, never `--colorTextPrimary`.
2. **Hierarchical** — category first, then specificity:
   `--{category}-{property}-{variant}-{state}`.
3. **Predictable** — given the pattern, a developer can guess the token name
   without looking it up.
4. **No abbreviations** — `--color-background-primary`, not `--clr-bg-pri`.
   Exception: universally understood abbreviations like `bg`, `sm`, `md`, `lg`.
5. **State as suffix** — `--button-bg-hover`, `--input-border-focus`.

### 8.2 Naming Anatomy

```
--color-text-primary
  │     │    │
  │     │    └── variant: primary, secondary, tertiary, brand, danger, ...
  │     └── property: text, surface, border, interactive
  └── category: color, spacing, font, radius, shadow, duration, ease

--button-bg-hover
  │      │   │
  │      │   └── state: hover, active, focus, disabled
  │      └── property: bg, text, border, radius, padding, shadow
  └── component: button, card, input, badge, ...
```

### 8.3 Do and Don't

```
DO                                DON'T
──────────────────────────────    ──────────────────────────────
--color-text-primary              --primary-text-color
--color-surface-elevated          --elevated-bg
--spacing-4                       --space16 (ambiguous unit)
--button-bg-hover                 --btnBgHvr
--font-size-lg                    --large-font
--shadow-md                       --medium-shadow
--duration-normal                 --200ms
```


## 9. Color Tokens Deep Dive

### 9.1 Palette Generation

Start with a single brand hue. Generate the full ramp programmatically using
consistent lightness steps in OKLCH or HSL color space. This ensures
perceptual uniformity — the 500 step of every hue should feel like the
same "middle" brightness.

```typescript
// Recommended lightness stops (OKLCH L channel)
const lightnessStops = {
  50:  0.97,
  100: 0.93,
  200: 0.87,
  300: 0.78,
  400: 0.67,
  500: 0.55,
  600: 0.47,
  700: 0.39,
  800: 0.32,
  900: 0.25,
  950: 0.17,
};
```

### 9.2 Contrast Ratios (WCAG)

Every text/surface combination must meet minimum contrast:

| Context          | Minimum Ratio | WCAG Level |
|------------------|---------------|------------|
| Body text        | 4.5:1         | AA         |
| Large text (18+) | 3:1           | AA         |
| UI components    | 3:1           | AA         |
| Enhanced         | 7:1           | AAA        |

Validate during token generation. Flag violations before they reach code.

```typescript
function contrastRatio(fg: string, bg: string): number {
  const lum1 = relativeLuminance(fg);
  const lum2 = relativeLuminance(bg);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Validate all text semantic tokens against their expected surface
const validations = [
  { fg: '--color-text-primary',   bg: '--color-surface-default',  min: 4.5 },
  { fg: '--color-text-secondary', bg: '--color-surface-default',  min: 4.5 },
  { fg: '--color-text-brand',     bg: '--color-surface-default',  min: 4.5 },
  { fg: '--color-text-danger',    bg: '--color-surface-default',  min: 4.5 },
  { fg: '--color-text-inverse',   bg: '--color-interactive-default', min: 4.5 },
];
```


## 10. Integration with Memoire

### 10.1 Token Registry

Tokens live in `.memoire/tokens.json`. This file is the bridge between Figma
variables, CSS generation, and Tailwind config generation.

```json
{
  "version": "1.0.0",
  "collections": {
    "primitives": {
      "color": { "gray-50": "#fafafa", "gray-100": "#f5f5f5" },
      "spacing": { "0": "0px", "1": "4px", "2": "8px" },
      "radius": { "none": "0px", "sm": "2px", "md": "6px" }
    },
    "semantic": {
      "light": {
        "color-text-primary": { "$ref": "primitives.color.gray-900" },
        "color-surface-default": { "$ref": "primitives.color.white" }
      },
      "dark": {
        "color-text-primary": { "$ref": "primitives.color.gray-50" },
        "color-surface-default": { "$ref": "primitives.color.gray-900" }
      }
    },
    "components": {
      "button": {
        "bg": { "$ref": "semantic.color-interactive-default" }
      }
    }
  }
}
```

### 10.2 Codegen Pipeline

When `memi generate` runs, it reads the token registry and:

1. Generates `primitives.css` with all primitive custom properties.
2. Generates `semantic.css` with light/dark semantic tokens.
3. Generates `components.css` with component-scoped tokens.
4. Updates `tailwind.config.ts` theme extension to reference the tokens.
5. Injects token imports into the generated component files.

### 10.3 Spec to Token Mapping

Every component spec can reference tokens by name:

```json
{
  "name": "MetricCard",
  "level": "molecule",
  "tokens": {
    "background": "--color-surface-elevated",
    "border": "--color-border-default",
    "title-color": "--color-text-secondary",
    "value-color": "--color-text-primary",
    "radius": "--radius-lg",
    "padding": "--space-lg",
    "shadow": "--elevation-card"
  }
}
```

During codegen, these token references become CSS variable usage in the
generated Tailwind classes or inline styles.


## 11. Migration Patterns

### 11.1 Hex Values to Tokens

Find and replace raw hex values in existing code with token references.

```
BEFORE                                    AFTER
──────────────────────────────────────    ──────────────────────────────────────
className="bg-[#ffffff]"                  className="bg-surface"
className="text-[#171717]"               className="text-text-primary"
className="border-[#e5e5e5]"             className="border-border"
style={{ color: '#3b82f6' }}             className="text-text-brand"
style={{ padding: '16px' }}              className="p-4"
style={{ borderRadius: '8px' }}          className="rounded-lg"
```

### 11.2 Migration Checklist

1. Inventory all raw values in the codebase (hex colors, px values, font names).
2. Map each raw value to its nearest primitive token.
3. Map each primitive to its semantic purpose (is this gray being used as
   text? As a border? As a background?).
4. Replace in code with Tailwind classes referencing semantic tokens.
5. Validate visually — screenshot before/after comparison.
6. Run contrast checks on all text/surface combinations.
7. Test in all theme modes (light, dark, high-contrast).

### 11.3 Inline Styles to Tokens

```tsx
// BEFORE
<div style={{
  backgroundColor: '#f5f5f5',
  border: '1px solid #e5e5e5',
  borderRadius: '8px',
  padding: '24px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
}}>

// AFTER
<div className="bg-surface-subtle border border-border rounded-lg p-6 shadow-md">
```


## 12. Anti-Patterns

### 12.1 Using Primitives Directly in Components

```tsx
// WRONG — tied to a specific shade, breaks on theme change
<div className="bg-gray-50 text-gray-900 border-gray-200">

// RIGHT — semantic, survives any theme
<div className="bg-surface-subtle text-text-primary border-border">
```

### 12.2 Hardcoded Values

```css
/* WRONG */
.card { border-radius: 8px; padding: 24px; }

/* RIGHT */
.card { border-radius: var(--card-radius); padding: var(--card-padding); }
```

### 12.3 Creating Too Many Component Tokens

If a component token simply mirrors a semantic token with no customization,
it is unnecessary indirection. Only create component tokens when the
component genuinely needs to diverge.

```css
/* WRONG — pointless wrapper */
--card-text-color: var(--color-text-primary);  /* just use the semantic directly */

/* RIGHT — meaningful override */
--badge-bg: var(--color-surface-brand);  /* badge has unique default behavior */
```

### 12.4 Inconsistent Naming

```css
/* WRONG — mixed conventions, unpredictable */
--btnBackground: #3b82f6;
--card_radius: 8px;
--TEXT-color-main: #171717;

/* RIGHT — consistent, hierarchical, predictable */
--button-bg: var(--color-interactive-default);
--card-radius: var(--radius-lg);
--color-text-primary: var(--gray-900);
```

### 12.5 Flattening References

```css
/* WRONG — loses the reference chain, themes cannot override */
--button-bg: #3b82f6;

/* RIGHT — preserves the chain: component → semantic → primitive */
--button-bg: var(--color-interactive-default);
```

### 12.6 Skipping the Semantic Layer

```css
/* WRONG — primitive in component, no theming possible */
--card-bg: var(--gray-50);

/* RIGHT — semantic encodes purpose, supports theme switching */
--card-bg: var(--color-surface-elevated);
```

### 12.7 Putting Too Much in One File

Split token definitions by tier and purpose:

```
tokens/
├── primitives.css        (tier 1)
├── semantic-light.css    (tier 2, light mode)
├── semantic-dark.css     (tier 2, dark mode)
├── semantic-hc.css       (tier 2, high contrast)
├── components/
│   ├── button.css        (tier 3)
│   ├── card.css          (tier 3)
│   └── input.css         (tier 3)
└── index.css             (imports all in correct order)
```

Import order matters — primitives first, then semantics, then components:

```css
/* index.css */
@import './primitives.css';
@import './semantic-light.css';
@import './semantic-dark.css';
@import './components/button.css';
@import './components/card.css';
@import './components/input.css';
```


## 13. Quick Reference

### Token Tier Decision Tree

```
Is this a raw value (hex, px, rem)?
  └── YES → Primitive token (tier 1)

Does it describe a purpose (text color, surface bg, border)?
  └── YES → Semantic token (tier 2)

Is it scoped to one specific component?
  └── YES → Component token (tier 3)
  └── NO  → Use the semantic token directly
```

### Files to Generate

| File                  | Source               | Contains                        |
|-----------------------|----------------------|---------------------------------|
| `primitives.css`      | Token registry       | All tier-1 custom properties    |
| `semantic-light.css`  | Token registry       | Light theme tier-2 tokens       |
| `semantic-dark.css`   | Token registry       | Dark theme tier-2 tokens        |
| `components/*.css`    | Token registry       | Per-component tier-3 tokens     |
| `tailwind.config.ts`  | Token registry       | Theme extension with var() refs |
| `.memoire/tokens.json`| Figma / manual       | Canonical token record          |

### Validation Checklist

- [ ] No raw hex values in component code
- [ ] No raw px values for spacing, radius, or font sizes
- [ ] All text/surface combinations pass WCAG AA contrast (4.5:1)
- [ ] Dark theme renders correctly — no invisible text, no missing borders
- [ ] High contrast theme renders correctly
- [ ] All Tailwind classes resolve to CSS variable references
- [ ] Token registry file is committed and up to date
- [ ] Figma variable collections mirror the three-tier structure
