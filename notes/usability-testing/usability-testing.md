---
name: Usability Testing
description: >
  Comprehensive usability testing skill — test planning, task design,
  moderated and unmoderated protocols, metrics collection, analysis
  frameworks, insight synthesis, and integration with the Memoire
  research pipeline.
category: research
activateOn: research-to-dashboard
freedomLevel: high
version: 1.0.0
author: memoire
---

# Usability Testing Skill

This skill covers the full lifecycle of usability testing: planning,
recruiting, facilitating, measuring, analyzing, and synthesizing.
It produces structured research insights that feed directly into
Memoire specs, codegen improvements, and dashboard visualizations.

---

## 1. Test Planning Framework

### 1.1 Define Objectives

Every usability test begins with clear objectives. Objectives must be
specific, observable, and tied to product decisions.

**Objective Template:**

```
Determine whether [target users] can [complete specific task]
using [feature/product] within [acceptable threshold]
so that the team can decide [product decision].
```

**Examples:**

- Determine whether new users can complete account onboarding within
  3 minutes so that the team can decide whether to simplify the flow.
- Determine whether power users can locate the export function within
  2 clicks so that the team can decide on navigation restructuring.

### 1.2 Formulate Hypotheses

Hypotheses turn vague hunches into testable statements. Each hypothesis
has a metric, a threshold, and a consequence.

| Hypothesis ID | Statement | Metric | Pass Threshold | If Fails |
|---------------|-----------|--------|----------------|----------|
| H1 | Users will complete checkout without assistance | Task success rate | >= 85% | Redesign checkout flow |
| H2 | Users will find settings within 30 seconds | Time on task | <= 30s | Add settings shortcut |
| H3 | The new layout will not increase errors | Error rate | <= 10% | Revert layout change |
| H4 | Users will rate the experience positively | SUS score | >= 68 | Conduct follow-up interviews |

### 1.3 Select Metrics

Choose metrics before testing begins. Never retrofit metrics after
seeing results.

**Primary Metrics (always collect):**

- Task success rate (binary or graded)
- Time on task (seconds from start to completion)
- Error rate (count and type of errors per task)
- Post-task satisfaction (SEQ or single ease question)

**Secondary Metrics (collect when relevant):**

- System Usability Scale (SUS) — post-session
- Net Promoter Score (NPS) — post-session
- Task-level confidence rating
- Number of assists or prompts given (moderated)
- Navigation path analysis (clicks, pages visited)

### 1.4 Plan Resources

| Resource | Moderated | Unmoderated |
|----------|-----------|-------------|
| Facilitator | 1 required | 0 |
| Note-taker | 1 recommended | 0 |
| Participants | 5-8 per round | 10-20 per round |
| Sessions per day | 4-5 max | Unlimited |
| Duration per session | 45-60 min | 15-30 min |
| Analysis time | 2-3 days | 1-2 days |
| Tools | Video conferencing, screen share | UserTesting, Maze, Lookback |

### 1.5 Timeline Template

| Day | Activity |
|-----|----------|
| Day 1-2 | Write test plan, design tasks, build prototype |
| Day 3-4 | Recruit participants, pilot test with 1 internal user |
| Day 5-8 | Run sessions (4-5 per day moderated, or launch unmoderated) |
| Day 9-10 | Analyze data, build affinity diagrams |
| Day 11 | Synthesize insights, write report |
| Day 12 | Present findings, update specs |

---

## 2. Participant Recruitment

### 2.1 Screening Criteria

Define participants by behavior, not demographics alone.

**Screening Questionnaire Template:**

```
1. How often do you use [product category]?
   [ ] Daily  [ ] Weekly  [ ] Monthly  [ ] Rarely  [ ] Never

2. Which of the following tools have you used in the past 6 months?
   [ ] Tool A  [ ] Tool B  [ ] Tool C  [ ] None

3. What is your primary goal when using [product category]?
   [Open text]

4. How would you rate your technical proficiency?
   [ ] Beginner  [ ] Intermediate  [ ] Advanced  [ ] Expert

5. Are you comfortable sharing your screen during a 45-minute session?
   [ ] Yes  [ ] No
```

**Disqualification Criteria:**

- Works in UX, design, or product management (unless testing internal tools)
- Has participated in a usability study for this product in the past 6 months
- Cannot use the required device or browser
- Answers screening questions inconsistently (attention check failure)

### 2.2 Participant Profiles

| Profile | Description | Recruit Count | Priority |
|---------|-------------|---------------|----------|
| New user | No prior experience with the product | 3-4 | High |
| Casual user | Uses product 1-2 times per month | 2-3 | Medium |
| Power user | Daily user with advanced feature usage | 2-3 | Medium |
| Accessibility user | Uses assistive technology | 1-2 | High for a11y tests |

