# Docker Environments

---
name: Docker Environments
category: connect
activateOn: docker-environment
freedomLevel: high
version: 1.0.0
description: >
  Docker-aware Mémoire operation. Detects Dockerfile, docker-compose.yml, and
  .devcontainer/ in the project root and adapts the Mémoire pipeline accordingly.
  Covers Figma bridge port-forwarding, CI/CD headless audits, shared MCP server
  as a team service, agent worker containers, and devcontainer setup.
---

## 1. Auto-Detection

Mémoire activates this Note when any of the following are present in the project root:

| File / Directory | Signals |
|-----------------|---------|
| `Dockerfile` | Single-service container build |
| `docker-compose.yml` / `docker-compose.yaml` | Multi-service orchestration |
| `compose.yml` / `compose.yaml` | Compose v2 convention |
| `.devcontainer/devcontainer.json` | VS Code / Codespaces dev environment |
| `.devcontainer/docker-compose.yml` | Devcontainer with compose override |

When detected, Mémoire applies Docker-aware defaults:
- Bridge discovery checks both `localhost` and `host.docker.internal`
- Preview server binds to `0.0.0.0` instead of `127.0.0.1`
- Port conflict warnings include Docker port-mapping guidance
- `memi doctor` reports include container networking status

---

## 2. The Figma Bridge and Docker — What You Need to Know

### The Topology Problem

The Figma plugin runs in the user's browser or desktop app — always on the host machine. The Mémoire bridge (WebSocket auto-discovery on ports 9223-9232) must reach `localhost` on the host to connect to the plugin.

When Mémoire runs inside a Docker container, `localhost` inside the container is the container itself — not the host. The bridge cannot auto-discover the Figma plugin across this boundary without explicit forwarding.

### The Solution: Port Forwarding

Map the bridge port range from host to container:

```bash
docker run -p 9223:9223 -p 9224:9224 ... memoire
```

Or in `docker-compose.yml`:

```yaml
services:
  memoire:
    ports:
      - "9223:9223"
      - "9224:9224"
      - "9225:9225"
      - "9226:9226"
      - "9227:9227"
      - "9228:9228"
      - "9229:9229"
      - "9230:9230"
      - "9231:9231"
      - "9232:9232"
```

Then set the bridge host in `.memoire/project.json`:

```json
{
  "bridge": {
    "host": "0.0.0.0",
    "portRange": [9223, 9232]
  }
}
```

The Figma plugin connects to `localhost:{port}` on the host. With ports forwarded, the host's port maps into the container, and the bridge handshake completes normally.

### When NOT to Use Docker for the Bridge

If your primary workflow is Figma canvas operations — designing, generating library, real-time sync — run Mémoire directly on the host. The port forwarding works, but adds a networking hop and complicates the auto-discovery sequence. Reserve Docker for the use cases in sections 3–5 below where it provides real value.

---

## 3. CI/CD Headless Pipeline

This is the highest-value Docker use case. Run WCAG audits, spec validation, and code generation as part of your PR pipeline — no human, no Figma connection required.

### What Runs Headless

| Command | Needs Figma Bridge | Headless-Safe |
|---------|-------------------|---------------|
| `memi audit --wcag` | No | Yes |
| `memi spec validate` | No | Yes |
| `memi generate` | No | Yes |
| `memi research synthesize` | No | Yes |
| `memi preview` | No | Yes |
| `memi pull` | Yes | No |
| `memi sync` | Yes | No |
| `memi connect` | Yes | No |

### Dockerfile (Headless Build)

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app

# Install Mémoire CLI
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# CI stage — headless only, no bridge
FROM base AS ci
ENV MEMOIRE_HEADLESS=true
ENV MEMOIRE_NO_BRIDGE=true
ENTRYPOINT ["node", "dist/cli.js"]
```

### docker-compose.yml with Profiles

```yaml
version: "3.9"

services:
  # ── Local dev: bridge enabled, ports forwarded ──────────────
  memoire-dev:
    build:
      context: .
      target: base
    profiles: ["dev"]
    ports:
      - "4400:4400"   # preview server
      - "4401:4401"   # dashboard
      - "9223-9232:9223-9232"   # Figma bridge range
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - MEMOIRE_ENV=development
    command: ["node", "dist/cli.js", "watch", "--code"]

  # ── CI: headless, no bridge, spec validation + audit ────────
  memoire-ci:
    build:
      context: .
      target: ci
    profiles: ["ci"]
    volumes:
      - .:/workspace
    working_dir: /workspace
    environment:
      - MEMOIRE_HEADLESS=true
      - MEMOIRE_NO_BRIDGE=true
    command: ["node", "dist/cli.js", "audit", "--wcag", "--exit-code"]

  # ── MCP server: shared team service ─────────────────────────
  memoire-mcp:
    build:
      context: .
      target: base
    profiles: ["mcp"]
    ports:
      - "4402:4402"   # MCP HTTP transport (if enabled)
    environment:
      - MEMOIRE_MCP_PORT=4402
    command: ["node", "dist/cli.js", "mcp", "start"]
    restart: unless-stopped
