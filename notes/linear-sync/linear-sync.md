# Linear Sync

---
name: Linear Sync
category: connect
activateOn: always
freedomLevel: high
version: 1.0.0
description: >
  Bidirectional sync between Linear and Memoire. Maps Linear issues to spec
  lifecycle, syncs comments as design decisions, tracks cycles against spec
  delivery, and pushes status updates back to Linear when specs are generated
  or exported to code.
---

## 1. Overview

Linear Sync bridges project management in Linear with the spec-driven design
pipeline in Memoire. Every design task in Linear maps to a spec (component,
page, dataviz, design, or IA). When a spec progresses through its lifecycle
-- stub, drafted, validated, generated, exported -- the corresponding Linear
issue is updated automatically. When a designer or PM triages a new issue in
Linear, a matching spec stub can be created in Memoire without manual effort.

### What This Skill Does

- Maps Linear issues to Memoire specs via a stable `linearIssueId` field
- Syncs workflow states in both directions
- Imports design issues from Linear as spec stubs
- Pushes spec generation and export events back to Linear
- Syncs comments between Linear issue threads and spec metadata
- Attaches Figma links and screenshots from Linear to specs
- Tracks which specs belong to the current Linear cycle/sprint
- Reports milestone progress based on spec completion

### What This Skill Does NOT Do

- Replace Linear as the source of truth for project management
- Create Linear issues from thin air without a matching spec intent
- Auto-assign engineers -- assignment stays in Linear
- Handle billing, workspace admin, or Linear settings

---

## 2. Linear API Setup

### Authentication

Linear uses personal API keys or OAuth2 tokens. For Memoire, a personal API
key is the simplest path.

1. Go to Linear Settings > API > Personal API Keys
2. Create a new key with a descriptive label (e.g. `memoire-sync`)
3. Store the key in your environment:

