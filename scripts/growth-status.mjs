#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf-8"));
const json = process.argv.includes("--json");
const now = new Date().toISOString();

const directoryPullRequests = [
  ["punkpeye/awesome-mcp-servers", 4373],
  ["TensorBlock/awesome-mcp-servers", 455],
  ["YuzeHao2023/Awesome-MCP-Servers", 208],
  ["MobinX/awesome-mcp-list", 241],
  ["toolsdk-ai/toolsdk-mcp-registry", 296],
  ["bytefer/awesome-shadcn-ui", 18],
  ["birobirobiro/awesome-shadcn-ui", 493],
];

const [
  npmMetadata,
  weeklyDownloads,
  monthlyDownloads,
  githubRepo,
  registrySearch,
  safeSkillPr,
  directoryStatuses,
] = await Promise.all([
  getNpmMetadata(),
  fetchJson("https://api.npmjs.org/downloads/point/last-week/%40sarveshsea%2Fmemoire"),
  fetchJson("https://api.npmjs.org/downloads/point/last-month/%40sarveshsea%2Fmemoire"),
  fetchJson("https://api.github.com/repos/sarveshsea/m-moire"),
  fetchJson("https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.sarveshsea/memoire"),
  fetchJson("https://api.github.com/repos/sarveshsea/m-moire/pulls/2"),
  Promise.all(directoryPullRequests.map(async ([repo, number]) => {
    const pull = await fetchJson(`https://api.github.com/repos/${repo}/pulls/${number}`);
    return {
      repo,
      number,
      url: `https://github.com/${repo}/pull/${number}`,
      state: summarizePullState(pull),
      title: pull.ok === false ? null : pull.title,
      updatedAt: pull.ok === false ? null : pull.updated_at,
    };
  })),
]);

const status = {
  generatedAt: now,
  package: {
    name: packageJson.name,
    localVersion: packageJson.version,
    mcpName: packageJson.mcpName,
  },
  npm: normalizeNpmMetadata(npmMetadata),
  downloads: {
    weekly: normalizeDownloadPoint(weeklyDownloads),
    monthly: normalizeDownloadPoint(monthlyDownloads),
  },
  github: normalizeRepo(githubRepo),
  officialMcpRegistry: normalizeRegistry(registrySearch),
  safeSkill: normalizeSafeSkillPr(safeSkillPr),
  directoryPullRequests: directoryStatuses,
  nextActions: buildNextActions({ npmMetadata, registrySearch, safeSkillPr, githubRepo }),
};

if (json) {
  console.log(JSON.stringify(status, null, 2));
} else {
  printHuman(status);
}

async function getNpmMetadata() {
  const encoded = encodeURIComponent(packageJson.name).replace(/^%40/, "%40");
  return fetchJson(`https://registry.npmjs.org/${encoded}`);
}

async function fetchJson(url) {
  try {
    const headers = {
      "Accept": "application/json",
      "User-Agent": "Memoire-GrowthStatus/1.0",
    };
    if (process.env.GITHUB_TOKEN && url.includes("api.github.com")) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(12_000),
    });
    const body = await response.text();
    const payload = body ? JSON.parse(body) : null;
    if (!response.ok) {
      return { ok: false, status: response.status, error: payload?.message ?? response.statusText, url };
    }
    return payload;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err), url };
  }
}

function normalizeNpmMetadata(metadata) {
  if (metadata.ok === false) return { ok: false, error: metadata.error };
  const latest = metadata["dist-tags"]?.latest;
  const version = latest ? metadata.versions?.[latest] : null;
  return {
    ok: true,
    latest,
    mcpName: version?.mcpName ?? null,
    description: version?.description ?? metadata.description ?? null,
    npmUrl: "https://www.npmjs.com/package/@sarveshsea/memoire",
  };
}

function normalizeDownloadPoint(point) {
  if (point.ok === false) return { ok: false, error: point.error };
  return {
    ok: true,
    downloads: point.downloads,
    start: point.start,
    end: point.end,
  };
}