```

**Run headless audit in CI:**

```bash
docker compose --profile ci run --rm memoire-ci
```

**GitHub Actions example:**

```yaml
name: Design System CI

on: [push, pull_request]

jobs:
  design-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Mémoire WCAG audit
        run: docker compose --profile ci run --rm memoire-ci

      - name: Validate specs
        run: |
          docker compose --profile ci run --rm memoire-ci \
            node dist/cli.js spec validate --all --strict

      - name: Generate code (dry run)
        run: |
          docker compose --profile ci run --rm memoire-ci \
            node dist/cli.js generate --dry-run
```

### Exit Codes for CI Gates

`memi audit --wcag --exit-code` returns:
- `0` — all checks pass
- `1` — warnings present (configurable: `--fail-on-warn`)
- `2` — errors present (always fails)
- `3` — critical violations (always fails)

Gate PRs on exit code 2+ for a soft policy, exit code 1+ for a strict policy.

---

## 4. Shared MCP Server (Team Service)

Instead of each developer running `memi mcp start` locally, deploy one containerized MCP instance that all Claude Code and Cursor sessions on the team point to.

### What This Enables

- All agents share the same design system state (specs, tokens, Code Connect map)
- Design system updates propagate to all connected AI sessions immediately
- No per-developer setup — point `claude_desktop_config.json` at the shared host
- Audit results and research output visible across the team

### Container Setup

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Mount .memoire/ from the host or a shared volume
VOLUME ["/workspace/.memoire"]

EXPOSE 4402
CMD ["node", "dist/cli.js", "mcp", "start", "--port", "4402"]
```

### Claude Code Config

Point each developer's Claude Code config at the shared instance. Run `memi mcp config --target claude-code` on the server to generate the base config, then replace `localhost` with the shared host:

```json
{
  "mcpServers": {
    "memoire": {
      "url": "http://memoire.internal:4402/mcp",
      "transport": "http"
    }
  }
}
```

### Shared Volume for Design System State

The critical piece is that all agents read the same `.memoire/` directory. Mount it as a shared volume:

```yaml
services:
  memoire-mcp:
    volumes:
      - design-system:/workspace/.memoire
    command: ["node", "dist/cli.js", "mcp", "start"]

volumes:
  design-system:
    driver: local
    driver_opts:
      type: nfs
      o: addr=nas.internal,rw
      device: ":/design-system"
```

For smaller teams, a bind mount to a shared network drive works fine.

---

## 5. Agent Workers as Containers

The Mémoire multi-agent model maps cleanly to containers. Each role gets isolated resources, its own restart policy, and no shared process state.

### Role-to-Container Mapping

```yaml
services:
  token-engineer:
    build: .
    command: ["node", "dist/cli.js", "agent", "spawn", "token-engineer"]
    environment:
      - MEMOIRE_AGENT_ROLE=token-engineer
    restart: on-failure:3

  component-architect:
    build: .
    command: ["node", "dist/cli.js", "agent", "spawn", "component-architect"]
    environment:
      - MEMOIRE_AGENT_ROLE=component-architect
    restart: on-failure:3

  accessibility-checker:
    build: .
    command: ["node", "dist/cli.js", "agent", "spawn", "accessibility-checker"]
    environment:
      - MEMOIRE_AGENT_ROLE=accessibility-checker
    restart: on-failure:3

  orchestrator:
    build: .
    command: ["node", "dist/cli.js", "compose", "--listen"]
    depends_on:
      - token-engineer
      - component-architect
      - accessibility-checker
    restart: unless-stopped
```

### Agent Health Checks

```yaml
services:
  token-engineer:
    healthcheck:
      test: ["CMD", "node", "dist/cli.js", "agent", "status", "--role", "token-engineer", "--json"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s
```

### Scaling Specific Roles

Scale the roles that bottleneck your pipeline:

```bash
# Scale code-generator to 3 parallel workers
docker compose up --scale code-generator=3
```

The task queue in `src/agents/` is lock-based — multiple workers claiming from the same queue is safe.

---

## 6. Devcontainer Support

A `.devcontainer/` setup gives every developer the same Mémoire environment with zero local install.

### `.devcontainer/devcontainer.json`

```json
{
  "name": "Mémoire Dev",
  "dockerComposeFile": "docker-compose.yml",
  "service": "memoire-dev",
  "workspaceFolder": "/app",

  "features": {
    "ghcr.io/devcontainers/features/node:1": {
      "version": "20"
    }
  },

  "forwardPorts": [4400, 4401, 9223, 9224, 9225],

  "postCreateCommand": "npm ci && npm run build",

  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode"
      ]
    }
  },

  "remoteEnv": {
    "FIGMA_ACCESS_TOKEN": "${localEnv:FIGMA_ACCESS_TOKEN}",
    "MEMOIRE_ENV": "development"
  }
}
```

### Figma Token in Devcontainer

The `remoteEnv` block above forwards `FIGMA_ACCESS_TOKEN` from the local host into the container. The developer sets it once in their shell profile (`.zshrc`, `.bashrc`) and it's available inside the devcontainer without committing credentials.

