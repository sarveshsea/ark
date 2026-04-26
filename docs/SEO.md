# SEO Handoff

Use this copy on the website repo, GitHub metadata, and launch pages until `memoire.cv/components` is healthy. The conversion URL is the npm package page.

## Primary Search Phrase

`Design CI for shadcn/Tailwind apps`

## Title Tags

- Homepage: `Memoire - Design CI for shadcn/Tailwind apps`
- Components fallback: `Installable shadcn registries - Memoire`
- Docs: `Memoire docs - Diagnose UI debt, extract tokens, publish registries`
- Launch page: `Memoire 0.13 - Code-first Design CI for frontend teams`

## Meta Descriptions

- Homepage: `Memoire diagnoses UI debt in real shadcn/Tailwind codebases, extracts design tokens, and publishes improved systems as installable registries.`
- Components fallback: `Explore Memoire showcase registries for SaaS, docs, and dashboards. Install real shadcn components from npm-backed registries.`
- Docs: `Install Memoire, run memi diagnose, extract tokens from code, and publish a reusable shadcn/Tailwind registry.`
- Launch page: `Memoire 0.13 is a code-first Design CI workflow for teams using shadcn, Tailwind, tweakcn, and installable registries.`

## OpenGraph

- `og:title`: `Memoire - Design CI for shadcn/Tailwind apps`
- `og:description`: `Diagnose UI debt in real code, extract tokens, and publish improved design systems as installable registries.`
- `og:url`: `https://www.npmjs.com/package/@sarveshsea/memoire`
- `og:type`: `website`
- `og:image`: `https://raw.githubusercontent.com/sarveshsea/m-moire/main/assets/theme-workflow-demo.svg`

## Twitter Card

- `twitter:card`: `summary_large_image`
- `twitter:title`: `Memoire - Design CI for shadcn/Tailwind apps`
- `twitter:description`: `Run memi diagnose, extract tokens from code, and publish a reusable shadcn/Tailwind registry.`
- `twitter:image`: `https://raw.githubusercontent.com/sarveshsea/m-moire/main/assets/theme-workflow-demo.svg`

## JSON-LD

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Memoire",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "macOS, Linux, Windows",
  "description": "Design CI for shadcn/Tailwind apps: diagnose UI debt, extract tokens, and publish installable registries.",
  "softwareVersion": "0.13.1",
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
- `/components` priority `0.8`, changefreq `daily` once the registry index is stable
- `/components/starter-saas`, `/components/docs-blog`, `/components/dashboard` priority `0.7`, changefreq `weekly`

## Website Acceptance Criteria

- The first screen says `Design CI for shadcn/Tailwind apps`.
- The only primary CTA is `https://www.npmjs.com/package/@sarveshsea/memoire`.
- The first code block uses `npm i -g @sarveshsea/memoire`, `memi diagnose`, `memi tokens --from ./src --report`, and `memi publish --name @you/ds`.
- `/components` never renders an empty state if `examples/featured-registries.json` can be mirrored.
- Footer links use `@sarveshsea/memoire`, not an unscoped package name.
