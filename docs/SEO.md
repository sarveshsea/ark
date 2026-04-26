# SEO Handoff

Use this copy on the website repo, GitHub metadata, and launch pages until `memoire.cv/components` is healthy. The conversion URL is the npm package page.

## Primary Search Phrase

`Shadcn-native Design CI for Tailwind apps`

## 0.14.1 Search Wedge

- `shadcn registry generator`
- `v0 design system registry`
- `install shadcn registry from npm`
- `Tailwind token extraction`
- `UI fix plan`
- `shadcn-native registry bridge`
- `AI editor design system context`

## Marketplace Search Phrases

- `shadcn registry marketplace`
- `installable shadcn design systems`
- `Tailwind design system registry`
- `AI chat shadcn registry`
- `auth UI shadcn registry`
- `landing page shadcn registry`
- `ecommerce shadcn registry`
- `tweakcn registry publishing`
- `Open in v0 registry`
- `shadcn registry item JSON`

## Title Tags

- Homepage: `Memoire - Shadcn-native Design CI for Tailwind apps`
- Components fallback: `Shadcn registry marketplace - Memoire`
- Docs: `Memoire docs - Export shadcn registries from real apps`
- Launch page: `Memoire 0.14.1 - Shadcn registry generator for Tailwind apps`

## Meta Descriptions

- Homepage: `Memoire diagnoses UI debt in real shadcn/Tailwind codebases, extracts tokens, exports shadcn-native registries, and generates UI fix plans.`
- Components fallback: `Explore installable shadcn/Tailwind design systems for SaaS, docs, dashboards, landing pages, auth, AI chat, ecommerce, and tweakcn-inspired themes.`
- Docs: `Install Memoire, run memi diagnose, export /r/*.json shadcn registry items, and install from npm, URLs, GitHub, or aliases.`
- Launch page: `Memoire 0.14.1 is a shadcn-native registry bridge for Tailwind apps, v0, AI editors, npm, and UI fix planning.`

## OpenGraph

- `og:title`: `Memoire - Shadcn-native Design CI for Tailwind apps`
- `og:description`: `Turn existing apps into shadcn registries for shadcn, v0, AI editors, npm, and UI fix planning.`
- `og:url`: `https://www.npmjs.com/package/@sarveshsea/memoire`
- `og:type`: `website`
- `og:image`: `https://raw.githubusercontent.com/sarveshsea/m-moire/main/assets/theme-workflow-demo.svg`

## Twitter Card

- `twitter:card`: `summary_large_image`
- `twitter:title`: `Memoire - Shadcn-native Design CI for Tailwind apps`
- `twitter:description`: `Run memi diagnose, memi shadcn export, and memi fix plan to bridge real Tailwind apps into registry workflows.`
- `twitter:image`: `https://raw.githubusercontent.com/sarveshsea/m-moire/main/assets/theme-workflow-demo.svg`

## JSON-LD

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Memoire",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "macOS, Linux, Windows",
  "description": "Shadcn-native Design CI for Tailwind apps: diagnose UI debt, extract tokens, export shadcn registries, and plan safe UI fixes.",
  "softwareVersion": "0.14.1",
  "url": "https://www.npmjs.com/package/@sarveshsea/memoire",
  "codeRepository": "https://github.com/sarveshsea/m-moire",
  "programmingLanguage": "TypeScript",
  "keywords": [
    "design-ci",
    "ui-quality",
    "shadcn-audit",
    "tailwind-audit",
    "token-extraction",
    "design-tokens",
    "shadcn-registry",
    "shadcn-registry-generator",
    "v0-design-system-registry",
    "install-shadcn-registry-from-npm",
    "ui-fix-plan",
    "shadcn-registry-marketplace",
    "installable-shadcn-design-systems",
    "tailwind-design-system-registry",
    "tweakcn"
  ],
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
```

## Sitemap Priorities

- `/` priority `1.0`, changefreq `weekly`
- `/docs` priority `0.8`, changefreq `weekly`
- `/components` priority `0.9`, changefreq `daily` once the registry index is stable
- `/components/starter-saas`, `/components/docs-blog`, `/components/dashboard`, `/components/landing-page`, `/components/auth-flow`, `/components/ai-chat`, `/components/ecommerce` priority `0.8`, changefreq `weekly`
- `/components/starter`, `/components/tweakcn-vercel`, `/components/tweakcn-supabase`, `/components/tweakcn-linear` priority `0.7`, changefreq `weekly`

## Website Acceptance Criteria

- The first screen says `Shadcn-native Design CI for Tailwind apps`.
- The only primary CTA is `https://www.npmjs.com/package/@sarveshsea/memoire`.
- The first code block uses `npm i -g @sarveshsea/memoire`, `memi diagnose`, `memi tokens --from ./src --report`, `memi shadcn export --out public/r`, and `memi publish --name @you/ds`.
- `/components` renders `examples/marketplace-catalog.v1.json`; if that fails, it falls back to `examples/featured-registries.json` instead of an empty state.
- Footer links use `@sarveshsea/memoire`, not an unscoped package name.
- Individual registry pages use the page templates in [`MARKETPLACE_SEO.md`](./MARKETPLACE_SEO.md).
