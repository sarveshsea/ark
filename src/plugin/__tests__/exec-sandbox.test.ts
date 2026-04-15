import { describe, expect, it } from "vitest";
import {
  EXEC_MAX_LENGTH,
  EXEC_MAX_TOKENS,
  guardExecCode,
  normalizeCode,
  withExecTimeout,
} from "../main/exec/sandbox.js";

describe("guardExecCode — accepts safe code", () => {
  it("allows a plain read of a node", () => {
    expect(guardExecCode("return figma.currentPage.name;").ok).toBe(true);
  });
  it("allows Math and arithmetic", () => {
    expect(guardExecCode("return Math.max(1, 2, 3);").ok).toBe(true);
  });
  it("allows template strings containing banned identifiers", () => {
    // Banned tokens inside strings are stripped during normalization.
    expect(guardExecCode("return `closePlugin is dangerous`;").ok).toBe(true);
  });
  it("allows dot access on figma", () => {
    expect(guardExecCode("return figma.currentPage.selection.length;").ok).toBe(true);
  });
});

describe("guardExecCode — rejects hostile code", () => {
  const hostileFixtures: Array<{ name: string; code: string; expectCode: string }> = [
    { name: "direct closePlugin", code: "figma.closePlugin();", expectCode: "E_EXEC_REJECTED" },
    { name: "computed access closePlugin", code: "figma['closePlugin']();", expectCode: "E_EXEC_REJECTED" },
    { name: "computed access via concat", code: "figma['clos'+'ePlugin']();", expectCode: "E_EXEC_REJECTED" },
    { name: "unicode-escaped Function", code: "var f = \\u0046unction;", expectCode: "E_EXEC_REJECTED" },
    { name: "new Function()", code: "new Function('return 1')();", expectCode: "E_EXEC_REJECTED" },
    { name: "eval", code: "eval('1');", expectCode: "E_EXEC_REJECTED" },
    { name: "setTimeout", code: "setTimeout(() => {}, 0);", expectCode: "E_EXEC_REJECTED" },
    { name: "setInterval", code: "setInterval(() => {}, 0);", expectCode: "E_EXEC_REJECTED" },
    { name: "while(true)", code: "while (true) { }", expectCode: "E_EXEC_REJECTED" },
    { name: "while(1)", code: "while (1) { }", expectCode: "E_EXEC_REJECTED" },
    { name: "do-while(true)", code: "do { } while (true);", expectCode: "E_EXEC_REJECTED" },
    { name: "for(;;)", code: "for (;;) { }", expectCode: "E_EXEC_REJECTED" },
    { name: "globalThis", code: "globalThis.foo = 1;", expectCode: "E_EXEC_REJECTED" },
    { name: "proto pollution __proto__", code: "x.__proto__ = null;", expectCode: "E_EXEC_REJECTED" },
    { name: "constructor.constructor", code: "({}).constructor.constructor('x');", expectCode: "E_EXEC_REJECTED" },
    { name: "window access", code: "window.alert('x');", expectCode: "E_EXEC_REJECTED" },
    { name: "self access", code: "self.foo = 1;", expectCode: "E_EXEC_REJECTED" },
    { name: "import()", code: "await import('./a');", expectCode: "E_EXEC_REJECTED" },
    { name: "require()", code: "require('a');", expectCode: "E_EXEC_REJECTED" },
    { name: "bracket on globalThis", code: "globalThis['eval']('x');", expectCode: "E_EXEC_REJECTED" },
  ];

  for (const fx of hostileFixtures) {
    it(`rejects: ${fx.name}`, () => {
      const res = guardExecCode(fx.code);
      expect(res.ok).toBe(false);
      expect(res.error?.code).toBe(fx.expectCode);
    });
  }
});

describe("guardExecCode — size and token limits", () => {
  it("rejects code exceeding max length with E_EXEC_TOO_LARGE", () => {
    const big = "a".repeat(EXEC_MAX_LENGTH + 1);
    const res = guardExecCode(big);
    expect(res.ok).toBe(false);
    expect(res.error?.code).toBe("E_EXEC_TOO_LARGE");
  });

  it("rejects pathological token count", () => {
    // Generate many tokens by repeating a safe pattern.
    const chunk = "a;".repeat(EXEC_MAX_TOKENS + 100);
    const res = guardExecCode(chunk);
    expect(res.ok).toBe(false);
    expect(res.error?.code).toBe("E_EXEC_TOO_LARGE");
  });

  it("rejects non-string input", () => {
    const res = guardExecCode(42 as unknown as string);
    expect(res.ok).toBe(false);
    expect(res.error?.code).toBe("E_PARAM_INVALID");
  });
});

describe("normalizeCode — strips strings and comments", () => {
  it("strips double-quoted strings", () => {
    expect(normalizeCode('var x = "closePlugin"; return 1;')).not.toContain("closePlugin");
  });
  it("strips single-quoted strings", () => {
    expect(normalizeCode("var x = 'eval'; return 1;")).not.toContain("eval");
  });
  it("strips template strings", () => {
    expect(normalizeCode("var x = `eval`; return 1;")).not.toContain("eval");
  });
  it("strips line comments", () => {
    expect(normalizeCode("// closePlugin\nreturn 1;")).not.toContain("closePlugin");
  });
  it("strips block comments", () => {
    expect(normalizeCode("/* closePlugin */ return 1;")).not.toContain("closePlugin");
  });
  it("decodes \\uNNNN escapes so banned tokens surface", () => {
    const out = normalizeCode("var f = \\u0046unction;");
    expect(out).toContain("Function");
  });
  it("decodes \\u{NNNN} escapes", () => {
    const out = normalizeCode("var f = \\u{46}unction;");
    expect(out).toContain("Function");
  });
});

describe("withExecTimeout", () => {
  it("resolves when work completes before deadline", async () => {
    const result = await withExecTimeout(Promise.resolve("ok"), 1000);
    expect(result).toBe("ok");
  });

  it("rejects with E_EXEC_TIMEOUT when deadline fires", async () => {
    const never = new Promise<string>(() => {});
    await expect(withExecTimeout(never, 50)).rejects.toMatchObject({
      widgetError: { code: "E_EXEC_TIMEOUT" },
    });
  });
});
