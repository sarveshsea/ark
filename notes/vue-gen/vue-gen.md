---
name: vue-gen
description: Vue 3 Composition API code generation — transforms Memoire component specs into Vue SFCs with script setup, Tailwind styling, and composable patterns
activateOn: component-creation
freedomLevel: high
category: generate
tags: [vue, vue3, composition-api, sfc, tailwind, codegen]
---

# Vue Generator — Memoire Note

Generate production-grade Vue 3 Single File Components from Memoire specs. Every output
uses `<script setup lang="ts">`, Tailwind for styling, and follows Atomic Design folder
conventions. This skill replaces the default React/shadcn-ui codegen pipeline with a
Vue-native equivalent powered by shadcn-vue.

---

## 1. SFC Structure

Every generated component follows this canonical order:

```vue
<script setup lang="ts">
// 1. Type imports
// 2. Component imports (other SFCs, shadcn-vue)
// 3. Composable imports
// 4. Props definition
// 5. Emits definition
// 6. Reactive state (ref, reactive, computed)
// 7. Methods and handlers
// 8. Lifecycle hooks
// 9. Watchers
// 10. Expose (if needed)
</script>

<template>
  <!-- Single root element preferred but not required (Vue 3 supports fragments) -->
  <!-- Use semantic HTML elements -->
  <!-- Tailwind utility classes for all styling -->
</template>
```

No `<style>` block by default. All styling is handled through Tailwind utility classes
in the template. A scoped style block is permitted only when Tailwind cannot express the
rule (e.g., deep selectors for third-party components, complex animations with @keyframes).

```vue
<!-- Only when strictly necessary -->
<style scoped>
/* Deep selector for third-party child components */
:deep(.third-party-inner) {
  /* ... */
}
</style>
```

---

## 2. Atomic Level to Folder Mapping

Memoire enforces Atomic Design. Vue output mirrors the same folder structure used by the
React pipeline, substituting `.vue` for `.tsx`.

| Atomic Level | Output Folder                   | File Pattern               | Composition Rule                          |
|--------------|---------------------------------|----------------------------|-------------------------------------------|
| `atom`       | `components/ui/`               | `ComponentName.vue`        | Standalone. `composesSpecs` must be empty |
| `molecule`   | `components/molecules/`        | `ComponentName.vue`        | Composes 2-5 atoms                        |
| `organism`   | `components/organisms/`        | `ComponentName.vue`        | Composes molecules and/or atoms           |
| `template`   | `components/templates/`        | `ComponentName.vue`        | Layout skeleton, no real content          |
| `page`       | `pages/` or `views/`           | `PageName.vue`             | Template filled with data                 |

Index barrels use `index.ts`:

```ts
// components/ui/index.ts
export { default as Button } from './Button.vue'
export { default as Badge } from './Badge.vue'
export { default as Input } from './Input.vue'
```

---

## 3. Props with defineProps

Always use the type-based declaration with a TypeScript interface. The interface lives
inside the `<script setup>` block, co-located with the component that owns it. Export
the interface only when other components need to extend it.

### Basic props

```vue
<script setup lang="ts">
interface Props {
  /** Primary display text */
  label: string
  /** Visual variant */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  /** Render in compact size */
  size?: 'sm' | 'md' | 'lg'
  /** Disable all interactions */
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  disabled: false,
})
</script>
```

### Rules

- Use `withDefaults` for default values. Never use JavaScript default parameters.
- Optional props use `?` in the interface. Required props omit it.
- Document every prop with a JSDoc comment.
- Boolean props default to `false` unless there is a strong UX reason otherwise.
- Union string literal types replace enums for variant/size/status props.
- Complex object props define a dedicated interface above the Props interface.

### Mapping from ComponentSpec.props

The Memoire `ComponentSpec.props` field is a `Record<string, string>` where keys are
prop names and values are type strings (e.g., `"string"`, `"boolean"`, `"'sm' | 'md' | 'lg'"`).

Translation rules:

| Spec Type String         | Vue Prop Type                       |
|--------------------------|-------------------------------------|
| `"string"`               | `string`                            |
| `"number"`               | `number`                            |
| `"boolean"`              | `boolean`                           |
| `"string[]"`             | `string[]`                          |
| `"ReactNode"` / `"node"`| `— slot instead (see section 6)`   |
| `"() => void"`           | `— emit instead (see section 4)`   |
| `"'a' \| 'b' \| 'c'"`  | `'a' \| 'b' \| 'c'`               |
| `"Record<K, V>"`        | `Record<K, V>`                      |
| `"ComponentSpec.name"`   | Import the child component type     |

