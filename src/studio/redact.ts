const ENV_SECRET_NAMES = [
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "FIGMA_TOKEN",
  "GITHUB_TOKEN",
  "SUPABASE_ACCESS_TOKEN",
  "VERCEL_TOKEN",
];

export function redactSecrets(input: string): string {
  let output = input;
  for (const name of ENV_SECRET_NAMES) {
    output = output.replace(new RegExp(`(${name}=)[^\\s]+`, "g"), "$1[redacted]");
  }
  output = output.replace(/(Authorization:\s*Bearer\s+)[^\s]+/gi, "$1[redacted]");
  output = output.replace(/\b(sk-(?:ant|proj|live|test|openai)[A-Za-z0-9_\-]+)\b/g, "[redacted]");
  return output;
}
