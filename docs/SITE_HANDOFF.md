# Site and GitHub Handoff

These are the exact external-surface updates that still need credentials or the separate website repo.

## GitHub repo metadata

- Description: `Shadcn-native Design CI for Tailwind apps: export registries that work with shadcn, v0, AI editors, and npm.`
- Topics: `shadcn-native`, `shadcn-registry`, `shadcn-registry-generator`, `v0-design-system`, `design-ci`, `tailwind-audit`, `token-extraction`, `ui-quality`, `ui-fix-plan`, `registry-generator`, `design-tokens`, `tweakcn`

## Homepage hero

- Heading: `Shadcn-native Design CI for Tailwind apps.`
- Subhead: `Turn an existing app into a registry that works with shadcn, v0, AI editors, npm, and Mémoire.`
- Primary CTA: `https://www.npmjs.com/package/@sarveshsea/memoire`
- Secondary CTA: omit until `/components` is reliable. If one is required, use `https://github.com/sarveshsea/m-moire#no-figma-required`.

## Docs landing

- Lead with the two quickstarts from [`docs/README.md`](./README.md)
- Push MCP, Notes, and agents below the fold under an `Advanced` heading

## `/components` fallback

- Primary data: render all entries from [`examples/marketplace-catalog.v1.json`](../examples/marketplace-catalog.v1.json)
- Fallback data: when the full catalog cannot load, render the three entries from [`examples/featured-registries.json`](../examples/featured-registries.json)
- Never show an all-zero empty state if either catalog exists
- Registry cards must show screenshot, title, description, install command, tags, component count, source link, and npm package link
- Individual pages should use the template and keyword clusters in [`docs/MARKETPLACE_SEO.md`](./MARKETPLACE_SEO.md)

## Footer

- npm link: `https://www.npmjs.com/package/@sarveshsea/memoire`
- Version string: only show the currently released package version
- OpenGraph, Twitter card, sitemap, and JSON-LD copy: [`docs/SEO.md`](./SEO.md)

## 0.14.1 external release checklist

- Publish `0.13.1` first if npm latest is still behind the repo; do not announce `0.14.1` while npm users still see the old README.
- Publish `0.14.1` to npm from the tagged `main` commit, then run `npm run check:public-release`.
- Update GitHub description and topics to the exact strings above.
- Deploy the website hero, docs landing, and `/components` catalog from the generated marketplace bundle.
- Verify `/components` renders non-empty cards from the catalog or featured fallback.
- Verify npm README first screen contains `Shadcn-native Design CI for Tailwind apps` and `npm i -g @sarveshsea/memoire`.
- Record the 7-day follow-up metrics in [`docs/METRICS.md`](./METRICS.md): npm weekly downloads, npm monthly downloads, npm latest, GitHub stars, README CTA, and `/components` health.