When a prop type is `"ReactNode"` or `"node"`, do not create a prop. Create a named
slot instead. When a prop type is a callback `"() => void"`, define an emit.

---

## 4. Emits with defineEmits

Use the type-based declaration. Every emit gets a descriptive name prefixed with a verb.

```vue
<script setup lang="ts">
const emit = defineEmits<{
  /** Fired when the user clicks the primary action */
  (e: 'click', event: MouseEvent): void
  /** Fired when the value changes */
  (e: 'update:modelValue', value: string): void
  /** Fired when the component requests dismissal */
  (e: 'dismiss'): void
}>()
</script>
```

### v-model support

Components that wrap form controls must support `v-model` via the `modelValue` prop and
`update:modelValue` emit convention.

```vue
<script setup lang="ts">
interface Props {
  modelValue: string
  placeholder?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <input
    :value="modelValue"
    :placeholder="placeholder"
    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    @input="onInput"
  />
</template>
```

### Multiple v-model bindings (Vue 3.4+)

```vue
<script setup lang="ts">
const firstName = defineModel<string>('firstName')
const lastName = defineModel<string>('lastName')
</script>
```

Prefer `defineModel` when targeting Vue 3.4+. Fall back to `modelValue` + emit for
broader compatibility.

---

## 5. Reactive State

### ref for primitives and single values

```ts
import { ref } from 'vue'

const isOpen = ref(false)
const count = ref(0)
const searchQuery = ref('')
```

### reactive for objects

```ts
import { reactive } from 'vue'

interface FormState {
  name: string
  email: string
  errors: Record<string, string>
}

const form = reactive<FormState>({
  name: '',
  email: '',
  errors: {},
})
```

### computed for derived values

```ts
import { computed } from 'vue'

const isValid = computed(() => form.name.length > 0 && form.email.includes('@'))
const itemCount = computed(() => items.value.length)
const filteredItems = computed(() =>
  items.value.filter(item =>
    item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
)
```

### Rules

- Prefer `ref` over `reactive` for most cases. `reactive` loses reactivity on reassignment.
- Always type `ref` and `reactive` generics when the initial value does not fully express the type.
- Never destructure `reactive` objects — reactivity is lost. Use `toRefs` if destructuring is needed.
- Use `computed` for any derived state. Never store derived state in a separate `ref` and sync manually.

---

## 6. Slot Patterns

Slots are Vue's composition mechanism. They replace React's `children` and render props.

### Default slot

```vue
<!-- Card.vue -->
<template>
  <div class="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
    <slot />
  </div>
</template>
```

### Named slots

```vue
<!-- Card.vue with header and footer -->
<template>
  <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
    <div v-if="$slots.header" class="flex flex-col space-y-1.5 p-6">
      <slot name="header" />
    </div>
    <div class="p-6 pt-0">
      <slot />
    </div>
    <div v-if="$slots.footer" class="flex items-center p-6 pt-0">
      <slot name="footer" />
    </div>
  </div>
</template>
```

### Scoped slots

For components that expose data to their consumers:

```vue
<!-- DataList.vue -->
<script setup lang="ts">
interface Props {
  items: unknown[]
}

const props = defineProps<Props>()
</script>

<template>
  <ul class="divide-y divide-border">
    <li v-for="(item, index) in items" :key="index" class="py-3">
      <slot name="item" :item="item" :index="index" />
    </li>
    <li v-if="items.length === 0">
      <slot name="empty">
        <p class="py-8 text-center text-sm text-muted-foreground">No items</p>
      </slot>
    </li>
  </ul>
</template>
```

### Rules

- Use `$slots.name` checks with `v-if` to conditionally render slot wrappers.
- Provide fallback content inside the `<slot>` tag for optional slots.
- When a Memoire spec prop has type `"ReactNode"` or `"node"`, convert to a slot.
- If the spec prop name is `"children"`, use the default slot. Any other name becomes a named slot.
- Scoped slots replace React render props.

---

## 7. Tailwind Class Binding

### Static classes

```vue
<template>
  <button class="inline-flex items-center justify-center rounded-md text-sm font-medium">
    <slot />
  </button>
</template>
```

### Dynamic classes with :class

