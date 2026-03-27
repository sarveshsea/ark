/**
 * Research Dashboard Template — Generates the research HTML page.
 *
 * Extracted from src/commands/preview.ts.
 */

import type { ResearchStore } from "../../research/engine.js";
import { esc } from "./types.js";

export function generateResearchDashboard(research: ResearchStore, generatedAt: string): string {
  const { insights, themes, personas, sources } = research;
  const highConf = insights.filter(i => i.confidence === "high");
  const medConf = insights.filter(i => i.confidence === "medium");
  const lowConf = insights.filter(i => i.confidence === "low");

  // Tag frequency for the tag cloud
  const tagFreq = new Map<string, number>();
  for (const i of insights) {
    for (const t of i.tags) {
      tagFreq.set(t, (tagFreq.get(t) || 0) + 1);
    }
  }
  const sortedTags = [...tagFreq.entries()].sort((a, b) => b[1] - a[1]);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath d='M25.5 15.5A9.5 9.5 0 0 1 12 25 9.5 9.5 0 0 1 9.5 6.5 12 12 0 1 0 25.5 15.5z' fill='%23e2e8f0'/%3E%3C/svg%3E">
<title>Mémoire Research</title>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #161618;
  --bg-card: #1c1c1f;
  --bg-hover: #242428;
  --bg-surface: #1e1e21;
  --fg: #e0e0e0;
  --fg-muted: #777777;
  --fg-dim: #4a4a4e;
  --border: #2a2a2e;
  --accent: #d4d4d4;
  --accent-bright: #ffffff;
  --accent-dim: #444444;
  --high: #ffffff;
  --medium: #888888;
  --low: #444444;
  --mono: 'SF Mono', 'Fira Code', 'JetBrains Mono', 'Cascadia Code', monospace;
  --sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  --radius: 3px;
}

body {
  font-family: var(--mono);
  font-size: 12px;
  background: var(--bg);
  color: var(--fg);
  line-height: 1.6;
  min-height: 100vh;
}

/* ── Header ──────────────────────────── */
.hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-card);
  position: sticky;
  top: 0;
  z-index: 10;
}

.hdr-left { display: flex; align-items: center; gap: 16px; }

.hdr-title {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.hdr-title span { color: var(--accent-bright); }

.hdr-back {
  font-size: 10px;
  color: var(--fg-muted);
  text-decoration: none;
  border: 1px solid var(--border);
  padding: 3px 10px;
  border-radius: var(--radius);
  letter-spacing: 1px;
  text-transform: uppercase;
  transition: all 0.15s;
}

.hdr-back:hover { border-color: var(--accent); color: var(--fg); }

.hdr-meta {
  font-size: 10px;
  color: var(--fg-muted);
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* ── Stats Bar ───────────────────────── */
.stats-bar {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border);
}

.stat {
  flex: 1;
  padding: 16px 24px;
  border-right: 1px solid var(--border);
  text-align: center;
}

.stat:last-child { border-right: none; }

.stat-val {
  font-size: 28px;
  font-weight: 700;
  color: var(--accent-bright);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.stat-label {
  font-size: 9px;
  color: var(--fg-muted);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-top: 6px;
}

/* ── Layout ──────────────────────────── */
.content {
  display: grid;
  grid-template-columns: 280px 1fr;
  min-height: calc(100vh - 120px);
}

/* ── Sidebar ─────────────────────────── */
.sidebar {
  border-right: 1px solid var(--border);
  padding: 20px;
  overflow-y: auto;
  max-height: calc(100vh - 120px);
  position: sticky;
  top: 56px;
}

.sidebar-section {
  margin-bottom: 24px;
}

.sidebar-heading {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--fg-muted);
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border);
}

/* ── Source List ──────────────────────── */
.source-item {
  padding: 6px 0;
  font-size: 11px;
  border-bottom: 1px solid rgba(255,255,255,0.02);
  display: flex;
  align-items: center;
  gap: 8px;
}

.source-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-dim);
  flex-shrink: 0;
}

