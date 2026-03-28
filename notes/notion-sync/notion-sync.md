---
skill: Notion Sync
category: connect
activateOn: always
freedomLevel: high
description: >
  Bidirectional sync between Notion databases and the Memoire registry.
  Imports research insights, user stories, and requirements as specs.
  Exports component status, spec summaries, and project state back to Notion.
version: 1.0.0
requires:
  - "@notionhq/client >= 2.0.0"
  - "memoire-engine"
tokens:
  - NOTION_INTEGRATION_TOKEN
  - NOTION_ROOT_PAGE_ID (optional)
---

# Notion Sync — Memoire Connect Skill

## Overview

This skill bridges Notion workspaces and the Memoire registry. It treats Notion
as a structured research and project management surface and Memoire as the
spec-driven design intelligence layer. Data flows both directions:

- **Inbound**: Notion databases holding research notes, user stories, requirements,
  competitive analysis, and stakeholder feedback become Memoire specs and research
  insights.
- **Outbound**: Generated component status, spec summaries, design token snapshots,
  and project health metrics are pushed to Notion dashboards.

The sync is idempotent. Every record carries a `notion_page_id` on the Memoire
side and a `memoire_spec_id` custom property on the Notion side. Conflict
resolution follows a last-writer-wins strategy with optional manual review.

---

## 1. Notion API Setup

### 1.1 Create an Internal Integration

1. Go to https://www.notion.so/my-integrations
2. Click **New integration**.
3. Name it `Memoire Sync`.
4. Select the workspace that holds your project databases.
5. Under **Capabilities**, enable:
   - Read content
   - Update content
   - Insert content
   - Read comments (optional, for research extraction)
6. Copy the **Internal Integration Secret** (starts with `ntn_`).

### 1.2 Store the Token

The token is stored in `.memoire/secrets.json` (git-ignored by default):

```json
{
  "notion": {
    "token": "ntn_xxxxxxxxxxxxxxxxxxxx",
    "rootPageId": "optional-root-page-uuid"
  }
}
```

Alternatively set the environment variable:

```bash
export NOTION_INTEGRATION_TOKEN="ntn_xxxxxxxxxxxxxxxxxxxx"
```

Resolution order:
1. `NOTION_INTEGRATION_TOKEN` env var
2. `.memoire/secrets.json` → `notion.token`
3. Interactive prompt via `memi notion connect`

Never commit tokens. The `.memoire/secrets.json` file must be in `.gitignore`.

### 1.3 Share Databases with the Integration

Each Notion database you want to sync must be explicitly shared with the
integration. Open the database page, click the three-dot menu, select
**Connections**, and add **Memoire Sync**.

### 1.4 Scoped Permissions

Memoire requests only the capabilities it needs per operation:

| Operation | Required Capability |
|-----------|-------------------|
| `memi notion pull` | Read content |
| `memi notion push` | Read content, Update content, Insert content |
| `memi notion status` | Read content |

---

## 2. Database Schema Mapping

### 2.1 Notion Properties to Memoire Spec Fields

The mapper translates Notion database properties to Memoire spec fields using a
configurable schema map stored in `.memoire/notion-sync.config.json`:

```json
{
  "databases": {
    "research": {
      "notionDatabaseId": "abc123...",
      "specType": "research",
      "propertyMap": {
        "Name": "title",
        "Status": "status",
        "Category": "category",
        "Priority": "priority",
        "Assignee": "owner",
        "Tags": "tags",
        "Summary": "description",
        "Source URL": "sourceUrl",
        "Created": "createdAt",
        "Last Edited": "updatedAt"
      }
    },
    "components": {
      "notionDatabaseId": "def456...",
      "specType": "component",
      "propertyMap": {
        "Component Name": "name",
        "Atomic Level": "atomicLevel",
        "Status": "status",
        "Variants": "variants",
        "Props": "props",
        "Composes": "composesSpecs",
        "Figma Link": "figmaUrl",
        "Notes": "description"
      }
    },
    "user-stories": {
      "notionDatabaseId": "ghi789...",
      "specType": "page",
      "propertyMap": {
        "Story Title": "title",
        "Acceptance Criteria": "requirements",
        "Epic": "parentSpec",
        "Priority": "priority",
        "Sprint": "milestone",
        "Status": "status"
      }
    }
  }
}
```

