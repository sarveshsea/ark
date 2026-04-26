# Memoire Marketplace Examples

Seed inventory for the Memoire registry marketplace. Every folder under `presets/` is a ready-to-publish `@memoire-examples/*` registry with `registry.json`, Tailwind tokens, component specs, React code, screenshot proof, and a copy-paste install command.

Machine-readable data lives in [`marketplace-catalog.v1.json`](./marketplace-catalog.v1.json). The legacy website fallback remains [`featured-registries.json`](./featured-registries.json).

## Featured Registries

Put these in front of new users first because they cover the broadest product surfaces.

<p align="center">
  <img src="../assets/showcases/starter-saas.svg" alt="Starter SaaS registry" width="220" />
  <img src="../assets/showcases/docs-blog.svg" alt="Docs Blog registry" width="220" />
  <img src="../assets/showcases/dashboard.svg" alt="Dashboard registry" width="220" />
</p>

| Registry | What it is | Install |
| --- | --- | --- |
| [`starter-saas`](./presets/starter-saas) | Neutral SaaS starter with blue product accents and app-shell primitives. | `memi add Button --from @memoire-examples/starter-saas` |
| [`docs-blog`](./presets/docs-blog) | Editorial docs/blog kit with reading-friendly surfaces. | `memi add Button --from @memoire-examples/docs-blog` |
| [`dashboard`](./presets/dashboard) | High-contrast ops dashboard starter for admin and analytics products. | `memi add Button --from @memoire-examples/dashboard` |

## All Installable Registries

| Registry | Package | Best first component | Copy-paste install |
| --- | --- | --- | --- |
| [`starter-saas`](./presets/starter-saas) | `@memoire-examples/starter-saas` | `Button` | `memi add Button --from @memoire-examples/starter-saas` |
| [`docs-blog`](./presets/docs-blog) | `@memoire-examples/docs-blog` | `Button` | `memi add Button --from @memoire-examples/docs-blog` |
| [`dashboard`](./presets/dashboard) | `@memoire-examples/dashboard` | `Button` | `memi add Button --from @memoire-examples/dashboard` |
| [`landing-page`](./presets/landing-page) | `@memoire-examples/landing-page` | `HeroSection` | `memi add HeroSection --from @memoire-examples/landing-page` |
| [`auth-flow`](./presets/auth-flow) | `@memoire-examples/auth-flow` | `AuthCard` | `memi add AuthCard --from @memoire-examples/auth-flow` |
| [`ai-chat`](./presets/ai-chat) | `@memoire-examples/ai-chat` | `ChatComposer` | `memi add ChatComposer --from @memoire-examples/ai-chat` |
| [`ecommerce`](./presets/ecommerce) | `@memoire-examples/ecommerce` | `ProductCard` | `memi add ProductCard --from @memoire-examples/ecommerce` |
| [`starter`](./presets/starter) | `@memoire-examples/starter` | `Button` | `memi add Button --from @memoire-examples/starter` |
| [`tweakcn-vercel`](./presets/tweakcn-vercel) | `@memoire-examples/tweakcn-vercel` | `Button` | `memi add Button --from @memoire-examples/tweakcn-vercel` |
| [`tweakcn-supabase`](./presets/tweakcn-supabase) | `@memoire-examples/tweakcn-supabase` | `Button` | `memi add Button --from @memoire-examples/tweakcn-supabase` |
| [`tweakcn-linear`](./presets/tweakcn-linear) | `@memoire-examples/tweakcn-linear` | `Button` | `memi add Button --from @memoire-examples/tweakcn-linear` |

## Which One Should I Install?

| If you are building... | Start with | Why |
| --- | --- | --- |
| A SaaS dashboard or app shell | `starter-saas` | Broad primitives and conservative B2B styling. |
| Documentation, changelog, or blog UI | `docs-blog` | Editorial surfaces and reading-first contrast. |
| Admin, analytics, or ops products | `dashboard` | Dark analytics look with high-contrast cards. |
| A launch page or waitlist | `landing-page` | Ships a full `HeroSection` above-the-fold organism. |
| Login, signup, or settings pages | `auth-flow` | Ships `AuthCard` and secure auth-oriented copy. |
| AI assistants or chat-first products | `ai-chat` | Ships `ChatMessage` and `ChatComposer`. |
| Storefronts, pricing cards, or product grids | `ecommerce` | Ships `ProductCard` and conversion-focused tags. |
| A blank registry to fork | `starter` | Smallest neutral baseline. |
| A tweakcn-inspired theme package | `tweakcn-vercel`, `tweakcn-supabase`, or `tweakcn-linear` | Strong visual styles for theme packaging demos. |

## What Every Preset Ships

- `package.json` with the `@memoire-examples/<slug>` name and `memoire.registry: true`.
- `registry.json` valid per Memoire Registry Protocol v1.
- `tokens/tokens.json` in W3C DTCG format.
- `tokens/tokens.css` using Tailwind v4 `@theme`.
- Component JSON specs with Atomic Design levels.
- React component code that uses CSS variables instead of hardcoded hex.
- Screenshot proof under `assets/showcases/<slug>.svg`.

## Validate

```bash
npm run build:marketplace
npm run validate:presets
node scripts/build-presets.mjs ai-chat
```

Zod roundtrip and file existence are covered by `examples/presets/__tests__/schema-roundtrip.test.ts`. Marketplace contract coverage is in `src/marketplace/__tests__/catalog.test.ts`.

## Fork And Ship Your Own

```bash
cp -r examples/presets/landing-page my-design-system
cd my-design-system
# edit package.json + registry.json name
npm publish --access public
memi add HeroSection --from @yourscope/your-ds
```

## Legacy

`starter-registry/` is the original bare starter. The presets above are more developed versions of that pattern.

## Notes On tweakcn Presets

The tweakcn-flavored presets are inspired-by reimplementations in Memoire's own token format. No proprietary tweakcn preset JSON is redistributed, so these are safe to fork and republish under your own scope.