### 2.3 Recruitment Channels

- Existing user base (email outreach, in-app intercept)
- UserTesting.com or similar panel services
- Social media and community forums
- Internal employees (only for early-stage or internal tools)
- Recruitment agencies (for specialized audiences)

### 2.4 Incentive Guidelines

| Session Length | Remote | In-Person |
|---------------|--------|-----------|
| 15-20 min | $25-40 | $40-60 |
| 30-45 min | $50-75 | $75-100 |
| 60 min | $75-125 | $100-175 |
| Specialized audience | 1.5x-2x standard rate | 1.5x-2x standard rate |

---

## 3. Task Scenario Design

### 3.1 Principles

Tasks must be realistic, measurable, and free from leading language.

**Rules:**

1. Frame tasks as goals, not instructions.
   - BAD: "Click the Settings icon in the top right corner."
   - GOOD: "You want to change your notification preferences."

2. Provide context that motivates the action.
   - BAD: "Find the search function."
   - GOOD: "You are looking for a specific order you placed last week."

3. Avoid product-specific jargon unless testing discoverability of that term.
   - BAD: "Use the Quick Action Bar to create a widget."
   - GOOD: "You want to quickly add a new component to your project."

4. Include success criteria that can be observed without asking the user.
   - Success: User reaches the confirmation screen.
   - Partial success: User reaches the correct section but does not complete.
   - Failure: User navigates to an unrelated area or gives up.

5. Order tasks from easy to hard. Start with a warm-up task.

### 3.2 Task Template

```
Task ID: T[number]
Scenario: [Contextual setup — who is the user, what do they need]
Goal: [What the user should accomplish]
Starting point: [URL or screen where the user begins]
Success criteria:
  - Full success: [Observable outcome]
  - Partial success: [Observable outcome]
  - Failure: [Observable outcome]
Max time: [Seconds before prompting or moving on]
Measures: [Which metrics apply to this task]
```

### 3.3 Example Tasks

**Task 1 — Warm-up (Easy)**

```
Task ID: T1
Scenario: You just signed up for the app and want to see what
  features are available.
Goal: Explore the main navigation and identify three key features.
Starting point: Home screen after login
Success criteria:
  - Full: Names 3+ features correctly
  - Partial: Names 1-2 features
  - Failure: Cannot identify any features
Max time: 120 seconds
Measures: Time on task, verbal descriptions
```

**Task 2 — Core flow (Medium)**

```
Task ID: T2
Scenario: You have been using the app for a week. You want to
  create a new project and add a team member.
Goal: Create a project named "Q3 Launch" and invite
  colleague@example.com.
Starting point: Dashboard
Success criteria:
  - Full: Project created AND invite sent
  - Partial: Project created but invite not sent
  - Failure: Neither completed
Max time: 180 seconds
Measures: Task success, time on task, error count, path analysis
```

**Task 3 — Advanced (Hard)**

```
Task ID: T3
Scenario: Your manager asked for a report of all activity from
  last month. You need to export it.
Goal: Generate and download a PDF report for March activity.
Starting point: Dashboard
Success criteria:
  - Full: PDF downloaded
  - Partial: Found the report section but could not export
  - Failure: Could not locate reporting
Max time: 240 seconds
Measures: Task success, time on task, error count, assists given
```

### 3.4 Task Sequencing

| Position | Difficulty | Purpose |
|----------|------------|---------|
| 1 | Easy | Build confidence, establish think-aloud behavior |
| 2-3 | Medium | Test core product flows |
| 4-5 | Hard | Test advanced or edge-case scenarios |
| Final | Open-ended | "Is there anything else you would try?" |

---

## 4. Moderated Testing Protocol

### 4.1 Session Structure

| Phase | Duration | Activities |
|-------|----------|------------|
| Welcome | 5 min | Introduce yourself, explain the process, get consent |
| Warm-up | 5 min | Background questions, establish rapport |
| Tasks | 30-40 min | Task scenarios with think-aloud |
| Debrief | 5-10 min | Post-session questionnaire, open discussion |
| Wrap-up | 2 min | Thank participant, explain next steps, confirm incentive |

### 4.2 Facilitator Script

**Welcome:**

"Thank you for taking the time to help us today. We are testing the
[product], not you — there are no wrong answers or actions. If
something is confusing, that is exactly the kind of feedback we need.

I will ask you to complete a few tasks. As you work through them,
please think out loud — tell me what you are looking at, what you
expect to happen, and what you are thinking. This helps us understand
your experience.

