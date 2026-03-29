---
name: Accessibility Audit
description: >
  WCAG 2.2 AA/AAA compliance auditing for design systems and generated components.
  Covers color contrast, keyboard navigation, screen reader compatibility, focus
  management, motion sensitivity, cognitive accessibility, touch targets, and
  semantic structure. Outputs actionable findings with severity, remediation code,
  and automated testing hooks.
activateOn: design-review
freedomLevel: read-only
category: research
tags:
  - accessibility
  - wcag
  - a11y
  - screen-reader
  - color-contrast
  - keyboard-nav
  - aria
  - cognitive
  - focus-management
  - touch-targets
  - reduced-motion
---

# Accessibility Audit — Memoire Research Skill

Systematic WCAG 2.2 compliance checks for Figma designs and generated code.
Produces structured findings that feed back into specs and codegen.

---

## Audit Checklist

### 1. Color Contrast (WCAG 1.4.3 / 1.4.6 / 1.4.11)

| Check | AA Threshold | AAA Threshold |
|-------|-------------|---------------|
| Normal text (< 18px / < 14px bold) | 4.5:1 | 7:1 |
| Large text (>= 18px or >= 14px bold) | 3:1 | 4.5:1 |
| UI components & graphical objects | 3:1 | 3:1 |
| Focus indicators | 3:1 | — |
| Placeholder text | 4.5:1 | 7:1 |
| Disabled elements | exempt | exempt |
| Decorative elements | exempt | exempt |

**Contrast ratio formula:**
```
ratio = (L1 + 0.05) / (L2 + 0.05)
where L1 = lighter relative luminance, L2 = darker

Relative luminance:
L = 0.2126 * R + 0.7152 * G + 0.0722 * B
where R/G/B are linearized: if sRGB <= 0.03928 then linear = sRGB/12.92
else linear = ((sRGB + 0.055) / 1.055) ^ 2.4
```

**How to audit:**
1. Extract all color tokens from design system
2. Build all foreground/background pair combinations used in the UI
3. Compute contrast ratio for each pair
4. Check all state variants: default, hover, active, disabled, focus, error, selected
5. Flag pairs below threshold — error for AA fail, warning for AAA fail
6. Verify non-text UI elements (icons, borders, form controls) meet 3:1

**Color-blind safety:**
- Never rely on color alone to convey information (WCAG 1.4.1)
- Provide secondary indicators: icons, patterns, labels, underlines
- Test with simulated protanopia, deuteranopia, tritanopia
- Common problem pairs: red/green, blue/purple, light green/yellow

**Remediation pattern:**
```tsx
// BAD: color-only status
<span className={status === 'error' ? 'text-red-500' : 'text-green-500'}>
  {status}
</span>

// GOOD: color + icon + text
<span className={status === 'error' ? 'text-red-500' : 'text-green-500'}>
  {status === 'error' ? <AlertIcon aria-hidden="true" /> : <CheckIcon aria-hidden="true" />}
  {status === 'error' ? 'Error' : 'Success'}
</span>
```

### 2. Keyboard Navigation (WCAG 2.1.1 / 2.1.2 / 2.4.7 / 2.4.11 / 2.4.12 / 2.4.13)

| Element | Key | Expected Behavior | ARIA Pattern |
|---------|-----|-------------------|--------------|
| Button | Tab + Enter/Space | Activates | `role="button"` if not `<button>` |
| Link | Tab + Enter | Navigates | Native `<a>` preferred |
| Text input | Tab | Focuses, type to edit | `<input>` or `role="textbox"` |
| Checkbox | Tab + Space | Toggles | `role="checkbox"`, `aria-checked` |
| Radio | Tab to group, Arrow within | Selects | `role="radiogroup"`, `role="radio"` |
| Select/Dropdown | Tab + Arrow + Enter | Opens, navigates, selects | `role="listbox"`, `aria-expanded` |
| Modal | Tab trapped inside, Escape closes | Focus trapped | `role="dialog"`, `aria-modal="true"` |
| Menu | Arrow keys, Escape | Navigates items | `role="menu"`, `role="menuitem"` |
| Tabs | Tab to active, Arrow between | Switches panel | `role="tablist"`, `role="tab"` |
| Accordion | Tab + Enter/Space | Toggles section | `aria-expanded`, `aria-controls` |
| Slider | Tab + Arrow | Adjusts value | `role="slider"`, `aria-valuenow` |
| Tooltip | Focus/hover trigger | Shows on focus too | `role="tooltip"`, `aria-describedby` |
| Combobox | Tab + type + Arrow | Filters + navigates | `role="combobox"`, `aria-autocomplete` |

