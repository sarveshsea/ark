import { constants } from "node:fs";
import { access, readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { packagePath } from "../utils/asset-path.js";

const COMMUNITY_URL = "https://www.figma.com/community/plugin/1631708567749401678";
const REPOSITORY_URL = "https://github.com/sarveshsea/mermaid-jam";

export type MermaidJamLocalSource =
  | "env"
  | "workspace-child"
  | "workspace-sibling"
  | "package-sidecar"
  | "desktop-projects"
  | "missing";

export type MermaidJamQuickLinkKind = "community" | "repository" | "local-manifest";
export type MermaidJamOpenTarget = MermaidJamQuickLinkKind;

export interface MermaidJamQuickLink {
  kind: MermaidJamQuickLinkKind;
  label: string;
  href: string;
}

export interface MermaidJamIntegration {
  schemaVersion: 1;
  id: "mermaid-jam";
  name: "Mermaid Jam";
  kind: "figjam-plugin";
  description: string;
  packageName: "mermaid-jam";
  communityUrl: string;
  repositoryUrl: string;
  supportedInputs: ["mermaid", "markdown"];
  supportedOutputs: ["editable-figjam"];
  local: {
    found: boolean;
    ready: boolean;
    root: string | null;
    source: MermaidJamLocalSource;
    manifestPath: string | null;
    manifestId: string | null;
    manifestName: string | null;
    editorTypes: string[];
    packageVersion: string | null;
    codePath: string | null;
    uiPath: string | null;
  };
  install: {
    quickLinks: MermaidJamQuickLink[];
    nextSteps: string[];
  };
}

export interface ResolveMermaidJamIntegrationOptions {
  projectRoot: string;
  env?: Record<string, string | undefined>;
  candidates?: string[];
}

interface CandidateRoot {
  root: string;
  source: MermaidJamLocalSource;
}

interface LocalManifest {
  id?: string;
  name?: string;
  editorType?: string | string[];
  main?: string;
  ui?: string;
}

interface LocalPackageJson {
  name?: string;
  version?: string;
  homepage?: string;
  repository?: string | { url?: string };
}

export async function resolveMermaidJamIntegration(
  options: ResolveMermaidJamIntegrationOptions,
): Promise<MermaidJamIntegration> {
  const projectRoot = resolve(options.projectRoot);
  const env = options.env ?? process.env;
  const local = await resolveLocalCheckout(projectRoot, env, options.candidates);
  const communityUrl = local.packageJson?.homepage?.startsWith("https://www.figma.com/")
    ? local.packageJson.homepage
    : COMMUNITY_URL;
  const repositoryUrl = normalizeRepositoryUrl(local.packageJson?.repository) ?? REPOSITORY_URL;
  const quickLinks: MermaidJamQuickLink[] = [
    { kind: "community", label: "Open on Figma Community", href: communityUrl },
    { kind: "repository", label: "View Mermaid Jam repo", href: repositoryUrl },
  ];

  if (local.manifestPath) {
    quickLinks.push({
      kind: "local-manifest",
      label: "Import local FigJam manifest",
      href: pathToFileURL(local.manifestPath).href,
    });
  }

  return {
    schemaVersion: 1,
    id: "mermaid-jam",
    name: "Mermaid Jam",
    kind: "figjam-plugin",
    description: "Native Mémoire integration for sending Mermaid and markdown diagram source into the Mermaid Jam FigJam plugin.",
    packageName: "mermaid-jam",
    communityUrl,
    repositoryUrl,
    supportedInputs: ["mermaid", "markdown"],
    supportedOutputs: ["editable-figjam"],
    local: {
      found: Boolean(local.root),
      ready: local.ready,
      root: local.root,
      source: local.source,
      manifestPath: local.manifestPath,
      manifestId: local.manifest?.id ?? null,
      manifestName: local.manifest?.name ?? null,
      editorTypes: normalizeEditorTypes(local.manifest?.editorType),
      packageVersion: local.packageJson?.version ?? null,
      codePath: local.codePath,
      uiPath: local.uiPath,
    },
    install: {
      quickLinks,
      nextSteps: buildNextSteps(Boolean(local.root), local.ready, local.manifestPath),
    },
  };
}

export async function openMermaidJamTarget(
  integration: MermaidJamIntegration,
  target: MermaidJamOpenTarget = "community",
  openApp: (target: string) => Promise<void> = openSystemTarget,
): Promise<{ target: MermaidJamOpenTarget; opened: string; openedAt: string }> {
  let destination: string | null = null;
  if (target === "community") destination = integration.communityUrl;
  if (target === "repository") destination = integration.repositoryUrl;
  if (target === "local-manifest") destination = integration.local.manifestPath;

  if (!destination) {
    throw Object.assign(new Error(`Mermaid Jam target is not available: ${target}`), { statusCode: 404 });
  }

  await openApp(destination);
  return { target, opened: destination, openedAt: new Date().toISOString() };
}

function buildNextSteps(found: boolean, ready: boolean, manifestPath: string | null): string[] {
  const steps = [
    "Open Mermaid Jam from a FigJam board, then paste Mermaid or markdown source to generate editable FigJam nodes.",
    "Use the Figma Community link for the normal install path.",
  ];

  if (!found) {
    steps.push("Set MEMOIRE_MERMAID_JAM_ROOT to a local mermaid-jam checkout when developing the plugin alongside Memoire.");
  } else if (!ready) {
    steps.push("Run `npm install && npm run build` in the Mermaid Jam checkout so plugin/code.js and plugin/ui.html exist.");
  } else if (manifestPath) {
    steps.push(`For local development, import ${manifestPath} from Figma or FigJam via Plugins > Development > Import plugin from manifest.`);
  }

  return steps;
}

async function resolveLocalCheckout(
  projectRoot: string,
  env: Record<string, string | undefined>,
  explicitCandidates: string[] | undefined,
): Promise<{
  root: string | null;
  source: MermaidJamLocalSource;
  manifestPath: string | null;
  manifest: LocalManifest | null;
  packageJson: LocalPackageJson | null;
  ready: boolean;
  codePath: string | null;
  uiPath: string | null;
}> {
  for (const candidate of candidateRoots(projectRoot, env, explicitCandidates)) {
    const found = await inspectCandidate(candidate);
    if (found) return found;
  }

  return {
    root: null,
    source: "missing",
    manifestPath: null,
    manifest: null,
    packageJson: null,
    ready: false,
    codePath: null,
    uiPath: null,
  };
}

function candidateRoots(
  projectRoot: string,
  env: Record<string, string | undefined>,
  explicitCandidates: string[] | undefined,
): CandidateRoot[] {
  const candidates: CandidateRoot[] = [];
  const push = (root: string | undefined, source: MermaidJamLocalSource) => {
    if (!root) return;
    candidates.push({ root: resolve(root), source });
  };

  push(env.MEMOIRE_MERMAID_JAM_ROOT, "env");
  for (const explicit of explicitCandidates ?? []) push(explicit, "env");
  push(join(projectRoot, "unicornjam"), "workspace-child");
  push(join(projectRoot, "mermaid-jam"), "workspace-child");
  push(join(dirname(projectRoot), "unicornjam"), "workspace-sibling");
  push(join(dirname(projectRoot), "mermaid-jam"), "workspace-sibling");
  push(packagePath("integrations", "mermaid-jam"), "package-sidecar");
  push(env.HOME ? join(env.HOME, "Desktop", "Projects", "Other", "unicornjam") : undefined, "desktop-projects");
  push(env.HOME ? join(env.HOME, "Desktop", "Projects", "Other", "mermaid-jam") : undefined, "desktop-projects");

  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    if (seen.has(candidate.root)) return false;
    seen.add(candidate.root);
    return true;
  });
}

