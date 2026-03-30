/**
 * CLI command: memi mcp — Start Mémoire as an MCP server (stdio transport).
 */

import type { Command } from "commander";
import type { MemoireEngine } from "../engine/core.js";
import { startStdioMcpServer } from "../mcp/server.js";
import { ui } from "../tui/format.js";

export function registerMcpCommand(program: Command, engine: MemoireEngine): void {
  const mcp = program
    .command("mcp")
    .description("MCP server commands (start, config)");

  mcp
    .command("start")
    .description("Start Mémoire as an MCP server (stdio transport)")
    .option("--no-figma", "Skip Figma bridge connection")
    .action(async (opts) => {
      await startStdioMcpServer(engine, opts.figma !== false);
    });

  mcp
    .command("config")
    .description("Print MCP config snippets for Claude Code, Cursor, or generic JSON")
    .option("--target <target>", "Config target: claude-code, cursor, generic", "claude-code")
    .option("--global", "Use global memi binary (default). Use --no-global for npx.")
    .action(async (opts: { target: string; global?: boolean }) => {
      const useGlobal = opts.global !== false;
      const cmd = useGlobal ? "memi" : "npx";
      const args = useGlobal ? ["mcp", "start"] : ["@sarveshsea/memoire", "mcp", "start"];

      const serverConfig = {
        command: cmd,
        args,
        env: {
          FIGMA_TOKEN: "${FIGMA_TOKEN}",
          FIGMA_FILE_KEY: "${FIGMA_FILE_KEY}",
        },
      };

      switch (opts.target) {
        case "claude-code": {
          const config = {
            mcpServers: {
              memoire: serverConfig,
            },
          };
          console.log();
          console.log(ui.section("CLAUDE CODE MCP CONFIG"));
          console.log();
          console.log("  Add to .mcp.json in your project root:");
          console.log();
          console.log(JSON.stringify(config, null, 2));
          console.log();
          console.log("  Or add to ~/.claude/settings.json under mcpServers for global access.");
          console.log();
          break;
        }

        case "cursor": {
          const config = {
            mcpServers: {
              memoire: {
                command: cmd,
                args,
              },
            },
          };
          console.log();
          console.log(ui.section("CURSOR MCP CONFIG"));
          console.log();
          console.log("  Add to .cursor/mcp.json in your project root:");
          console.log();
          console.log(JSON.stringify(config, null, 2));
          console.log();
          break;
        }

        default: {
          const config = {
            mcpServers: {
              memoire: serverConfig,
            },
          };
          console.log(JSON.stringify(config, null, 2));
          break;
        }
      }

      console.log(ui.section("AVAILABLE TOOLS (14)"));
      console.log();
      const tools = [
        ["pull_design_system", "Pull tokens, components, styles from Figma"],
        ["get_specs / get_spec", "List or read component/page/dataviz specs"],
        ["create_spec", "Create or update a spec (JSON)"],
        ["generate_code", "Generate code from a spec"],
        ["get_tokens / update_token", "Read or modify design tokens"],
        ["capture_screenshot", "Screenshot a Figma node (PNG/SVG)"],
        ["get_selection", "Current Figma selection with properties"],
        ["compose", "Natural language design intent orchestration"],
        ["run_audit", "Design system quality audit"],
        ["get_research", "Research store (insights, personas)"],
        ["figma_execute", "Run Plugin API code in Figma sandbox"],
        ["get_page_tree", "Figma page structure (pages, frames)"],
      ];
      for (const [name, desc] of tools) {
        console.log(`  ${name.padEnd(28)} ${ui.dim(desc)}`);
      }
      console.log();

      console.log(ui.section("RESOURCES (3)"));
      console.log();
      console.log("  memoire://design-system     Current tokens, components, styles");
      console.log("  memoire://specs/{name}       Individual spec by name");
      console.log("  memoire://project            Project context and framework info");
      console.log();
    });

  // Keep backward compat — bare `memi mcp` still starts the server
  mcp.action(async () => {
    await startStdioMcpServer(engine, true);
  });
}