**Focus visibility requirements (WCAG 2.4.11 — new in 2.2):**
- Focus indicator must have >= 2px outline
- Must contrast 3:1 against adjacent colors
- Must not be fully obscured by other content
- Minimum focus area: 2px perimeter of the component

**Focus-not-obscured (WCAG 2.4.12 — new in 2.2):**
- Focused element must not be entirely hidden by sticky headers, footers, or overlays
- At least partial visibility required when focused

**Audit steps:**
1. Tab through every interactive element — verify logical order matches visual order
2. Verify focus ring is visible (min 2px, contrasts 3:1 with background)
3. Verify Escape closes overlays and returns focus to trigger
4. Verify no keyboard traps (can always Tab away from non-modal elements)
5. Verify all custom widgets implement WAI-ARIA keyboard patterns
6. Verify skip link exists and works ("Skip to main content")
7. Test with sticky/fixed positioned elements — focus must not be fully obscured

**Remediation pattern — focus ring:**
```tsx
// Tailwind focus ring that meets WCAG 2.4.11
<button className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current">
  Action
</button>

// CSS custom property approach
.interactive:focus-visible {
  outline: 2px solid var(--fg);
  outline-offset: 2px;
}
```

**Remediation pattern — focus trap (modal):**
```tsx
function useFocusTrap(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    el.addEventListener('keydown', handleKeyDown);
    first?.focus();
    return () => el.removeEventListener('keydown', handleKeyDown);
  }, [ref]);
}
```

### 3. Screen Reader Compatibility (WCAG 4.1.2 / 1.3.1 / 1.3.5 / 1.3.6)

| Pattern | Required ARIA / HTML | Example |
|---------|---------------------|---------|
| Icon-only button | `aria-label` | `<button aria-label="Close"><XIcon /></button>` |
| Decorative image | `aria-hidden="true"` or `role="presentation"` | `<img src="..." alt="" role="presentation" />` |
| Informative image | `alt` text | `<img src="chart.png" alt="Revenue grew 23% in Q4" />` |
| Form field | `<label>` association | `<label htmlFor="email">Email</label><input id="email" />` |
| Form group | `<fieldset>` + `<legend>` | Radio groups, checkbox groups |
| Error message | `aria-describedby` + `aria-invalid` | `<input aria-invalid="true" aria-describedby="err-1" />` |
| Live region | `aria-live="polite"` or `"assertive"` | Toast notifications, loading states |
| Loading state | `aria-busy="true"` | `<div aria-busy="true" aria-live="polite">Loading...</div>` |
| Expandable | `aria-expanded` + `aria-controls` | Accordion, dropdown, collapsible |
| Selected state | `aria-selected` or `aria-current` | Tabs, nav items, list selections |
| Progress | `role="progressbar"` + `aria-valuenow` | `<div role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100">` |
| Table | `<th scope="col/row">` + `<caption>` | Data tables with headers |
| Status message | `role="status"` | Non-intrusive updates (WCAG 4.1.3) |

**Identify Purpose (WCAG 1.3.5 — autocomplete):**
- Form inputs for personal data must use `autocomplete` attributes
- `autocomplete="name"`, `autocomplete="email"`, `autocomplete="tel"`, etc.
- Helps assistive tech auto-fill and identify field purpose