### Port Forwarding in VS Code

VS Code auto-forwards ports listed in `forwardPorts`. The Figma plugin connects to `localhost:9223` on the host, which tunnels into the container via VS Code's port forwarding, completing the bridge handshake transparently.

---

## 7. Environment Variables Reference

| Variable | Default | Purpose |
|----------|---------|---------|
| `MEMOIRE_HEADLESS` | `false` | Disables interactive TUI, uses JSON output |
| `MEMOIRE_NO_BRIDGE` | `false` | Skips Figma bridge discovery entirely |
| `MEMOIRE_ENV` | `development` | Environment name (`development`, `ci`, `production`) |
| `MEMOIRE_MCP_PORT` | `4402` | Port for MCP HTTP transport |
| `MEMOIRE_PREVIEW_PORT` | `4400` | Port for preview server |
| `MEMOIRE_DASHBOARD_PORT` | `4401` | Port for dashboard server |
| `MEMOIRE_BRIDGE_HOST` | `0.0.0.0` | Host to bind the WebSocket bridge listener |
| `MEMOIRE_AGENT_ROLE` | `general` | Role for a spawned agent worker |
| `FIGMA_ACCESS_TOKEN` | — | Figma REST API token (required for `memi pull`) |

Set in `.env` for local dev (never commit), or in Docker secrets / CI environment for production.

---

## 8. Configuration Reference

Add a `docker` block to `.memoire/project.json` to configure Docker-aware behavior:

```json
{
  "docker": {
    "enabled": true,
    "mode": "dev",
    "bridge": {
      "host": "0.0.0.0",
      "portRange": [9223, 9232],
      "fallbackHost": "host.docker.internal"
    },
    "preview": {
      "host": "0.0.0.0",
      "port": 4400
    },
    "ci": {
      "headless": true,
      "noBridge": true,
      "exitOnAuditError": true,
      "failOnWarn": false
    },
    "mcp": {
      "shared": true,
      "host": "memoire.internal",
      "port": 4402
    }
  }
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `docker.enabled` | boolean | auto-detected | Force-enable Docker mode |
| `docker.mode` | string | `dev` | `dev`, `ci`, or `mcp` |
| `bridge.host` | string | `0.0.0.0` | Bind host for WebSocket bridge |
| `bridge.portRange` | number[] | `[9223, 9232]` | Port range for bridge discovery |
| `bridge.fallbackHost` | string | `host.docker.internal` | Fallback for Docker Desktop on Mac/Win |
| `preview.host` | string | `0.0.0.0` | Bind host for preview server |
| `ci.headless` | boolean | `true` | Suppress interactive output in CI |
| `ci.noBridge` | boolean | `true` | Skip bridge init in CI |
| `ci.exitOnAuditError` | boolean | `true` | Exit non-zero on audit errors |
| `ci.failOnWarn` | boolean | `false` | Exit non-zero on audit warnings |
| `mcp.shared` | boolean | `false` | Use shared remote MCP server |
| `mcp.host` | string | `localhost` | Shared MCP server host |
| `mcp.port` | number | `4402` | Shared MCP server port |

---

## 9. Anti-Patterns

### Do Not: Run the Figma Bridge Exclusively in Docker for Canvas Work

Every canvas operation requires the bridge. In Docker, every operation adds a port-forward round trip. For design-heavy sessions, run Mémoire on the host — save Docker for CI and MCP.

### Do Not: Use Root User in Production Containers

```dockerfile
# Bad
RUN npm ci
CMD ["node", "dist/cli.js"]

# Good
RUN addgroup -S memoire && adduser -S memoire -G memoire
USER memoire
CMD ["node", "dist/cli.js"]
```

### Do Not: Commit `.memoire/` Into the Docker Image

`.memoire/` contains project-specific state (tokens, specs, sync cache) that changes constantly. Mount it as a volume. Baking it into the image means every spec change requires a rebuild.

```dockerfile
# In Dockerfile
VOLUME ["/workspace/.memoire"]
```

### Do Not: Bind the Preview Server to 127.0.0.1 in Containers

The default `127.0.0.1` is unreachable from outside the container. Always bind to `0.0.0.0` in Docker. Set `MEMOIRE_PREVIEW_HOST=0.0.0.0` or configure via `.memoire/project.json`.

### Do Not: Store FIGMA_ACCESS_TOKEN in docker-compose.yml

```yaml
# Bad
environment:
  - FIGMA_ACCESS_TOKEN=figd_abc123...

# Good — read from host environment or Docker secret
environment:
  - FIGMA_ACCESS_TOKEN=${FIGMA_ACCESS_TOKEN}
```

Or use Docker secrets for production:

```yaml
secrets:
  figma_token:
    external: true

services:
  memoire-mcp:
    secrets:
      - figma_token
    environment:
      - FIGMA_ACCESS_TOKEN_FILE=/run/secrets/figma_token
```

### Do Not: Skip Health Checks on Agent Workers

Agent workers that crash silently break the task queue. The heartbeat timeout is 30 seconds — a dead worker holds no lock, but a partially-complete task can stall. Always add health checks and `restart: on-failure`.