### 2.2 Property Type Conversions

| Notion Type | Memoire Type | Conversion |
|-------------|-------------|------------|
| `title` | `string` | Extract plain text from rich text array |
| `rich_text` | `string` | Convert to markdown (see Section 8) |
| `select` | `string` | Use `.select.name` |
| `multi_select` | `string[]` | Map `.multi_select[].name` |
| `number` | `number` | Direct pass-through |
| `checkbox` | `boolean` | Direct pass-through |
| `date` | `ISO 8601 string` | Use `.date.start`, ignore `.date.end` unless range |
| `url` | `string` | Direct pass-through |
| `email` | `string` | Direct pass-through |
| `people` | `string[]` | Map `.people[].name` |
| `relation` | `string[]` | Resolve to page titles (see Section 9) |
| `rollup` | varies | Unwrap based on rollup function type |
| `formula` | varies | Use computed `.formula.string\|number\|boolean` |
| `files` | `Attachment[]` | Download and store (see Section 10) |
| `status` | `string` | Use `.status.name` |
| `created_time` | `ISO 8601 string` | Direct pass-through |
| `last_edited_time` | `ISO 8601 string` | Direct pass-through |

### 2.3 Reverse Mapping (Memoire to Notion)

When pushing specs back, the mapper inverts the property map and constructs
Notion-compatible property objects:

```typescript
function toNotionProperties(
  spec: MemoireSpec,
  propertyMap: Record<string, string>
): Record<string, NotionPropertyValue> {
  const reversed = invertMap(propertyMap);
  const properties: Record<string, NotionPropertyValue> = {};

  for (const [specField, notionProp] of Object.entries(reversed)) {
    const value = spec[specField];
    const propSchema = databaseSchema[notionProp];
    properties[notionProp] = convertToNotionType(value, propSchema.type);
  }

  return properties;
}
```

---

## 3. Bidirectional Sync Workflows

### 3.1 Notion to Memoire (Pull)

**Command**: `memi notion pull [--database <name>] [--since <date>] [--dry-run]`

**Workflow**:

1. **Read config** — Load `.memoire/notion-sync.config.json` to get database IDs
   and property maps.
2. **Query databases** — For each configured database, query Notion with optional
   `last_edited_time` filter (if `--since` is provided or using last sync
   timestamp from `.memoire/notion-sync.state.json`).
3. **Paginate** — Notion returns max 100 results per request. Follow
   `next_cursor` until `has_more` is false.
4. **Extract page content** — For each page, fetch block children to get the
   full body content (headings, paragraphs, lists, code blocks, images).
5. **Convert** — Map properties using the schema map. Convert block content to
   markdown for the spec's `description` or `content` field.
6. **Deduplicate** — Check the Memoire registry for existing specs with matching
   `notion_page_id`. Update if found, create if new.
7. **Validate** — Run the spec through the appropriate Zod schema validator.
8. **Write** — Save specs to the appropriate directory (`specs/components/`,
   `specs/pages/`, etc.) and update the registry.
9. **Record state** — Write the sync timestamp to `.memoire/notion-sync.state.json`.

```typescript
interface SyncState {
  lastPull: Record<string, string>;   // databaseName → ISO timestamp
  lastPush: Record<string, string>;
  conflicts: ConflictRecord[];
  syncedPages: Record<string, {       // notionPageId → metadata
    specId: string;
    specType: string;
    lastSynced: string;
    hash: string;                      // content hash for change detection
  }>;
}
```

**Incremental sync**: Only pages modified after `lastPull[databaseName]` are
fetched. Full sync is triggered by `memi notion pull --full`.

### 3.2 Memoire to Notion (Push)

**Command**: `memi notion push [--database <name>] [--spec <specId>] [--dry-run]`

**Workflow**:

1. **Scan registry** — Find all specs that have changed since last push
   (compare content hashes).
2. **Match database** — Determine which Notion database each spec maps to based
   on `specType`.
3. **Check existence** — For each spec, check if a Notion page with matching
   `memoire_spec_id` exists.
   - If exists: **PATCH** the page properties and append/replace content blocks.
   - If new: **POST** a new page to the database with full properties and content.
