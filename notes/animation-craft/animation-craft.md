---
name: Animation Craft
description: Motion design and micro-interaction craft -- animation principles, timing curves, Framer Motion patterns, CSS transitions, loading states, and delightful UI choreography
category: craft
activateOn: component-creation
freedomLevel: high
version: 1.0.0
tags: [animation, motion, framer-motion, micro-interactions, transitions, choreography]
---

# Animation Craft -- Motion Design Intelligence

> Skill pack for designing and implementing animations that communicate, guide, and delight. Covers the 12 principles, micro-interaction patterns, CSS/Tailwind utilities, Framer Motion, performance, motion tokens, and accessibility.

## Core Philosophy

Motion is communication, not decoration. Every animation must answer: **what changed, where should I look, and what can I do next?** If an animation does not serve one of those purposes, remove it.

## The 12 Principles of Animation (Applied to UI)

| # | Principle | UI Application |
|---|-----------|---------------|
| 1 | Squash & Stretch | Button press scales down slightly on `:active`, bounces on release |
| 2 | Anticipation | Subtle pull-back before a card flies out; drawer nudges before opening |
| 3 | Staging | Direct attention to one element at a time; dim background on modal open |
| 4 | Straight Ahead / Pose to Pose | Use keyframe-based (pose to pose) for predictable UI; physics-based for playful elements |
| 5 | Follow Through / Overlap | Stagger child elements so they arrive after the parent; badge swings after nav settles |
| 6 | Ease In / Ease Out | Never use `linear` for UI motion; always ease-out for entrances, ease-in for exits |
| 7 | Arcs | Floating action buttons follow arc paths, not straight lines |
| 8 | Secondary Action | Icon spins while its label fades in; progress bar pulses while count increments |
| 9 | Timing | Fast = confident (150ms); medium = informative (300ms); slow = dramatic (500ms+) |
| 10 | Exaggeration | Shake on error; overshoot on success checkmark; scale pulse on notification |
| 11 | Solid Drawing | Maintain consistent 3D perspective in card flips and rotations |
| 12 | Appeal | Curves over straight lines; spring physics over linear easing; personality over sterility |

## Easing Curves Reference

| Name | CSS Value | Use Case |
|------|-----------|----------|
| ease-out | `cubic-bezier(0.0, 0.0, 0.2, 1.0)` | Elements entering the screen |
| ease-in | `cubic-bezier(0.4, 0.0, 1.0, 1.0)` | Elements leaving the screen |
| ease-in-out | `cubic-bezier(0.4, 0.0, 0.2, 1.0)` | Elements moving between positions |
| spring | `cubic-bezier(0.34, 1.56, 0.64, 1.0)` | Playful overshoot (buttons, toggles) |
| sharp | `cubic-bezier(0.4, 0.0, 0.6, 1.0)` | Quick, decisive actions (close, dismiss) |
| smooth | `cubic-bezier(0.0, 0.0, 0.0, 1.0)` | Background, ambient motion |

## Duration Guidelines

| Category | Duration | Examples |
|----------|----------|----------|
| Micro | 100-150ms | Hover states, opacity changes, color shifts |
| Fast | 150-250ms | Button press, toggle, checkbox, tooltip show |
| Medium | 250-400ms | Card expand, dropdown open, tab switch |
| Slow | 400-700ms | Modal entrance, page transition, drawer slide |
| Dramatic | 700ms+ | Hero reveals, onboarding sequences, data viz entry |

**Rule of thumb:** Small elements move fast. Large elements move slower. Elements traveling greater distances need more time.

## Micro-Interaction Patterns

### Button States

```css
.btn {
  transition: transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1.0),
              box-shadow 150ms ease-out,
              background-color 100ms ease;
}
.btn:hover   { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
.btn:active  { transform: scale(0.97); box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
```

### Loading States

| Pattern | When to Use | Implementation |
|---------|-------------|----------------|
| Skeleton screens | Content loading (lists, cards) | Pulsing gray rectangles matching content shape |
| Spinner | Action in progress (submit, save) | Rotating circle, 800ms loop |
| Progress bar | Determinate progress (upload, sync) | Width transition with ease-out |
| Shimmer | Content placeholder (images, text) | Gradient sweep, 1.5s loop |
| Dot pulse | Waiting (chat, AI response) | Three dots scaling in sequence, 1.2s loop |

### Transitions

| From/To | Animation | Duration |
|---------|-----------|----------|
| Page A to Page B | Shared element morph + fade crossfade | 300-400ms |
| List to Detail | Card expands to fill viewport | 350ms ease-out |
| Tab A to Tab B | Content fades, slides in direction of tab | 200ms |
| Show modal | Backdrop fades in (200ms) + modal scales up from 0.95 (250ms) | 250ms |
| Dismiss modal | Modal fades + scales to 0.95 (200ms) + backdrop fades out (150ms) | 200ms |

### Feedback Animations

| Event | Animation |
|-------|-----------|
| Success | Checkmark draws in (stroke-dashoffset), green flash |
| Error | Horizontal shake (3 cycles, 4px amplitude, 400ms), red border pulse |
| Warning | Single gentle pulse (scale 1.02), amber glow |
| Copy to clipboard | Brief scale pop (1.1) + tooltip "Copied" fade in |
| Drag start | Element lifts (scale 1.03, shadow increase) |
| Drop | Element settles (spring ease, slight overshoot) |