```vue
<template>
  <button
    :class="[
      'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      variantClasses[variant],
      sizeClasses[size],
    ]"
  >
    <slot />
  </button>
</template>
```

### Variant maps in script

Define variant-to-class maps as plain objects in the script block, not as computed
properties, since they are static:

```vue
<script setup lang="ts">
interface Props {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
})

const variantClasses: Record<NonNullable<Props['variant']>, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
}

const sizeClasses: Record<NonNullable<Props['size']>, string> = {
  sm: 'h-9 rounded-md px-3',
  md: 'h-10 px-4 py-2',
  lg: 'h-11 rounded-md px-8',
}
</script>
```

### cn() utility

Use a `cn` utility (class-variance-authority + tailwind-merge pattern) for conditional
class merging. This is the same approach shadcn-vue uses:

```ts
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Usage in components:

```vue
<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div :class="cn('rounded-lg border bg-card p-6 shadow-sm', props.class)">
    <slot />
  </div>
</template>
```

### Rules

- Always accept an optional `class` prop so consumers can extend styling.
- Use `cn()` to merge consumer classes with component defaults.
- Never use inline `style` bindings for layout or theming. Only for truly dynamic values (percentages from data, user-chosen colors).
- Arrays in `:class` are preferred over template-literal concatenation.

---

## 8. Composables

Composables are the Vue equivalent of React hooks. They encapsulate reusable reactive
logic in `useXxx` functions.

### File location

```
composables/
  useToggle.ts
  useMediaQuery.ts
  useFetch.ts
  useDebounce.ts
  useLocalStorage.ts
```

### Basic composable

```ts
// composables/useToggle.ts
import { ref } from 'vue'

export function useToggle(initialValue = false) {
  const value = ref(initialValue)

  function toggle() {
    value.value = !value.value
  }

  function setTrue() {
    value.value = true
  }

  function setFalse() {
    value.value = false
  }

  return { value, toggle, setTrue, setFalse }
}
```

### Composable with cleanup

```ts
// composables/useMediaQuery.ts
import { ref, onMounted, onUnmounted } from 'vue'

export function useMediaQuery(query: string) {
  const matches = ref(false)
  let mediaQuery: MediaQueryList | null = null

  function handler(event: MediaQueryListEvent) {
    matches.value = event.matches
  }

  onMounted(() => {
    mediaQuery = window.matchMedia(query)
    matches.value = mediaQuery.matches
    mediaQuery.addEventListener('change', handler)
  })

  onUnmounted(() => {
    mediaQuery?.removeEventListener('change', handler)
  })

  return { matches }
}
```

### Async composable

```ts
// composables/useFetch.ts
import { ref, watchEffect, type Ref } from 'vue'

interface UseFetchReturn<T> {
  data: Ref<T | null>
  error: Ref<Error | null>
  isLoading: Ref<boolean>
}

export function useFetch<T>(url: Ref<string> | string): UseFetchReturn<T> {
  const data = ref<T | null>(null) as Ref<T | null>
  const error = ref<Error | null>(null)
  const isLoading = ref(false)

  async function fetchData(fetchUrl: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(fetchUrl)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      data.value = await response.json()
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
    } finally {
      isLoading.value = false
    }
  }

  if (typeof url === 'string') {
    fetchData(url)
  } else {
    watchEffect(() => {
      fetchData(url.value)
    })
  }

  return { data, error, isLoading }
}
```

### Rules

- Every composable file exports a single `useXxx` function.
- Always return an object (not an array) so destructuring is name-based.
- Clean up event listeners, timers, and subscriptions in `onUnmounted`.
- Accept both raw values and refs as arguments for flexibility. Use `toValue()` (Vue 3.3+) to unwrap.
- Never access the DOM in the composable body. Use `onMounted` for DOM-dependent logic.
- Composables must not import components. They are logic-only.

---

## 9. Lifecycle Hooks

```ts
import {
  onMounted,
  onUpdated,
  onUnmounted,
  onBeforeMount,
  onBeforeUpdate,
  onBeforeUnmount,
} from 'vue'

// Runs after the component is mounted to the DOM
onMounted(() => {
  // DOM is available, safe to query elements, start observers
})

