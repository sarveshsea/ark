<p align="center">
  <img src="assets/memoire-moon.svg" alt="Memoire" width="120" height="120" />
</p>

<h1 align="center">Memoire</h1>

<p align="center">
  AI-native design intelligence engine.<br/>
  Connects to Figma. Pulls your design system. Generates production React code.<br/>
  Runs autonomously with Codex or Claude.
</p>

<p align="center">
  <a href="https://github.com/sarveshsea/m-moire/actions"><img src="https://github.com/sarveshsea/m-moire/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@sarveshsea/memoire"><img src="https://img.shields.io/npm/v/@sarveshsea/memoire" alt="npm"></a>
  <a href="https://github.com/sarveshsea/m-moire/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
</p>

---

## What it does

Point it at a Figma file. It:
1. Connects to Figma automatically (no config)
2. Pulls design tokens, components, and styles
3. Creates structured JSON specs (every component described before code)
4. Generates React + TypeScript + Tailwind code using shadcn/ui
5. Shows everything on a local preview server

All components follow **Atomic Design** -- atoms, molecules, organisms, templates, pages.

---

## Install

```bash
npm install -g @sarveshsea/memoire
```

Or run directly:

```bash
npx @sarveshsea/memoire
```

### Requirements

- Node.js 20+
- Figma Desktop App (for plugin bridge)
- Codex or Claude Code (optional -- for autonomous agent mode)

---

## Quick start

```bash
# Initialize in your project
memoire init

# Connect to Figma
memoire connect

# Pull your design system
memoire pull

# Generate code from specs
memoire generate

# Start preview server
memoire preview
```

---

## Commands

| Command | What it does |
|---------|-------------|
| `memi init` | Initialize workspace |
| `memi connect` | Start the Figma bridge and report Control Plane install health |
| `memi pull` | Extract design tokens, components, styles from Figma |
| `memi spec <type> <name>` | Create a component/page/dataviz spec |
| `memi generate [name]` | Generate shadcn/ui code from specs |
| `memi preview` | Start localhost preview gallery |
| `memi sync` | Full pipeline: pull + spec + generate |
| `memi sync --live` | Live mode: watch for changes and sync continuously |
| `memi sync --conflicts` | Show and resolve pending sync conflicts |
| `memi go` | Zero-friction single command |
| `memi compose "<intent>"` | Agent orchestrator: classify, plan, execute |
| `memi watch --code` | Watch specs + generated/ for changes |
| `memi daemon start` | Start daemon with reactive pipeline |
| `memi mcp start` | Start as MCP server (stdio) |
| `memi mcp config` | Print MCP config for Claude Code / Cursor |
| `memi agent spawn <role>` | Spawn a persistent agent worker |
| `memi agent list\|kill\|status` | Manage agent instances |
| `memi research <sub>` | Research pipeline (Excel, stickies, synthesis) |
| `memi tokens` | Export design tokens as CSS variables |
| `memi status` | Show project status |
| `memi doctor` | Health check for project, plugin bundle, bridge, and workspace |
| `memi dashboard` | Launch monitoring dashboard |

---

## MCP Server

Memoire exposes 14 tools and 3 resources via the Model Context Protocol. Any MCP-compatible AI tool can use it as a design layer.

```bash
# Print config for Claude Code
memi mcp config --target claude-code

# Print config for Cursor
memi mcp config --target cursor
```

Drop the output into `.mcp.json` (Claude Code) or `.cursor/mcp.json` (Cursor).

**Tools:** `pull_design_system`, `get_specs`, `get_spec`, `create_spec`, `generate_code`, `get_tokens`, `update_token`, `capture_screenshot`, `get_selection`, `compose`, `run_audit`, `get_research`, `figma_execute`, `get_page_tree`

---

## Multi-Agent Orchestration

Multiple Claude instances can operate as persistent agents:

```bash
# Spawn a token engineer agent
memi agent spawn token-engineer

# Spawn a design auditor in another terminal
memi agent spawn design-auditor

# Check status
memi agent status
```

**Roles:** token-engineer, component-architect, layout-designer, dataviz-specialist, code-generator, accessibility-checker, design-auditor, research-analyst, general

The orchestrator dispatches to external agents first and falls back to internal execution.

---

## Architecture

```
src/
├── engine/    Core orchestrator, registry, token-differ, sync, pipeline
├── figma/     Figma bridge (WebSocket on ports 9223-9232)
├── mcp/       MCP server (14 tools, 3 resources, stdio transport)
├── agents/    Agent orchestrator, registry, task queue, agent bridge
├── research/  Research engine (Excel, stickies, web)
├── specs/     Spec types + Zod validation + 56-component catalog
├── codegen/   Code generation (shadcn mapper, dataviz, pages)
├── ai/        Anthropic SDK integration
├── preview/   Localhost preview gallery + dashboard
├── tui/       Terminal UI (Ink/React)
└── commands/  CLI commands (Commander.js)
```

---

## Figma plugin

The Figma plugin auto-discovers Memoire on ports 9223-9232.

1. Open Figma Desktop
2. Go to **Plugins > Development > Import plugin from manifest**
3. Select `~/.memoire/plugin/manifest.json`
4. If Figma says the `main` file must not be a symlink, remove the old import and re-import from that copied path, not from a linked `node_modules` path

### Figma Operator Console

The Widget V2 plugin is an operator console, not only a bridge debugger.

- `Jobs` shows sync, inspect, capture, and healer work as tracked job state
- `Selection` shows live node IDs, layout facts, styles, variants, and quick actions
- `System` shows bridge status, ports, latency, and buffered change-stream state

Use these commands to verify the installed bundle and bridge health:

```bash
memi connect --json
memi doctor --json
```

`memi connect --json` reports where the Control Plane manifest is being loaded from, whether the installed bundle is current, and which widget assets are present. `memi doctor --json` reports plugin bundle health, install freshness, and bridge state.

---

## Spec-first workflow

Every component starts as a JSON spec before code generation:

```json
{
  "name": "MetricCard",
  "type": "component",
  "level": "molecule",
  "purpose": "Display a KPI with trend indicator",
  "shadcnBase": ["Card", "Badge"],
  "props": {
    "title": "string",
    "value": "string",
    "trend": "string?"
  },
  "variants": ["default", "compact"],
  "accessibility": {
    "role": "article",
    "ariaLabel": "Metric display card"
  }
}
```

---

## License

MIT
