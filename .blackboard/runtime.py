"""Controlled, local-only writer for the Blackboard SQLite ledger."""
from __future__ import annotations

import argparse
import re
import sqlite3
import sys
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator

ROOT = Path(__file__).resolve().parent
RUNTIME = ROOT / "runtime"
DATABASE = RUNTIME / "board.sqlite"
EVENT_KINDS = {
    "created", "claimed", "progress_reported", "submitted", "defect_recorded",
    "accepted", "repair_requested", "defect_disposition",
}
# Must match the read surfaces (query_liveboard, server, snapshot names).
ID_PATTERN = re.compile(r"[A-Za-z0-9_-]+")
LEGACY_REVIEWER = "legacy-reviewer-not-recorded"
LEGACY_STOP_CONDITION = "legacy-stop-condition-not-recorded"


def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def ensure_runtime() -> None:
    RUNTIME.mkdir(exist_ok=True)


@contextmanager
def transaction() -> Iterator[sqlite3.Connection]:
    ensure_runtime()
    connection = sqlite3.connect(DATABASE, timeout=10, isolation_level=None)
    connection.row_factory = sqlite3.Row
    try:
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("BEGIN IMMEDIATE")
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def schema(connection: sqlite3.Connection) -> None:
    # Keep every DDL statement inside the caller's transaction.  executescript()
    # would commit before running the migration and could strand a partial schema.
    connection.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          diagnostic_question TEXT NOT NULL,
          specialty TEXT NOT NULL,
          scope TEXT NOT NULL,
          acceptance TEXT NOT NULL,
          dependencies TEXT NOT NULL DEFAULT '',
          reviewer TEXT NOT NULL,
          stop_condition TEXT NOT NULL,
          state TEXT NOT NULL CHECK(state IN ('queued','claimed','submitted','accepted','repair_requested')),
          assignee TEXT,
          claimed_at TEXT,
          last_reported_at TEXT,
          submitted_at TEXT,
          reviewed_at TEXT,
          artifact_path TEXT,
          review_note TEXT,
          stale_after_seconds INTEGER NOT NULL CHECK(stale_after_seconds > 0)
        )
    """)
    task_columns = {row["name"] for row in connection.execute("PRAGMA table_info(tasks)")}
    if "reviewer" not in task_columns:
        connection.execute(
            f"ALTER TABLE tasks ADD COLUMN reviewer TEXT NOT NULL DEFAULT '{LEGACY_REVIEWER}'"
        )
    if "stop_condition" not in task_columns:
        connection.execute(
            f"ALTER TABLE tasks ADD COLUMN stop_condition TEXT NOT NULL DEFAULT '{LEGACY_STOP_CONDITION}'"
        )
    connection.execute("""
        CREATE TABLE IF NOT EXISTS events (
          sequence INTEGER PRIMARY KEY AUTOINCREMENT,
          at TEXT NOT NULL,
          kind TEXT NOT NULL CHECK(kind IN ('created','claimed','progress_reported','submitted','defect_recorded','accepted','repair_requested','defect_disposition')),
          task_id TEXT REFERENCES tasks(id),
          actor TEXT NOT NULL,
          detail TEXT NOT NULL
        )
    """)
    event_table = connection.execute(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='events'"
    ).fetchone()
    if event_table is not None and "defect_disposition" not in event_table["sql"]:
        connection.execute("ALTER TABLE events RENAME TO events_before_disposition")
        connection.execute("""
            CREATE TABLE events (
              sequence INTEGER PRIMARY KEY AUTOINCREMENT,
              at TEXT NOT NULL,
              kind TEXT NOT NULL CHECK(kind IN ('created','claimed','progress_reported','submitted','defect_recorded','accepted','repair_requested','defect_disposition')),
              task_id TEXT REFERENCES tasks(id),
              actor TEXT NOT NULL,
              detail TEXT NOT NULL
            )
        """)
        connection.execute(
            """INSERT INTO events(sequence, at, kind, task_id, actor, detail)
               SELECT sequence, at, kind, task_id, actor, detail
               FROM events_before_disposition
               ORDER BY sequence"""
        )
        connection.execute("DROP TABLE events_before_disposition")
    connection.execute("""
        CREATE TABLE IF NOT EXISTS defects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id TEXT NOT NULL REFERENCES tasks(id),
          summary TEXT NOT NULL,
          state TEXT NOT NULL DEFAULT 'open' CHECK(state IN ('open','fixed','dismissed')),
          reported_at TEXT NOT NULL,
          disposition TEXT NOT NULL DEFAULT ''
        )
    """)


def text(value: str, label: str) -> str:
    value = value.strip()
    if not value:
        raise ValueError(f"{label} must not be empty")
    return value


def task_id(value: str) -> str:
    value = text(value, "id")
    if not ID_PATTERN.fullmatch(value):
        raise ValueError("id may contain only ASCII letters, numbers, hyphens, and underscores")
    return value


def allowed_artifact(value: str, identifier: str) -> str:
    supplied = Path(value).expanduser()
    if ".." in supplied.parts:
        raise ValueError("artifact path must not contain traversal segments")
    candidate = supplied.resolve()
    try:
        candidate.relative_to(RUNTIME.resolve())
    except ValueError as exc:
        raise ValueError("artifact path must remain under .blackboard/runtime") from exc
    if not candidate.is_file():
        raise ValueError("artifact path must name an existing file")
    if candidate.suffix.lower() not in {".md", ".json", ".txt"}:
        raise ValueError("artifact suffix must be .md, .json, or .txt")
    if candidate.stem != identifier:
        raise ValueError("artifact filename must match the exact task id")
    return str(candidate)


def emit(connection: sqlite3.Connection, kind: str, task: str | None, actor: str, detail: str) -> None:
    if kind not in EVENT_KINDS:
        raise ValueError("invalid event kind")
    connection.execute(
        "INSERT INTO events(at, kind, task_id, actor, detail) VALUES (?, ?, ?, ?, ?)",
        (utcnow(), kind, task, text(actor, "actor"), text(detail, "detail")),
    )


def one(connection: sqlite3.Connection, identifier: str) -> sqlite3.Row:
    row = connection.execute("SELECT * FROM tasks WHERE id = ?", (task_id(identifier),)).fetchone()
    if row is None:
        raise ValueError("unknown task")
    return row


def create(args: argparse.Namespace) -> None:
    with transaction() as connection:
        schema(connection)
        identifier = task_id(args.id)
        connection.execute(
            """INSERT INTO tasks(
                 id, diagnostic_question, specialty, scope, acceptance, dependencies,
                 reviewer, stop_condition, state, stale_after_seconds
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'queued', ?)""",
            (identifier, text(args.question, "question"), text(args.specialty, "specialty"),
             text(args.scope, "scope"), text(args.acceptance, "acceptance"), args.dependencies.strip(),
             text(args.reviewer, "reviewer"), text(args.stop_condition, "stop condition"), args.stale_after),
        )
        emit(connection, "created", identifier, args.actor, f"Task created: {args.question.strip()}")


def claim(args: argparse.Namespace) -> None:
    with transaction() as connection:
        schema(connection)
        row = one(connection, args.id)
        if row["state"] not in {"queued", "repair_requested"}:
            raise ValueError(f"cannot claim task in {row['state']} state")
        if row["state"] == "repair_requested" and not text(args.reason, "reason"):
            raise ValueError("repair claim requires a reason")
        at = utcnow()
        connection.execute("UPDATE tasks SET state='claimed', assignee=?, claimed_at=?, review_note=CASE WHEN state='repair_requested' THEN review_note ELSE NULL END WHERE id=?",
                           (text(args.assignee, "assignee"), at, row["id"]))
        emit(connection, "claimed", row["id"], args.actor, args.reason.strip() or f"Claimed by {args.assignee.strip()}")


def progress(args: argparse.Namespace) -> None:
    with transaction() as connection:
        schema(connection)
        row = one(connection, args.id)
        if row["state"] != "claimed":
            raise ValueError("progress is allowed only for claimed tasks")
        at = utcnow()
        connection.execute("UPDATE tasks SET last_reported_at=? WHERE id=?", (at, row["id"]))
        emit(connection, "progress_reported", row["id"], args.actor, text(args.detail, "detail"))


def submit(args: argparse.Namespace) -> None:
    with transaction() as connection:
        schema(connection)
        row = one(connection, args.id)
        if row["state"] != "claimed":
            raise ValueError("submit is allowed only for claimed tasks")
        artifact = allowed_artifact(args.artifact, row["id"])
        at = utcnow()
        connection.execute("UPDATE tasks SET state='submitted', artifact_path=?, submitted_at=? WHERE id=?",
                           (artifact, at, row["id"]))
        emit(connection, "submitted", row["id"], args.actor, text(args.detail, "detail"))


def defect(args: argparse.Namespace) -> None:
    with transaction() as connection:
        schema(connection)
        row = one(connection, args.id)
        if getattr(args, "state", "open") != "open":
            raise ValueError("new defects must start in open state")
        if getattr(args, "disposition", "").strip():
            raise ValueError("new defects must not have a disposition")
        at = utcnow()
        connection.execute("INSERT INTO defects(task_id, summary, state, reported_at, disposition) VALUES (?, ?, ?, ?, ?)",
                           (row["id"], text(args.summary, "summary"), "open", at, ""))
        emit(connection, "defect_recorded", row["id"], args.actor, text(args.summary, "summary"))


def dispose_defect(args: argparse.Namespace) -> None:
    with transaction() as connection:
        schema(connection)
        try:
            identifier = int(text(args.id, "defect id"))
        except ValueError as exc:
            raise ValueError("defect id must be a positive integer") from exc
        if identifier <= 0:
            raise ValueError("defect id must be a positive integer")
        row = connection.execute("SELECT * FROM defects WHERE id = ?", (identifier,)).fetchone()
        if row is None:
            raise ValueError("unknown defect")
        if row["state"] != "open":
            raise ValueError("cannot transition a terminal defect")
        if args.state not in {"fixed", "dismissed"}:
            raise ValueError("defect disposition state must be fixed or dismissed")
        disposition = text(args.disposition, "disposition")
        connection.execute(
            "UPDATE defects SET state=?, disposition=? WHERE id=?",
            (args.state, disposition, identifier),
        )
        emit(
            connection,
            "defect_disposition",
            row["task_id"],
            args.actor,
            f"Defect {identifier} {args.state}: {disposition}",
        )


def review(args: argparse.Namespace) -> None:
    if args.decision == "repair" and not (args.assignee or "").strip():
        raise ValueError("repair review requires --assignee")
    with transaction() as connection:
        schema(connection)
        row = one(connection, args.id)
        if row["state"] != "submitted":
            raise ValueError("review is allowed only for submitted tasks")
        if row["reviewer"] == LEGACY_REVIEWER:
            raise ValueError("legacy task has no predeclared reviewer")
        actor = text(args.actor, "actor")
        if actor != row["reviewer"]:
            raise ValueError("review actor must equal the predeclared reviewer")
        if actor == row["assignee"]:
            raise ValueError("reviewer must differ from the task assignee")
        submission = connection.execute(
            "SELECT actor FROM events WHERE task_id=? AND kind='submitted' ORDER BY sequence DESC LIMIT 1",
            (row["id"],),
        ).fetchone()
        if submission is None:
            raise ValueError("submitted task has no submission event")
        if actor == submission["actor"]:
            raise ValueError("reviewer must differ from the current result submitter")
        decision = args.decision
        note = text(args.note, "note")
        at = utcnow()
        if decision == "accept":
            connection.execute("UPDATE tasks SET state='accepted', reviewed_at=?, review_note=? WHERE id=?", (at, note, row["id"]))
            emit(connection, "accepted", row["id"], actor, note)
        else:
            assignee = text(args.assignee, "assignee")
            connection.execute("UPDATE tasks SET state='repair_requested', assignee=?, reviewed_at=?, review_note=? WHERE id=?",
                               (assignee, at, note, row["id"]))
            emit(connection, "repair_requested", row["id"], actor, note)


def init(_: argparse.Namespace) -> None:
    """Create an empty project ledger; repeated initialization preserves all data."""
    with transaction() as connection:
        schema(connection)


def self_test(_: argparse.Namespace) -> None:
    import tempfile
    import threading
    global DATABASE, RUNTIME
    original_database, original_runtime = DATABASE, RUNTIME
    try:
        with tempfile.TemporaryDirectory() as directory:
            RUNTIME = Path(directory) / "runtime"
            DATABASE = RUNTIME / "board.sqlite"
            init(argparse.Namespace())
            seed_artifact = RUNTIME / "test.md"
            seed_artifact.write_text("bounded diagnostic", encoding="utf-8")
            create(argparse.Namespace(id="test", question="q", specialty="s", scope="bounded", acceptance="a", dependencies="", reviewer="checker", stop_condition="self-test complete", stale_after=1, actor="test"))
            outcomes: list[str] = []
            barrier = threading.Barrier(2)
            def competing_claim(assignee: str) -> None:
                barrier.wait()
                try:
                    claim(argparse.Namespace(id="test", assignee=assignee, actor="test", reason=""))
                    outcomes.append("won")
                except ValueError:
                    outcomes.append("lost")
            contenders = [threading.Thread(target=competing_claim, args=(name,)) for name in ("worker", "other")]
            [contender.start() for contender in contenders]
            [contender.join() for contender in contenders]
            assert sorted(outcomes) == ["lost", "won"], f"expected one claim winner, got {outcomes}"
            with transaction() as connection:
                winner = one(connection, "test")["assignee"]
            progress(argparse.Namespace(id="test", actor=winner, detail="reported"))
            submit(argparse.Namespace(id="test", actor=winner, artifact=str(seed_artifact), detail="submitted"))
            try:
                submit(argparse.Namespace(id="test", actor=winner, artifact=str(seed_artifact), detail="duplicate"))
                raise AssertionError("duplicate submission unexpectedly succeeded")
            except ValueError:
                pass
            review(argparse.Namespace(id="test", actor="checker", decision="repair", note="needs repair", assignee=winner))
            claim(argparse.Namespace(id="test", assignee=winner, actor="test", reason="repair assigned by reviewer"))
            for bad_id in ("café", "١٢"):
                try:
                    create(argparse.Namespace(id=bad_id, question="q", specialty="s", scope="bounded", acceptance="a", dependencies="", reviewer="checker", stop_condition="done", stale_after=1, actor="test"))
                    raise AssertionError(f"non-ASCII id {bad_id!r} was accepted")
                except ValueError:
                    pass
            progress(argparse.Namespace(id="test", actor=winner, detail="repaired"))
            submit(argparse.Namespace(id="test", actor=winner, artifact=str(seed_artifact), detail="resubmitted"))
            try:
                review(argparse.Namespace(id="test", actor="checker", decision="repair", note="again", assignee=None))
                raise AssertionError("repair review without an assignee was accepted")
            except ValueError:
                pass
            import snapshot_liveboard
            with snapshot_liveboard.consistent_read(DATABASE):
                blocked = sqlite3.connect(DATABASE, timeout=0.2, isolation_level=None)
                try:
                    blocked.execute("BEGIN IMMEDIATE")
                    blocked.execute("UPDATE tasks SET last_reported_at='x' WHERE id='test'")
                    blocked.execute("COMMIT")
                    raise AssertionError("a writer committed during a snapshot read")
                except sqlite3.OperationalError:
                    blocked.execute("ROLLBACK") if blocked.in_transaction else None
                finally:
                    blocked.close()
            assert snapshot_liveboard.capture_snapshot(DATABASE)["summary"]["task_count"] == 1
            import query_liveboard
            with query_liveboard.read_transaction(DATABASE):
                blocked = sqlite3.connect(DATABASE, timeout=0.2, isolation_level=None)
                try:
                    blocked.execute("BEGIN IMMEDIATE")
                    blocked.execute("UPDATE tasks SET last_reported_at='x' WHERE id='test'")
                    blocked.execute("COMMIT")
                    raise AssertionError("a writer committed during a query read")
                except sqlite3.OperationalError:
                    blocked.execute("ROLLBACK") if blocked.in_transaction else None
                finally:
                    blocked.close()
            first = snapshot_liveboard.write_snapshot(DATABASE, "race")
            original = first.read_bytes()
            first.write_bytes(b"sentinel")
            real_exists = Path.exists
            Path.exists = lambda self: False if self == first else real_exists(self)  # simulate losing the check-then-write race
            try:
                snapshot_liveboard.write_snapshot(DATABASE, "race")
                raise AssertionError("a snapshot name was silently overwritten")
            except ValueError:
                pass
            finally:
                Path.exists = real_exists
            assert first.read_bytes() == b"sentinel", "existing snapshot was modified"
            from server import app
            client = app.test_client()
            response = client.post("/api/snapshot")
            assert response.status_code == 405, "HTTP mutation method was not rejected"
            print("self-test passed: concurrent claim winner, transitions, duplicate/invalid rejection, ASCII ids, repair flow and missing-assignee rejection, consistent snapshot and query reads, exclusive snapshot names, and HTTP mutation rejection")
    finally:
        DATABASE, RUNTIME = original_database, original_runtime


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description=__doc__)
    commands = root.add_subparsers(dest="command", required=True)
    commands.add_parser("init").set_defaults(function=init)
    commands.add_parser("self-test").set_defaults(function=self_test)
    def writer(name: str):
        command = commands.add_parser(name); command.add_argument("--actor", required=True); command.add_argument("--id", required=True); return command
    command = writer("create")
    command.add_argument("--question", required=True); command.add_argument("--specialty", required=True); command.add_argument("--scope", required=True); command.add_argument("--acceptance", required=True); command.add_argument("--dependencies", default=""); command.add_argument("--reviewer", required=True); command.add_argument("--stop-condition", required=True); command.add_argument("--stale-after", type=int, default=300)
    command.set_defaults(function=create)
    command = writer("claim"); command.add_argument("--assignee", required=True); command.add_argument("--reason", default=""); command.set_defaults(function=claim)
    command = writer("progress"); command.add_argument("--detail", required=True); command.set_defaults(function=progress)
    command = writer("submit"); command.add_argument("--artifact", required=True); command.add_argument("--detail", required=True); command.set_defaults(function=submit)
    command = writer("defect"); command.add_argument("--summary", required=True); command.set_defaults(function=defect)
    command = writer("dispose-defect"); command.add_argument("--state", required=True, choices=("fixed", "dismissed")); command.add_argument("--disposition", required=True); command.set_defaults(function=dispose_defect)
    command = writer("review"); command.add_argument("--decision", required=True, choices=("accept", "repair")); command.add_argument("--note", required=True); command.add_argument("--assignee"); command.set_defaults(function=review)
    return root


def main() -> int:
    args = parser().parse_args()
    if getattr(args, "stale_after", 1) <= 0:
        print("error: stale-after must be positive", file=sys.stderr); return 2
    try:
        args.function(args)
    except (ValueError, sqlite3.IntegrityError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