You can stop at any time. Do you have any questions before we begin?"

**Think-Aloud Prompts (use when participant goes silent):**

- "What are you thinking right now?"
- "What are you looking for?"
- "What do you expect will happen if you click that?"
- "Tell me more about why you chose that option."
- "What would you normally do at this point?"

**Neutral Probing Questions (use after task completion):**

- "How did that go for you?"
- "Was there anything that surprised you?"
- "On a scale of 1-7, how easy or difficult was that?"
- "What would you change about that experience?"
- "How does that compare to what you expected?"

### 4.3 Facilitator Rules

1. Never lead the participant toward the correct answer.
2. Never express approval or disappointment at their actions.
3. Redirect "What should I do?" with "What would you do if I were
   not here?"
4. Wait at least 5 seconds of silence before prompting.
5. If the participant is clearly stuck and frustrated, offer a hint
   only after the max time expires. Record this as an "assisted"
   completion.
6. Keep your tone warm, neutral, and consistent across all sessions.
7. Take note of facial expressions, hesitations, and verbal cues
   that indicate confusion, frustration, or satisfaction.
8. Never skip the consent and recording permission step.

### 4.4 Handling Difficult Situations

| Situation | Response |
|-----------|----------|
| Participant wants to quit | "That is completely fine. Thank you for your time so far." |
| Participant blames themselves | "This is about the product, not you. This feedback is very helpful." |
| Participant asks for help | "What would you try if I were not here?" (Wait.) If stuck past max time, provide minimal hint. |
| Participant goes off-topic | "That is interesting. Let us come back to the current task for now." |
| Technical failure | Pause the timer. Fix the issue. Resume or skip the task. Document the incident. |
| Participant gives only positive feedback | "If you had to change one thing, what would it be?" |

---

## 5. Unmoderated Testing Setup

### 5.1 When to Use Unmoderated

- Large sample sizes needed (10+ participants)
- Geographic diversity required
- Budget constraints (no facilitator time)
- Simple, well-defined tasks
- Benchmark or comparative studies
- Follow-up validation of moderated findings

### 5.2 Platform Configuration

| Element | Specification |
|---------|--------------|
| Tool | Maze, UserTesting, Lookback, or similar |
| Prototype | Interactive prototype or live staging environment |
| Screen recording | Required — video plus audio if possible |
| Task instructions | Written, displayed one at a time |
| Completion criteria | Automatic detection (reached target screen) or self-reported |
| Post-task questions | Single ease question (SEQ) after each task |
| Post-session survey | SUS questionnaire, open-ended feedback, NPS |
| Max session duration | 20-30 minutes to avoid fatigue |

### 5.3 Written Instructions Template

```
Welcome to this usability study.

We are evaluating [product/feature]. Your honest feedback helps us
make it better. There are no right or wrong answers.

You will be asked to complete [N] tasks. For each task:
- Read the scenario carefully.
- Try to complete the task as you normally would.
- If you get stuck for more than [time], you may skip the task.
- After each task, answer the short question that appears.

This session will take approximately [duration] minutes.
Your screen will be recorded. No personal information is collected.

Click "Start" when you are ready.
```

### 5.4 Quality Checks for Unmoderated Data

- Discard sessions under 2 minutes (speeders)
- Discard sessions where the user never attempted any task
- Flag sessions where screen recording is blank or corrupted
- Cross-check self-reported success against click path data
- Remove duplicate submissions from the same IP or user ID

---

## 6. Metrics Reference

### 6.1 Task Success Rate

**Definition:** The percentage of participants who completed the task
without assistance.

**Calculation:**

```
Binary:    Success Rate = (Successes / Total Attempts) x 100
Graded:    Success Rate = ((Full * 1.0) + (Partial * 0.5)) / Total x 100
```

**Benchmarks:**

| Rating | Binary Rate | Graded Rate |
|--------|-------------|-------------|
| Excellent | >= 90% | >= 95% |
| Good | 78-89% | 85-94% |
| Needs work | 60-77% | 70-84% |
| Critical | < 60% | < 70% |

### 6.2 Time on Task

**Definition:** Elapsed time from task start to task completion or
abandonment.

**Reporting:**

- Report median, not mean (outliers skew time data)
- Report interquartile range for spread
- Set a maximum threshold per task; cap times at that value
- Compare against previous baselines or competitor benchmarks

**Benchmark Rule of Thumb:**

If median time on task exceeds 1.5x the expected time, the flow
needs investigation.

### 6.3 Error Rate

**Definition:** The number of unintended or incorrect actions per task.

