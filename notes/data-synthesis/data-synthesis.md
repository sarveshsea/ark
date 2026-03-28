---
name: Data Synthesis
description: Qualitative and quantitative data synthesis -- affinity mapping, thematic analysis, statistical frameworks, insight triangulation, and research-to-spec pipelines
category: research
activateOn: research-to-dashboard
freedomLevel: high
version: 1.0.0
tags: [data-synthesis, qualitative, quantitative, thematic-analysis, affinity-mapping, insights]
---

# Data Synthesis -- Research Intelligence

> Skill pack for transforming raw research data into structured insights. Covers affinity mapping, thematic analysis, quantitative aggregation, triangulation, insight scoring, gap analysis, and integration with the Memoire research pipeline.

## Core Loop

```
COLLECT RAW DATA --> ORGANIZE --> CODE --> THEME --> TRIANGULATE --> SCORE --> OUTPUT INSIGHTS
```

Every synthesis pass must produce **actionable insights**, not summaries. An insight is a non-obvious finding that changes a design decision.

## Affinity Mapping Methodology

### What It Is

A bottom-up clustering technique. Individual observations (sticky notes, quotes, data points) are grouped by natural similarity until themes emerge.

### Process

| Step | Action | Output |
|------|--------|--------|
| 1. Harvest | Extract individual observations from raw data. One fact per unit. | 50-300 discrete data points |
| 2. Spread | Lay all data points out without grouping. Randomize order. | Ungrouped pool |
| 3. Cluster | Silently group related points. Move items that feel similar together. | 8-20 raw clusters |
| 4. Label | Name each cluster with a descriptive header that captures the shared meaning. | Named clusters |
| 5. Supergroup | Group clusters into 3-6 high-level themes. | Theme hierarchy |
| 6. Prioritize | Rank themes by frequency, severity, and opportunity. | Prioritized theme map |

### Rules

- One observation per data point -- never combine two findings into one note
- Group by meaning, not by source (do not cluster "all interview 3 data" together)
- If a cluster has more than 15 items, split it
- If a cluster has fewer than 3 items, consider merging or flagging as an outlier
- Relabel clusters after regrouping -- initial labels often drift from final content

### In Memoire

```bash
memi research from-stickies       # Pull sticky notes from Figma canvas
memi research synthesize           # Run affinity mapping + thematic analysis
memi research report               # Generate structured insight report
```

## Thematic Analysis

### Three Coding Phases

#### Phase 1: Open Coding

Read through all data and assign descriptive codes to each meaningful segment.

| Raw Data | Open Code |
|----------|-----------|
| "I always forget where I saved the file" | file-location-confusion |
| "The search never finds what I need" | search-ineffective |
| "I end up asking a colleague where things are" | workaround-social |

**Rules:**
- Code everything relevant, skip nothing on first pass
- Use gerunds or descriptive phrases (not single words)
- One segment can have multiple codes
- Target 30-80 unique codes from a typical study

#### Phase 2: Axial Coding

Group open codes into categories. Identify relationships between categories.

| Category | Open Codes |
|----------|-----------|
| Navigation Failure | file-location-confusion, search-ineffective, breadcrumb-ignored |
| Social Workarounds | workaround-social, slack-channel-for-files, ask-manager |
| Mental Model Mismatch | expected-folder-structure, alphabetical-assumption, recency-bias |

**Relationships to identify:**
- Causal: A leads to B ("navigation failure causes social workarounds")
- Contextual: A happens during B ("mental model mismatch occurs during onboarding")
- Strategic: A is a response to B ("social workarounds compensate for navigation failure")

#### Phase 3: Selective Coding

Identify the core theme that connects all categories. This becomes the central narrative.

```
Core Theme: "Users build parallel information architectures through social channels
             because the system's structure does not match their mental models."
```

### Code Quality Checklist

- [ ] Every data segment is coded (no orphan data)
- [ ] Codes are applied consistently across all sources
- [ ] Categories have clear boundaries (no code belongs to 3+ categories)
- [ ] Core theme is supported by data from multiple participants/sources

## Quantitative Aggregation

### Standard Metrics

| Metric | Formula | Use Case |
|--------|---------|----------|
| Mean | Sum / Count | Average satisfaction, task time |
| Median | Middle value (sorted) | Task time (resistant to outliers) |
| Mode | Most frequent value | Preferred option selection |
| Std Dev | sqrt(variance) | Spread of responses |
| NPS | %Promoters - %Detractors | Overall loyalty/satisfaction |
| SUS Score | ((Sum of odd - 5) + (25 - Sum of even)) * 2.5 | System usability |
| Task Success Rate | Successes / Total Attempts * 100 | Effectiveness |
| Time on Task | Median completion time | Efficiency |
| Error Rate | Errors / Opportunities * 100 | Error-proneness |

### NPS Calculation

```
Responses on 0-10 scale:
  Detractors: 0-6
  Passives:   7-8
  Promoters:  9-10

NPS = (Promoter Count / Total) * 100 - (Detractor Count / Total) * 100
Range: -100 to +100
```

| NPS Range | Interpretation |
|-----------|---------------|
| -100 to 0 | Critical -- systemic issues |
| 0 to 30 | Below average -- improvement needed |
| 30 to 50 | Good -- competitive |
| 50 to 70 | Excellent -- strong loyalty |
| 70 to 100 | World-class |