4. **Convert content** — Transform spec fields back to Notion property types.
   Convert markdown body to Notion block objects.
5. **Upload attachments** — If the spec references local images or files, upload
   them via the Notion file upload endpoint.
6. **Record state** — Update `lastPush` timestamp and page mapping in state file.

**Push spec summary format** (what gets written to Notion):

```
## [ComponentName] — [AtomicLevel]

**Status**: [generated | draft | validated | published]
**Composes**: [list of child specs]
**Variants**: [variant list]
**Props**: [prop summary table]

### Description
[spec.description]

### Generated Code
[link to local preview or code snippet]
```

### 3.3 Selective Sync

Both pull and push accept filters:

```bash
# Pull only research database
memi notion pull --database research

# Push a single spec
memi notion push --spec MetricCard

# Pull pages modified in the last 7 days
memi notion pull --since 2026-03-21

# Dry run — show what would change without writing
memi notion pull --dry-run
```

---

## 4. Page Content Extraction

### 4.1 Block Tree Retrieval

Notion pages store content as a tree of blocks. Retrieval requires recursive
fetching since the API only returns direct children:

```typescript
async function getFullBlockTree(
  client: NotionClient,
  blockId: string,
  depth: number = 0,
  maxDepth: number = 5
): Promise<NotionBlock[]> {
  if (depth >= maxDepth) return [];

  const blocks: NotionBlock[] = [];
  let cursor: string | undefined;

  do {
    const response = await rateLimitedRequest(() =>
      client.blocks.children.list({
        block_id: blockId,
        start_cursor: cursor,
        page_size: 100,
      })
    );

    for (const block of response.results) {
      if (block.has_children) {
        block._children = await getFullBlockTree(
          client, block.id, depth + 1, maxDepth
        );
      }
      blocks.push(block);
    }

    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  return blocks;
}
```

### 4.2 Block Types to Markdown

| Notion Block Type | Markdown Output |
|-------------------|----------------|
| `paragraph` | Plain text with inline formatting |
| `heading_1` | `# Heading` |
| `heading_2` | `## Heading` |
| `heading_3` | `### Heading` |
| `bulleted_list_item` | `- Item` (nested with indentation) |
| `numbered_list_item` | `1. Item` (nested with indentation) |
| `to_do` | `- [x] Done` or `- [ ] Pending` |
| `toggle` | `<details><summary>Title</summary>Content</details>` |
| `code` | Fenced code block with language annotation |
| `quote` | `> Blockquote` |
| `callout` | `> **Icon** Callout text` |
| `divider` | `---` |
| `table` | Markdown table with `\|` delimiters |
| `image` | `![caption](url)` — download and localize |
| `bookmark` | `[Title](url)` |
| `embed` | Raw URL or iframe placeholder |
| `child_page` | `[Page Title](notion://page-id)` — reference link |
| `child_database` | Skip or reference as `[Database: Name]` |
| `synced_block` | Resolve original and render its children |
| `column_list` | Render columns sequentially (markdown has no columns) |
| `equation` | `$LaTeX$` or `$$LaTeX$$` for block equations |

---

## 5. Database Query Patterns

### 5.1 Filters

Build Notion filters programmatically from CLI flags:

```typescript
function buildFilter(
  opts: PullOptions,
  config: DatabaseConfig
): NotionFilter | undefined {
  const conditions: NotionFilterCondition[] = [];

  // Time-based filter for incremental sync
  if (opts.since) {
    conditions.push({
      timestamp: "last_edited_time",
      last_edited_time: { on_or_after: opts.since },
    });
  }

  // Status filter — skip archived/deleted
  if (config.propertyMap.Status) {
    conditions.push({
      property: "Status",
      status: { does_not_equal: "Archived" },
    });
  }

  // Tag filter
  if (opts.tags?.length) {
    for (const tag of opts.tags) {
      conditions.push({
        property: "Tags",
        multi_select: { contains: tag },
      });
    }
  }

  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return { and: conditions };
}
```

### 5.2 Sorts

Default sort order is `last_edited_time` descending (newest first). Override
with config:

```json
{
  "defaultSort": [
    { "property": "Priority", "direction": "ascending" },
    { "timestamp": "last_edited_time", "direction": "descending" }
  ]
}
```

### 5.3 Pagination