**Remediation pattern — live region:**
```tsx
// Announce dynamic content changes
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {statusMessage}
</div>

// Tailwind sr-only utility for visually hidden but screen-reader accessible
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### 4. Focus Management (WCAG 2.4.3 / 2.4.7 / 3.2.1 / 3.2.2)

| Scenario | Focus Behavior |
|----------|---------------|
| Modal opens | Move focus to first focusable element or the modal heading |
| Modal closes | Return focus to the element that triggered the modal |
| Page navigation (SPA) | Move focus to `<main>` or `<h1>` of new page |
| Dynamic content insert | Announce with `aria-live`, optionally move focus |
| Item deleted from list | Focus next item, or previous if last was deleted |
| Accordion expand | Focus remains on trigger; content is next in tab order |
| Error in form | Move focus to first invalid field |
| Toast notification | Use `aria-live="polite"` — do NOT move focus |
| Skip link activation | Move focus to main content landmark |

**No focus-on-change (WCAG 3.2.1):**
- Receiving focus must not trigger a context change (page navigation, form submit, modal open)
- Hover or focus alone should not cause unexpected state changes

**Remediation pattern — SPA route change:**
```tsx
// After route change, move focus to main heading
useEffect(() => {
  const heading = document.querySelector('h1');
  if (heading) {
    heading.setAttribute('tabindex', '-1');
    heading.focus();
  }
}, [pathname]);
```

### 5. Touch & Pointer (WCAG 2.5.5 / 2.5.7 / 2.5.8)

**Target size (WCAG 2.5.5 — enhanced, WCAG 2.5.8 — new in 2.2):**
| Level | Minimum Size | Notes |
|-------|-------------|-------|
| AA (2.5.8) | 24x24 CSS px | Or 24px spacing between targets |
| AAA (2.5.5) | 44x44 CSS px | Recommended for mobile |
| Exception | Inline links in text | Exempt from size requirement |
| Exception | User-agent controlled | Native browser elements |

**Dragging movements (WCAG 2.5.7 — new in 2.2):**
- Any drag-based operation must have a non-dragging alternative
- Drag-to-reorder → up/down buttons or keyboard arrows
- Drag-to-resize → resize handle with keyboard support
- Drag-to-draw → tap/click waypoints

**Remediation pattern — touch targets:**
```tsx
// Ensure 44x44 minimum touch area even for small visual elements
<button className="relative min-h-[44px] min-w-[44px] flex items-center justify-center">
  <XIcon className="h-4 w-4" />
</button>

// For inline elements that can't be 44px, use padding/margin for spacing
<nav className="flex gap-2">
  {items.map(item => (
    <a key={item.id} className="px-3 py-2 min-h-[44px] inline-flex items-center">
      {item.label}
    </a>
  ))}
</nav>
```

### 6. Motion & Animation (WCAG 2.3.1 / 2.3.3 / 2.2.2)

| Rule | Requirement |
|------|-------------|
| No seizure triggers | No content flashes > 3 times/second |
| No auto-play without controls | Auto-playing content has pause/stop |
| Respect `prefers-reduced-motion` | All animation must check this |
| Parallax/scroll-linked | Must degrade to static under reduced-motion |
| Carousel/slideshow | Auto-advance has visible pause control |
| Video | Captions + audio description available |

**Non-negotiable reduced-motion pattern:**
```tsx
// CSS approach — always provide reduced-motion override
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

// Tailwind approach
<div className="animate-fade-in motion-reduce:animate-none">

// React hook for programmatic animation control
function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return prefersReduced;
}