// Runs before the component is removed
onUnmounted(() => {
  // Clean up: remove listeners, cancel timers, abort fetch
})
```

### Rules

- `onMounted` replaces React's `useEffect(() => {}, [])`.
- `onUnmounted` replaces the cleanup return in React's `useEffect`.
- Avoid `onUpdated` for most cases. Use `watch` or `watchEffect` for reactive side effects.
- Multiple calls to the same hook are allowed and compose in order. Use this to
  separate concerns rather than bundling unrelated logic into one hook.

---

## 10. Watchers

```ts
import { watch, watchEffect } from 'vue'

// Watch a specific source with old/new comparison
watch(() => props.variant, (newVal, oldVal) => {
  // React to variant changes
})

// Watch a ref
watch(searchQuery, (newQuery) => {
  // Debounced search
}, { debounce: 300 }) // Vue 3.5+ with built-in debounce

// Watch multiple sources
watch([searchQuery, selectedCategory], ([query, category]) => {
  fetchResults(query, category)
})

// Eager watcher — runs immediately and on every dependency change
watchEffect(() => {
  document.title = `${props.title} | App`
})
```

### Rules

- Prefer `watch` with explicit sources over `watchEffect` for clarity.
- Use `{ immediate: true }` when you need the callback to fire on mount.
- Use `{ deep: true }` sparingly — it is expensive on large objects.
- Return cleanup from watcher callbacks with `onCleanup` (Vue 3.5+).

---

## 11. Component Registration and Auto-Import

### Recommended: unplugin-vue-components

Configure auto-import so generated components do not need manual import statements in
pages and templates:

```ts
// vite.config.ts
import Components from 'unplugin-vue-components/vite'

