"""Capture and compare source-neutral operational snapshots of the local Liveboard ledger."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sqlite3
from collections import Counter
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator


ROOT = Path(__file__).resolve().parent
DEFAULT_DATABASE = ROOT / "runtime" / "board.sqlite"
NAME_PATTERN = re.compile(r"^[A-Za-z0-9_-]+$")
BOUNDARY = (
    "This journal contains recorded operational metadata only. It is not independent evidence, "
    "does not verify a claim, relationship, money flow, or identity, and does not establish that "
    "a person or agent is currently live."
)
TASK_FIELDS = (
    "reviewer",
    "stop_condition",
    "state",
    "assignee",
    "claimed_at",
    "last_reported_at",
    "submitted_at",
    "reviewed_at",
)
DEFECT_FIELDS = ("task_id", "state", "reported_at")


def snapshot_name(value: str) -> str:
    if not NAME_PATTERN.fullmatch(value):
        raise ValueError("invalid snapshot name")
    return value


def snapshot_directory(database: Path) -> Path:
    return database.resolve().parent / "snapshots"


def snapshot_path(database: Path, name: str) -> Path:
    return snapshot_directory(database) / f"{snapshot_name(name)}.json"


def readonly_connection(database: Path) -> sqlite3.Connection:
    if not database.is_file():
        raise FileNotFoundError(database)
    connection = sqlite3.connect(f"file:{database.as_posix()}?mode=ro", uri=True)
    connection.row_factory = sqlite3.Row
    return connection


def count_by(items: list[dict[str, Any]], field: str) -> dict[str, int]:
    return dict(sorted(Counter(str(item.get(field) or "not_recorded") for item in items).items()))


@contextmanager
def consistent_read(database: Path) -> Iterator[sqlite3.Connection]:
    """Hold one read transaction so every SELECT and the file hash see one ledger version.

    The ledger uses SQLite's rollback journal, so the shared lock held here keeps
    writers from committing until the capture finishes.
    """
    connection = readonly_connection(database)
    try:
        connection.execute("BEGIN")
        connection.execute("SELECT 1 FROM tasks LIMIT 1").fetchall()  # acquire the shared lock now
        yield connection
    finally:
        connection.close()


def capture_snapshot(database: Path) -> dict[str, Any]:
    with consistent_read(database) as connection:
        tasks = [
            dict(row)
            for row in connection.execute(
                """SELECT id, reviewer, stop_condition, state, assignee, claimed_at,
                          last_reported_at, submitted_at, reviewed_at
                   FROM tasks ORDER BY id"""
            )
        ]
        defects = [
            dict(row)
            for row in connection.execute("SELECT id, task_id, state, reported_at FROM defects ORDER BY id")
        ]
        event_row = connection.execute("SELECT COUNT(*) AS count, MIN(sequence) AS minimum, MAX(sequence) AS maximum FROM events").fetchone()
        ledger_sha256 = hashlib.sha256(database.read_bytes()).hexdigest()
    return {
        "schema_version": 1,
        "kind": "liveboard_operational_snapshot",
        "captured_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "boundary": BOUNDARY,
        "ledger_sha256": ledger_sha256,
        "summary": {
            "task_count": len(tasks),
            "task_state_counts": count_by(tasks, "state"),
            "defect_count": len(defects),
            "defect_state_counts": count_by(defects, "state"),
            "event_count": event_row["count"],
            "event_sequence_min": event_row["minimum"],
            "event_sequence_max": event_row["maximum"],
        },
        "tasks": tasks,
        "defects": defects,
    }


def write_snapshot(database: Path, name: str) -> Path:
    target = snapshot_path(database, name)
    if target.exists():
        raise ValueError("snapshot already exists")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(capture_snapshot(database), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return target


def read_snapshot(database: Path, name: str) -> dict[str, Any]:
    path = snapshot_path(database, name)
    if not path.is_file():
        raise ValueError("snapshot not found")
    payload = json.loads(path.read_text(encoding="utf-8"))
    if payload.get("kind") != "liveboard_operational_snapshot" or payload.get("schema_version") != 1:
        raise ValueError("snapshot has an unsupported format")
    return payload


def changed_records(before: list[dict[str, Any]], after: list[dict[str, Any]], fields: tuple[str, ...]) -> tuple[list[str], list[str], list[dict[str, Any]]]:
    before_by_id = {str(item["id"]): item for item in before}
    after_by_id = {str(item["id"]): item for item in after}
    added = sorted(set(after_by_id) - set(before_by_id))
    removed = sorted(set(before_by_id) - set(after_by_id))
    changed = []
    for identifier in sorted(set(before_by_id) & set(after_by_id)):
        fields_changed = [field for field in fields if before_by_id[identifier].get(field) != after_by_id[identifier].get(field)]
        if fields_changed:
            changed.append({"id": after_by_id[identifier]["id"], "changed_fields": fields_changed})
    return added, removed, changed


def compare_snapshots(before: dict[str, Any], after: dict[str, Any]) -> dict[str, Any]:
    added_tasks, removed_tasks, changed_tasks = changed_records(before["tasks"], after["tasks"], TASK_FIELDS)
    added_defects, removed_defects, changed_defects = changed_records(before["defects"], after["defects"], DEFECT_FIELDS)
    before_max = before["summary"].get("event_sequence_max")
    after_max = after["summary"].get("event_sequence_max")
    first_new = before_max + 1 if isinstance(before_max, int) and isinstance(after_max, int) and after_max > before_max else None
    return {
        "before_captured_at": before["captured_at"],
        "after_captured_at": after["captured_at"],
        "before_summary": before["summary"],
        "after_summary": after["summary"],
        "added_task_ids": added_tasks,
        "removed_task_ids": removed_tasks,
        "changed_tasks": changed_tasks,
        "added_defect_ids": added_defects,
        "removed_defect_ids": removed_defects,
        "changed_defects": changed_defects,
        "event_sequence": {"before_max": before_max, "after_max": after_max, "first_new": first_new, "last_new": after_max if first_new is not None else None},
        "interpretation": "This comparison reports recorded operational changes only. It does not explain why anything changed or establish research evidence or live activity.",
    }


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description=__doc__)
    root.add_argument("--database", type=Path, default=DEFAULT_DATABASE, help="Liveboard SQLite ledger to inspect")
    commands = root.add_subparsers(dest="command", required=True)
    capture = commands.add_parser("capture", help="Write one metadata-only snapshot beside the ledger")
    capture.add_argument("name", help="Letters, numbers, hyphens, and underscores only")
    compare = commands.add_parser("compare", help="Compare two named snapshots")
    compare.add_argument("before")
    compare.add_argument("after")
    return root


def emit(kind: str, result: Any) -> None:
    print(json.dumps({"kind": kind, "boundary": BOUNDARY, "result": result}, indent=2, ensure_ascii=False))


def main() -> int:
    args = parser().parse_args()
    database = args.database.resolve()
    try:
        if args.command == "capture":
            path = write_snapshot(database, args.name)
            emit("liveboard_snapshot_capture", {"snapshot_path": str(path), "snapshot_name": args.name})
        else:
            emit("liveboard_snapshot_comparison", compare_snapshots(read_snapshot(database, args.before), read_snapshot(database, args.after)))
        return 0
    except (FileNotFoundError, ValueError, json.JSONDecodeError, sqlite3.Error) as error:
        print(json.dumps({"error": str(error), "boundary": BOUNDARY}, ensure_ascii=False))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