Always paginate. Never assume a database has fewer than 100 items:

```typescript
async function queryAllPages(
  client: NotionClient,
  databaseId: string,
  filter?: NotionFilter,
  sorts?: NotionSort[]
): Promise<NotionPage[]> {
  const pages: NotionPage[] = [];
  let cursor: string | undefined;

  do {
    const response = await rateLimitedRequest(() =>
      client.databases.query({
        database_id: databaseId,
        filter,
        sorts,
        start_cursor: cursor,
        page_size: 100,
      })
    );

    pages.push(...response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  return pages;
}
```

---

## 6. Relation Handling

### 6.1 Linked Databases

Notion relations link pages across databases. When syncing, resolve relations
to meaningful identifiers:

```typescript
async function resolveRelations(
  client: NotionClient,
  page: NotionPage,
  propertyName: string
): Promise<string[]> {
  const relation = page.properties[propertyName];
  if (relation.type !== "relation") return [];

  const titles: string[] = [];
  for (const ref of relation.relation) {
    const linked = await rateLimitedRequest(() =>
      client.pages.retrieve({ page_id: ref.id })
    );
    const title = extractTitle(linked);
    titles.push(title);
  }

  return titles;
}
```

### 6.2 Relation Sync Strategy

Relations are stored as spec references in Memoire:

```json
{
  "name": "UserProfilePage",
  "specType": "page",
  "composesSpecs": ["AvatarAtom", "ProfileCard", "ActivityChart"],
  "_notionRelations": {
    "Components": ["notion-page-id-1", "notion-page-id-2"],
    "Epic": ["notion-page-id-3"]
  }
}
```

When pushing back, `_notionRelations` is used to reconstruct the Notion relation
property. If a referenced spec was created in Memoire (not imported from Notion),
the push workflow creates a stub page in the target database first.

---

## 7. Rich Text Conversion

### 7.1 Notion Rich Text to Markdown

Notion rich text is an array of annotated text segments:

```typescript
function richTextToMarkdown(richText: NotionRichText[]): string {
  return richText.map((segment) => {
    let text = segment.plain_text;

    // Apply annotations in correct nesting order
    if (segment.annotations.code) text = `\`${text}\``;
    if (segment.annotations.bold && segment.annotations.italic) {
      text = `***${text}***`;
    } else if (segment.annotations.bold) {
      text = `**${text}**`;
    } else if (segment.annotations.italic) {
      text = `*${text}*`;
    }
    if (segment.annotations.strikethrough) text = `~~${text}~~`;
    if (segment.annotations.underline) text = `<u>${text}</u>`;

    // Handle links
    if (segment.href) {
      text = `[${text}](${segment.href})`;
    }

    // Handle mentions
    if (segment.type === "mention") {
      if (segment.mention.type === "page") {
        text = `[${text}](notion://page/${segment.mention.page.id})`;
      } else if (segment.mention.type === "database") {
        text = `[${text}](notion://database/${segment.mention.database.id})`;
      } else if (segment.mention.type === "date") {
        text = segment.mention.date.start;
      } else if (segment.mention.type === "user") {
        text = `@${segment.mention.user.name || "unknown"}`;
      }
    }

    return text;
  }).join("");
}
```

### 7.2 Markdown to Notion Rich Text

Reverse conversion for push operations. Parse markdown inline formatting into
Notion rich text segments:

```typescript
function markdownToRichText(md: string): NotionRichText[] {
  const segments: NotionRichText[] = [];
  const tokens = parseInlineMarkdown(md);

  for (const token of tokens) {
    segments.push({
      type: "text",
      text: { content: token.text, link: token.href ? { url: token.href } : null },
      annotations: {
        bold: token.bold || false,
        italic: token.italic || false,
        strikethrough: token.strikethrough || false,
        underline: false,
        code: token.code || false,
        color: "default",
      },
    });
  }

  return segments;
}
```

### 7.3 Color Handling

Notion supports text colors and background colors. These are preserved as
metadata but not rendered in markdown. On push, previously stored color
annotations are restored from the sync state.

---

## 8. Rich Text — Extended Block Conversions

### 8.1 Markdown to Notion Blocks

When pushing content to Notion, convert markdown back to block objects:

```typescript
function markdownToBlocks(md: string): NotionBlock[] {
  const blocks: NotionBlock[] = [];
  const lines = md.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Headings
    if (line.startsWith("### ")) {
      blocks.push(heading(3, line.slice(4)));
    } else if (line.startsWith("## ")) {
      blocks.push(heading(2, line.slice(3)));
    } else if (line.startsWith("# ")) {
      blocks.push(heading(1, line.slice(2)));
    }
    // Code blocks
    else if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push(codeBlock(lang, codeLines.join("\n")));
    }
    // Bullet lists
    else if (line.match(/^[-*] /)) {
      blocks.push(bulletedListItem(line.slice(2)));
    }
    // Numbered lists
    else if (line.match(/^\d+\. /)) {
      blocks.push(numberedListItem(line.replace(/^\d+\. /, "")));
    }
    // Blockquotes
    else if (line.startsWith("> ")) {
      blocks.push(quote(line.slice(2)));
    }
    // Dividers
    else if (line.match(/^---+$/)) {
      blocks.push({ type: "divider", divider: {} });
    }
    // Paragraphs
    else if (line.trim()) {
      blocks.push(paragraph(line));
    }

    i++;
  }

  return blocks;
}
```

---

## 9. File and Image Attachment Handling

### 9.1 Downloading from Notion

Notion file URLs are temporary (signed S3 URLs valid for ~1 hour). Download
immediately during pull:

```typescript
async function downloadAttachment(
  fileObj: NotionFile,
  targetDir: string
): Promise<string> {
  const url = fileObj.type === "file" ? fileObj.file.url : fileObj.external.url;
  const filename = sanitizeFilename(fileObj.name || urlToFilename(url));
  const targetPath = path.join(targetDir, filename);

  // Skip if already downloaded and hash matches
  if (await fileExists(targetPath)) {
    const existing = await hashFile(targetPath);
    if (existing === fileObj._cachedHash) return targetPath;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new NotionSyncError(
      `Failed to download attachment: ${response.status} ${response.statusText}`,
      "ATTACHMENT_DOWNLOAD_FAILED"
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(targetPath, buffer);

  return targetPath;
}
```

### 9.2 Attachment Storage

Downloaded files are stored in `.memoire/attachments/{notion-page-id}/`:

```
.memoire/
  attachments/
    abc123.../
      screenshot.png
      wireframe.pdf
      data-export.csv
```

Spec files reference attachments by relative path:

```json
{
  "attachments": [
    { "name": "screenshot.png", "path": ".memoire/attachments/abc123/screenshot.png" },
    { "name": "wireframe.pdf", "path": ".memoire/attachments/abc123/wireframe.pdf" }
  ]
}
```

### 9.3 Uploading to Notion

When pushing specs that contain local images, upload via external URL reference
(Notion does not yet support direct file upload via the public API for page
content). Host images on the Memoire preview server and reference:

```typescript
async function attachToNotionPage(
  client: NotionClient,
  pageId: string,
  filePath: string,
  previewBaseUrl: string
): Promise<void> {
  const publicUrl = `${previewBaseUrl}/attachments/${path.basename(filePath)}`;

  await rateLimitedRequest(() =>
    client.blocks.children.append({
      block_id: pageId,
      children: [{
        type: "image",
        image: {
          type: "external",
          external: { url: publicUrl },
        },
      }],
    })
  );
}
```

---

## 10. Webhook Setup for Real-Time Sync

### 10.1 Architecture

Notion does not offer native webhooks. Real-time sync is implemented via
polling with an optional webhook proxy:

**Option A — Polling (default)**:
- A background watcher polls configured databases every 60 seconds.
- Uses `last_edited_time` filter to fetch only changed pages.
- Lightweight: ~1 API request per database per minute.

**Option B — Webhook proxy (advanced)**:
- Use a service like Pipedream, Make, or Zapier to trigger on Notion database
  changes.
- The proxy sends a POST to `http://localhost:{memoirePort}/api/notion/webhook`.
- Memoire processes the event and triggers a targeted pull.

### 10.2 Polling Implementation

```typescript
class NotionWatcher {
  private interval: NodeJS.Timeout | null = null;
  private readonly pollMs: number;

  constructor(
    private client: NotionClient,
    private config: NotionSyncConfig,
    private state: SyncState,
    pollIntervalSeconds: number = 60
  ) {
    this.pollMs = pollIntervalSeconds * 1000;
  }

  start(): void {
    if (this.interval) return;
    this.interval = setInterval(() => this.poll(), this.pollMs);
    this.poll(); // immediate first check
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private async poll(): Promise<void> {
    for (const [name, dbConfig] of Object.entries(this.config.databases)) {
      const since = this.state.lastPull[name] || new Date(0).toISOString();
      const filter = {
        timestamp: "last_edited_time" as const,
        last_edited_time: { on_or_after: since },
      };

      const pages = await queryAllPages(
        this.client, dbConfig.notionDatabaseId, filter
      );

      if (pages.length > 0) {
        await this.syncPages(name, dbConfig, pages);
        this.state.lastPull[name] = new Date().toISOString();
        await saveState(this.state);
      }
    }
  }

  private async syncPages(
    dbName: string,
    config: DatabaseConfig,
    pages: NotionPage[]
  ): Promise<void> {
    for (const page of pages) {
      await processSinglePage(this.client, config, page, this.state);
    }
    emitEvent("notion:sync:complete", { database: dbName, count: pages.length });
  }
}
```

### 10.3 Webhook Endpoint

```typescript
app.post("/api/notion/webhook", async (req, res) => {
  const { database_id, page_id, event_type } = req.body;

  if (!database_id || !page_id) {
    return res.status(400).json({ error: "Missing database_id or page_id" });
  }

  // Verify the database is in our config
  const dbConfig = findDatabaseConfig(database_id);
  if (!dbConfig) {
    return res.status(404).json({ error: "Database not configured" });
  }

  // Trigger targeted pull
  if (event_type === "page.updated" || event_type === "page.created") {
    const page = await client.pages.retrieve({ page_id });
    await processSinglePage(client, dbConfig, page, state);
  }

  res.json({ ok: true });
});
```

---

## 11. Error Handling and Conflict Resolution

### 11.1 Error Categories

| Error | Code | Recovery |
|-------|------|----------|
| Rate limited (429) | `RATE_LIMITED` | Exponential backoff, retry after `Retry-After` header |
| Not found (404) | `PAGE_NOT_FOUND` | Mark as deleted in sync state, skip |
| Unauthorized (401) | `UNAUTHORIZED` | Prompt user to re-authenticate |
| Validation error (400) | `VALIDATION_ERROR` | Log malformed data, skip page, continue |
| Network error | `NETWORK_ERROR` | Retry up to 3 times with backoff |
| Spec validation failed | `SPEC_INVALID` | Write to `.memoire/notion-sync.errors.json`, skip |

### 11.2 Retry with Backoff

```typescript
async function rateLimitedRequest<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5
): Promise<T> {
  let delay = 350; // Start just above 333ms (3 req/s)

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.status === 429 && attempt < maxRetries) {
        const retryAfter = parseInt(error.headers?.["retry-after"] || "1", 10);
        const waitMs = Math.max(retryAfter * 1000, delay);
        await sleep(waitMs);
        delay *= 2;
        continue;
      }
      throw error;
    }
  }

  throw new Error("Max retries exceeded");
}
```

### 11.3 Conflict Resolution

Conflicts arise when both Notion and Memoire have changes to the same entity
since the last sync.

**Detection**: Compare content hashes. If `hash(notionContent) !== syncState.hash`
AND `hash(specContent) !== syncState.hash`, a conflict exists.

**Resolution strategies** (configured per database):

| Strategy | Behavior |
|----------|----------|
| `notion-wins` | Notion content overwrites the local spec |
| `memoire-wins` | Local spec is preserved, Notion is updated on next push |
| `manual` | Conflict is logged, both versions kept, user resolves |
| `newest-wins` | Compare `last_edited_time`, newest version wins |

```json
{
  "databases": {
    "research": {
      "conflictStrategy": "notion-wins"
    },
    "components": {
      "conflictStrategy": "memoire-wins"
    }
  }
}
```

**Manual conflict format** (`.memoire/notion-sync.conflicts.json`):

```json
[
  {
    "specId": "MetricCard",
    "notionPageId": "abc123...",
    "notionVersion": { "hash": "...", "lastEdited": "..." },
    "memoireVersion": { "hash": "...", "lastEdited": "..." },
    "detectedAt": "2026-03-28T12:00:00.000Z",
    "resolved": false
  }
]
```

Resolve with: `memi notion resolve <specId> --keep notion|memoire`

---

## 12. Rate Limiting

### 12.1 Notion API Limits

- **3 requests per second** per integration.
- Burst tolerance is minimal. Exceeding triggers 429 responses.
- Rate limits are per integration token, not per user.

### 12.2 Request Queue

All Notion API calls go through a central queue that enforces the 3 req/s limit:

```typescript
class RequestQueue {
  private queue: Array<{ fn: () => Promise<any>; resolve: Function; reject: Function }> = [];
  private inflight = 0;
  private readonly maxPerSecond = 3;
  private readonly interval = Math.ceil(1000 / this.maxPerSecond); // ~334ms
  private timer: NodeJS.Timeout | null = null;

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.drain();
    });
  }

  private drain(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      if (this.queue.length === 0) {
        clearInterval(this.timer!);
        this.timer = null;
        return;
      }
      const item = this.queue.shift()!;
      item.fn().then(item.resolve).catch(item.reject);
    }, this.interval);
  }
}
```

### 12.3 Batch Operations

When pulling or pushing many pages, batch operations to stay within limits:

- Group block retrievals per page (1 page = 1-3 requests depending on depth).
- Pre-compute which pages need updates before making write calls.
- Use `page_size: 100` on all list endpoints to minimize pagination requests.
- Cache database schema queries (schema changes rarely).

---

## 13. Caching Strategy

### 13.1 Cache Layers

| Layer | Storage | TTL | Purpose |
|-------|---------|-----|---------|
| Database schema | Memory + `.memoire/cache/notion-schemas.json` | 24 hours | Avoid re-fetching property definitions |
| Page properties | `.memoire/cache/notion-pages/` | Until next sync | Fast lookup without API call |
| Block content | `.memoire/cache/notion-blocks/` | Until next sync | Avoid re-fetching unchanged page bodies |
| Relation titles | Memory | Session | Resolve relation IDs to names without repeated lookups |
| Attachment hashes | `.memoire/notion-sync.state.json` | Permanent | Skip re-downloading unchanged files |

### 13.2 Cache Invalidation

- **On pull**: Fetched pages replace their cache entries. Untouched pages keep
  stale cache.
- **On push**: Clear cache for pushed pages (Notion may normalize content).
- **Manual**: `memi notion cache clear` wipes all cached data and forces full
  sync.

### 13.3 Content Hashing

Use SHA-256 of the JSON-serialized page properties and block content for
change detection:

```typescript
function hashPageContent(
  properties: Record<string, any>,
  blocks: NotionBlock[]
): string {
  const content = JSON.stringify({ properties, blocks }, null, 0);
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}
```

---

## 14. CLI Integration

### 14.1 Commands

```
memi notion connect         — Authenticate and test connection
memi notion pull             — Pull from all configured databases
memi notion pull --database research --since 2026-03-21
memi notion pull --full      — Full sync, ignore last sync timestamp
memi notion pull --dry-run   — Show what would change without writing
memi notion push             — Push all changed specs to Notion
memi notion push --spec MetricCard
memi notion push --dry-run
memi notion status           — Show sync state, pending conflicts, last timestamps
memi notion resolve <id>     — Resolve a sync conflict
memi notion watch            — Start background polling watcher
memi notion cache clear      — Clear all cached Notion data
memi notion config           — Open sync configuration in editor
```

### 14.2 Status Output

```
Notion Sync Status
==================

Connection:   Connected (workspace: "Acme Design")
Integration:  Memoire Sync (ntn_...xxxx)
Last pull:    2026-03-28T11:30:00Z (28 minutes ago)
Last push:    2026-03-28T10:15:00Z (1h 43m ago)

Databases:
  research      — 47 pages synced, 0 conflicts
  components    — 23 pages synced, 1 conflict (MetricCard)
  user-stories  — 12 pages synced, 0 conflicts

Pending:
  - [CONFLICT] MetricCard — modified in both Notion and Memoire
  - [NEW] 3 research pages added in Notion since last pull
```

### 14.3 Output Formats

All commands support `--json` for machine-readable output:

```bash
memi notion status --json | jq '.databases.research.syncedCount'
```

---

## 15. Security

### 15.1 Token Storage

- Tokens are stored in `.memoire/secrets.json`, which must be in `.gitignore`.
- The file is created with `0600` permissions (owner read/write only).
- Tokens are never logged, printed, or included in error messages.
- The `memi notion connect` command validates the token by calling
  `client.users.me()` before storing.

### 15.2 Scoped Access

- Only databases explicitly shared with the integration are accessible.
- The integration cannot access private pages unless shared.
- Configure read-only mode by omitting Update and Insert capabilities:

```json
{
  "notion": {
    "readOnly": true
  }
}
```

In read-only mode, `memi notion push` refuses to execute.

### 15.3 Data Handling

- Downloaded attachments are stored locally only. They are not transmitted to
  third-party services.
- Cached data inherits the security posture of the `.memoire/` directory.
- The `memi notion cache clear` command securely deletes cached files.

---

## 16. Anti-Patterns

### Things to avoid

1. **Polling too aggressively** — Do not poll more frequently than every 30
   seconds. The default of 60 seconds is well within limits. Aggressive polling
   burns rate limit budget and provides negligible freshness gain.

2. **Fetching full page content on every sync** — Always check the
   `last_edited_time` first. Only fetch block content for pages that have
   actually changed. A database with 500 pages and 3 changed entries should
   cost ~10 API requests, not 1500.

3. **Ignoring pagination** — Never assume a database query returns all results.
   Always follow `next_cursor`. Databases grow over time and silent data loss
   from missed pages is difficult to debug.

4. **Storing Notion file URLs permanently** — Notion's signed S3 URLs expire
   within ~1 hour. Always download files immediately and store locally. Do not
   save the URL as a permanent reference.

5. **Flattening rich text** — Do not reduce rich text to `plain_text` and
   discard annotations. Formatting carries meaning (bold for emphasis, code
   for technical terms). Preserve it in the markdown conversion.

6. **Bidirectional sync without conflict detection** — Never blindly overwrite
   in either direction. Always compare content hashes to detect divergence.
   Silent data loss erodes trust in the sync.

7. **Hardcoding property names** — Use the configurable property map. Notion
   databases across teams use different naming conventions. A column called
   "Status" in one workspace might be "State" or "Phase" in another.

8. **Creating duplicate pages on push** — Always check for existing pages with
   matching `memoire_spec_id` before creating. Use the sync state mapping as
   the primary lookup and fall back to a database query with a filter on the
   custom property.

9. **Ignoring Notion's 2000-character limit per rich text segment** — Long
   paragraphs must be split into multiple segments. Notion silently truncates
   text beyond this limit.

10. **Running sync without validation** — Every imported spec must pass through
    the Zod schema validator before being written. Invalid specs that bypass
    validation corrupt the registry and break downstream codegen.

---

## Appendix: Configuration Reference

### `.memoire/notion-sync.config.json`

```json
{
  "databases": {
    "<name>": {
      "notionDatabaseId": "string (UUID)",
      "specType": "component | page | dataviz | research | design | ia",
      "propertyMap": { "<NotionProperty>": "<MemoireField>" },
      "conflictStrategy": "notion-wins | memoire-wins | manual | newest-wins",
      "defaultSort": [{ "property": "string", "direction": "ascending | descending" }],
      "pullFilter": { "property": "string", "status": { "equals": "string" } },
      "autoSync": true
    }
  },
  "polling": {
    "enabled": false,
    "intervalSeconds": 60
  },
  "attachments": {
    "download": true,
    "maxSizeMb": 50
  },
  "cache": {
    "schemaTtlHours": 24,
    "enabled": true
  }
}
```

### `.memoire/notion-sync.state.json`

```json
{
  "lastPull": { "<databaseName>": "ISO 8601 timestamp" },
  "lastPush": { "<databaseName>": "ISO 8601 timestamp" },
  "syncedPages": {
    "<notionPageId>": {
      "specId": "string",
      "specType": "string",
      "lastSynced": "ISO 8601 timestamp",
      "hash": "string (16-char hex)"
    }
  },
  "conflicts": []
}
```