**Error Types:**

| Type | Description | Severity |
|------|-------------|----------|
| Slip | Correct intent, wrong action (misclick) | Low |
| Mistake | Incorrect intent, wrong mental model | High |
| Recovery error | Error during error recovery (makes it worse) | Critical |
| Omission | Skipped a required step | Medium |

**Calculation:**

```
Error Rate = Total Errors / Total Opportunities x 100
Per-task:   Errors per Task = Sum of Errors / Number of Participants
```

### 6.4 System Usability Scale (SUS)

The SUS is a 10-item questionnaire administered after the session.
Each item uses a 5-point Likert scale from Strongly Disagree (1) to
Strongly Agree (5).

**Full SUS Questionnaire:**

```
1. I think that I would like to use this system frequently.
2. I found the system unnecessarily complex.
3. I thought the system was easy to use.
4. I think that I would need the support of a technical person
   to be able to use this system.
5. I found the various functions in this system were well integrated.
6. I thought there was too much inconsistency in this system.
7. I would imagine that most people would learn to use this system
   very quickly.
8. I found the system very cumbersome to use.
9. I felt very confident using the system.
10. I needed to learn a lot of things before I could get going
    with this system.
```

**Scoring Algorithm:**

```
For odd-numbered items (1, 3, 5, 7, 9):
  contribution = response - 1

For even-numbered items (2, 4, 6, 8, 10):
  contribution = 5 - response

SUS Score = (sum of all contributions) x 2.5
```

Score range: 0 to 100.

**Interpretation:**

| SUS Score | Grade | Adjective | Percentile |
|-----------|-------|-----------|------------|
| 84.1-100 | A+ | Best Imaginable | 96-100 |
| 80.8-84.0 | A | Excellent | 90-95 |
| 71.4-80.7 | B | Good | 70-89 |
| 68.0-71.3 | C | OK | 50-69 |
| 51.7-67.9 | D | Poor | 15-49 |
| 0-51.6 | F | Awful | 0-14 |

Industry average: 68. Anything below 68 requires action.

### 6.5 Net Promoter Score (NPS)

**Question:** "On a scale of 0-10, how likely are you to recommend
this product to a friend or colleague?"

**Calculation:**

```
Promoters:  9-10
Passives:   7-8
Detractors: 0-6

NPS = %Promoters - %Detractors
```

Range: -100 to +100.

| NPS Range | Interpretation |
|-----------|---------------|
| 50+ | Excellent |
| 30-49 | Good |
| 0-29 | Needs improvement |
| Below 0 | Critical concern |

### 6.6 Single Ease Question (SEQ)

**Question:** "Overall, how easy or difficult was this task?"

Scale: 1 (Very Difficult) to 7 (Very Easy).

Benchmark: Mean score of 5.5 or above indicates acceptable ease.
Below 4.0 indicates a significant problem.

---

## 7. Observation Templates

### 7.1 Session Note Template

```
Session ID: [S-001]
Participant: [P-001] (profile: new user / casual / power / a11y)
Date: [YYYY-MM-DD]
Facilitator: [Name]
Note-taker: [Name]

--- Task: [T1 - Task Name] ---
Start time: [HH:MM:SS]
End time: [HH:MM:SS]
Outcome: [Success / Partial / Failure / Assisted]
Errors: [Count and brief description]
SEQ rating: [1-7]

Observations:
- [Timestamp] [Observation — what the user did or said]
- [Timestamp] [Observation]
- [Timestamp] [Observation]

Quotes:
- "[Verbatim quote from participant]"
- "[Verbatim quote from participant]"

--- Task: [T2 - Task Name] ---
[Repeat structure]

--- Post-Session ---
SUS score: [Calculated]
NPS response: [0-10]
Key themes from debrief:
- [Theme 1]
- [Theme 2]
Overall impression: [1-2 sentence summary]
```

### 7.2 Quick Observation Codes

Use shorthand codes during live sessions for speed:

| Code | Meaning |
|------|---------|
| [+] | Positive reaction or success |
| [-] | Negative reaction or failure |
| [?] | Confusion or hesitation |
| [!] | Strong emotional reaction |
| [E] | Error committed |
| [R] | Recovery from error |
| [H] | Help requested or hint given |
| [Q] | Notable quote (mark for extraction) |
| [N] | Navigation — unexpected path taken |
| [T] | Time pressure — approaching max time |

---

## 8. Analysis Methods

### 8.1 Affinity Diagramming

**Purpose:** Group raw observations into themes without imposing
a pre-existing framework.

**Process:**

1. Write each observation, quote, and finding on a separate note.
   One finding per note. Keep it factual.
