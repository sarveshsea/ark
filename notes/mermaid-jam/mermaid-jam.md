---
name: Mermaid Jam
description: >
  Route Mermaid and markdown diagram source into the Mermaid Jam FigJam plugin
  so output stays editable as native FigJam cards, sections, and connectors.
activateOn: figma-canvas-operation
freedomLevel: high
category: connect
tags:
  - figjam
  - mermaid
  - markdown
  - diagram
  - user-flow
author: Memoire
---

# Mermaid Jam

Use this Note when a user asks to turn Mermaid markdown, fenced Mermaid blocks,
or markdown user-flow notes into a FigJam diagram.

## Native Route

1. Run `memi mermaid-jam status --json`.
2. If `integration.local.ready` is true, use the reported
   `integration.local.manifestPath` for local development import.
3. If no local checkout is ready, use `integration.communityUrl` and open the
   Figma Community install page.
4. Open the plugin from a FigJam board, not a Figma design file, then paste the
   Mermaid or markdown source into Mermaid Jam.

The manifest may be importable from Figma and FigJam, but generation is
FigJam-native because the renderer creates FigJam sections, shape cards, and
dynamic connectors.

## Supported Inputs

- Mermaid `flowchart` / `graph`
- Mermaid `journey`
- Mermaid `sequenceDiagram`
- Mermaid `stateDiagram` / `stateDiagram-v2`
- Mermaid `mindmap`
- Mermaid `timeline`
- Markdown headings and bullets describing a user flow

## Local Development

When developing the plugin alongside Memoire, set:

```bash
export MEMOIRE_MERMAID_JAM_ROOT=/path/to/unicornjam
```

Then run:

```bash
memi mermaid-jam status --json
```

If the status is `needs-build`, run `npm install && npm run build` inside the
Mermaid Jam checkout before importing `plugin/manifest.json`.
