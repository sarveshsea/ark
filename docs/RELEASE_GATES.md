# Release Gates

Use these checks before announcing or tagging a public release.

## Local Publish-Ready Gate

`npm run publish:ready` verifies the local package is safe to publish before npm mutates anything:

- npm auth is active for `https://registry.npmjs.org/`.
- `package.json`, `server.json`, and the MCP npm package entry use the same version.
- local version is newer than npm `latest`.
- `server.json` and `dist/index.js` are present in the package tarball.
- the git worktree is clean.

```bash
npm run build
SKIP_PACK_GATE=1 npm run check:release
npm run publish:ready
npm run growth:status
```

## Public npm Gate

`npm run check:public-release` verifies the live npm surface after publish:

- npm `dist-tags.latest` matches `package.json`.
- npm README includes the current positioning phrase.
- npm README includes `npm i -g @sarveshsea/memoire`.
- A clean temp install can run `memi --version`.

For the `0.14.4` line, npm must report `0.14.4` before any Official MCP Registry or directory follow-up.

```bash
npm run check:public-release
SKIP_INSTALL_SMOKE=1 npm run check:public-release
```

The local `npm run check:release` remains repo-only so development can continue while npm is intentionally behind.

## External Trust Gate

Before the public `0.14.4` announcement, verify every external surface points to the same shadcn-native story:

- npm latest: `0.14.4`
- npm README phrase: `Shadcn-native Design CI for Tailwind apps`
- npm install command: `npm i -g @sarveshsea/memoire`
- GitHub description: `Shadcn-native Design CI for Tailwind apps: export registries that work with shadcn, v0, AI editors, and npm.`
- GitHub topics: `shadcn-native`, `shadcn-registry`, `shadcn-registry-generator`, `v0-design-system`, `design-ci`, `tailwind-audit`, `token-extraction`, `ui-quality`, `ui-fix-plan`, `registry-generator`, `design-tokens`, `tweakcn`
- Website hero: `Shadcn-native Design CI for Tailwind apps.`
- Website `/components`: non-empty registry catalog with npm install commands and shadcn item URLs

Seven days after publish, compare the metrics against the launch baseline in [`docs/METRICS.md`](./METRICS.md) and log the next distribution action before changing the positioning again.
