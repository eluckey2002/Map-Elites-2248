"""Loopback-only, read-only HTTP view of the Blackboard ledger."""
from __future__ import annotations

import argparse
import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, abort, jsonify, request, send_file, send_from_directory

import snapshot_liveboard as journal

ROOT = Path(__file__).resolve().parent
DATABASE = ROOT / "runtime" / "board.sqlite"
TASK_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]+$")
ALLOWED_LIVEBOARD_ARTIFACT_SUFFIXES = {".md", ".json", ".txt"}
ALLOWED_STATIC_FILES = {"app.js", "index.html", "style.css"}
app = Flask(__name__, static_folder=None)


def allowed_liveboard_artifact(task_id: str, path: str) -> Path | None:
    """Resolve only the exact task's stored artifact inside this ledger's runtime folder."""
    if not TASK_ID_PATTERN.fullmatch(task_id) or not path:
        return None
    candidate = Path(path).resolve()
    runtime_root = DATABASE.resolve().parent
    try:
        candidate.relative_to(runtime_root)
    except ValueError:
        return None
    if (
        not candidate.is_file()
        or candidate.suffix.lower() not in ALLOWED_LIVEBOARD_ARTIFACT_SUFFIXES
        or candidate.stem != task_id
    ):
        return None
    return candidate


def task_artifact(task_id: str) -> Path | None:
    """Find one task's current artifact without exposing an arbitrary stored path."""
    if not TASK_ID_PATTERN.fullmatch(task_id) or not DATABASE.is_file():
        return None
    uri = f"file:{DATABASE.as_posix()}?mode=ro"
    connection = sqlite3.connect(uri, uri=True)
    try:
        row = connection.execute("SELECT artifact_path FROM tasks WHERE id = ?", (task_id,)).fetchone()
    except sqlite3.Error:
        return None
    finally:
        connection.close()
    return allowed_liveboard_artifact(task_id, row[0] if row else "")


def read_snapshot() -> dict:
    now = datetime.now(timezone.utc)
    if not DATABASE.is_file():
        return {"now": now.isoformat(timespec="seconds"), "service_state": "database_unavailable", "tasks": [], "defects": [], "events": []}
    uri = f"file:{DATABASE.as_posix()}?mode=ro"
    connection = sqlite3.connect(uri, uri=True, isolation_level=None)
    connection.row_factory = sqlite3.Row
    try:
        connection.execute("BEGIN")
        tasks = [dict(row) for row in connection.execute("SELECT * FROM tasks ORDER BY id")]
        defects = [dict(row) for row in connection.execute("SELECT * FROM defects ORDER BY reported_at DESC, id DESC")]
        events = [dict(row) for row in connection.execute("SELECT * FROM events ORDER BY sequence DESC")]
        connection.execute("COMMIT")
    except sqlite3.Error:
        connection.execute("ROLLBACK")
        raise
    finally:
        connection.close()
    for task in tasks:
        stamp = task.get("last_reported_at")
        if not stamp:
            task["reported_age_seconds"] = None; task["reporting_state"] = "never_reported"
        else:
            age = max(0, int((now - datetime.fromisoformat(stamp)).total_seconds()))
            task["reported_age_seconds"] = age
            task["reporting_state"] = "stale" if age > task["stale_after_seconds"] else "fresh"
        artifact_path = task.get("artifact_path")
        if not artifact_path:
            task["artifact_state"] = "not_recorded"
        else:
            task["artifact_state"] = "available" if allowed_liveboard_artifact(task["id"], artifact_path) else "missing"
    return {"now": now.isoformat(timespec="seconds"), "service_state": "available", "tasks": tasks, "defects": defects, "events": events}


def journal_metadata() -> dict:
    """List usable saved captures without returning their task or defect records."""
    if not DATABASE.is_file():
        return {"service_state": "database_unavailable", "boundary": journal.BOUNDARY, "snapshots": [], "unreadable_snapshot_names": []}
    directory = journal.snapshot_directory(DATABASE)
    if not directory.is_dir():
        return {"service_state": "available", "boundary": journal.BOUNDARY, "snapshots": [], "unreadable_snapshot_names": []}
    snapshots = []
    unreadable = []
    for candidate in sorted(directory.glob("*.json")):
        name = candidate.stem
        try:
            payload = journal.read_snapshot(DATABASE, name)
        except (ValueError, OSError, journal.json.JSONDecodeError):
            unreadable.append(name)
            continue
        snapshots.append({"name": name, "captured_at": payload["captured_at"], "summary": payload["summary"]})
    snapshots.sort(key=lambda item: (item["captured_at"], item["name"]))
    return {"service_state": "available", "boundary": journal.BOUNDARY, "snapshots": snapshots, "unreadable_snapshot_names": unreadable}


def journal_comparison(before: str, after: str) -> dict:
    """Compare exactly two named captures, using the journal's bounded read model."""
    if not DATABASE.is_file():
        raise ValueError("database unavailable")
    return {
        "service_state": "available",
        "boundary": journal.BOUNDARY,
        "before_name": journal.snapshot_name(before),
        "after_name": journal.snapshot_name(after),
        "comparison": journal.compare_snapshots(journal.read_snapshot(DATABASE, before), journal.read_snapshot(DATABASE, after)),
    }


@app.get("/api/snapshot")
def snapshot():
    try:
        return jsonify(read_snapshot())
    except sqlite3.Error:
        return jsonify({"now": datetime.now(timezone.utc).isoformat(timespec="seconds"), "service_state": "database_unavailable", "tasks": [], "defects": [], "events": []}), 503


@app.get("/api/journal/snapshots")
def journal_snapshots():
    return jsonify(journal_metadata())


@app.get("/api/journal/compare")
def compare_journal_snapshots():
    before = request.args.get("before", "")
    after = request.args.get("after", "")
    try:
        return jsonify(journal_comparison(before, after))
    except (ValueError, OSError, journal.json.JSONDecodeError):
        abort(404)


@app.get("/")
def index():
    return send_from_directory(ROOT / "static", "index.html")


@app.get("/static/<path:name>")
def static_asset(name: str):
    """Serve only the status viewer's fixed assets."""
    if name not in ALLOWED_STATIC_FILES:
        abort(404)
    return send_from_directory(ROOT / "static", name)


@app.get("/artifacts/tasks/<task_id>")
def liveboard_task_artifact(task_id: str):
    artifact = task_artifact(task_id)
    if artifact is None:
        abort(404)
    return send_file(artifact)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8766)
    args = parser.parse_args()
    if args.host != "127.0.0.1":
        parser.error("Blackboard is loopback-only; --host must be 127.0.0.1")
    app.run(host=args.host, port=args.port, debug=False, use_reloader=False)


if __name__ == "__main__":
    main()