function normalizeRepo(repo) {
  if (repo.ok === false) return { ok: false, error: repo.error };
  return {
    ok: true,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    description: repo.description,
    topics: repo.topics ?? [],
    url: repo.html_url,
  };
}

function normalizeRegistry(search) {
  if (search.ok === false) return { ok: false, listed: false, count: 0, error: search.error };
  const servers = Array.isArray(search.servers) ? search.servers : [];
  return {
    ok: true,
    listed: servers.some((server) => server.name === "io.github.sarveshsea/memoire"),
    count: search.metadata?.count ?? servers.length,
    url: "https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.sarveshsea/memoire",
  };
}

function normalizeSafeSkillPr(pull) {
  if (pull.ok === false) return { ok: false, error: pull.error };
  const scoreMatch = `${pull.title ?? ""}\n${pull.body ?? ""}`.match(/(\d+)\/100/);
  return {
    ok: true,
    number: pull.number,
    state: summarizePullState(pull),
    title: pull.title,
    score: scoreMatch ? Number(scoreMatch[1]) : null,
    url: pull.html_url,
  };
}

function summarizePullState(pull) {
  if (pull.ok === false) return "unknown";
  if (pull.merged_at) return "merged";
  return pull.state ?? "unknown";
}

function buildNextActions({ npmMetadata, registrySearch, safeSkillPr, githubRepo }) {
  const actions = [];
  const npm = normalizeNpmMetadata(npmMetadata);
  const registry = normalizeRegistry(registrySearch);
  const safeSkill = normalizeSafeSkillPr(safeSkillPr);
  const repo = normalizeRepo(githubRepo);

  if (npm.ok && npm.latest !== packageJson.version) {
    actions.push(`Publish ${packageJson.version} to npm; npm latest is ${npm.latest}.`);
  }
  if (registry.ok && !registry.listed) {
    actions.push("Publish server.json to the Official MCP Registry after npm is current.");
  }
  if (safeSkill.ok && safeSkill.state === "open") {
    actions.push("Do not merge the SafeSkill blocked badge; address findings or close after replacement proof.");
  }
  if (repo.ok && repo.stars < 16) {
    actions.push(`Starstruck needs ${16 - repo.stars} more real stars.`);
  }
  return actions;
}

function printHuman(status) {
  console.log(`Memoire Growth Status (${status.generatedAt})`);
  console.log("");
  console.log(`Package: ${status.package.name}@${status.package.localVersion}`);
  console.log(`npm: ${status.npm.ok ? `${status.npm.latest} · ${status.npm.mcpName ?? "no mcpName"}` : `error: ${status.npm.error}`}`);
  console.log(`Downloads: ${formatDownloads(status.downloads.weekly, "weekly")} · ${formatDownloads(status.downloads.monthly, "monthly")}`);
  console.log(`GitHub: ${status.github.ok ? `${status.github.stars} stars · ${status.github.forks} forks · ${status.github.openIssues} open issues` : `error: ${status.github.error}`}`);
  console.log(`Official MCP Registry: ${status.officialMcpRegistry.listed ? "listed" : "not listed"} (${status.officialMcpRegistry.count} result${status.officialMcpRegistry.count === 1 ? "" : "s"})`);
  console.log(`SafeSkill PR: ${status.safeSkill.ok ? `#${status.safeSkill.number} ${status.safeSkill.state}${status.safeSkill.score !== null ? ` · ${status.safeSkill.score}/100` : ""}` : `error: ${status.safeSkill.error}`}`);
  console.log("");
  console.log("Directory PRs:");
  for (const pull of status.directoryPullRequests) {
    console.log(`- ${pull.repo}#${pull.number}: ${pull.state}${pull.title ? ` · ${pull.title}` : ""}`);
  }
  console.log("");
  console.log("Next:");
  for (const action of status.nextActions) {
    console.log(`- ${action}`);
  }
}

function formatDownloads(point, label) {
  if (!point.ok) return `${label} error`;
  return `${point.downloads} ${label} (${point.start}..${point.end})`;
}