.source-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.source-type {
  font-size: 9px;
  color: var(--fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ── Tag Cloud ───────────────────────── */
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  font-size: 10px;
  padding: 2px 8px;
  border: 1px solid var(--border);
  border-radius: 2px;
  color: var(--fg-muted);
  cursor: pointer;
  transition: all 0.15s;
  letter-spacing: 0.5px;
}

.tag:hover { border-color: var(--accent); color: var(--fg); }
.tag.active { background: var(--accent-dim); color: var(--accent-bright); border-color: var(--accent); }

.tag .tag-count {
  font-size: 8px;
  color: var(--fg-dim);
  margin-left: 3px;
}

/* ── Confidence Bar ──────────────────── */
.conf-bar {
  display: flex;
  height: 4px;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 8px;
  gap: 2px;
}

.conf-bar .seg {
  height: 100%;
  border-radius: 1px;
}

.conf-bar .seg.high { background: var(--high); }
.conf-bar .seg.medium { background: var(--medium); }
.conf-bar .seg.low { background: var(--low); }

.conf-legend {
  display: flex;
  gap: 12px;
  margin-top: 6px;
  font-size: 9px;
  color: var(--fg-muted);
}

.conf-legend span::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 1px;
  margin-right: 4px;
  vertical-align: middle;
}

.conf-legend .ch::before { background: var(--high); }
.conf-legend .cm::before { background: var(--medium); }
.conf-legend .cl::before { background: var(--low); }

/* ── Main Panel ──────────────────────── */
.main {
  padding: 20px 24px;
  overflow-y: auto;
}

/* ── Tabs ────────────────────────────── */
.tabs {
  display: flex;
  gap: 2px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border);
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  background: none;
  color: var(--fg-muted);
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
}

.tab-btn:hover { color: var(--fg); }
.tab-btn.active { color: var(--accent-bright); border-bottom-color: var(--accent); }

.tab-panel { display: none; }
.tab-panel.active { display: block; }

/* ── Themes Grid ─────────────────────── */
.themes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.theme-card {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-card);
  padding: 16px;
  transition: border-color 0.15s;
}

.theme-card:hover { border-color: var(--accent-dim); }

.theme-name {
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 4px;
  letter-spacing: 0.5px;
}

.theme-desc {
  font-size: 11px;
  color: var(--fg-muted);
  margin-bottom: 10px;
  font-family: var(--sans);
  line-height: 1.5;
}

.theme-freq {
  font-size: 22px;
  font-weight: 700;
  color: var(--accent-bright);
  line-height: 1;
}

.theme-freq-label {
  font-size: 9px;
  color: var(--fg-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* ── Insight Cards ───────────────────── */
.insight-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.insight {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-card);
  padding: 14px 16px;
  transition: border-color 0.15s;
  cursor: default;
}

.insight:hover { border-color: var(--accent-dim); }

.insight-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 6px;
}

.insight-conf {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  margin-top: 4px;
  flex-shrink: 0;
}

.insight-conf.high { background: var(--high); }
.insight-conf.medium { background: var(--medium); }
.insight-conf.low { background: var(--low); }

.insight-finding {
  font-size: 12px;
  font-weight: 600;
  flex: 1;
  line-height: 1.5;
}

.insight-meta {
  display: flex;
  gap: 12px;
  font-size: 10px;
  color: var(--fg-muted);
  margin-top: 6px;
  padding-left: 18px;
}

.insight-evidence {
  margin-top: 8px;
  padding-left: 18px;
}

.insight-evidence details {
  font-size: 10px;
  color: var(--fg-muted);
}

.insight-evidence summary {
  cursor: pointer;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--fg-dim);
  padding: 2px 0;
}

.insight-evidence summary:hover { color: var(--fg-muted); }

.insight-evidence blockquote {
  border-left: 2px solid var(--border);
  padding: 4px 0 4px 12px;
  margin: 4px 0;
  font-family: var(--sans);
  font-size: 11px;
  color: var(--fg-muted);
  line-height: 1.5;
}

.insight-tags {
  display: flex;
  gap: 4px;
  margin-top: 6px;
  padding-left: 18px;
}

.insight-tag {
  font-size: 9px;
  padding: 1px 6px;
  border: 1px solid var(--border);
  border-radius: 2px;
  color: var(--fg-dim);
  letter-spacing: 0.5px;
}

/* ── Persona Cards ───────────────────── */
.persona-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
}

.persona-card {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-card);
  overflow: hidden;
}

.persona-head {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.persona-name { font-size: 13px; font-weight: 700; }

.persona-role {
  font-size: 10px;
  color: var(--fg-muted);
  font-family: var(--sans);
}

.persona-body { padding: 14px 16px; }

.persona-section {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--fg-muted);
  margin-top: 10px;
  margin-bottom: 4px;
}

.persona-section:first-child { margin-top: 0; }

