pub mod markdown_corpus;
mod studio;

use serde::Serialize;
use serde_json::Value;
use std::{
    collections::HashMap,
    fs,
    io::{BufRead, BufReader},
    path::PathBuf,
    process::{Command, Stdio},
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex,
    },
    thread,
    time::Duration,
};
use tauri::{AppHandle, Emitter, Manager, State};

#[derive(Default)]
struct AppState {
    processes: Mutex<HashMap<String, Arc<Mutex<std::process::Child>>>>,
    markdown_corpus_cancel: AtomicBool,
}

#[derive(Debug, Clone, Serialize)]
struct DesktopStudioEvent {
    id: String,
    #[serde(rename = "sessionId")]
    session_id: String,
    #[serde(rename = "type")]
    event_type: String,
    timestamp: String,
    message: String,
}

#[tauri::command]
fn studio_status() -> Result<studio::StudioStatus, String> {
    Ok(studio::studio_status(&studio::current_dir()))
}

#[tauri::command]
fn studio_config() -> Result<studio::StudioConfigSummary, String> {
    Ok(studio::studio_config(&studio::current_dir()))
}

#[tauri::command]
fn list_harnesses() -> Result<Vec<studio::HarnessStatus>, String> {
    Ok(studio::list_harnesses())
}

#[tauri::command]
fn start_session(
    app: AppHandle,
    state: State<AppState>,
    harness: String,
    cwd: String,
    prompt: String,
    action: Option<String>,
) -> Result<studio::SessionSummary, String> {
    let command = studio::build_command_for_action(&harness, &prompt, action.as_deref())?;
    let session_id = format!("desktop-{}", studio::unix_millis());
    let started_at = studio::unix_millis().to_string();
    let cwd_path = PathBuf::from(&cwd);
    let mut child = Command::new(&command.command)
        .args(&command.args)
        .current_dir(&cwd_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|err| format!("Failed to start {}: {err}", command.command))?;

    let stdout = child.stdout.take();
    let stderr = child.stderr.take();
    let child = Arc::new(Mutex::new(child));
    state
        .processes
        .lock()
        .map_err(|_| "Process registry lock failed".to_string())?
        .insert(session_id.clone(), child.clone());

    emit_event(&app, &session_id, "session_started", &format!("Started {harness}"));
    if let Some(stdout) = stdout {
        spawn_reader(app.clone(), session_id.clone(), "stdout", stdout);
    }
    if let Some(stderr) = stderr {
        spawn_reader(app.clone(), session_id.clone(), "stderr", stderr);
    }
    spawn_waiter(app.clone(), session_id.clone(), child);

    Ok(studio::SessionSummary {
        id: session_id,
        harness,
        cwd,
        prompt,
        status: "running".to_string(),
        started_at,
        completed_at: None,
        exit_code: None,
        event_count: 1,
    })
}

#[tauri::command]
fn cancel_session(app: AppHandle, state: State<AppState>, id: String) -> Result<bool, String> {
    let child = state
        .processes
        .lock()
        .map_err(|_| "Process registry lock failed".to_string())?
        .remove(&id);
    let Some(child) = child else {
        return Ok(false);
    };
    let mut child = child.lock().map_err(|_| "Child process lock failed".to_string())?;
    let _ = child.kill();
    emit_event(&app, &id, "session_done", "Cancellation requested");
    Ok(true)
}

#[tauri::command]
fn read_workspace(path: String) -> Result<Vec<studio::WorkspaceEntry>, String> {
    studio::read_workspace(&PathBuf::from(path))
}

#[tauri::command]
fn open_artifact(path: String) -> Result<String, String> {
    Ok(path)
}

#[tauri::command]
fn save_config(config: Value) -> Result<bool, String> {
    let pretty = serde_json::to_string_pretty(&config).map_err(|err| err.to_string())?;
    let path = studio::current_dir().join(".memoire").join("studio").join("config.json");
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|err| err.to_string())?;
    }
    fs::write(path, format!("{pretty}\n")).map_err(|err| err.to_string())?;
    Ok(true)
}

