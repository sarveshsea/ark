// Exercises the slot-hash memoization primitive used by ui/main.ts#render.
// We replicate the primitive locally so the test doesn't need a real
// document / mount — the invariant under test is "only mutate a slot whose
// signature changed" which is pure logic.

import { describe, expect, it } from "vitest";

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
  }
  return hash.toString(16);
}

function createSlotWriter() {
  const slots = new Map<string, string>();
  const writes: Array<{ slot: string; html: string }> = [];
  return {
    write(slot: string, html: string): boolean {
      const sig = fnv1a(html);
      if (slots.get(slot) === sig) return false;
      slots.set(slot, sig);
      writes.push({ slot, html });
      return true;
    },
    writes,
  };
}

describe("slot writer (mirrors ui/main.ts#writeSlotIfChanged)", () => {
  it("writes on first call", () => {
    const w = createSlotWriter();
    expect(w.write("a", "<div>x</div>")).toBe(true);
    expect(w.writes).toHaveLength(1);
  });

  it("skips identical content on second call", () => {
    const w = createSlotWriter();
    w.write("a", "<div>x</div>");
    expect(w.write("a", "<div>x</div>")).toBe(false);
    expect(w.writes).toHaveLength(1);
  });

  it("writes when content changes", () => {
    const w = createSlotWriter();
    w.write("a", "<div>x</div>");
    expect(w.write("a", "<div>y</div>")).toBe(true);
    expect(w.writes).toHaveLength(2);
  });

  it("slots are isolated — one changing doesn't invalidate the other", () => {
    const w = createSlotWriter();
    w.write("a", "<div>x</div>");
    w.write("b", "<div>y</div>");
    expect(w.write("a", "<div>z</div>")).toBe(true);
    expect(w.write("b", "<div>y</div>")).toBe(false);
    expect(w.writes.map((v) => v.slot)).toEqual(["a", "b", "a"]);
  });

  it("is stable across 1000 identical calls", () => {
    const w = createSlotWriter();
    w.write("a", "hello");
    for (let i = 0; i < 1000; i += 1) w.write("a", "hello");
    expect(w.writes).toHaveLength(1);
  });

  it("different payloads with same length produce different signatures", () => {
    expect(fnv1a("abc")).not.toBe(fnv1a("bca"));
  });
});