.persona-list {
  list-style: none;
  font-size: 11px;
  font-family: var(--sans);
  color: var(--fg);
  line-height: 1.8;
}

.persona-list li::before {
  content: '—';
  color: var(--fg-dim);
  margin-right: 6px;
}

/* ── Empty ───────────────────────────── */
.empty-note {
  text-align: center;
  padding: 40px;
  color: var(--fg-muted);
  font-size: 11px;
}

/* ── Scrollbar ───────────────────────── */
::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #222; border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: #444; }

/* ── Responsive ──────────────────────── */
@media (max-width: 768px) {
  .content { grid-template-columns: 1fr; }
  .sidebar { position: static; max-height: none; border-right: none; border-bottom: 1px solid var(--border); }
  .stats-bar { flex-wrap: wrap; }
  .stat { min-width: 50%; }
}
</style>
</head>
<body>

<div class="hdr">
  <div class="hdr-left">
    <a href="index.html" class="hdr-back">&larr; Gallery</a>
    <div class="hdr-title"><span>MÉMOIRE</span> RESEARCH</div>
  </div>
  <div class="hdr-meta">UPDATED ${esc(new Date(generatedAt).toLocaleString())}</div>
</div>

<div class="stats-bar">
  <div class="stat">
    <div class="stat-val">${insights.length}</div>
    <div class="stat-label">Insights</div>
  </div>
  <div class="stat">
    <div class="stat-val">${themes.length}</div>
    <div class="stat-label">Themes</div>
  </div>
  <div class="stat">
    <div class="stat-val">${highConf.length}</div>
    <div class="stat-label">High Confidence</div>
  </div>
  <div class="stat">
    <div class="stat-val">${sources.length}</div>
    <div class="stat-label">Sources</div>
  </div>
  <div class="stat">
    <div class="stat-val">${personas.length}</div>
    <div class="stat-label">Personas</div>
  </div>
</div>

<div class="content">

<!-- Sidebar -->
<div class="sidebar">

  <div class="sidebar-section">
    <div class="sidebar-heading">Confidence</div>
    <div class="conf-bar">
      ${highConf.length > 0 ? `<div class="seg high" style="flex:${highConf.length}"></div>` : ""}
      ${medConf.length > 0 ? `<div class="seg medium" style="flex:${medConf.length}"></div>` : ""}
      ${lowConf.length > 0 ? `<div class="seg low" style="flex:${lowConf.length}"></div>` : ""}
    </div>
    <div class="conf-legend">
      <span class="ch">${highConf.length} High</span>
      <span class="cm">${medConf.length} Med</span>
      <span class="cl">${lowConf.length} Low</span>
    </div>
  </div>

  <div class="sidebar-section">
    <div class="sidebar-heading">Tags</div>
    <div class="tag-cloud">
      ${sortedTags.map(([tag, count]) =>
        `<span class="tag" onclick="filterByTag('${esc(tag)}',this)">${esc(tag)}<span class="tag-count">${count}</span></span>`
      ).join("")}
    </div>
  </div>

  <div class="sidebar-section">
    <div class="sidebar-heading">Sources</div>
    ${sources.map(s => {
      const name = s.name.split("/").pop() || s.name;
      return `<div class="source-item">
        <div class="source-dot"></div>
        <span class="source-name" title="${esc(s.name)}">${esc(name)}</span>
        <span class="source-type">${esc(s.type)}</span>
      </div>`;
    }).join("")}
    ${sources.length === 0 ? `<div class="empty-note">No sources yet</div>` : ""}
  </div>

</div>

<!-- Main -->
<div class="main">

<div class="tabs">
  <button class="tab-btn active" onclick="switchTab('insights',this)">Insights (${insights.length})</button>
  <button class="tab-btn" onclick="switchTab('themes',this)">Themes (${themes.length})</button>
  ${personas.length > 0 ? `<button class="tab-btn" onclick="switchTab('personas',this)">Personas (${personas.length})</button>` : ""}
</div>