2. Spread all notes on a surface (physical or digital — Miro, FigJam).
3. Silently group notes that seem related. Do not name groups yet.
4. Once clusters emerge, label each group with a descriptive theme.
5. Look for super-groups: themes that cluster into higher-order
   categories.
6. Count the frequency of findings in each group. Larger groups
   indicate stronger patterns.
7. Prioritize by frequency multiplied by severity.

**Output Format for Memoire:**

```json
{
  "type": "affinity-cluster",
  "theme": "Navigation confusion in settings",
  "observations": 12,
  "participants_affected": 5,
  "severity": "high",
  "evidence": [
    "P-001: 'I have no idea where settings are.'",
    "P-003: Clicked profile icon expecting settings.",
    "P-005: Took 45 seconds to find settings (threshold: 30s)."
  ],
  "recommendation": "Add settings link to profile dropdown"
}
```

### 8.2 Severity Rating Scale

Rate each finding on a standardized severity scale.

| Rating | Label | Definition | Action |
|--------|-------|------------|--------|
| 0 | Not a problem | Evaluator disagrees this is usability issue | None |
| 1 | Cosmetic | Noticeable but does not affect task completion | Fix if time permits |
| 2 | Minor | Causes hesitation or minor confusion; workaround exists | Schedule fix |
| 3 | Major | Causes significant delay, errors, or task failure for some users | Fix before release |
| 4 | Catastrophic | Prevents task completion; no workaround | Fix immediately |

**Severity Assignment Rules:**

- Two independent raters assign severity; average the scores.
- If raters disagree by 2+ points, discuss and reconcile.
- Weight severity by frequency: a severity-2 issue affecting 80%
  of users may outrank a severity-3 issue affecting 10%.

### 8.3 Rainbow Spreadsheet Method

A visual matrix that shows findings across all participants at a
glance. Each participant gets a color; each row is a finding.

**Structure:**

| Finding | P1 (red) | P2 (orange) | P3 (yellow) | P4 (green) | P5 (blue) | Count |
|---------|----------|-------------|-------------|------------|-----------|-------|
| Could not find export button | X | | X | X | | 3/5 |
| Confused by icon meaning | X | X | | X | X | 4/5 |
| Skipped required field | | | X | | X | 2/5 |
| Praised onboarding flow | X | X | X | X | | 4/5 |

**Interpretation:**

- Findings affecting 3+ out of 5 participants are patterns (act on them).
- Findings affecting 1 participant may be individual preference (monitor).
- Positive findings are just as important — they confirm what works.

### 8.4 Thematic Analysis

A structured six-phase approach for deeper qualitative analysis.

**Phase 1 — Familiarization:**
Read through all session notes and transcripts. Note initial impressions.

**Phase 2 — Initial Coding:**
Assign descriptive codes to individual observations. Example codes:
- CONFUSION-NAV (navigation confusion)
- ERROR-FORM (form submission error)
- DELIGHT-ANIM (delight at animation)
- EXPECT-MISMATCH (expectation did not match reality)

**Phase 3 — Searching for Themes:**
Group codes into candidate themes. A theme captures something
meaningful about the data in relation to the research question.

**Phase 4 — Reviewing Themes:**
Check that each theme has enough supporting evidence. Merge thin
themes. Split themes that are too broad.

**Phase 5 — Defining and Naming:**
Write a 1-2 sentence definition for each theme. The name should
be descriptive enough that someone not in the session understands it.

**Phase 6 — Reporting:**
Select vivid examples (quotes, screen recordings, error counts)
to illustrate each theme in the final report.

---

## 9. Insight Synthesis for Memoire

### 9.1 Insight Format

Every usability finding must be converted into a structured Memoire
research insight for pipeline compatibility.

```json
{
  "id": "UT-[study-id]-[number]",
  "type": "usability-finding",
  "source": "usability-test",
  "studyId": "[study identifier]",
  "title": "[Concise finding title]",
  "description": "[Detailed description of what was observed]",
  "severity": 1 | 2 | 3 | 4,
  "frequency": "[N out of M participants]",
  "affectedTasks": ["T1", "T3"],
  "affectedComponents": ["NavigationBar", "SettingsPanel"],
  "evidence": {
    "quotes": ["Verbatim participant quotes"],
    "metrics": {
      "taskSuccessRate": 0.6,
      "medianTimeOnTask": 45,
      "errorRate": 0.3
    },
    "sessionIds": ["S-001", "S-003", "S-005"]
  },
  "recommendation": "[Specific, actionable recommendation]",
  "specImpact": {
    "specs": ["NavigationBar.json", "Dashboard.json"],
    "changes": ["Add settings shortcut to nav dropdown"]
  },
  "status": "open",
  "createdAt": "[ISO timestamp]"
}
```