export default defineConfig({
  plugins: [
    Components({
      dirs: [
        'components/ui',
        'components/molecules',
        'components/organisms',
        'components/templates',
      ],
      dts: true,
    }),
  ],
})
```

### Manual imports (when auto-import is not configured)

```vue
<script setup lang="ts">
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import MetricCard from '@/components/molecules/MetricCard.vue'
</script>
```

### Rules

- Always use PascalCase for component names in both file names and template usage.
- When referencing a component from the same atomic level, use a relative import.
- When referencing a component from a different level, use the `@/` alias.
- Generated index barrels must re-export with named exports for tree-shaking.

---

## 12. Memoire Spec Integration

### Reading a ComponentSpec

When the generator receives a `ComponentSpec` (from `specs/components/*.json`), it
extracts information in this order:

1. **name** -- PascalCase file name, determines output folder via `level`
2. **level** -- Atomic level, maps to output folder (section 2)
3. **purpose** -- Becomes the file-level JSDoc comment
4. **props** -- Translated to `defineProps` interface (section 3)
5. **variants** -- Become a union-type prop called `variant`
6. **shadcnBase** -- Maps to shadcn-vue imports (section 13)
7. **composesSpecs** -- Determines child component imports
8. **accessibility** -- Drives ARIA attributes and keyboard handling (section 14)
9. **designTokens** -- Determines whether to use CSS variables or Tailwind classes
10. **tags** -- Added as file-level comments for searchability

### Generation pipeline

```
ComponentSpec JSON
    |
    v
[1] Validate with Zod (ComponentSpecSchema)
    |
    v
[2] Resolve shadcnBase -> shadcn-vue component imports
    |
    v
[3] Resolve composesSpecs -> child component imports
    |
    v
[4] Map props (filter out "ReactNode" -> slots, "() => void" -> emits)
    |
    v
[5] Generate <script setup> block
    |
    v
[6] Generate <template> block with Tailwind classes
    |
    v
[7] Write to atomic-level output folder
    |
    v
[8] Update index barrel
```

### PageSpec generation

PageSpecs generate a page-level `.vue` file that imports the template and fills it with
data. Sections map to component instances with props:

```vue
<script setup lang="ts">
import DashboardTemplate from '@/components/templates/DashboardTemplate.vue'
import MetricCard from '@/components/molecules/MetricCard.vue'
import ActivityChart from '@/components/organisms/ActivityChart.vue'

// Data fetching composable
import { useDashboardData } from '@/composables/useDashboardData'

const { metrics, activities, isLoading } = useDashboardData()
</script>

<template>
  <DashboardTemplate>
    <template #metrics>
      <MetricCard
        v-for="metric in metrics"
        :key="metric.id"
        :label="metric.label"
        :value="metric.value"
        :trend="metric.trend"
      />
    </template>
    <template #main>
      <ActivityChart
        v-if="!isLoading"
        :data="activities"
      />
    </template>
  </DashboardTemplate>
</template>
```

---

## 13. shadcn-vue Mapping

shadcn-vue is the Vue port of shadcn/ui. It provides the same components with identical
styling but Vue-native APIs. The generator maps Memoire's `shadcnBase` field to shadcn-vue
imports.

| Memoire shadcnBase | shadcn-vue Import                                         | Notes                              |
|--------------------|-----------------------------------------------------------|------------------------------------|
| `Button`           | `import { Button } from '@/components/ui/button'`        | Supports `variant`, `size`, `asChild` |
| `Input`            | `import { Input } from '@/components/ui/input'`          | Use with `v-model`                 |
| `Label`            | `import { Label } from '@/components/ui/label'`          | Pair with every input              |
| `Badge`            | `import { Badge } from '@/components/ui/badge'`          | `variant` prop                     |
| `Card`             | `import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'` | Compound component |
| `Avatar`           | `import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'` | Compound component |
| `Select`           | `import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'` | Radix-vue based |
| `Dialog`           | `import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'` | Replaces Modal |
| `Tabs`             | `import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'` | |
| `Table`            | `import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'` | |
| `Tooltip`          | `import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'` | Wrap app in `TooltipProvider` |
| `DropdownMenu`     | `import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'` | |
| `Checkbox`         | `import { Checkbox } from '@/components/ui/checkbox'`    | Uses Radix-vue                     |
| `Switch`           | `import { Switch } from '@/components/ui/switch'`        | Replaces Toggle in some contexts   |
| `Skeleton`         | `import { Skeleton } from '@/components/ui/skeleton'`    | Loading placeholder                |
| `Separator`        | `import { Separator } from '@/components/ui/separator'`  | Horizontal or vertical             |
| `Progress`         | `import { Progress } from '@/components/ui/progress'`    | Accepts `modelValue` for %         |
| `Sheet`            | `import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'` | Mobile-friendly Drawer |
| `Accordion`        | `import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'` | |
| `Popover`          | `import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'` | |
| `Command`          | `import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'` | For Combobox patterns |
| `Toast`            | `import { useToast } from '@/components/ui/toast/use-toast'` | Composable-driven |

### shadcn-vue compound component pattern

Many shadcn-vue components are compound (Card, Dialog, Table, etc.). The generator must
import all sub-components and compose them in the template:

```vue
<script setup lang="ts">
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'

interface Props {
  title: string
  description?: string
}

const props = defineProps<Props>()
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>{{ title }}</CardTitle>
      <CardDescription v-if="description">{{ description }}</CardDescription>
    </CardHeader>
    <CardContent>
      <slot />
    </CardContent>
  </Card>
</template>
```

---

## 14. Accessibility Patterns

The generator reads `ComponentSpec.accessibility` and applies these rules.

### Role mapping

```vue
<template>
  <!-- spec.accessibility.role = "navigation" -->
  <nav aria-label="Main navigation">
    <slot />
  </nav>

  <!-- spec.accessibility.role = "alert" -->
  <div role="alert" class="rounded-md border border-destructive p-4">
    <slot />
  </div>

  <!-- spec.accessibility.role = "dialog" -->
  <!-- Use shadcn-vue Dialog which handles role automatically -->
</template>
```

### aria-label handling

| Spec Value   | Generated Code                                              |
|-------------|-------------------------------------------------------------|
| `required`  | Add `ariaLabel` to Props interface, bind with `:aria-label` |
| `optional`  | Add optional `ariaLabel` to Props, bind with `v-if`        |
| `none`      | Omit — content is self-describing or uses `aria-labelledby` |

```vue
<script setup lang="ts">
interface Props {
  ariaLabel: string  // required
}
</script>

<template>
  <button :aria-label="ariaLabel">
    <slot />
  </button>
</template>
```

### Keyboard navigation

When `spec.accessibility.keyboardNav` is true, the generator adds keyboard event handlers:

```vue
<script setup lang="ts">
function handleKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault()
      activate()
      break
    case 'Escape':
      close()
      break
    case 'ArrowDown':
      event.preventDefault()
      focusNext()
      break
    case 'ArrowUp':
      event.preventDefault()
      focusPrevious()
      break
  }
}
</script>

<template>
  <div
    tabindex="0"
    role="listbox"
    @keydown="handleKeydown"
  >
    <slot />
  </div>
</template>
```

### General accessibility rules

- Every `<img>` gets an `alt` prop. Decorative images use `alt=""` and `aria-hidden="true"`.
- Form inputs must have associated `<Label>` components via `for`/`id` pairing.
- Color alone must never convey meaning. Add icons or text alongside color indicators.
- Focus must be visible. Use Tailwind's `focus-visible:ring-2 focus-visible:ring-ring`.
- Interactive elements must have a minimum touch target of 44x44px on mobile.
- Use `aria-live="polite"` for dynamic content updates (toasts, loading states).
- Use `aria-describedby` for error messages linked to form fields.

---

## 15. Testing Patterns

All generated components include a co-located test file: `ComponentName.test.ts`.

### Test setup

```ts
// ComponentName.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ComponentName from './ComponentName.vue'

describe('ComponentName', () => {
  it('renders with default props', () => {
    const wrapper = mount(ComponentName)
    expect(wrapper.exists()).toBe(true)
  })

  it('renders slot content', () => {
    const wrapper = mount(ComponentName, {
      slots: {
        default: 'Hello World',
      },
    })
    expect(wrapper.text()).toContain('Hello World')
  })

  it('applies variant classes', () => {
    const wrapper = mount(ComponentName, {
      props: { variant: 'destructive' },
    })
    expect(wrapper.classes()).toContain('bg-destructive')
  })

  it('emits click event', async () => {
    const wrapper = mount(ComponentName)
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
})
```

### Testing patterns by atomic level

| Level      | Test Focus                                                |
|------------|-----------------------------------------------------------|
| `atom`     | Props rendering, variant classes, emit firing, a11y attrs |
| `molecule` | Child atom rendering, inter-atom interaction, slot delegation |
| `organism` | State management, data flow between children, loading/error/empty states |
| `template` | Slot placement, responsive layout classes, section visibility |
| `page`     | Data fetching integration, route params, full render smoke test |

### Testing composables

```ts
// composables/__tests__/useToggle.test.ts
import { describe, it, expect } from 'vitest'
import { useToggle } from '../useToggle'

describe('useToggle', () => {
  it('starts with initial value', () => {
    const { value } = useToggle(true)
    expect(value.value).toBe(true)
  })

  it('toggles value', () => {
    const { value, toggle } = useToggle(false)
    toggle()
    expect(value.value).toBe(true)
    toggle()
    expect(value.value).toBe(false)
  })
})
```

### Testing async components

```ts
import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import AsyncComponent from './AsyncComponent.vue'

describe('AsyncComponent', () => {
  it('shows loading state initially', () => {
    const wrapper = mount(AsyncComponent)
    expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(true)
  })

  it('renders data after fetch', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: ['a', 'b'] }),
    } as Response)

    const wrapper = mount(AsyncComponent)
    await flushPromises()

    expect(wrapper.findAll('[data-testid="item"]')).toHaveLength(2)
  })
})
```

### Rules

- Every generated component gets a test file. No exceptions.
- Use `data-testid` attributes for test selectors, not CSS classes.
- Test behavior and output, not implementation details.
- Mock external dependencies (fetch, composables) at the boundary.
- Test all states: default, loading, error, empty, populated.

---

## 16. Anti-Patterns

### Never do these

| Anti-Pattern | Why | Correct Approach |
|---|---|---|
| Options API (`data()`, `methods`, `computed`) | Inconsistent with Composition API standard | Use `<script setup>` with `ref`/`computed` |
| `this` keyword | Not available in `<script setup>` | Direct variable references |
| Global component registration | Breaks tree-shaking, unclear dependencies | Local imports or unplugin-vue-components |
| `v-html` without sanitization | XSS vulnerability | Sanitize with DOMPurify or use text interpolation |
| Mutating props directly | Violates one-way data flow | Emit an event, let parent update |
| Watchers that set refs (watcher chains) | Circular updates, hard to debug | Use `computed` for derived state |
| Index as `:key` on mutable lists | Causes rendering bugs when items reorder | Use unique `id` from data |
| CSS modules or `<style scoped>` for layout | Conflicts with Tailwind-only rule | Tailwind utility classes |
| `any` type annotations | Defeats TypeScript's purpose | Define proper interfaces |
| Barrel files that re-export everything | Slow dev server, breaks code splitting | Import directly from source |
| `defineExpose` without clear need | Leaks internal state to parents | Only expose imperative APIs (focus, reset) |
| Inline functions in templates | Recreated every render, hard to test | Define in script, reference by name |
| `reactive` for primitives | Unnecessary complexity, easy to break | Use `ref` for primitives |
| Deep watchers on large arrays | Performance cost on every change | Watch specific properties or use shallow ref |
| String refs (`ref="name"`) | Legacy pattern from Vue 2 | Template refs with `ref()` |

### Vue 2 patterns to reject

If the generator encounters any of these in input or configuration, it must refuse and
convert to Vue 3 equivalents:

- `Vue.component()` global registration
- `mixins` -- use composables instead
- `filters` -- use computed or methods
- `$on` / `$off` / `$emit` on event bus -- use provide/inject or a store
- `Vue.set()` / `Vue.delete()` -- not needed in Vue 3 reactivity
- `@hook:` lifecycle listeners -- use `onMounted` etc. in composables

---

## 17. Provide/Inject for Deep Prop Drilling

When an organism needs to share state with deeply nested atoms without prop drilling:

```ts
// composables/useTheme.ts
import { inject, provide, ref, type InjectionKey, type Ref } from 'vue'

type Theme = 'light' | 'dark' | 'system'

const ThemeKey: InjectionKey<Ref<Theme>> = Symbol('theme')

export function provideTheme(initial: Theme = 'system') {
  const theme = ref<Theme>(initial)
  provide(ThemeKey, theme)
  return theme
}

export function useTheme(): Ref<Theme> {
  const theme = inject(ThemeKey)
  if (!theme) {
    throw new Error('useTheme() called without provideTheme() in ancestor')
  }
  return theme
}
```

### Rules

- Always use `InjectionKey<T>` with `Symbol` for type safety.
- Throw a descriptive error when injection is missing.
- Keep injection keys in the composable file that manages the state, not scattered across components.

---

## 18. DataViz Spec to Vue

When generating from a `DataVizSpec` (chart wrapper components), the generator outputs a
Vue component that wraps a charting library. The Vue ecosystem equivalent of Recharts is
vue-chartjs (Chart.js wrapper) or VueUse's integration with D3.

### Chart component pattern

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
)

interface DataPoint {
  label: string
  value: number
}

interface Props {
  data: DataPoint[]
  title?: string
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  height: 350,
})

const chartData = computed(() => ({
  labels: props.data.map(d => d.label),
  datasets: [
    {
      data: props.data.map(d => d.value),
      borderColor: 'hsl(var(--primary))',
      backgroundColor: 'hsl(var(--primary) / 0.1)',
      tension: 0.3,
      fill: true,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    title: { display: !!props.title, text: props.title },
  },
}))
</script>

<template>
  <div :style="{ height: `${height}px` }" class="w-full">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
```

---

## 19. Router Integration

Page-level components integrate with Vue Router:

```vue
<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// Read route params
const projectId = computed(() => route.params.id as string)

// Programmatic navigation
function goToSettings() {
  router.push({ name: 'project-settings', params: { id: projectId.value } })
}
</script>
```

### Rules

- Page components live in `pages/` or `views/` and map 1:1 to routes.
- Use `useRoute()` for reactive route data. Never access `$route` in setup.
- Use named routes for navigation, not raw paths.
- Route params are always strings. Parse numbers explicitly.

---

## 20. Generation Checklist

Before writing any `.vue` file, the generator verifies:

- [ ] Spec passes Zod validation (`ComponentSpecSchema.parse()`)
- [ ] Atomic level determines the correct output folder
- [ ] All `composesSpecs` references resolve to existing specs or shadcn-vue components
- [ ] No `composesSpecs` on atoms (violation of atomic design)
- [ ] `shadcnBase` entries map to valid shadcn-vue components
- [ ] Props with type `"ReactNode"` converted to slots
- [ ] Props with callback types converted to emits
- [ ] `variants` array becomes a `variant` union-type prop
- [ ] `accessibility.role` applied to root element or delegated to shadcn-vue
- [ ] `accessibility.keyboardNav` triggers keyboard event handler generation
- [ ] `accessibility.ariaLabel` determines `ariaLabel` prop presence
- [ ] Every form input has a paired `<Label>`
- [ ] Every list uses a stable `:key` (not index)
- [ ] No raw hex colors in Tailwind classes (use design token CSS variables)
- [ ] `cn()` utility used when consumer class override is needed
- [ ] Test file generated alongside component file
- [ ] Index barrel updated with new export