## CSS / Tailwind Animation Utilities

### Built-in Tailwind Classes

```
animate-spin      -- 1s linear infinite rotation
animate-ping      -- 1s cubic-bezier outward ring
animate-pulse     -- 2s ease-in-out opacity pulse
animate-bounce    -- 1s infinite vertical bounce
```

### Custom Tailwind Config Extensions

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 300ms ease-out forwards',
        'slide-in-right': 'slide-in-right 350ms ease-out forwards',
        'scale-in': 'scale-in 250ms ease-out forwards',
        'shake': 'shake 400ms ease-in-out',
      },
    },
  },
}
```

### Stagger Pattern with Tailwind

```html
<div class="animate-fade-in" style="animation-delay: 0ms">Item 1</div>
<div class="animate-fade-in" style="animation-delay: 50ms">Item 2</div>
<div class="animate-fade-in" style="animation-delay: 100ms">Item 3</div>
```

## Framer Motion Patterns

### Fade-In on Mount

```tsx
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: [0.0, 0.0, 0.2, 1.0] }}
>
  {children}
</motion.div>
```

### Staggered List

```tsx
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

<motion.ul variants={container} initial="hidden" animate="show">
  {items.map((i) => (
    <motion.li key={i.id} variants={item}>{i.label}</motion.li>
  ))}
</motion.ul>
```

### Layout Animation (Shared Element)

```tsx
<motion.div layoutId={`card-${id}`} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
  <Card>{content}</Card>
</motion.div>
```

### Exit Animation with AnimatePresence

```tsx
<AnimatePresence mode="wait">
  {isOpen && (
    <motion.div
      key="modal"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    />
  )}
</AnimatePresence>
```

### Spring Physics

```tsx
// Snappy, no overshoot
{ type: 'spring', stiffness: 500, damping: 30 }

// Bouncy, playful
{ type: 'spring', stiffness: 300, damping: 15 }

// Gentle settle
{ type: 'spring', stiffness: 200, damping: 25 }
```

## Performance Guidelines

### The 60fps Contract

Every animation must hit 60fps (16.67ms per frame). Only animate properties that trigger **compositing**, not layout or paint.

| Safe (Compositor) | Unsafe (Layout/Paint) |
|-------------------|-----------------------|
| `transform` | `width`, `height` |
| `opacity` | `top`, `left`, `right`, `bottom` |
| `filter` | `margin`, `padding` |
| `clip-path` (on GPU layer) | `border-radius` (if animated) |

### GPU Layer Promotion

```css
/* Promote element to its own compositor layer */
.animated-element {
  will-change: transform, opacity;
  transform: translateZ(0); /* Force GPU layer */
}
```

**Rules:**
- Add `will-change` before the animation starts, remove after it ends
- Do not apply `will-change` to more than 10 elements simultaneously
- Never `will-change: auto` on scroll containers with many children
- Prefer `transform: translate3d()` over `top/left` for position animation

### Measurement Checklist

1. Open DevTools Performance tab, record the animation
2. Check for frame drops below 60fps
3. Look for forced reflows (layout thrashing) in the timeline
4. Verify GPU layers in the Layers panel -- too many layers waste VRAM
5. Test on low-end devices (throttle CPU 4x in DevTools)

## Motion Tokens

Define these as CSS custom properties or Tailwind theme values for consistency across the system.

```css
:root {
  /* Duration */
  --motion-duration-micro: 100ms;
  --motion-duration-fast: 200ms;
  --motion-duration-medium: 300ms;
  --motion-duration-slow: 500ms;
  --motion-duration-dramatic: 800ms;

  /* Easing */
  --motion-ease-out: cubic-bezier(0.0, 0.0, 0.2, 1.0);
  --motion-ease-in: cubic-bezier(0.4, 0.0, 1.0, 1.0);
  --motion-ease-in-out: cubic-bezier(0.4, 0.0, 0.2, 1.0);
  --motion-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1.0);

  /* Distance */
  --motion-distance-sm: 4px;
  --motion-distance-md: 8px;
  --motion-distance-lg: 16px;
  --motion-distance-xl: 32px;

  /* Stagger */
  --motion-stagger-fast: 30ms;
  --motion-stagger-medium: 50ms;
  --motion-stagger-slow: 80ms;
}
```

## Accessibility -- prefers-reduced-motion

All motion must respect the user's operating system preference. This is non-negotiable.

### CSS Approach

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Framer Motion Approach

```tsx
import { useReducedMotion } from 'framer-motion';

function AnimatedCard({ children }: { children: React.ReactNode }) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduce ? { duration: 0 } : { duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
```

### What to Preserve in Reduced Motion Mode

- **Keep:** Opacity fades (brief, under 150ms), color changes, instant state changes
- **Remove:** Translations, scaling, rotations, parallax, auto-playing sequences
- **Simplify:** Complex choreography becomes a single crossfade

## Choreography Rules

1. **Entrance order:** Background first, then container, then content, then secondary elements
2. **Exit order:** Reverse of entrance -- secondary elements leave first
3. **Stagger cap:** Never stagger more than 8 items; group remaining items into a batch
4. **One hero at a time:** Only one element should perform a dramatic animation at any moment
5. **Respect reading order:** Stagger direction follows the user's reading flow (top-left to bottom-right in LTR)
6. **Settle before interact:** No element should be interactive while still animating into position