```bash
export LINEAR_API_KEY="lin_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

Or add it to `.memoire/project.json`:

```json
{
  "integrations": {
    "linear": {
      "apiKey": "${LINEAR_API_KEY}",
      "teamId": "TEAM-UUID",
      "projectId": "PROJECT-UUID"
    }
  }
}
```

Never commit API keys to version control. The `${LINEAR_API_KEY}` syntax
tells Memoire to read from the environment at runtime.

### Required IDs

| ID | Where to Find | Purpose |
|-----|--------------|---------|
| `teamId` | Linear Settings > Teams > click team > URL contains team ID | Scopes all queries to your team |
| `projectId` | Linear project page URL | Filters issues to a single project |
| `workspaceSlug` | URL: `linear.app/{slug}/...` | Used for constructing deep links |

### Verifying the Connection

```bash
memi linear status
```

This calls the Linear API `viewer` query to confirm authentication and prints
the team name, project name, and current cycle (if any).

---

## 3. Issue-to-Spec Mapping

### The Core Model

Every Linear issue that represents design work maps 1:1 to a Memoire spec.
The mapping is stored in the spec's metadata:

```json
{
  "name": "MetricCard",
  "type": "component",
  "atomicLevel": "molecule",
  "meta": {
    "linearIssueId": "ISS-123",
    "linearIssueUrl": "https://linear.app/team/issue/ISS-123",
    "linearLabels": ["component", "dashboard"],
    "linearCycle": "Cycle 14",
    "linearPriority": 2
  }
}
```

And on the Linear side, the issue description or a custom attachment contains
the Memoire spec path:

```
[memoire:spec] specs/components/MetricCard.json
```

### Mapping Rules

| Linear Issue State | Memoire Spec State | Direction |
|-------------------|-------------------|-----------|
| Issue created with design label | Spec stub created | Linear -> Memoire |
| Spec drafted and validated | Issue moved to "In Progress" | Memoire -> Linear |
| Spec code generated | Issue comment posted | Memoire -> Linear |
| Spec exported to Figma | Issue moved to "Done" | Memoire -> Linear |
| Issue cancelled | Spec marked `deprecated` | Linear -> Memoire |
| Issue reopened | Spec `deprecated` flag removed | Linear -> Memoire |

### How Spec Stubs Are Created

When `memi linear sync` runs, it queries Linear for issues matching the
design label taxonomy (see Section 5). For each qualifying issue without
a linked spec:

1. Parse the issue title to extract a component/page name
2. Determine spec type from the issue's labels
3. Create a minimal spec stub in the appropriate `specs/` subdirectory
4. Write the `linearIssueId` into the spec metadata
5. Post an attachment to the Linear issue linking back to the spec

Example: An issue titled "Design MetricCard for dashboard" with label
`component` creates `specs/components/MetricCard.json` with type
`component` and atomic level inferred from the title context.

---

## 4. Workflow State Mapping

### Linear Default States

Linear ships with these workflow states per team:

| State | Type | Category |
|-------|------|----------|
| Triage | triage | triage |
| Backlog | backlog | backlog |
| Todo | unstarted | unstarted |
| In Progress | started | started |
| In Review | started | started |
| Done | completed | completed |
| Cancelled | cancelled | cancelled |

### Memoire Spec Lifecycle

| Lifecycle Phase | Description |
|----------------|-------------|
| `stub` | Spec file exists with minimal fields |
| `drafted` | All required fields populated |
| `validated` | Passes Zod schema validation |
| `generated` | Code generated from spec |
| `exported` | Pushed to Figma or preview |
| `deprecated` | No longer active |

### Bidirectional State Machine

```
Linear State        Memoire Action         Memoire State
-----------        ---------------         -------------
Triage       --->  create spec stub   ---> stub
Backlog      --->  (no action)        ---> stub
Todo         --->  (no action)        ---> stub
In Progress  <---  spec drafted       <--- drafted
In Progress  <---  spec validated     <--- validated
In Review    <---  code generated     <--- generated
Done         <---  exported to Figma  <--- exported
Cancelled    --->  mark deprecated    ---> deprecated
```

When Memoire detects a spec transition, it calls the Linear API to update
the issue state. The state mapping is configurable in `.memoire/project.json`:

```json
{
  "integrations": {
    "linear": {
      "stateMapping": {
        "drafted": "In Progress",
        "validated": "In Progress",
        "generated": "In Review",
        "exported": "Done"
      }
    }
  }
}
```

### Custom Workflow States

If your team uses custom states (e.g. "Design Review", "QA"), map them
explicitly:

```json
{
  "stateMapping": {
    "drafted": "Design Review",
    "validated": "Design Review",
    "generated": "Engineering Review",
    "exported": "Done"
  }
}
```

The sync engine resolves state names to UUIDs via the `workflowStates`
query at startup and caches the mapping.

---

## 5. Label Taxonomy for Design Work

### Required Labels

Create these labels in Linear to classify design issues for Memoire:

| Label | Color | Maps To |
|-------|-------|---------|
| `component` | `#3B82F6` (blue) | ComponentSpec |
| `page` | `#8B5CF6` (violet) | PageSpec |
| `dataviz` | `#10B981` (emerald) | DatavizSpec |
| `token` | `#F59E0B` (amber) | DesignSpec (tokens) |
| `research` | `#EC4899` (pink) | Research pipeline input |
| `ia` | `#6366F1` (indigo) | IASpec |

### Automatic Label Detection

During `memi linear sync`, the engine reads issue labels to determine:

1. **Spec type** -- which spec schema to use
2. **Atomic level** -- inferred from title keywords:
   - "button", "input", "badge", "icon" -> atom
   - "card", "form field", "search bar" -> molecule
   - "header", "sidebar", "data table" -> organism
   - "layout", "shell", "scaffold" -> template
   - "dashboard", "settings page", "profile" -> page

3. **Priority mapping** -- Linear priority (0=none, 1=urgent, 4=low) is
   stored in spec metadata for sorting in `memi status` output

### Label Sync Direction

Labels are read-only from Linear's perspective. Memoire never creates or
modifies labels in Linear. Labels are the PM/designer's domain.

---

## 6. Cycle and Sprint Integration

### Reading the Current Cycle

```graphql
query CurrentCycle($teamId: String!) {
  team(id: $teamId) {
    activeCycle {
      id
      name
      number
      startsAt
      endsAt
      issues {
        nodes {
          id
          identifier
          title
          state { name type }
          labels { nodes { name } }
        }
      }
    }
  }
}
```

### Cycle-Scoped Spec Report

`memi linear status --cycle` prints a table:

