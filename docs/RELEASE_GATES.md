# Release Gates

Use these checks before announcing or tagging a public release.

## Public npm Gate

`npm run check:public-release` verifies the live npm surface after publish:

- npm `dist-tags.latest` matches `package.json`.
- npm README includes the current positioning phrase.
- npm README includes `npm i -g @sarveshsea/memoire`.
- A clean temp install can run `memi --version`.

For the `0.14.1` line, `0.13.1` must be published first. If npm still reports `0.12.3`, do not announce `0.14.1`; publish and verify the existing release line before continuing external launch work.

```bash
npm run check:public-release
SKIP_INSTALL_SMOKE=1 npm run check:public-release
```

The local `npm run check:release` remains repo-only so development can continue while npm is intentionally behind.

## External Trust Gate

Before the public `0.14.1` announcement, verify every external surface points to the same shadcn-native story:

- npm latest: `0.14.1`
- npm README phrase: `Shadcn-native Design CI for Tailwind apps`
- npm install command: `npm i -g @sarveshsea/memoire`
- GitHub description: `Shadcn-native Design CI for Tailwind apps: export registries that work with shadcn, v0, AI editors, and npm.`
- GitHub topics: `shadcn-native`, `shadcn-registry`, `shadcn-registry-generator`, `v0-design-system`, `design-ci`, `tailwind-audit`, `token-extraction`, `ui-quality`, `ui-fix-plan`, `registry-generator`, `design-tokens`, `tweakcn`
- Website hero: `Shadcn-native Design CI for Tailwind apps.`
- Website `/components`: non-empty registry catalog with npm install commands and shadcn item URLs

Seven days after publish, compare the metrics against the launch baseline in [`docs/METRICS.md`](./METRICS.md) and log the next distribution action before changing the positioning again.