### 9.2 Mapping Insights to Specs

When a usability finding identifies a component-level issue:

1. Load the affected spec from `specs/components/` or `specs/pages/`.
2. Check the spec's current definition against the finding.
3. Add the insight reference to the spec's `researchInsights` array.
4. Update the spec's `requirements` or `interactions` if the finding
   warrants a design change.
5. Regenerate code via `memi generate` to propagate the fix.

### 9.3 Feeding Dashboards

Usability metrics flow into Memoire dashboards through the research
pipeline:

```
Usability Test Sessions
    --> Raw observations (session notes)
    --> Structured insights (JSON)
    --> Research synthesis (aggregated findings)
    --> Dashboard spec (DataViz spec)
    --> Generated dashboard code
```

Key dashboard components for usability data:

| Component | Spec Type | Data |
|-----------|-----------|------|
| Task Success Chart | dataviz | Success rates per task across rounds |
| SUS Score Trend | dataviz | SUS scores over time |
| Severity Distribution | dataviz | Finding count by severity level |
| Participant Heatmap | dataviz | Which participants hit which issues |
| Time on Task Comparison | dataviz | Median time per task vs threshold |

---

## 10. Reporting Templates

### 10.1 Executive Summary (1 page)

```
USABILITY TEST REPORT — [Product/Feature Name]
Date: [Date Range]
Methodology: [Moderated/Unmoderated], [N] participants
Facilitator: [Name]

HEADLINE FINDING:
[One sentence that captures the most important result.]

KEY METRICS:
- Overall task success rate: [X%]
- Average SUS score: [X] ([Grade])
- NPS: [X]
- Critical issues found: [N]

TOP 3 FINDINGS:
1. [Finding] — Severity [N], [X/Y participants affected]
2. [Finding] — Severity [N], [X/Y participants affected]
3. [Finding] — Severity [N], [X/Y participants affected]

RECOMMENDED ACTIONS:
1. [Action] — Priority: [Immediate/High/Medium/Low]
2. [Action] — Priority: [Immediate/High/Medium/Low]
3. [Action] — Priority: [Immediate/High/Medium/Low]

NEXT STEPS:
- [What happens next: fix, retest, deeper investigation]
```

### 10.2 Detailed Findings Report Structure

```
1. Study Overview
   - Objectives and hypotheses
   - Methodology and tools
   - Participant demographics

2. Metrics Summary
   - Task success rates (table + chart)
   - Time on task (table + chart)
   - Error rates by task
   - SUS scores
   - NPS

3. Detailed Findings
   For each finding:
   - Title
   - Severity and frequency
   - Description (what happened)
   - Evidence (quotes, metrics, screenshots)
   - Affected component/spec
   - Recommendation

4. Positive Findings
   - What worked well (reinforce in future designs)

5. Participant Feedback Themes
   - Thematic analysis results
   - Affinity diagram summary

6. Recommendations (prioritized)
   - Immediate (severity 4)
   - Before next release (severity 3)
   - Backlog (severity 1-2)

7. Appendices
   - Full task descriptions
   - SUS raw scores
   - Session recordings index
   - Raw observation notes
```

---

## 11. Decision Table: Which Test Type for Which Situation

| Situation | Recommended Method | Participants | Duration |
|-----------|-------------------|--------------|----------|
| Evaluating a new feature concept | Moderated, think-aloud | 5-6 | 45-60 min |
| Comparing two design options (A/B) | Unmoderated, between-subjects | 20+ per variant | 15-20 min |
| Validating a redesign before launch | Moderated + SUS | 5-8 | 45-60 min |
| Benchmarking against a competitor | Unmoderated, within-subjects | 15-20 | 20-30 min |
| Checking accessibility compliance | Moderated with AT users | 3-5 AT users | 60 min |
| Quick check on a single flow | Unmoderated, task-focused | 10-15 | 10-15 min |
| Exploring mental models and expectations | Moderated, card sort + tasks | 6-8 | 60 min |
| Post-launch performance tracking | Unmoderated, recurring | 10-15 per round | 15 min |
| Internal tool evaluation | Moderated, contextual inquiry | 5-8 | 60-90 min |
| Mobile-specific interaction testing | Moderated with device camera | 5-6 | 45 min |

---

## 12. Integration with Memoire Pipeline

### 12.1 End-to-End Flow