```
Cycle 14 (Mar 18 - Mar 31)
---------------------------------------------------------------------------
ISS-142  MetricCard          component  molecule   generated   In Review
ISS-145  ActivityChart        dataviz    organism   validated   In Progress
ISS-148  DashboardLayout      page       template   stub        Todo
ISS-151  DesignTokens v2      token      --         drafted     In Progress
---------------------------------------------------------------------------
Progress: 1/4 exported | 2/4 in progress | 1/4 not started
```

### Historical Cycle Tracking

Completed cycles are cached in `.memoire/linear-cache/cycles/` as JSON
files. This enables retrospective reporting: how many specs shipped per
cycle, average time from stub to export, bottleneck stages.

---

## 7. Project Milestone Tracking

### Milestones in Linear

Linear milestones group issues across cycles. Memoire maps milestones to
design phases:

| Milestone | Typical Spec Coverage |
|-----------|----------------------|
| "Design System v2" | All component and token specs |
| "Dashboard MVP" | Page specs + dataviz specs for dashboard |
| "Research Round 1" | Research pipeline specs |

### Querying Milestones

```graphql
query ProjectMilestones($projectId: String!) {
  project(id: $projectId) {
    projectMilestones {
      nodes {
        id
        name
        targetDate
        sortOrder
      }
    }
  }
}
```

### Milestone Progress Calculation

For each milestone, Memoire counts linked specs by lifecycle phase:

```
Milestone: Dashboard MVP (target: Apr 15)
  Total specs: 12
  Exported:    4  (33%)
  Generated:   3  (25%)
  Validated:   2  (17%)
  Drafted:     1  ( 8%)
  Stub:        2  (17%)
  Weighted progress: 62%
```

Weighted progress uses: stub=0, drafted=0.2, validated=0.4, generated=0.7,
exported=1.0.

---

## 8. Bidirectional Sync Engine

### Linear to Memoire (Import)

Triggered by `memi linear sync --pull` or the default `memi linear sync`:

1. Query all issues in the configured project with design labels
2. For each issue, check if a spec with matching `linearIssueId` exists
3. If no spec exists:
   a. Determine spec type from labels
   b. Infer name from issue title (strip prefixes like "Design", "Create")
   c. Generate spec stub with Zod-valid minimal fields
   d. Write to `specs/{type}/{PascalName}.json`
   e. Post a Memoire attachment to the Linear issue
4. If spec exists:
   a. Check if Linear state changed (e.g. cancelled, reopened)
   b. Update spec metadata (priority, labels, cycle) if changed
   c. Sync new comments (see Section 9)

### Memoire to Linear (Export)

Triggered by `memi linear sync --push` or automatically after spec events:

1. Scan all specs with a `linearIssueId` in metadata
2. For each spec, determine current lifecycle phase
3. Compare against the last-known phase stored in `.memoire/linear-cache/`
4. If phase changed:
   a. Map new phase to Linear workflow state
   b. Call `issueUpdate` mutation to transition the issue
   c. Post a comment describing the transition:
      ```
      [memoire] Spec "MetricCard" moved to **generated** -- code output at
      components/molecules/MetricCard/MetricCard.tsx
      ```
   d. Update the local cache

### Sync Conflict Resolution

If both sides changed since last sync:

- **State conflicts**: Linear wins for backward transitions (e.g. someone
  moved the issue back to Triage). Memoire wins for forward transitions.
- **Metadata conflicts**: Linear is the source of truth for labels,
  priority, assignee. Memoire is the source of truth for spec content.
- **Comment conflicts**: No conflict possible -- comments are append-only.

### The Sync Cache

Located at `.memoire/linear-cache/`:

```
linear-cache/
  issues.json          # issue ID -> last known state, phase, updated timestamp
  cycles/              # completed cycle snapshots
  comments.json        # comment ID -> synced flag
  attachments.json     # attachment ID -> spec path
```

---

## 9. Comment Sync

### Linear Comments as Design Decisions

Design decisions often live in Linear issue comment threads. Memoire syncs
these into spec metadata under the `decisions` array:

```json
{
  "name": "MetricCard",
  "meta": {
    "decisions": [
      {
        "source": "linear",
        "author": "sara@team.com",
        "date": "2026-03-25T14:30:00.000Z",
        "text": "Use sparkline instead of full chart -- space is limited",
        "linearCommentId": "COMMENT-UUID"
      }
    ]
  }
}
```

