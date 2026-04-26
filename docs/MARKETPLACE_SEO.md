# Marketplace SEO Keyword Pack

Use this for the website repo, npm README sections, GitHub discussions, launch posts, and individual registry pages. Until `/components` is deployed and healthy, link announcements to the npm package page.

## Primary Keywords

| Keyword | Page intent | Landing page |
| --- | --- | --- |
| `shadcn registry marketplace` | Developers looking for installable component registries. | `/components` |
| `installable shadcn design systems` | Teams wanting reusable shadcn/Tailwind systems. | `/components` and npm README |
| `Tailwind design system registry` | Developers packaging tokens and components. | `/docs` and `/components` |
| `Design CI for shadcn` | Teams diagnosing UI quality in code. | Homepage and npm README |
| `token extraction for Tailwind` | Developers extracting CSS variables and theme tokens. | Docs and npm README |
| `tweakcn registry publishing` | tweakcn users turning themes into packages. | Theme docs and npm README |
| `shadcn registry generator` | Developers converting existing apps into registry item JSON. | Homepage, docs, and npm README |
| `v0 design system registry` | Teams giving v0 branded shadcn/Tailwind context. | `/components` and v0 workflow docs |
| `install shadcn registry from npm` | Developers installing registries without preinstalled node_modules. | npm README and docs |
| `UI fix plan` | Teams wanting evidence-backed, safe UI repair plans. | Docs and launch page |

## `/components` Page Copy

Title: `Shadcn Registry Marketplace - Memoire`

Description: `Explore installable shadcn/Tailwind design systems from Memoire. Add SaaS, docs, dashboard, landing page, auth, AI chat, ecommerce, and tweakcn-inspired registries with memi add.`

Hero:

```text
Installable shadcn registries for real apps.
Browse tokenized design systems, install components with memi add or shadcn, open registry items in v0, and fork the registries for your own product.
```

Primary CTA:

```text
npm i -g @sarveshsea/memoire
```

Secondary command:

```text
memi shadcn export --out public/r
```

## Individual Registry Page Template

Title: `{Title} shadcn registry - Memoire Marketplace`

Description: `{Description} Install with {installCommand}. Includes tokens, component specs, React code, screenshot proof, and source metadata.`

Above-the-fold content:

```text
{Title}
{Description}

Install:
{installCommand}

Components:
{componentList}
```

Required links:

- npm package page for the registry package
- Source path from `examples/marketplace-catalog.v1.json`
- Screenshot URL from `examples/marketplace-catalog.v1.json`
- `registryItemUrl` from `examples/site-bundle/catalog.json`
- `openInV0Url` from `examples/site-bundle/catalog.json`
- Main Memoire npm package: `https://www.npmjs.com/package/@sarveshsea/memoire`

## Registry Page Keywords

| Registry | Keyword cluster |
| --- | --- |
| `starter-saas` | `saas shadcn registry`, `installable SaaS design system`, `shadcn app shell` |
| `docs-blog` | `docs shadcn registry`, `blog design system`, `editorial Tailwind components` |
| `dashboard` | `dashboard shadcn registry`, `admin UI registry`, `analytics dashboard components` |
| `landing-page` | `landing page shadcn registry`, `install hero section`, `waitlist landing page components` |
| `auth-flow` | `auth UI shadcn registry`, `install login UI`, `signup form components` |
| `ai-chat` | `AI chat shadcn registry`, `chat composer component`, `LLM app UI components` |
| `ecommerce` | `ecommerce shadcn registry`, `product card component`, `storefront UI registry` |
| `starter` | `starter shadcn registry`, `minimal Tailwind design system`, `forkable registry` |
| `tweakcn-vercel` | `tweakcn Vercel theme registry`, `dark shadcn theme`, `Vercel style Tailwind registry` |
| `tweakcn-supabase` | `tweakcn Supabase theme registry`, `green dark shadcn theme`, `Supabase style registry` |
| `tweakcn-linear` | `tweakcn Linear theme registry`, `Linear style shadcn theme`, `indigo Tailwind registry` |

## JSON-LD Collection Page

```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Memoire shadcn registry marketplace",
  "description": "Installable shadcn/Tailwind design systems with tokens, component specs, React code, screenshots, and source links.",
  "url": "https://www.memoire.cv/components",
  "isPartOf": {
    "@type": "SoftwareApplication",
    "name": "Memoire",
    "url": "https://www.npmjs.com/package/@sarveshsea/memoire"
  }
}
```

## Sitemap

- `/components` priority `0.9`, changefreq `daily`
- `/components/starter-saas` priority `0.8`, changefreq `weekly`
- `/components/docs-blog` priority `0.8`, changefreq `weekly`
- `/components/dashboard` priority `0.8`, changefreq `weekly`
- `/components/landing-page` priority `0.8`, changefreq `weekly`
- `/components/auth-flow` priority `0.8`, changefreq `weekly`
- `/components/ai-chat` priority `0.8`, changefreq `weekly`
- `/components/ecommerce` priority `0.8`, changefreq `weekly`
- `/components/starter` priority `0.7`, changefreq `weekly`
- `/components/tweakcn-vercel` priority `0.7`, changefreq `weekly`
- `/components/tweakcn-supabase` priority `0.7`, changefreq `weekly`
- `/components/tweakcn-linear` priority `0.7`, changefreq `weekly`
