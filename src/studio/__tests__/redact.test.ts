import { describe, expect, it } from "vitest";
import { redactSecrets } from "../redact.js";

describe("studio redaction", () => {
  it("redacts common provider keys and bearer tokens from logs", () => {
    const input = [
      "ANTHROPIC_API_KEY=sk-ant-secret",
      "OPENAI_API_KEY=sk-openai-secret",
      "Authorization: Bearer abc.def.ghi",
    ].join("\n");

    expect(redactSecrets(input)).toBe([
      "ANTHROPIC_API_KEY=[redacted]",
      "OPENAI_API_KEY=[redacted]",
      "Authorization: Bearer [redacted]",
    ].join("\n"));
  });
});
