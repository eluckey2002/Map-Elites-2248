"""Read a count-only Liveboard summary, a task index, or one stored record without changing the ledger."""

from __future__ import annotations

import argparse
import json
import re
import sqlite3
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
DEFAULT_DATABASE = ROOT / "runtime" / "board.sqlite"
ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]+$")
BOUNDARY = (
    "This is a read-only record from the local Liveboard ledger. Recorded state is not "
    "independent evidence, proof of a claim or connection, proof of money flow or identity, "
    "or evidence that a person or agent is currently live."
)


def identifier(value: str) -> str:
    if not ID_PATTERN.fullmatch(value):
        raise ValueError("invalid id")
    return value


def connection_for(database: Path) -> sqlite3.Connection:
    if not database.is_file():
        raise FileNotFoundError(f"no board at {database}; create it with: python .blackboard/board.py init")
    connection = sqlite3.connect(f"file:{database.as_posix()}?mode=ro", uri=True)
    connection.row_factory = sqlite3.Row
    return connection


def task_record(connection: sqlite3.Connection, task_id: str) -> dict[str, Any]:
    row = connection.execute("SELECT * FROM tasks WHERE id = ?", (identifier(task_id),)).fetchone()
    if row is None:
        raise LookupError("record not found")
    return {
        "boundary": BOUNDARY,
        "task": dict(row),
        "defects": [dict(item) for item in connection.execute("SELECT * FROM defects WHERE task_id = ? ORDER BY reported_at DESC, id DESC", (task_id,))],
        "events": [dict(item) for item in connection.execute("SELECT * FROM events WHERE task_id = ? ORDER BY sequence DESC", (task_id,))],
    }


def defect_record(connection: sqlite3.Connection, defect_id: str) -> dict[str, Any]:
    row = connection.execute("SELECT * FROM defects WHERE id = ?", (identifier(defect_id),)).fetchone()
    if row is None:
        raise LookupError("record not found")
    task = connection.execute("SELECT * FROM tasks WHERE id = ?", (row["task_id"],)).fetchone()
    return {
        "boundary": BOUNDARY,
        "defect": dict(row),
        "task": dict(task) if task is not None else None,
        "events": [dict(item) for item in connection.execute("SELECT * FROM events WHERE task_id = ? ORDER BY sequence DESC", (row["task_id"],))],
    }


def count_by_state(connection: sqlite3.Connection, table: str) -> dict[str, int]:
    """Return only recorded state counts from one fixed ledger table."""
    if table not in {"tasks", "defects"}:
        raise ValueError("unsupported summary table")
    return {
        str(row["state"]): int(row["count"])
        for row in connection.execute(f"SELECT state, COUNT(*) AS count FROM {table} GROUP BY state ORDER BY state")
    }


def summary_record(connection: sqlite3.Connection) -> dict[str, Any]:
    """Return a compact operational shape without task, defect, or event prose."""
    event_range = connection.execute("SELECT MIN(sequence) AS first, MAX(sequence) AS last FROM events").fetchone()
    task_states = count_by_state(connection, "tasks")
    defect_states = count_by_state(connection, "defects")
    return {
        "boundary": BOUNDARY,
        "summary": {
            "task_count": sum(task_states.values()),
            "task_state_counts": task_states,
            "defect_count": sum(defect_states.values()),
            "defect_state_counts": defect_states,
            "event_count": int(connection.execute("SELECT COUNT(*) AS count FROM events").fetchone()["count"]),
            "event_sequence": {"first": event_range["first"], "last": event_range["last"]},
        },
        "interpretation": "This is a count-only operational summary. It does not show task, defect, or event details and does not establish live activity or research truth.",
    }


def tasks_record(connection: sqlite3.Connection, state: str | None) -> dict[str, Any]:
    """Return one line per task so agents can find IDs without the web view."""
    columns = "id, state, assignee, reviewer, last_reported_at, diagnostic_question"
    if state is None:
        rows = connection.execute(f"SELECT {columns} FROM tasks ORDER BY state, id")
    else:
        rows = connection.execute(f"SELECT {columns} FROM tasks WHERE state = ? ORDER BY id", (state,))
    return {"boundary": BOUNDARY, "tasks": [dict(row) for row in rows]}


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description=__doc__)
    root.add_argument("--database", type=Path, default=DEFAULT_DATABASE, help="Liveboard SQLite ledger to inspect")
    command = root.add_subparsers(dest="command", required=True)
    command.add_parser("summary", help="Read count-only task, problem, and event totals")
    tasks = command.add_parser("tasks", help="List task IDs with state, assignee, and reviewer")
    tasks.add_argument("--state", choices=("queued", "claimed", "submitted", "accepted", "repair_requested"))
    for name in ("task", "defect"):
        item = command.add_parser(name, help=f"Read one {name} record")
        item.add_argument("id", help="Letters, numbers, hyphens, and underscores only")
    return root


def main() -> int:
    args = parser().parse_args()
    try:
        with connection_for(args.database.resolve()) as connection:
            if args.command == "summary":
                payload = summary_record(connection)
            elif args.command == "tasks":
                payload = tasks_record(connection, args.state)
            elif args.command == "task":
                payload = task_record(connection, args.id)
            else:
                payload = defect_record(connection, args.id)
    except (FileNotFoundError, LookupError, ValueError) as error:
        print(json.dumps({"error": str(error), "boundary": BOUNDARY}, ensure_ascii=False))
        return 2
    except sqlite3.Error as error:
        print(json.dumps({"error": "ledger unavailable", "boundary": BOUNDARY}, ensure_ascii=False))
        return 2
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