<!-- Insights Tab -->
<div class="tab-panel active" id="tab-insights">
  <div class="insight-list" id="insightList">
    ${insights.map(i => `<div class="insight" data-tags="${esc(i.tags.join(","))}" data-confidence="${i.confidence}">
      <div class="insight-header">
        <div class="insight-conf ${i.confidence}" title="${i.confidence} confidence"></div>
        <div class="insight-finding">${esc(i.finding)}</div>
      </div>
      <div class="insight-meta">
        <span>${esc(i.source.split("/").pop() || i.source)}</span>
        <span>${esc(i.confidence)}</span>
        <span>${esc(new Date(i.createdAt).toLocaleDateString())}</span>
      </div>
      ${i.evidence.length > 0 ? `<div class="insight-evidence">
        <details>
          <summary>${i.evidence.length} evidence point${i.evidence.length !== 1 ? "s" : ""}</summary>
          ${i.evidence.slice(0, 5).map(e => `<blockquote>${esc(e)}</blockquote>`).join("")}
          ${i.evidence.length > 5 ? `<div style="font-size:9px;color:var(--fg-dim);padding:4px 0">+${i.evidence.length - 5} more</div>` : ""}
        </details>
      </div>` : ""}
      ${i.tags.length > 0 ? `<div class="insight-tags">${i.tags.map(t => `<span class="insight-tag">${esc(t)}</span>`).join("")}</div>` : ""}
    </div>`).join("\n    ")}
    ${insights.length === 0 ? `<div class="empty-note">No insights yet. Run <code>memoire research from-file</code> or <code>memoire research from-stickies</code></div>` : ""}
  </div>
</div>

<!-- Themes Tab -->
<div class="tab-panel" id="tab-themes">
  <div class="themes-grid">
    ${themes.map(t => {
      const relatedInsights = insights.filter(i => t.insights.includes(i.id));
      return `<div class="theme-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
          <div>
            <div class="theme-name">${esc(t.name)}</div>
            <div class="theme-desc">${esc(t.description)}</div>
          </div>
          <div style="text-align:right">
            <div class="theme-freq">${t.frequency}</div>
            <div class="theme-freq-label">findings</div>
          </div>
        </div>
        ${relatedInsights.slice(0, 3).map(i => `<div style="font-size:10px;padding:4px 0;border-top:1px solid var(--border);color:var(--fg-muted);font-family:var(--sans)">
          <span style="color:var(--${i.confidence})">&bull;</span> ${esc(i.finding.substring(0, 80))}${i.finding.length > 80 ? "..." : ""}
        </div>`).join("")}
        ${relatedInsights.length > 3 ? `<div style="font-size:9px;color:var(--fg-dim);padding-top:4px">+${relatedInsights.length - 3} more insights</div>` : ""}
      </div>`;
    }).join("\n    ")}
    ${themes.length === 0 ? `<div class="empty-note" style="grid-column:1/-1">No themes yet. Run <code>memoire research synthesize</code></div>` : ""}
  </div>
</div>

<!-- Personas Tab -->
<div class="tab-panel" id="tab-personas">
  <div class="persona-grid">
    ${personas.map(p => `<div class="persona-card">
      <div class="persona-head">
        <div class="persona-name">${esc(p.name)}</div>
        <div class="persona-role">${esc(p.role)}</div>
      </div>
      <div class="persona-body">
        ${p.goals.length > 0 ? `<div class="persona-section">Goals</div>
        <ul class="persona-list">${p.goals.map(g => `<li>${esc(g)}</li>`).join("")}</ul>` : ""}
        ${p.painPoints.length > 0 ? `<div class="persona-section">Pain Points</div>
        <ul class="persona-list">${p.painPoints.map(pp => `<li>${esc(pp)}</li>`).join("")}</ul>` : ""}
        ${p.behaviors.length > 0 ? `<div class="persona-section">Behaviors</div>
        <ul class="persona-list">${p.behaviors.map(b => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
      </div>
    </div>`).join("\n    ")}
    ${personas.length === 0 ? `<div class="empty-note" style="grid-column:1/-1">No personas yet. Run <code>memoire research synthesize</code></div>` : ""}
  </div>
</div>

</div>
</div>

<script>
function switchTab(name, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');
}

let activeTag = null;
function filterByTag(tag, el) {
  if (activeTag === tag) {
    activeTag = null;
    el.classList.remove('active');
    document.querySelectorAll('.insight').forEach(i => i.style.display = '');
    return;
  }

  activeTag = tag;
  document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
  el.classList.add('active');

  document.querySelectorAll('.insight').forEach(i => {
    const tags = i.dataset.tags.split(',');
    i.style.display = tags.includes(tag) ? '' : 'none';
  });

  // Switch to insights tab
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelector('.tab-btn').classList.add('active');
  document.getElementById('tab-insights').classList.add('active');
}
</script>
</body>
</html>`;
}
