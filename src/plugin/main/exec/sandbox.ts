// Hardened guard for user-supplied code passed to `execute`.
//
// Figma's plugin sandbox does not give us a real `eval`-style isolate, and we
// can't ship a full AST parser (bundle size + ES2017 target). Instead we
// normalize the code — strip comments and string literals, unescape unicode —
// then scan the *normalized* form for banned identifiers, computed member
// access, and infinite-loop shapes. That closes the obvious obfuscation
// channels (`figma["close"+"Plugin"]`, `\u0046unction(...)`, `do{}while(1)`)
// that the previous regex-on-raw-source denylist missed.
//
// This is explicitly described as "AST-free best effort" — not a true sandbox.
// A follow-up phase may add a real parser via a lazy-loaded worker. For now
// the combination of normalize + deny + timeout + length + node-count is the
// smallest viable protection we can actually ship.

import { makeError, type WidgetError } from "../../shared/errors.js";

export const EXEC_MAX_LENGTH = 50_000;
export const EXEC_MAX_TOKENS = 10_000;
export const EXEC_DEFAULT_TIMEOUT_MS = 3000;

// Identifiers that must never appear in user code (normalized). Matched as a
// word boundary so "closePlugin" in a comment or string isn't caught — the
// normalization step already removes those contexts.
const BANNED_IDENTIFIERS: ReadonlyArray<string> = [
  "closePlugin",
  "removePage",
  "__proto__",
  "__defineGetter__",
  "__defineSetter__",
  "constructor",
  "prototype",
  "eval",
  "Function",
  "setTimeout",
  "setInterval",
  "requestAnimationFrame",
  "import",
  "require",
  "globalThis",
  "window",
  "self",
  "parent",
  "top",
];

// Computed access to any of these roots is always suspicious: the legitimate
// uses of the plugin API are dot-accessed and covered by typed adapters.
const PROTECTED_ROOTS: ReadonlyArray<string> = ["figma", "globalThis", "window", "self"];

export interface ExecGuardResult {
  ok: boolean;
  error?: WidgetError;
  normalizedTokens?: number;
}

export function guardExecCode(raw: string): ExecGuardResult {
  if (typeof raw !== "string") {
    return {
      ok: false,
      error: makeError("E_PARAM_INVALID", "execute: code must be a string"),
    };
  }
  if (raw.length > EXEC_MAX_LENGTH) {
    return {
      ok: false,
      error: makeError("E_EXEC_TOO_LARGE", "execute: code exceeds max length", {
        detail: { length: raw.length, max: EXEC_MAX_LENGTH },
      }),
    };
  }

  const normalized = normalizeCode(raw);

  // Infinite-loop shapes, caught even when rewritten with `do{}while(1)` or
  // `for(;;){...}`. We use the normalized form so whitespace/comment tricks
  // don't bypass.
  if (/\bwhile\s*\(\s*(true|1)\s*\)/i.test(normalized)) {
    return rejected("E_EXEC_REJECTED", "Infinite while loop", { pattern: "while(true)" });
  }
  if (/\bdo\b[\s\S]*?\bwhile\s*\(\s*(true|1)\s*\)/i.test(normalized)) {
    return rejected("E_EXEC_REJECTED", "Infinite do-while", { pattern: "do{}while(true)" });
  }
  if (/\bfor\s*\(\s*;\s*;\s*\)/i.test(normalized)) {
    return rejected("E_EXEC_REJECTED", "Infinite for loop", { pattern: "for(;;)" });
  }

  // Banned identifiers as whole words, after normalization collapses unicode
  // escapes and strips strings/comments.
  for (const ident of BANNED_IDENTIFIERS) {
    const re = new RegExp("\\b" + escapeRegex(ident) + "\\b");
    if (re.test(normalized)) {
      return rejected("E_EXEC_REJECTED", "Banned identifier: " + ident, { identifier: ident });
    }
  }

  // Computed member access (`obj[...]`) against a protected root is rejected
  // outright because dot-access is sufficient for legitimate uses, and
  // computed-access is the main obfuscation vector.
  for (const root of PROTECTED_ROOTS) {
    const re = new RegExp("\\b" + escapeRegex(root) + "\\s*\\[");
    if (re.test(normalized)) {
      return rejected("E_EXEC_REJECTED", "Computed access to " + root + "[] is not allowed", {
        root,
      });
    }
  }

  // Node-count proxy: we can't parse to a real AST so we approximate with a
  // tokenizer. Guard against pathological nesting / gigantic literal trees.
  const tokens = countTokens(normalized);
  if (tokens > EXEC_MAX_TOKENS) {
    return rejected("E_EXEC_TOO_LARGE", "execute: token count exceeds max", {
      tokens,
      max: EXEC_MAX_TOKENS,
    });
  }

  return { ok: true, normalizedTokens: tokens };
}

