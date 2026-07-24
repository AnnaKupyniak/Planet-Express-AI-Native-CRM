import json
import os

_AGENT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_LOG_FILE = os.path.join(_AGENT_DIR, "..", "logs", "trace.jsonl")
DEFAULT_LOG_FILE = os.path.normpath(DEFAULT_LOG_FILE)
CURRENT_LOG_FILE = DEFAULT_LOG_FILE

def set_log_file(filepath: str):
    global CURRENT_LOG_FILE
    CURRENT_LOG_FILE = filepath

def reset_log():
    os.makedirs(os.path.dirname(CURRENT_LOG_FILE), exist_ok=True)
    # Не видаляємо вміст файлу, щоб зберігати історію всіх запитів
    pass

def log_step(step: int, tool_name: str, args: dict, result, error: str = None, http_status: int = None):
    log_dir = os.path.dirname(CURRENT_LOG_FILE)
    if log_dir:
        os.makedirs(log_dir, exist_ok=True)
        
    payload = {
        "step": step,
        "tool": tool_name,
        "args": args,
        "result": result,
        "error": error
    }
    if http_status is not None:
        payload["http_status"] = http_status
    
    with open(CURRENT_LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(payload, ensure_ascii=False) + "\n")
        f.flush()