```
1. PLAN
   memi research from-file usability-plan.xlsx
   --> Parses test plan, creates research project

2. COLLECT
   Sessions conducted (moderated or unmoderated)
   Observations recorded in session-notes.xlsx or JSON

3. IMPORT
   memi research from-file session-notes.xlsx
   --> Imports raw observation data into Memoire

4. SYNTHESIZE
   memi research synthesize --study [study-id]
   --> Runs affinity clustering on observations
   --> Generates structured insights
   --> Applies severity ratings

5. REPORT
   memi research report --study [study-id]
   --> Generates executive summary and detailed report
   --> Creates sticky notes in Figma with findings

6. UPDATE SPECS
   For each insight with specImpact:
   --> Updates affected component/page specs
   --> Logs change in spec changelog

7. REGENERATE
   memi generate [affected-components]
   --> Regenerates code reflecting usability improvements

8. DASHBOARD
   memi spec dataviz usability-metrics
   memi generate usability-metrics
   --> Creates dashboard visualizing test results
```

### 12.2 Research Insight Tags

When creating insights from usability testing, use these standardized
tags for pipeline filtering:

```
source:usability-test
method:moderated | method:unmoderated
severity:cosmetic | severity:minor | severity:major | severity:catastrophic
status:open | status:in-progress | status:resolved | status:wont-fix
round:1 | round:2 | round:3
task:[task-id]
component:[component-name]
```

### 12.3 Spec Annotation Format

When a usability finding impacts a spec, annotate the spec:

```json
{
  "researchInsights": [
    {
      "id": "UT-2026Q1-007",
      "finding": "Users could not find the export button",
      "severity": 3,
      "resolution": "Added export to action bar",
      "resolvedIn": "v2.1.0"
    }
  ]
}
```

---

## 13. Remote vs In-Person Considerations

