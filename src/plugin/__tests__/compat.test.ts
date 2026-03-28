import { describe, expect, it } from "vitest";
import { arrayIncludes, findFirst, findIndexBy, padStart2, stringIncludes, uniqueStrings } from "../shared/compat.js";

describe("plugin compatibility helpers", () => {
  it("provides array and string search helpers without modern runtime dependencies", () => {
    expect(arrayIncludes(["a", "b", "c"], "b")).toBe(true);
    expect(arrayIncludes(["a", "b", "c"], "z")).toBe(false);
    expect(stringIncludes("memoire-control-plane", "control")).toBe(true);
    expect(stringIncludes("memoire-control-plane", "widget")).toBe(false);
  });

  it("finds values and indices predictably", () => {
    const values = [{ id: "a" }, { id: "b" }, { id: "c" }];

    expect(findFirst(values, (value) => value.id === "b")).toEqual({ id: "b" });
    expect(findFirst(values, (value) => value.id === "z")).toBeNull();
    expect(findIndexBy(values, (value) => value.id === "c")).toBe(2);
    expect(findIndexBy(values, (value) => value.id === "z")).toBe(-1);
  });

  it("pads hex/time fragments and uniquifies strings", () => {
    expect(padStart2(0)).toBe("00");
    expect(padStart2("a")).toBe("0a");
    expect(padStart2("ff")).toBe("ff");
    expect(uniqueStrings(["a", "b", "a", "c", "b"])).toEqual(["a", "b", "c"]);
  });
});