### Spec Events as Linear Comments

When a spec reaches a lifecycle milestone, a comment is posted to the
linked Linear issue:

| Event | Comment Template |
|-------|-----------------|
| Spec drafted | `[memoire] Spec drafted -- {fieldCount} fields populated` |
| Spec validated | `[memoire] Spec validated -- all Zod checks passed` |
| Code generated | `[memoire] Code generated at {outputPath}` |
| Figma exported | `[memoire] Exported to Figma -- node {nodeId}` |
| Validation error | `[memoire] Spec validation failed: {errors}` |

### Comment Filtering

Not every Linear comment is a design decision. The sync engine filters:

- Skip comments from bots (author `isBot: true`)
- Skip comments that are pure reactions or empty
- Skip comments already synced (tracked by `linearCommentId`)
- Include comments that mention keywords: "decision", "agreed", "let's go
  with", "approved", "direction", or contain Figma URLs

Configurable via `.memoire/project.json`:

```json
{
  "integrations": {
    "linear": {
      "commentFilter": {
        "keywords": ["decision", "agreed", "approved", "direction"],
        "includeFigmaLinks": true,
        "skipBots": true
      }
    }
  }
}
```

---

## 10. Attachment Handling

### Figma Links in Linear Issues

When a Linear issue contains a Figma URL in its description or attachments,
Memoire extracts and stores it:

```json
{
  "meta": {
    "figmaUrl": "https://figma.com/design/abc123/File?node-id=42:1337",
    "figmaFileKey": "abc123",
    "figmaNodeId": "42:1337"
  }
}
```

This enables `memi pull` to fetch the specific Figma node for the spec
without manual URL entry.

### Screenshots and Attachments

Linear attachments with image MIME types are downloaded and stored in
`.memoire/attachments/{issueId}/`:

```
attachments/
  ISS-142/
    design-v1.png
    design-v2.png
    final-mockup.png
```

These are referenced in the spec metadata and available to the preview
server for visual comparison.

### Posting Attachments to Linear

When Memoire generates a preview screenshot (via `memi preview`), it can
post the screenshot back to the Linear issue as an attachment:

```graphql
mutation CreateAttachment($issueId: String!, $url: String!, $title: String!) {
  attachmentCreate(input: {
    issueId: $issueId
    url: $url
    title: $title
    subtitle: "Generated by Memoire"
    iconUrl: "https://memoire.dev/icon.png"
  }) {
    success
    attachment { id url }
  }
}
```

---

## 11. GraphQL Query Patterns

### Base Request Structure

All Linear API calls use the GraphQL endpoint at `https://api.linear.app/graphql`.

```typescript
async function linearQuery<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": process.env.LINEAR_API_KEY!,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Linear API ${response.status}: ${response.statusText}`);
  }

  const json = await response.json();
  if (json.errors) {
    throw new Error(`Linear GraphQL: ${json.errors.map((e: any) => e.message).join(", ")}`);
  }

  return json.data as T;
}
```

### Fetch Issues by Project and Labels

```graphql
query DesignIssues($projectId: String!, $after: String) {
  project(id: $projectId) {
    issues(
      first: 50
      after: $after
      filter: {
        labels: { name: { in: ["component", "page", "dataviz", "token", "research", "ia"] } }
      }
    ) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        identifier
        title
        description
        state { id name type }
        labels { nodes { id name color } }
        priority
        assignee { id name email }
        cycle { id name number }
        attachments { nodes { id url title } }
        comments {
          nodes {
            id
            body
            createdAt
            user { id name email isBot }
          }
        }
        createdAt
        updatedAt
      }
    }
  }
}
```

### Update Issue State

```graphql
mutation UpdateIssueState($issueId: String!, $stateId: String!) {
  issueUpdate(id: $issueId, input: { stateId: $stateId }) {
    success
    issue {
      id
      identifier
      state { name }
    }
  }
}
```

### Post a Comment

```graphql
mutation PostComment($issueId: String!, $body: String!) {
  commentCreate(input: { issueId: $issueId, body: $body }) {
    success
    comment { id body createdAt }
  }
}
```

### Resolve Workflow States for a Team

```graphql
query WorkflowStates($teamId: String!) {
  team(id: $teamId) {
    states {
      nodes {
        id
        name
        type
        position
      }
    }
  }
}
```

---

## 12. Webhook Setup for Real-Time Updates

### Why Webhooks

Polling is wasteful. Linear supports webhooks that fire on issue create,
update, comment, and label change events. Memoire can receive these if
running a persistent server (e.g. `memi watch` or `memi dashboard`).

### Creating a Webhook

```graphql
mutation CreateWebhook($url: String!, $teamId: String!) {
  webhookCreate(input: {
    url: $url
    teamId: $teamId
    label: "Memoire Sync"
    resourceTypes: ["Issue", "Comment", "IssueLabel"]
    enabled: true
  }) {
    success
    webhook { id url enabled }
  }
}
```

### Webhook Endpoint

Memoire's preview server exposes `POST /api/linear/webhook` when Linear
sync is configured. The handler:

1. Validates the `Linear-Signature` header using HMAC-SHA256
2. Parses the event type from the `action` field
3. Routes to the appropriate handler:

| Action | Handler |
|--------|---------|
| `Issue.create` | Check labels, create spec stub if design issue |
| `Issue.update` | Check state change, update spec metadata |
| `Comment.create` | Filter and sync to spec decisions |
| `Issue.remove` | Mark spec as deprecated |

### Webhook Signature Verification

```typescript
import { createHmac } from "crypto";