// Framer Motion integration
const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: prefersReduced ? 0 : 0.3 },
};
```

### 7. Semantic Structure (WCAG 1.3.1 / 2.4.1 / 2.4.2 / 2.4.6)

**Heading hierarchy:**
- One `<h1>` per page — matches `<title>`
- Heading levels must not skip (h1 > h2 > h3, never h1 > h3)
- Headings must be descriptive (not "Section 1")

**Landmark regions:**
| Landmark | HTML Element | Notes |
|----------|-------------|-------|
| Banner | `<header>` | Site-wide header (one per page) |
| Navigation | `<nav>` | Label with `aria-label` if > 1 nav |
| Main | `<main>` | One per page, skip link target |
| Complementary | `<aside>` | Related but independent content |
| Content Info | `<footer>` | Site-wide footer |
| Search | `<search>` (HTML5.2) or `role="search"` | Search functionality |
| Form | `<form>` with accessible name | Named form regions |

**Lists:**
- Use `<ul>/<ol>/<dl>`, not styled `<div>` sequences
- Assistive tech announces list item count
- Definition lists (`<dl>`) for key-value pairs

**Tables:**
- Data tables: `<th scope="col/row">`, `<caption>` or `aria-labelledby`
- Layout tables: avoid; if unavoidable, use `role="presentation"`

**Page title (WCAG 2.4.2):**
- Every page must have a unique, descriptive `<title>`
- Format: "Page Name | Site Name" or "Page Name — Site Name"

### 8. Cognitive Accessibility (WCAG 2.2 New Criteria)

**Consistent help (WCAG 3.2.6 — new in 2.2):**
- Help mechanisms (chat, FAQ link, contact) must appear in the same relative position across pages
- If a footer has a "Help" link on one page, all pages must have it in the same spot

**Redundant entry (WCAG 3.3.7 — new in 2.2):**
- Don't ask users to re-enter information they've already provided in the same session
- Auto-populate from previous steps (shipping → billing address)
- Exception: security re-authentication, data confirmation

**Accessible authentication (WCAG 3.3.8 — new in 2.2):**
- No cognitive function test (puzzle, memorization) as sole auth method
- Allow password managers (don't block paste in password fields)
- Allow copy-paste for verification codes
- Biometric and passkey alternatives satisfy this criterion

**Remediation patterns:**
```tsx
// BAD: blocks paste in password field
<input type="password" onPaste={(e) => e.preventDefault()} />

// GOOD: allows paste, supports password managers
<input type="password" autoComplete="current-password" />

// BAD: cognitive test CAPTCHA as only option
<ReCaptcha />

// GOOD: multiple auth options
<fieldset>
  <legend>Verify you're human</legend>
  <button onClick={handlePasskey}>Sign in with passkey</button>
  <button onClick={handleEmail}>Email verification code</button>
</fieldset>
```

### 9. Forms & Error Handling (WCAG 1.3.5 / 3.3.1 / 3.3.2 / 3.3.3 / 3.3.4)

| Criterion | Requirement |
|-----------|------------|
| Error identification (3.3.1) | Errors described in text, not color alone |
| Labels/instructions (3.3.2) | All inputs have visible labels |
| Error suggestion (3.3.3) | Suggest corrections when known |
| Error prevention (3.3.4) | Legal/financial: reversible, checked, confirmed |
| Input purpose (1.3.5) | `autocomplete` on personal data fields |

**Remediation pattern — form validation:**
```tsx
<form aria-describedby="form-errors" noValidate onSubmit={handleSubmit}>
  {errors.length > 0 && (
    <div id="form-errors" role="alert" className="text-red-600">
      <h2>Please fix {errors.length} error{errors.length > 1 ? 's' : ''}:</h2>
      <ul>
        {errors.map(err => (
          <li key={err.field}>
            <a href={`#${err.field}`}>{err.message}</a>
          </li>
        ))}
      </ul>
    </div>
  )}

  <div>
    <label htmlFor="email">Email address</label>
    <input
      id="email"
      type="email"
      autoComplete="email"
      aria-invalid={hasError('email')}
      aria-describedby={hasError('email') ? 'email-error' : undefined}
    />
    {hasError('email') && (
      <p id="email-error" className="text-red-600">
        Enter a valid email address (e.g., name@example.com)
      </p>
    )}
  </div>
