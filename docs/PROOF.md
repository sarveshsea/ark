# No-Figma Proof Examples

These examples are for developers who already have a shadcn/Tailwind app and want a better design system without starting in Figma.

## 0. Install a marketplace registry

Use this when a developer wants proof immediately, before running a full audit or token extraction pass.

```bash
npm i -g @sarveshsea/memoire
memi add HeroSection --from @memoire-examples/landing-page
memi add AuthCard --from @memoire-examples/auth-flow
memi add ChatComposer --from @memoire-examples/ai-chat
memi add ProductCard --from @memoire-examples/ecommerce
```

What to show:

- Eleven first-party registries in `examples/marketplace-catalog.v1.json`
- Screenshot proof for every catalog entry
- One copy-paste command per registry
- Clear choices for SaaS, docs, dashboard, landing page, auth, AI chat, ecommerce, starter, and tweakcn-inspired themes

Proof artifacts:

- `assets/marketplace-catalog.v1.json`
- `examples/marketplace-catalog.v1.json`
- `assets/showcases/*.svg`
- `examples/presets/*/registry.json`

## 1. Audit an existing app

Use this when the app feels inconsistent and you need a ranked UI-quality punch list.

```bash
npm i -g @sarveshsea/memoire
memi diagnose --no-write
memi diagnose --json --no-write > .memoire/app-quality/ci-diagnosis.json
```

What to show:

- Overall design debt score and verdict
- Highest-impact visual-system, color, spacing, component, responsive, and accessibility issues
- Recommended next moves before publishing a registry

Proof artifact:

- `.memoire/app-quality/diagnosis.md` when `--no-write` is omitted

## 2. Extract a token system from code

Use this when CSS variables, Tailwind classes, arbitrary values, and repeated literals are spread across the app.

```bash
memi tokens --from ./src --report --no-inferred
memi tokens --from ./app/globals.css --report
memi tokens --from http://localhost:3000 --report
```

What to show:

- CSS variable and Tailwind `@theme` extraction
- `:root` and `.dark` mode coverage
- Alias graph health
- Duplicate-value groups
- Semantic token coverage
- Recommendations before saving canonical tokens

Proof artifacts:

- `generated/tokens/token-extraction.report.md`
- `generated/tokens/token-extraction.report.json`

## 3. Publish the improved registry

Use this after diagnosis and token cleanup to make the system reusable across apps.

```bash
memi tokens --from ./src --save
memi publish --name @you/ds
memi add Button --from @you/ds
```

What to show:

- Token-backed registry package
- Installable shadcn-compatible components
- A repeatable update path instead of one-off copy/paste UI

Proof artifacts:

- `registry.json`
- `tokens/tokens.css`
- `tokens/tailwind-theme.css`
- component specs and generated code bundled in the registry package

## Acceptance Test

A new developer should understand this path in under 60 seconds:

```bash
npm i -g @sarveshsea/memoire
memi diagnose
memi tokens --from ./src --report
memi publish --name @you/ds
```