function verifyWebhook(body: string, signature: string, secret: string): boolean {
  const hmac = createHmac("sha256", secret);
  hmac.update(body);
  const digest = hmac.digest("hex");
  return signature === digest;
}
```

### Webhook URL Configuration

For local development, use a tunnel:

```bash
# Using cloudflared
cloudflared tunnel --url http://localhost:4400

# Or ngrok
ngrok http 4400
```

Then register the tunnel URL as the webhook endpoint in Linear.

---

## 13. Rate Limiting and Pagination

### Linear Rate Limits

Linear enforces rate limits per API key:

| Limit | Value |
|-------|-------|
| Requests per minute | 1500 |
| Complexity per request | 10000 points |
| Max query depth | 10 levels |
| Max `first` / page size | 250 (effective limit is 50 for nested) |

### Pagination Strategy

All list queries use cursor-based pagination:

```typescript
async function fetchAllIssues(projectId: string): Promise<Issue[]> {
  const allIssues: Issue[] = [];
  let cursor: string | undefined;

  do {
    const result = await linearQuery<ProjectIssuesResponse>(
      DESIGN_ISSUES_QUERY,
      { projectId, after: cursor }
    );

    allIssues.push(...result.project.issues.nodes);

    if (result.project.issues.pageInfo.hasNextPage) {
      cursor = result.project.issues.pageInfo.endCursor;
    } else {
      cursor = undefined;
    }
  } while (cursor);

  return allIssues;
}
```

### Complexity Management

Deeply nested queries burn complexity points fast. Strategies:

1. Fetch issues first, then comments in a separate query per issue
   (avoids nested pagination)
2. Use `includeArchived: false` to reduce result set
3. Cache aggressively -- `updatedAt` filters on subsequent syncs
4. Batch mutations: Linear supports up to 50 `issueUpdate` calls per
   request via aliases

### Incremental Sync

After the first full sync, subsequent runs use the `updatedAt` filter:

```graphql
filter: {
  updatedAt: { gte: "2026-03-27T00:00:00.000Z" }
  labels: { name: { in: ["component", "page", "dataviz", "token", "research", "ia"] } }
}
```

The last sync timestamp is stored in `.memoire/linear-cache/last-sync.json`.

---

## 14. Error Handling

### Retry Strategy

```typescript
async function linearQueryWithRetry<T>(
  query: string,
  variables?: Record<string, unknown>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await linearQuery<T>(query, variables);
    } catch (error: any) {
      const isRateLimit = error.message?.includes("429") || error.message?.includes("rate");
      const isTransient = error.message?.includes("502") || error.message?.includes("503");

      if ((isRateLimit || isTransient) && attempt < maxRetries) {
        const delay = isRateLimit ? 60_000 : 1000 * Math.pow(2, attempt);
        console.warn(`Linear API retry ${attempt}/${maxRetries} in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Unreachable");
}
```

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `401 Unauthorized` | Invalid or expired API key | Regenerate key in Linear settings |
| `403 Forbidden` | Key lacks permission for this team | Check team membership |
| `404 Not Found` | Issue/project deleted | Remove stale `linearIssueId` from spec |
| `429 Too Many Requests` | Rate limit hit | Back off 60s, reduce query complexity |
| `Complexity limit exceeded` | Query too deep/wide | Split into smaller queries |
| `ENOTFOUND api.linear.app` | Network issue | Check internet connection |

### Graceful Degradation

If the Linear API is unreachable during `memi linear sync`:

1. Log a warning but do not fail the entire Memoire pipeline
2. Use cached data from `.memoire/linear-cache/` for read operations
3. Queue write operations (state updates, comments) in a local outbox
4. Retry queued operations on next successful sync

The outbox lives at `.memoire/linear-cache/outbox.json`:

```json
[
  {
    "type": "stateUpdate",
    "issueId": "ISS-142",
    "targetState": "In Review",
    "queuedAt": "2026-03-28T10:15:00.000Z"
  },
  {
    "type": "comment",
    "issueId": "ISS-145",
    "body": "[memoire] Spec validated -- all Zod checks passed",
    "queuedAt": "2026-03-28T10:15:01.000Z"
  }
]
```

---

## 15. CLI Integration

### `memi linear sync`

The primary command. Runs both pull and push by default.

```
Usage: memi linear sync [options]

Options:
  --pull         Only import from Linear (skip push)
  --push         Only export to Linear (skip pull)
  --dry-run      Show what would happen without making changes
  --verbose      Print every API call and state transition
  --cycle        Scope sync to current cycle only
  --force        Ignore cache, perform full re-sync
```

Example output:

```
$ memi linear sync

Linear Sync
  Team: Memoire Design | Project: Dashboard MVP | Cycle: 14

  Pull (Linear -> Memoire)
    [new]  ISS-155 "TokenRefresh animation" -> specs/components/TokenRefresh.json
    [skip] ISS-142 "MetricCard" -- spec exists, no changes
    [update] ISS-148 "DashboardLayout" -- priority changed 3 -> 2

  Push (Memoire -> Linear)
    [state] ISS-142 MetricCard: generated -> moved to "In Review"
    [comment] ISS-145 ActivityChart: "Spec validated -- all Zod checks passed"

  Summary: 1 created | 1 updated | 1 state change | 1 comment posted
  Synced in 2.3s
```

### `memi linear status`

Shows the current state of all Linear-linked specs.

```
Usage: memi linear status [options]

Options:
  --cycle        Show only current cycle issues
  --milestone    Group by milestone
  --json         Output as JSON for scripting
```

### `memi linear link <spec> <issueId>`

Manually link an existing spec to a Linear issue:

```bash
memi linear link MetricCard ISS-142
```

### `memi linear unlink <spec>`

Remove the Linear link from a spec without deleting the spec.

### `memi linear import <issueId>`

Import a single Linear issue as a spec stub, even if it does not match
the label taxonomy.

---

## 16. Team Collaboration Patterns

### Recommended Workflow

1. **PM creates issues in Linear** with the appropriate design labels
   (`component`, `page`, `dataviz`, etc.) and assigns to a cycle
2. **Designer runs `memi linear sync`** to pull new issues as spec stubs
3. **Designer fills out specs** using `memi spec component MetricCard` or
   by editing the JSON directly
4. **Spec validation** happens automatically -- Zod schemas enforce
   completeness
5. **Code generation** via `memi generate MetricCard` produces the
   component
6. **Linear issue auto-updates** to "In Review" when code is generated
7. **PM reviews in Linear**, sees the Memoire comment with the output path
8. **Export to Figma** moves the issue to "Done"

### Multi-Designer Setup

Each designer runs their own Memoire instance. Specs are committed to git.
Linear sync uses issue IDs as stable keys, so multiple designers can work
on different specs in the same project without conflicts.

Recommended git workflow:
- Each designer works on a feature branch
- Specs are JSON files -- merge conflicts are rare and easy to resolve
- The `linearIssueId` field prevents duplicate spec creation
- Run `memi linear sync --dry-run` after merging to verify state consistency

### PM Visibility

PMs never need to install Memoire. They see:
- Issue state transitions happening automatically
- Comments with spec progress updates
- Milestone progress reflected in issue completion
- Cycle velocity data derived from spec lifecycle timing

### Handoff to Engineering

When a spec reaches `generated`, engineers can:
1. See the generated code path in the Linear issue comment
2. Pull the branch and find the component in the atomic design folder
3. Review the spec JSON for design intent, decisions, and constraints
4. Check the preview server for visual output

---

## 17. Anti-Patterns

### Do Not: Create Specs Outside Memoire and Expect Linear Sync

The sync engine relies on `linearIssueId` in spec metadata. Manually
created specs without this field will be invisible to Linear sync.
Always start from a Linear issue or use `memi linear link` to connect
existing specs.

### Do Not: Use Multiple Labels from the Taxonomy on One Issue

An issue should have exactly one of: `component`, `page`, `dataviz`,
`token`, `research`, `ia`. Multiple labels confuse the spec type
inference. Use additional labels outside the taxonomy for your own
organization (e.g. "urgent", "v2", "mobile").

### Do Not: Modify Spec `linearIssueId` Manually

This field is the sync anchor. Changing it breaks the bidirectional link.
Use `memi linear unlink` and `memi linear link` to rewire connections.

### Do Not: Poll Linear from Multiple CI Jobs Simultaneously

Each poll run consumes API rate limit budget. Centralize sync in one
scheduled job or use webhooks. Running `memi linear sync` in 5 parallel
CI jobs will burn 5x the rate limit budget for identical results.

### Do Not: Ignore the Dry-Run Flag

Before running sync on a large project for the first time, always use
`--dry-run` to preview what will happen. A misconfigured label taxonomy
can create dozens of unwanted spec stubs.

### Do Not: Store API Keys in project.json Without Environment Variable References

Always use `${LINEAR_API_KEY}` syntax. Committing raw keys to git is a
security incident. Memoire will warn if it detects a raw `lin_api_` prefix
in committed files.

### Do Not: Sync Everything

Not every Linear issue is a design task. The label taxonomy acts as a
filter. Issues without design labels are ignored by default. Resist the
urge to add a `design` label to engineering tasks just for visibility --
that is what Linear's own views and filters are for.

---

## 18. Configuration Reference

Full `.memoire/project.json` integration block:

```json
{
  "integrations": {
    "linear": {
      "apiKey": "${LINEAR_API_KEY}",
      "teamId": "team-uuid-here",
      "projectId": "project-uuid-here",
      "workspaceSlug": "your-workspace",
      "stateMapping": {
        "drafted": "In Progress",
        "validated": "In Progress",
        "generated": "In Review",
        "exported": "Done"
      },
      "commentFilter": {
        "keywords": ["decision", "agreed", "approved", "direction"],
        "includeFigmaLinks": true,
        "skipBots": true
      },
      "sync": {
        "autoSync": false,
        "syncInterval": 300,
        "pullOnWatch": true,
        "pushAfterGenerate": true,
        "pushAfterExport": true
      },
      "webhook": {
        "enabled": false,
        "secret": "${LINEAR_WEBHOOK_SECRET}",
        "path": "/api/linear/webhook"
      },
      "cache": {
        "dir": ".memoire/linear-cache",
        "ttl": 3600
      }
    }
  }
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `apiKey` | string | -- | Linear API key (use env var reference) |
| `teamId` | string | -- | Linear team UUID |
| `projectId` | string | -- | Linear project UUID |
| `workspaceSlug` | string | -- | For constructing issue URLs |
| `stateMapping` | object | see Section 4 | Spec phase -> Linear state name |
| `commentFilter` | object | see Section 9 | Controls which comments sync |
| `sync.autoSync` | boolean | false | Auto-sync on `memi watch` |
| `sync.syncInterval` | number | 300 | Seconds between auto-syncs |
| `sync.pullOnWatch` | boolean | true | Pull from Linear when watch starts |
| `sync.pushAfterGenerate` | boolean | true | Push state after code gen |
| `sync.pushAfterExport` | boolean | true | Push state after Figma export |
| `webhook.enabled` | boolean | false | Enable webhook receiver |
| `webhook.secret` | string | -- | HMAC secret for signature verification |
| `webhook.path` | string | `/api/linear/webhook` | Webhook endpoint path |
| `cache.dir` | string | `.memoire/linear-cache` | Cache directory |
| `cache.ttl` | number | 3600 | Cache TTL in seconds |