</form>
```

---

## Severity Levels

| Level | Meaning | Action | Examples |
|-------|---------|--------|----------|
| **Critical** | Blocks access for disabled users | Must fix before ship | Missing alt text on nav images, no keyboard access to primary actions, contrast below 2:1 |
| **Major** | Significant barrier, workaround exists | Fix in current sprint | Missing focus indicators, no skip link, heading hierarchy broken |
| **Minor** | Degraded experience, not a blocker | Fix in backlog | AAA contrast fail (passes AA), touch targets 36px (not 44px), missing autocomplete |
| **Info** | Best practice improvement | Track for next iteration | Could add aria-describedby for extra context, landmark labels for multiple navs |

---

## Automated Testing Tools

### Build-time / CI
| Tool | What It Catches | Integration |
|------|----------------|-------------|
| **axe-core** | 50+ WCAG rules, DOM-based | `@axe-core/react`, `jest-axe`, Playwright |
| **eslint-plugin-jsx-a11y** | Static JSX checks (missing alt, role misuse) | ESLint config |
| **pa11y** | Page-level WCAG scans | CI pipeline, URL-based |
| **Lighthouse** | Accessibility score + specific issues | Chrome DevTools, CI |

### Development-time
| Tool | Usage |
|------|-------|
| **axe DevTools** | Browser extension — real-time audit |
| **WAVE** | Browser extension — visual overlay of issues |
| **Accessibility Insights** | Microsoft tool — guided manual + automated |
| **VoiceOver** (macOS) | Cmd+F5 to test screen reader |
| **NVDA** (Windows) | Free screen reader for testing |

### Recommended test setup:
```typescript
// vitest + jest-axe for component-level a11y testing
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';

expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

// Playwright + axe for page-level testing
import AxeBuilder from '@axe-core/playwright';

test('page has no a11y violations', async ({ page }) => {
  await page.goto('/dashboard');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

---

## Output Format

Each finding should produce:

```json
{
  "id": "a11y-001",
  "rule": "WCAG 1.4.3",
  "level": "A",
  "severity": "critical",
  "component": "StatusBadge",
  "element": "badge text on green background",
  "issue": "Contrast ratio 2.8:1 — below 4.5:1 AA threshold for normal text",
  "currentValue": "fg: #ffffff, bg: #22c55e → 2.8:1",
  "remediation": "Darken text to #1a472a (7.2:1) or switch bg to #16a34a with white text (3.4:1 — still fails, use #15803d for 4.6:1)",
  "effort": "low",
  "automated": true,
  "testWith": "axe-core rule: color-contrast"
}
```

---

## Integration with Memoire

### Spec feedback loop
- Findings map to spec `accessibility` field updates
- Critical/Major issues block codegen (emit warning in generation output)
- Color contrast findings update design token recommendations
- Keyboard nav findings add to component `keyboardNav` spec property
- Touch target findings set `touchTarget` spec property

### Codegen enforcement
- Generated components always include `aria-label` when spec says `"required"`
- Generated forms always include `<label>` associations
- Generated modals always include focus trap and Escape handler
- Generated images always include `alt` attribute (empty string for decorative)
- `prefers-reduced-motion` media query included when component has animations

### Design token validation
- All fg/bg token pairs are contrast-checked at token registration time
- Failing pairs are flagged in `memi tokens` output
- Design system health score includes accessibility compliance percentage

### WCAG 2.2 criteria coverage map
| Criterion | Spec Field | Agent Check | Codegen Enforced |
|-----------|-----------|-------------|-----------------|
| 1.4.3 Contrast | designTokens | a11yContrast | token validation |
| 1.4.11 Non-text Contrast | designTokens | a11yContrast | border/icon checks |
| 2.1.1 Keyboard | accessibility.keyboardNav | a11yKeyboard | focus styles |
| 2.4.7 Focus Visible | accessibility.focusStyle | a11yKeyboard | outline classes |
| 2.4.11 Focus Appearance | accessibility.focusStyle | a11yKeyboard | 2px outline |
| 2.5.5 Target Size | accessibility.touchTarget | a11yCognitive | min-h/min-w |
| 2.5.8 Target Size Min | accessibility.touchTarget | a11yCognitive | 24px minimum |
| 3.3.2 Labels | accessibility.ariaLabel | a11yAria | label elements |
| 4.1.2 Name/Role/Value | accessibility.role | a11yAria | ARIA attributes |