async function inspectCandidate(candidate: CandidateRoot): Promise<Awaited<ReturnType<typeof resolveLocalCheckout>> | null> {
  const packagePathname = join(candidate.root, "package.json");
  const manifestPath = join(candidate.root, "plugin", "manifest.json");
  const [packageJson, manifest] = await Promise.all([
    readJson<LocalPackageJson>(packagePathname),
    readJson<LocalManifest>(manifestPath),
  ]);

  if (!manifest) return null;
  if (packageJson?.name && packageJson.name !== "mermaid-jam") return null;

  const codePath = manifest.main ? join(candidate.root, "plugin", manifest.main) : null;
  const uiPath = manifest.ui ? join(candidate.root, "plugin", manifest.ui) : null;
  const ready = Boolean(codePath && uiPath && await fileExists(codePath) && await fileExists(uiPath));

  return {
    root: candidate.root,
    source: candidate.source,
    manifestPath,
    manifest,
    packageJson,
    ready,
    codePath,
    uiPath,
  };
}

async function readJson<T>(path: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path, "utf-8")) as T;
  } catch {
    return null;
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function normalizeEditorTypes(editorType: string | string[] | undefined): string[] {
  if (Array.isArray(editorType)) return editorType;
  if (editorType) return [editorType];
  return [];
}

function normalizeRepositoryUrl(repository: LocalPackageJson["repository"]): string | null {
  const value = typeof repository === "string" ? repository : repository?.url;
  if (!value) return null;
  return value
    .replace(/^git\+/, "")
    .replace(/^git:\/\//, "https://")
    .replace(/\.git$/, "");
}

async function openSystemTarget(target: string): Promise<void> {
  if (process.platform !== "darwin") {
    throw Object.assign(new Error("Opening Mermaid Jam links from Memoire is currently supported on macOS only"), { statusCode: 501 });
  }
  await new Promise<void>((resolveOpen, rejectOpen) => {
    const child = spawn("open", [target], { stdio: "ignore" });
    child.once("error", rejectOpen);
    child.once("close", (code) => {
      if (code === 0) resolveOpen();
      else rejectOpen(new Error(`Failed to open Mermaid Jam target: ${target}`));
    });
  });
}
