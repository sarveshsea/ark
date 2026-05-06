use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::{
    collections::HashMap,
    env,
    fs,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};

const HARNESS_MANIFEST_JSON: &str = include_str!("../../../../src/studio/harness-manifest.json");

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HarnessManifest {
    pub schema_version: u8,
    pub hardline_blocked_patterns: Vec<BlockedPattern>,
    pub harnesses: Vec<HarnessDefinition>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockedPattern {
    pub pattern: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct HarnessDefinition {
    pub id: String,
    pub label: String,
    pub kind: String,
    pub provider: String,
    pub command: String,
    pub description: String,
    pub enabled_by_default: bool,
    pub install_probe: Vec<String>,
    pub capabilities: Vec<String>,
    pub command_templates: HashMap<String, Vec<String>>,
    pub env_policy: String,
    pub workspace_policy: String,
    pub supports_streaming: bool,
    pub supports_cancel: bool,
    pub output_parser: String,
    pub default_model: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct HarnessStatus {
    pub id: String,
    pub label: String,
    pub kind: String,
    pub provider: String,
    pub command: String,
    pub description: String,
    pub enabled: bool,
    pub installed: bool,
    #[serde(rename = "resolvedPath")]
    pub resolved_path: Option<String>,
    #[serde(rename = "supportsCancel")]
    pub supports_cancel: bool,
    #[serde(rename = "outputParser")]
    pub output_parser: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StudioStatus {
    pub status: String,
    #[serde(rename = "projectRoot")]
    pub project_root: String,
    pub config: StudioConfigSummary,
    pub harnesses: Vec<HarnessStatus>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StudioConfigSummary {
    #[serde(rename = "schemaVersion")]
    pub schema_version: u8,
    #[serde(rename = "defaultHarness")]
    pub default_harness: String,
    #[serde(rename = "workspaceRoots")]
    pub workspace_roots: Vec<String>,
    #[serde(rename = "defaultModel")]
    pub default_model: Option<String>,
    pub providers: Value,
    #[serde(rename = "enabledTools")]
    pub enabled_tools: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionSummary {
    pub id: String,
    pub harness: String,
    pub cwd: String,
    pub prompt: String,
    pub status: String,
    #[serde(rename = "startedAt")]
    pub started_at: String,
    #[serde(rename = "completedAt")]
    pub completed_at: Option<String>,
    #[serde(rename = "exitCode")]
    pub exit_code: Option<i32>,
    #[serde(rename = "eventCount")]
    pub event_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceEntry {
    pub name: String,
    pub path: String,
    #[serde(rename = "type")]
    pub kind: String,
}

#[derive(Debug, Clone)]
pub struct CommandSpec {
    pub command: String,
    pub args: Vec<String>,
}

pub fn studio_status(project_root: &Path) -> StudioStatus {
    let root = project_root.to_string_lossy().to_string();
    StudioStatus {
        status: "ready".to_string(),
        project_root: root.clone(),
        config: studio_config(project_root),
        harnesses: list_harnesses(),
    }
}

pub fn studio_config(project_root: &Path) -> StudioConfigSummary {
    let root = project_root.to_string_lossy().to_string();
    let mut config = StudioConfigSummary {
        schema_version: 1,
        default_harness: "memoire".to_string(),
        workspace_roots: vec![root],
        default_model: None,
        providers: json!({
            "anthropic": { "enabled": true, "envKey": "ANTHROPIC_API_KEY" },
            "openai": { "enabled": true, "envKey": "OPENAI_API_KEY" },
            "openaiCompatible": { "enabled": false, "baseUrl": null, "envKey": null },
            "ollama": { "enabled": true, "baseUrl": "http://127.0.0.1:11434", "defaultModel": "llama3.1:8b" }
        }),
        enabled_tools: json!({
            "shell": false,
            "browser": true,
            "figma": true,
            "mcp": true
        }),
    };

    let path = project_root.join(".memoire").join("studio").join("config.json");
    if let Ok(raw) = fs::read_to_string(path) {
        if let Ok(saved) = serde_json::from_str::<Value>(&raw) {
            if let Some(default_harness) = saved.get("defaultHarness").and_then(Value::as_str) {
                config.default_harness = default_harness.to_string();
            }
            if let Some(workspace_roots) = saved.get("workspaceRoots").and_then(Value::as_array) {
                let roots = workspace_roots
                    .iter()
                    .filter_map(Value::as_str)
                    .map(ToString::to_string)
                    .collect::<Vec<_>>();
                if !roots.is_empty() {
                    config.workspace_roots = roots;
                }
            }
            if saved.get("defaultModel").is_some() {
                config.default_model = saved
                    .get("defaultModel")
                    .and_then(Value::as_str)
                    .map(ToString::to_string);
            }
            if let Some(providers) = saved.get("providers") {
                merge_json_object(&mut config.providers, providers);
            }
            if let Some(enabled_tools) = saved.get("enabledTools") {
                merge_json_object(&mut config.enabled_tools, enabled_tools);
            }
        }
    }

    config
}

pub fn list_harnesses() -> Vec<HarnessStatus> {
    harness_manifest()
        .harnesses
        .into_iter()
        .map(|harness| {
            let resolved_path = harness
                .install_probe
                .iter()
                .find_map(|command| command_path(command))
                .or_else(|| command_path(&harness.command));
            let installed = resolved_path.is_some();
            HarnessStatus {
                id: harness.id,
                label: harness.label,
                kind: harness.kind,
                provider: harness.provider,
                command: harness.command,
                description: harness.description,
                enabled: harness.enabled_by_default,
                installed,
                resolved_path: resolved_path.map(|path| path.to_string_lossy().to_string()),
                supports_cancel: harness.supports_cancel,
                output_parser: harness.output_parser,
            }
        })
        .collect()
}

pub fn build_command_for_action(
    harness: &str,
    prompt: &str,
    action: Option<&str>,
) -> Result<CommandSpec, String> {
    let manifest = harness_manifest();
    let Some(definition) = manifest.harnesses.into_iter().find(|entry| entry.id == harness) else {
        return Err(format!("Unknown harness: {harness}"));
    };
    if !definition.enabled_by_default {
        return Err(format!("Harness {harness} is disabled by default in the desktop shell"));
    }
    let action = action.unwrap_or(if definition.id == "memoire" { "compose" } else { "raw" });
    let Some(template) = definition
        .command_templates
        .get(action)
        .or_else(|| definition.command_templates.get("raw"))
    else {
        return Err(format!("Harness {harness} does not support action {action}"));
    };
    Ok(CommandSpec {
        command: command_path(&definition.command)
            .or_else(|| definition.install_probe.iter().find_map(|probe| command_path(probe)))
            .unwrap_or_else(|| PathBuf::from(&definition.command))
            .to_string_lossy()
            .to_string(),
        args: template
            .iter()
            .map(|part| {
                let envelope = design_agent_envelope(harness, action, prompt);
                let system_prompt = design_agent_system_prompt(harness, action);
                part.replace("{{prompt}}", prompt)
                    .replace("{{promptEnvelope}}", &envelope)
                    .replace("{{agentSystemPrompt}}", &system_prompt)
                    .replace("{{ollamaModel}}", definition.default_model.as_deref().unwrap_or("llama3.2"))
            })
            .collect(),
    })
}

fn design_agent_system_prompt(harness: &str, action: &str) -> String {
    format!(
        "You are the Mémoire Studio design harness. Act as a product design, UX research, and design-system agent before acting as a coding agent. Preserve Atomic Design levels and ask for approval before destructive host actions. Current action: {action}. Current harness: {harness}."
    )
}

fn design_agent_envelope(harness: &str, action: &str, prompt: &str) -> String {
    format!(
        "# Mémoire Studio Agent Task\n\n## Design/research lens\n- Start from UX research, information architecture, accessibility, and design-system coherence.\n- Keep component thinking in Atomic design levels: atom -> molecule -> organism -> template -> page.\n- Use project memory, specs, references, and Figma state when available.\n- Report discoveries as research_note, design_decision, tool_call, artifact, and session_result when possible.\n\n## Harness behavior\n- Harness: {harness}\n- Action: {action}\n- Do not run destructive commands without explicit approval.\n- Produce a concise final session_result with artifacts, assumptions, and next design/research step.\n\n## User request\n{prompt}"
    )
}

pub fn read_workspace(path: &Path) -> Result<Vec<WorkspaceEntry>, String> {
    let mut entries = Vec::new();
    for entry in fs::read_dir(path).map_err(|err| err.to_string())? {
        let entry = entry.map_err(|err| err.to_string())?;
        let file_name = entry.file_name().to_string_lossy().to_string();
        if file_name == "node_modules" || file_name.starts_with(".git") {
            continue;
        }
        let file_type = entry.file_type().map_err(|err| err.to_string())?;
        entries.push(WorkspaceEntry {
            name: file_name,
            path: entry.path().to_string_lossy().to_string(),
            kind: if file_type.is_dir() { "directory" } else { "file" }.to_string(),
        });
    }
    entries.sort_by(|left, right| left.name.cmp(&right.name));
    Ok(entries)
}

pub fn redact_secrets(input: &str) -> String {
    let mut output = input.to_string();
    for name in ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "FIGMA_TOKEN", "GITHUB_TOKEN"] {
        output = redact_env_assignment(&output, name);
    }
    redact_bearer(&output)
}

pub fn harness_manifest() -> HarnessManifest {
    serde_json::from_str(HARNESS_MANIFEST_JSON).expect("valid Studio harness manifest")
}

fn command_path(command: &str) -> Option<PathBuf> {
    let mut paths: Vec<PathBuf> = env::var_os("PATH")
        .map(|paths| env::split_paths(&paths).collect())
        .unwrap_or_default();
    if let Some(home) = env::var_os("HOME") {
        let home = PathBuf::from(home);
        paths.push(home.join(".local").join("bin"));
        paths.push(home.join(".npm-global").join("bin"));
    }
    paths.extend([
        PathBuf::from("/opt/homebrew/bin"),
        PathBuf::from("/usr/local/bin"),
        PathBuf::from("/usr/bin"),
        PathBuf::from("/bin"),
    ]);
    paths.into_iter().find_map(|path| {
        let candidate = path.join(command);
        if candidate.is_file() {
            Some(candidate)
        } else {
            None
        }
    })
}

fn merge_json_object(target: &mut Value, source: &Value) {
    let (Some(target_object), Some(source_object)) = (target.as_object_mut(), source.as_object()) else {
        return;
    };
    for (key, value) in source_object {
        match (target_object.get_mut(key), value) {
            (Some(target_child), Value::Object(_)) => merge_json_object(target_child, value),
            _ => {
                target_object.insert(key.clone(), value.clone());
            }
        }
    }
}

fn redact_env_assignment(input: &str, name: &str) -> String {
    input
        .lines()
        .map(|line| {
            if line.starts_with(&format!("{name}=")) {
                format!("{name}=[redacted]")
            } else {
                line.to_string()
            }
        })
        .collect::<Vec<_>>()
        .join("\n")
}

fn redact_bearer(input: &str) -> String {
    input
        .lines()
        .map(|line| {
            if let Some(index) = line.to_ascii_lowercase().find("authorization: bearer ") {
                let prefix_len = index + "Authorization: Bearer ".len();
                format!("{}[redacted]", &line[..prefix_len])
            } else {
                line.to_string()
            }
        })
        .collect::<Vec<_>>()
        .join("\n")
}

pub fn unix_millis() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or_default()
}

pub fn current_dir() -> PathBuf {
    env::current_dir().unwrap_or_else(|_| PathBuf::from("."))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn builds_memoire_command_without_shell_interpolation() {
        let command = build_command_for_action("memoire", "create a hero", None).expect("command");
        assert!(command.command.ends_with("memi"));
        assert_eq!(
            command.args,
            vec!["compose", "create a hero", "--json", "--no-figma"]
        );
    }

    #[test]
    fn loads_shared_harness_manifest() {
        let manifest = harness_manifest();
        let codex = manifest
            .harnesses
            .iter()
            .find(|entry| entry.id == "codex")
            .expect("codex manifest entry");
        assert_eq!(manifest.schema_version, 1);
        assert_eq!(codex.provider, "openai");
        assert_eq!(codex.output_parser, "codex-jsonl");
    }

    #[test]
    fn external_agents_receive_design_research_envelope() {
        let command = build_command_for_action("codex", "audit the workbench", Some("audit"))
            .expect("codex command");
        let prompt = command.args.last().expect("prompt");
        assert!(prompt.contains("# Mémoire Studio Agent Task"));
        assert!(prompt.contains("UX research"));
        assert!(prompt.contains("Atomic design levels"));

        let claude = build_command_for_action("claude-code", "compose a flow", Some("compose"))
            .expect("claude command");
        assert!(claude.args.contains(&"--append-system-prompt".to_string()));
        assert!(claude.args.last().expect("prompt").contains("design_decision"));
    }

    #[test]
    fn shell_is_disabled_by_default() {
        let error = build_command_for_action("shell", "echo hi", None).expect_err("shell should fail");
        assert!(error.contains("disabled"));
    }

    #[test]
    fn redacts_provider_secrets() {
        let redacted = redact_secrets(
            "ANTHROPIC_API_KEY=sk-ant-secret\nAuthorization: Bearer abc.def",
        );
        assert_eq!(
            redacted,
            "ANTHROPIC_API_KEY=[redacted]\nAuthorization: Bearer [redacted]"
        );
    }
}