| Factor | Remote | In-Person |
|--------|--------|-----------|
| Participant pool | Global reach | Local only |
| Setup cost | Low (video call) | High (lab, equipment) |
| Body language visibility | Limited (face only) | Full visibility |
| Environment control | None (participant's device) | Full control |
| Technical issues | More frequent (connectivity, audio) | Rare |
| Screen recording quality | Variable | Consistent |
| Participant comfort | Higher (own environment) | Lower (unfamiliar lab) |
| Session scheduling | More flexible | Constrained by location |
| Physical product testing | Not possible | Full capability |
| Accessibility testing | Possible but limited | Full capability |

**Remote Best Practices:**

- Test the participant's setup 5 minutes before the session.
- Have a backup communication channel (phone number).
- Ask the participant to close all other applications.
- Record both the screen and the participant's face (with consent).
- Send task materials in advance only if they do not bias the test.
- Account for 10-15% no-show rate; over-recruit accordingly.

**In-Person Best Practices:**

- Provide clear directions to the facility.
- Have the device fully charged and prepped.
- Ensure the observation room does not distract the participant.
- Offer water and a brief comfort break for sessions over 45 minutes.
- Test all recording equipment before the first session of the day.

---

## 14. Accessibility Testing Overlay

Accessibility testing can be layered onto any usability test.

### 14.1 Additional Participant Profiles

| Profile | Assistive Technology | Key Focus Areas |
|---------|---------------------|----------------|
| Screen reader user | JAWS, NVDA, VoiceOver | Reading order, labels, landmarks, announcements |
| Magnification user | ZoomText, browser zoom (200-400%) | Layout integrity, text reflow, target sizes |
| Keyboard-only user | No mouse | Tab order, focus indicators, keyboard traps |
| Voice control user | Dragon, Voice Control | Interactive element labeling, command discoverability |
| Cognitive accessibility | No AT (task simplification) | Plain language, error recovery, memory load |

### 14.2 Accessibility-Specific Tasks

Add these tasks to any standard usability test when accessibility
participants are included:

```
Task A1: Navigate the main menu using only the keyboard.
Success: Reaches all primary menu items via Tab/Arrow keys.

Task A2: Complete the form using a screen reader.
Success: All fields announced correctly, form submitted.

Task A3: Read the dashboard content at 200% zoom.
Success: All content visible without horizontal scrolling.

Task A4: Recover from an error state using assistive technology.
Success: Error identified and corrected without sighted assistance.
```

### 14.3 Accessibility Metrics

| Metric | Measurement |
|--------|-------------|
| WCAG task success | Can AT user complete core tasks meeting WCAG 2.2 AA? |
| AT interaction time | Time premium for AT users vs non-AT users |
| Error announcement rate | Percentage of errors correctly announced by AT |
| Focus order correctness | Percentage of interactive elements in logical tab order |
| Target size compliance | Percentage of targets meeting 24x24px minimum |

---

## 15. Anti-Patterns in Usability Testing

These mistakes invalidate results or waste resources. Avoid them.

### 15.1 Planning Anti-Patterns

| Anti-Pattern | Why It Fails | Fix |
|--------------|-------------|-----|
| Testing without hypotheses | No framework for interpreting results | Write hypotheses before recruiting |
| Too many tasks | Participant fatigue degrades later tasks | Maximum 5-7 tasks per session |
| Testing on a broken prototype | Participants test bugs, not usability | Pilot test with internal user first |
| Recruiting the wrong users | Findings do not generalize | Use behavioral screening criteria |
| Testing too late | No time to act on findings | Test early with low-fidelity prototypes |

### 15.2 Facilitation Anti-Patterns

| Anti-Pattern | Why It Fails | Fix |
|--------------|-------------|-----|
| Leading questions | Biases participant behavior | Use neutral language (Section 4.2) |
| "Would you use this?" | Hypothetical answers are unreliable | Observe actual behavior instead |
| Helping too quickly | Masks real usability problems | Wait until max time, then give minimal hint |
| Reacting to participant actions | Social desirability bias | Maintain neutral expression and tone |
| Not recording the session | Lost data, unreliable recall | Always record with consent |
| Multitasking during session | Missed observations | Dedicated facilitator and note-taker |

### 15.3 Analysis Anti-Patterns

| Anti-Pattern | Why It Fails | Fix |
|--------------|-------------|-----|
| Cherry-picking quotes | Confirms bias, ignores counter-evidence | Use rainbow spreadsheet to see full picture |
| Reporting only negatives | Demoralizes the team, loses positive signals | Always include what worked well |
| No severity ratings | Everything treated as equally urgent | Apply the severity scale (Section 8.2) |
| Conflating one user's issue with a pattern | Wastes resources on edge cases | Require 2+ participants for a pattern |
| Ignoring quantitative data | Misses objective signal in qualitative noise | Always report metrics alongside observations |
| Delaying analysis | Details forgotten, notes become cryptic | Analyze within 48 hours of last session |

### 15.4 Organizational Anti-Patterns

| Anti-Pattern | Why It Fails | Fix |
|--------------|-------------|-----|
| Testing but not acting | Wastes participant time and budget | Get stakeholder commitment to act before testing |
| One-and-done testing | Single round misses iteration signal | Plan for 2-3 rounds: test, fix, retest |
| Report sits in a drawer | No impact on product | Present findings in design reviews and sprint planning |
| Only designers watch sessions | Engineers miss crucial context | Invite engineers and PMs to observe (even 1 session) |
| No baseline measurement | Cannot measure improvement | Establish baseline metrics in round 1 |

---

## 16. Appendix: Quick Reference Card

### Minimum Viable Usability Test

For teams with limited time and budget, this is the smallest useful test:

```
Participants: 5
Method: Moderated, remote
Tasks: 3-5
Duration: 30 minutes per session
Metrics: Task success (binary), SEQ per task, SUS post-session
Analysis: Rainbow spreadsheet + severity ratings
Timeline: 3 days (1 day prep, 1 day sessions, 1 day analysis)
Output: 1-page executive summary + prioritized findings list
```

### Session Checklist

```
Before session:
[ ] Prototype/staging URL tested and working
[ ] Recording software tested
[ ] Consent form ready
[ ] Task scenarios printed/available
[ ] Note-taking template open
[ ] Backup contact method for participant

During session:
[ ] Consent obtained and recording started
[ ] Think-aloud instructions given
[ ] Tasks presented one at a time
[ ] Timer running for each task
[ ] Observations logged with timestamps
[ ] Quotes captured verbatim
[ ] Post-task SEQ collected
[ ] Post-session SUS administered

After session:
[ ] Recording saved and labeled
[ ] Notes reviewed and completed within 1 hour
[ ] Key observations highlighted
[ ] Incentive confirmed
```

### Metric Thresholds at a Glance

| Metric | Green | Yellow | Red |
|--------|-------|--------|-----|
| Task success rate | >= 85% | 60-84% | < 60% |
| Time on task | <= expected | 1-1.5x expected | > 1.5x expected |
| Error rate | <= 10% | 11-25% | > 25% |
| SUS score | >= 72 | 52-71 | < 52 |
| NPS | >= 30 | 0-29 | < 0 |
| SEQ | >= 5.5 | 4.0-5.4 | < 4.0 |
```

---

*This skill is part of the Memoire research pipeline. Findings
generated here feed directly into component specs, page specs,
and dashboard visualizations through structured insight synthesis.*