#[tauri::command]
fn setup_markdown_corpus(
    app: AppHandle,
    state: State<AppState>,
    catalog: Option<Vec<markdown_corpus::CorpusRepo>>,
) -> Result<markdown_corpus::CorpusStatus, String> {
    let repos = catalog.unwrap_or_else(markdown_corpus::default_corpus_catalog);
    let root = studio::current_dir();
    state.markdown_corpus_cancel.store(false, Ordering::Relaxed);
    let _ = app.emit(
        "markdown-corpus-event",
        serde_json::json!({ "status": "downloading", "repos": repos.len() }),
    );
    let status = markdown_corpus::setup_markdown_corpus_at_with_cancel(
        &root,
        &repos,
        &state.markdown_corpus_cancel,
    )?;
    let _ = app.emit("markdown-corpus-event", &status);
    Ok(status)
}

#[tauri::command]
fn cancel_markdown_corpus_setup(state: State<AppState>) -> Result<bool, String> {
    state.markdown_corpus_cancel.store(true, Ordering::Relaxed);
    Ok(true)
}

#[tauri::command]
fn get_markdown_corpus_status() -> Result<markdown_corpus::CorpusStatus, String> {
    markdown_corpus::get_markdown_corpus_status_at(&studio::current_dir())
}

#[tauri::command]
fn analyze_markdown_for_fig_jam(path: String) -> Result<markdown_corpus::MarkdownAnalysisReport, String> {
    markdown_corpus::analyze_markdown_file(&PathBuf::from(path))
}

pub fn run() {
    tauri::Builder::default()
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            studio_status,
            studio_config,
            list_harnesses,
            start_session,
            cancel_session,
            read_workspace,
            open_artifact,
            save_config,
            setup_markdown_corpus,
            cancel_markdown_corpus_setup,
            get_markdown_corpus_status,
            analyze_markdown_for_fig_jam
        ])
        .run(tauri::generate_context!())
        .expect("error while running Mémoire Studio");
}

fn spawn_reader<R: std::io::Read + Send + 'static>(
    app: AppHandle,
    session_id: String,
    event_type: &'static str,
    stream: R,
) {
    thread::spawn(move || {
        let reader = BufReader::new(stream);
        for line in reader.lines().map_while(Result::ok) {
            emit_event(&app, &session_id, event_type, &studio::redact_secrets(&line));
        }
    });
}

fn spawn_waiter(app: AppHandle, session_id: String, child: Arc<Mutex<std::process::Child>>) {
    thread::spawn(move || loop {
        let status = {
            let mut child = match child.lock() {
                Ok(child) => child,
                Err(_) => {
                    emit_event(&app, &session_id, "session_error", "Child process lock failed");
                    return;
                }
            };
            child.try_wait()
        };

        match status {
            Ok(Some(exit_status)) => {
                if exit_status.success() {
                    emit_event(&app, &session_id, "session_done", "Session completed");
                } else {
                    emit_event(
                        &app,
                        &session_id,
                        "session_error",
                        &format!("Session exited with code {:?}", exit_status.code()),
                    );
                }
                if let Some(state) = app.try_state::<AppState>() {
                    if let Ok(mut processes) = state.processes.lock() {
                        processes.remove(&session_id);
                    }
                }
                return;
            }
            Ok(None) => thread::sleep(Duration::from_millis(100)),
            Err(err) => {
                emit_event(&app, &session_id, "session_error", &err.to_string());
                return;
            }
        }
    });
}

fn emit_event(app: &AppHandle, session_id: &str, event_type: &str, message: &str) {
    let event = DesktopStudioEvent {
        id: format!("event-{}", studio::unix_millis()),
        session_id: session_id.to_string(),
        event_type: event_type.to_string(),
        timestamp: studio::unix_millis().to_string(),
        message: message.to_string(),
    };
    let _ = app.emit("studio-event", event);
}
