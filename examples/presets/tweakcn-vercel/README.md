# @memoire-examples/tweakcn-vercel

Vercel-inspired dark-minimal Memoire Registry — reimagined in Memoire's own token format.

**Vibe:** sharp, tight, monospace-leaning labels, near-black surfaces, electric blue accent.
**Modes:** light + dark (auto via `prefers-color-scheme` and `.dark` class).

```
--color-foreground: oklch(98% 0.002 280)
--color-surface:    oklch(8% 0.005 280)
--color-accent:     oklch(70% 0.2 250)  /* electric blue */
```

## Fork and ship your own

```bash
cp -r examples/presets/tweakcn-vercel my-ds && cd my-ds
# rename in package.json + registry.json
memi publish --name @yourscope/your-ds
npm publish --access public
```

## Use it

```bash
memi add Button --from @memoire-examples/tweakcn-vercel
```

Inspired-by, not copied. No proprietary tweakcn assets were redistributed.
