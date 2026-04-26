# GitHub Achievement Growth Plan

This tracker keeps achievement work tied to real Memoire distribution. The goal is to earn profile credibility without creating spam, fake stars, fake accounts, or low-quality pull requests.

## Rules

- Use external repositories only for useful submissions, fixes, docs, or directory listings.
- Use the sandbox repository only for harmless GitHub workflow achievement tests.
- Do not ask for fake stars or use alternate accounts to inflate stars.
- Do not submit low-effort PRs to farm Pull Shark.
- Keep every accepted PR linked to a real Memoire distribution or ecosystem improvement.

## Current Baseline

| Item | Status | Next action |
| --- | --- | --- |
| Memoire repo stars | 4 | Drive Starstruck through launch and directory distribution |
| Memoire discussions | Enabled on GitHub | Add Q&A-focused categories in repository settings |
| npm latest | Requires manual auth and publish | Publish 0.14.1 before directory announcements |
| Sandbox repo | `sarveshsea/memoire-achievements-lab` | Use only for harmless workflow checks |
| GitHub metadata | Updated to shadcn-native Design CI | Keep npm, README, and directory copy aligned |

## Achievement Targets

| Achievement | Legit path | Target | Status | Links |
| --- | --- | --- | --- | --- |
| Public Sponsor | Sponsor one OSS maintainer whose work supports Memoire | Base badge | Pending | Add sponsor link after completion |
| Quickdraw | Open and close a sandbox issue or PR within 5 minutes | Base badge | Completed in sandbox | https://github.com/sarveshsea/memoire-achievements-lab/issues/1 |
| YOLO | Merge a tiny own PR in the sandbox repo without review | Base badge | Completed in sandbox | https://github.com/sarveshsea/memoire-achievements-lab/pull/2 |
| Pull Shark | Submit real PRs to MCP, shadcn, docs, and awesome-list directories | x2 first, then x3 | In progress | Track submissions in `docs/SUBMISSIONS.md` |
| Pair Extraordinaire | Merge real coauthored PRs with valid `Co-authored-by:` trailers | Base, then x2 | Pending | Use actual collaborator commits only |
| Galaxy Brain | Answer real GitHub Discussions questions and have them accepted | Base, then x2 | Pending | Requires Discussions enabled |
| Starstruck | Earn real stars from distribution, demos, and useful listings | 16 stars, then 128 | Pending | Track weekly in `docs/METRICS.md` |

## Discussion Categories To Configure

GitHub category forms live in `.github/DISCUSSION_TEMPLATE/`, but categories themselves must exist in the repository settings before the forms are used. Configure these categories after enabling Discussions:

| Category | Suggested slug | Format | Purpose |
| --- | --- | --- | --- |
| Q&A | `q-a` | Question and answer | Support, accepted answers, Galaxy Brain path |
| Show and tell | `show-and-tell` | Open-ended discussion | User demos, registries, launch proof |
| Registry help | `registry-help` | Question and answer | `memi shadcn export`, `memi add`, registry install issues |
| MCP setup | `mcp-setup` | Question and answer | Claude Code, Cursor, Codex, and MCP client setup |

## Weekly Review

Run this review every Friday during the 0.14.1 launch window:

1. Count accepted directory PRs and update Pull Shark progress.
2. Count accepted discussion answers and update Galaxy Brain progress.
3. Record GitHub stars, npm weekly downloads, and accepted directory links.
4. Identify the one directory or post that sent the most qualified traffic.
5. Choose the next 3 useful external PRs. Do not create filler PRs.

## Copy Blocks

### One-line description

```text
Memoire is an MCP server and CLI for shadcn-native Design CI: diagnose UI debt, extract Tailwind tokens, export shadcn registries, and plan safe UI fixes.
```

### Install block

```bash
npm i -g @sarveshsea/memoire
memi diagnose
memi shadcn export --out public/r
memi mcp config --install
```

### Directory submission pitch

```text
Memoire gives AI coding tools a shadcn-native design-system workflow. It runs as a CLI and MCP server, audits existing Tailwind/shadcn apps, extracts tokens, exports shadcn-compatible registries, and helps teams publish installable design systems from real code.
```
