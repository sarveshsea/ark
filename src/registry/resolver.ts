/**
 * Registry Resolver — fetch a remote Memoire registry by reference.
 *
 * Supported reference formats:
 *   - npm package name:       "@acme/design-system"
 *   - GitHub repo:            "github:user/repo"
 *   - GitHub repo + path:     "github:user/repo/subdir"
 *   - Raw HTTPS URL:          "https://example.com/path/to/registry.json"
 *   - Local path:             "./path/to/registry" or "/abs/path"
 */

import { readFile } from "fs/promises";
import { join, isAbsolute, resolve } from "path";
import {
  parseRegistry,
  type Registry,
  type RegistryComponentRef,
  REGISTRY_FILENAME,
} from "./schema.js";
import { resolveMarketplaceAlias } from "../marketplace/catalog-loader.js";

export interface ResolvedRegistry {
  /** The parsed registry document */
  registry: Registry;
  /** Base URL or path for fetching token/component files */
  baseUrl: string;
  /** Source reference (for logging) */
  source: string;
}

const FETCH_TIMEOUT_MS = 15000;

// ── SSRF guard (same pattern as penpot-client) ───────────────

function assertSafePublicUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`URL must be http(s): ${url}`);
  }
  const host = parsed.hostname.toLowerCase();
  const PRIVATE_IPV4 = /^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|0\.0\.0\.0)/;
  if (host === "localhost" || host === "::1" || PRIVATE_IPV4.test(host)) {
    throw new Error(`Registry URL cannot point to a private/loopback address: ${url}`);
  }
}

// ── Resolver ────────────────────────────────────────────────

/**
 * Resolve a registry reference to a parsed Registry + baseUrl.
 */
export async function resolveRegistry(ref: string, cwd: string = process.cwd()): Promise<ResolvedRegistry> {
  if (ref.startsWith("github:")) {
    return resolveGitHub(ref);
  }
  if (/^https?:\/\//.test(ref)) {
    return resolveHttp(ref);
  }
  // Reject any other explicit URL scheme (ftp:, file:, javascript:, etc.)
  if (/^[a-z][a-z0-9+\-.]*:\/\//i.test(ref)) {
    throw new Error(`Registry ref must use http(s), github:, local path, or npm package name — got: ${ref}`);
  }
  if (ref.startsWith("./") || ref.startsWith("../") || isAbsolute(ref)) {
    return resolveLocal(ref, cwd);
  }
  const marketplaceEntry = await resolveMarketplaceAlias(ref);
  if (marketplaceEntry && marketplaceEntry.packageName !== ref) {
    try {
      return await resolveNpm(marketplaceEntry.packageName, cwd);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Featured registry "${ref}" maps to "${marketplaceEntry.packageName}". ${message}`,
      );
    }
  }
  // Default: treat as npm package name — look in node_modules
  return resolveNpm(ref, cwd);
}

async function resolveLocal(ref: string, cwd: string): Promise<ResolvedRegistry> {
  const baseDir = isAbsolute(ref) ? ref : resolve(cwd, ref);
  const registryPath = join(baseDir, REGISTRY_FILENAME);
  const raw = await readFile(registryPath, "utf-8").catch(() => {
    throw new Error(`Could not read registry at ${registryPath}`);
  });
  const registry = parseRegistry(JSON.parse(raw));
  return { registry, baseUrl: baseDir, source: `local:${baseDir}` };
}

async function resolveNpm(pkgName: string, cwd: string): Promise<ResolvedRegistry> {
  // Look in local node_modules
  const baseDir = resolve(cwd, "node_modules", pkgName);
  try {
    return await resolveLocal(baseDir, cwd);
  } catch {
    throw new Error(
      `Registry "${pkgName}" not found in node_modules. Install it first: npm install ${pkgName}`,
    );
  }
}

async function resolveGitHub(ref: string): Promise<ResolvedRegistry> {
  // github:user/repo or github:user/repo/subdir
  const body = ref.replace(/^github:/, "");
  const parts = body.split("/");
  if (parts.length < 2) throw new Error(`Invalid GitHub ref: ${ref}`);
  const [user, repo, ...pathParts] = parts;
  const subdir = pathParts.join("/");
  const baseUrl = subdir
    ? `https://raw.githubusercontent.com/${user}/${repo}/main/${subdir}`
    : `https://raw.githubusercontent.com/${user}/${repo}/main`;
  return resolveHttp(`${baseUrl}/${REGISTRY_FILENAME}`, baseUrl);
}

async function resolveHttp(registryUrl: string, explicitBase?: string): Promise<ResolvedRegistry> {
  assertSafePublicUrl(registryUrl);
  const baseUrl = explicitBase ?? registryUrl.replace(/\/[^/]+$/, "");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(registryUrl, { signal: controller.signal, redirect: "error" });
    if (!res.ok) throw new Error(`Registry fetch failed (${res.status}): ${registryUrl}`);
    const raw = await res.text();
    const registry = parseRegistry(JSON.parse(raw));
    return { registry, baseUrl, source: registryUrl };
  } finally {
    clearTimeout(timer);
  }
}

// ── Fetching referenced files ────────────────────────────────

/**
 * Read a referenced file (tokens or component spec) from a resolved registry.
 */
export async function readRegistryFile(resolved: ResolvedRegistry, href: string): Promise<string> {
  const { baseUrl } = resolved;
  // Strip leading ./
  const cleanHref = href.startsWith("./") ? href.slice(2) : href;

  if (/^https?:\/\//.test(baseUrl)) {
    const url = `${baseUrl}/${cleanHref}`;
    assertSafePublicUrl(url);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: controller.signal, redirect: "error" });
      if (!res.ok) throw new Error(`Failed to fetch ${href}: ${res.status}`);
      return await res.text();
    } finally {
      clearTimeout(timer);
    }
  }

  // Local path
  const fullPath = join(baseUrl, cleanHref);
  return readFile(fullPath, "utf-8");
}

/**
 * Find a component ref by name in a registry (case-sensitive).
 */
export function findComponentRef(registry: Registry, name: string): RegistryComponentRef {
  const ref = registry.components.find(c => c.name === name);
  if (!ref) {
    const available = registry.components.map(c => c.name).join(", ") || "(none)";
    throw new Error(`Component "${name}" not in registry "${registry.name}". Available: ${available}`);
  }
  return ref;
}