// Wraps a promise (the actual execution) in a hard wall-clock cutoff. The
// caller must race this against the real work; when the deadline fires, we
// reject with E_EXEC_TIMEOUT so JobsStore can record a clean failure instead
// of the plugin hanging forever.
export function withExecTimeout<T>(promise: Promise<T>, ms = EXEC_DEFAULT_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      reject(makeErrorJson(makeError("E_EXEC_TIMEOUT", "execute: exceeded time budget", {
        detail: { budgetMs: ms },
        retryable: false,
      })));
    }, ms);
  });
  return Promise.race([promise, deadline]).finally(() => {
    if (timer !== undefined) clearTimeout(timer);
  });
}

// ── internals ───────────────────────────────────────────────────────────

function rejected(code: WidgetError["code"], message: string, detail?: Record<string, unknown>): ExecGuardResult {
  return { ok: false, error: makeError(code, message, { detail, retryable: false }) };
}

function makeErrorJson(err: WidgetError): Error {
  const e = new Error(err.message);
  (e as unknown as { widgetError: WidgetError }).widgetError = err;
  return e;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Strips single/double/backtick string literals, block and line comments,
// and decodes unicode escape sequences so a banned token encoded as
// \u0046unction is detected.
export function normalizeCode(raw: string): string {
  let out = "";
  let i = 0;
  let inBlockComment = false;
  let inLineComment = false;
  let stringChar: '"' | "'" | "`" | null = null;
  let escape = false;

  while (i < raw.length) {
    const ch = raw.charAt(i);
    const next = raw.charAt(i + 1);

    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i += 2;
        out += "  ";
        continue;
      }
      i += 1;
      out += ch === "\n" ? "\n" : " ";
      continue;
    }
    if (inLineComment) {
      if (ch === "\n") {
        inLineComment = false;
        out += "\n";
      } else {
        out += " ";
      }
      i += 1;
      continue;
    }
    if (stringChar) {
      if (escape) {
        escape = false;
        out += " ";
        i += 1;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        out += " ";
        i += 1;
        continue;
      }
      if (ch === stringChar) {
        stringChar = null;
        out += " ";
        i += 1;
        continue;
      }
      out += ch === "\n" ? "\n" : " ";
      i += 1;
      continue;
    }

    if (ch === "/" && next === "/") {
      inLineComment = true;
      i += 2;
      out += "  ";
      continue;
    }
    if (ch === "/" && next === "*") {
      inBlockComment = true;
      i += 2;
      out += "  ";
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      stringChar = ch;
      out += " ";
      i += 1;
      continue;
    }

    // Decode \uNNNN and \u{NNNN} unicode escapes. These frequently appear in
    // obfuscated identifiers like "\u0046unction". Only decode to BMP.
    if (ch === "\\" && next === "u") {
      const braceMatch = /^\\u\{([0-9a-fA-F]+)\}/.exec(raw.slice(i));
      const hexMatch = /^\\u([0-9a-fA-F]{4})/.exec(raw.slice(i));
      if (braceMatch) {
        const code = parseInt(braceMatch[1], 16);
        if (code < 0x10000) out += String.fromCharCode(code);
        else out += "_";
        i += braceMatch[0].length;
        continue;
      }
      if (hexMatch) {
        out += String.fromCharCode(parseInt(hexMatch[1], 16));
        i += hexMatch[0].length;
        continue;
      }
    }

    out += ch;
    i += 1;
  }

  return out;
}

// Cheap token count: identifiers, numbers, and punctuation groups. Not a real
// parser, just enough to reject pathological inputs.
function countTokens(source: string): number {
  let count = 0;
  const re = /[A-Za-z_$][A-Za-z0-9_$]*|\d+|[^\sA-Za-z0-9_$]/g;
  while (re.exec(source) !== null) count += 1;
  return count;
}