### SUS Score Interpretation

| SUS Score | Grade | Percentile |
|-----------|-------|------------|
| < 51 | F | Bottom 15% |
| 51-68 | D | 15-50% |
| 68-74 | C | 50-70% |
| 74-80 | B | 70-85% |
| 80-90 | A | 85-97% |
| > 90 | A+ | Top 3% |

### Statistical Significance

- For A/B comparisons: use chi-squared test (categorical) or t-test (continuous)
- Minimum sample size for usability: 5 per segment (qualitative), 30+ per variant (quantitative)
- Report confidence intervals, not just point estimates
- Flag any metric based on fewer than 5 data points as unreliable

## Triangulation Across Sources

### Triangulation Matrix

Cross-reference findings across at least 3 data sources to validate strength.

| Finding | Interviews | Surveys | Analytics | Usability Tests | Strength |
|---------|-----------|---------|-----------|----------------|----------|
| Users abandon search after 2 attempts | Mentioned by 4/6 | 62% agree | Avg 1.8 queries before exit | 3/5 gave up | STRONG |
| Mobile nav is confusing | 2/6 mentioned | 28% agree | Mobile bounce 2x desktop | Not tested | MODERATE |
| Dark mode is desired | 1/6 mentioned | 71% want it | N/A | N/A | WEAK (conflicting) |

### Strength Classification

| Level | Criteria |
|-------|----------|
| STRONG | Confirmed by 3+ independent sources with consistent direction |
| MODERATE | Confirmed by 2 sources, or 3 sources with some inconsistency |
| WEAK | Single source, or multiple sources with conflicting signals |
| CONTRADICTED | Sources actively disagree -- requires deeper investigation |

## Insight Quality Scoring

Rate every insight on four dimensions before including it in a deliverable.

| Dimension | Score 1 | Score 3 | Score 5 |
|-----------|---------|---------|---------|
| Evidence | Single anecdote | Multiple data points, one source | Multiple data points, multiple sources |
| Actionability | Vague observation | Suggests a direction | Points to a specific design change |
| Novelty | Already known by team | Partially known | Genuinely new understanding |
| Impact | Affects edge cases | Affects a segment | Affects most users |

**Threshold:** Only insights scoring 12+ (out of 20) go into the final report. Insights scoring 8-11 go into an appendix. Below 8, discard or flag for follow-up research.

### Insight Statement Format

```
[WHO] experiences [WHAT PROBLEM/BEHAVIOR]
because [WHY/ROOT CAUSE],
which means [IMPLICATION FOR DESIGN].
```

Example:
```
New users abandon the onboarding wizard at step 3
because the required fields feel invasive for a first interaction,
which means we should defer profile completion to post-activation.
```

## Gap Analysis Frameworks

### Coverage Gap Matrix

Map research questions against data sources to identify blind spots.

| Research Question | Source A | Source B | Source C | Gap? |
|-------------------|----------|----------|----------|------|
| Why do users churn at day 7? | Partial | No data | Partial | YES |
| What drives upgrade decisions? | Full | Full | Partial | No |
| How do teams collaborate? | No data | No data | Full | YES |

### Types of Gaps

| Gap Type | Description | Resolution |
|----------|-------------|------------|
| Data gap | No data collected on this question | Plan follow-up study |
| Segment gap | Data exists but not for a key user segment | Recruit missing segment |
| Depth gap | Quantitative data but no qualitative understanding | Conduct interviews |
| Recency gap | Data is older than 6 months | Refresh study |
| Context gap | Lab data but no field observation | Run diary study or contextual inquiry |

## Integration with Memoire Research Pipeline

### Pipeline Stages

```
RAW DATA (Excel, CSV, stickies)
  |
  v
memi research from-file <path>          # Ingest raw data
  |
  v
memi research from-stickies             # Pull Figma sticky notes
  |
  v
memi research synthesize                # Affinity map + thematic analysis
  |                                      # Outputs coded themes + scored insights
  v
memi research report                    # Structured insight report
  |                                      # Markdown + Figma sticky output
  v
memi spec component <name>              # Insights feed component specs
memi spec page <name>                   # Insights feed page specs
memi compose "dashboard from research"  # Agent builds dashboard from insights
```

### Data Formats

| Input Format | Command | Notes |
|-------------|---------|-------|
| Excel (.xlsx) | `from-file` | One sheet per study; row 1 = headers |
| CSV (.csv) | `from-file` | UTF-8 encoding required |
| Figma stickies | `from-stickies` | One observation per sticky |
| JSON | `from-file` | Array of `{ text, source, participant?, timestamp? }` |

### Output Artifacts

| Artifact | Format | Destination |
|----------|--------|-------------|
| Coded themes | JSON | `.memoire/research/themes.json` |
| Insight cards | JSON + Markdown | `.memoire/research/insights/` |
| Affinity map | Figma stickies | Canvas (grouped by theme) |
| Quantitative summary | JSON | `.memoire/research/metrics.json` |
| Final report | Markdown | `.memoire/research/report.md` |

### Connecting Insights to Specs

When generating component or page specs, reference insight IDs:

```json
{
  "name": "OnboardingWizard",
  "level": "organism",
  "researchInsights": ["INS-007", "INS-012"],
  "designRationale": "Deferred profile completion based on day-1 drop-off finding (INS-007)"
}
```

This creates traceability from research through spec to generated code.
