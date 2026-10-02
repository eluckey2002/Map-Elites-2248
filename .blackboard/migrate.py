"""Move this checkout's private board into the repository's shared board, or set it aside on purpose.

Nothing here deletes the private board: it is copied (SQLite's backup API, so a write in flight cannot
tear the copy), the copy is checked against the original, and the private folder is left in place
with a MIGRATED.txt marker that stops it being picked up again.
"""
from __future__ import annotations

import argparse
import os
import shutil
import sqlite3
import sys
from pathlib import Path

import locate
import runtime

SKIP = {"board.sqlite", "board.sqlite-journal", "board.sqlite-wal", "board.sqlite-shm", locate.MIGRATED_MARKER}


def counts(connection: sqlite3.Connection) -> dict[str, int]:
    return {
        table: connection.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        for table in ("tasks", "events", "defects")
    }


def describe(found: dict[str, int]) -> str:
    return f"{found['tasks']} tasks, {found['events']} events, {found['defects']} defects"


def write_marker(legacy: Path, message: str) -> None:
    (legacy / locate.MIGRATED_MARKER).write_text(message + "\n", encoding="utf-8")


def copy_files(legacy: Path, stage: Path) -> int:
    """Copy artifacts and snapshots (everything except the database itself); return how many files."""
    copied = 0
    for item in legacy.iterdir():
        if item.name in SKIP:
            continue
        if item.is_dir():
            shutil.copytree(item, stage / item.name)
            copied += sum(1 for p in (stage / item.name).rglob("*") if p.is_file())
        else:
            shutil.copy2(item, stage / item.name)
            copied += 1
    return copied


def rewrite_artifact_paths(connection: sqlite3.Connection, legacy: Path, target: Path) -> int:
    """Stored artifact paths are absolute; repoint the ones under the old folder at the new one."""
    old_root, rewritten = Path(legacy).resolve(), 0
    for row in connection.execute("SELECT id, artifact_path FROM tasks WHERE artifact_path IS NOT NULL").fetchall():
        try:
            relative = Path(row["artifact_path"]).resolve().relative_to(old_root)
        except ValueError:
            continue  # points somewhere else; not ours to move
        connection.execute("UPDATE tasks SET artifact_path=? WHERE id=?", (str(target / relative), row["id"]))
        rewritten += 1
    return rewritten


def migrate(args: argparse.Namespace) -> None:
    kind, target = locate.location()
    if kind != "shared":
        raise ValueError(f"nothing to migrate: the board is not in a repository's shared folder (mode: {kind})")
    legacy = locate.legacy_runtime()
    source = legacy / "board.sqlite"
    if not source.is_file():
        raise ValueError(f"no private board at {source}")
    if (legacy / locate.MIGRATED_MARKER).exists():
        raise ValueError(f"the private board at {legacy} was already migrated or set aside; see {locate.MIGRATED_MARKER} there")
    with locate.readonly(source) as connection:
        before = counts(connection)
    shared_db = target / "board.sqlite"

    if args.abandon:
        write_marker(legacy, f"Set aside by {args.actor}; NOT copied. It held {describe(before)} that the shared board at {target} does not have.")
        print(f"set aside the private board at {legacy} ({describe(before)}); it was not copied and is not deleted")
        return

    if shared_db.exists():
        with locate.readonly(shared_db) as connection:
            existing = counts(connection)
        raise ValueError(
            f"a shared board already exists at {target} ({describe(existing)}) and the private board holds "
            f"{describe(before)}. Boards are not merged. Re-run with --abandon to set the private board aside, "
            f"or move one of the two away first."
        )
    if target.exists() and any(target.iterdir()):
        raise ValueError(f"{target} exists and is not empty, but holds no board; clear it first")

    stage = target.parent / f"{target.name}.migrating-{os.getpid()}"
    shutil.rmtree(stage, ignore_errors=True)
    try:
        stage.mkdir(parents=True)
        source_connection = locate.open_readonly(source)
        copy = sqlite3.connect(stage / "board.sqlite")
        try:
            source_connection.backup(copy)
        finally:
            copy.close()
            source_connection.close()
        files = copy_files(legacy, stage)
        with runtime.transaction(stage / "board.sqlite") as connection:
            runtime.schema(connection)
            rewritten = rewrite_artifact_paths(connection, legacy, target)
            runtime.emit(
                connection, "board_migrated", None, args.actor,
                f"Migrated from {legacy} ({describe(before)}); {rewritten} artifact paths rewritten, {files} files copied",
            )
        with locate.readonly(stage / "board.sqlite") as connection:
            after = counts(connection)
            intact = connection.execute("PRAGMA integrity_check").fetchone()[0] == "ok" and not connection.execute("PRAGMA foreign_key_check").fetchall()
        expected = {**before, "events": before["events"] + 1}
        if after != expected or not intact:
            raise ValueError(f"the copy does not match the original (expected {expected}, got {after}); nothing was changed")
        if target.exists():
            target.rmdir()
        stage.rename(target)
    except BaseException:
        shutil.rmtree(stage, ignore_errors=True)
        raise
    write_marker(legacy, f"Migrated to {target} by {args.actor}: {describe(before)}, {rewritten} artifact paths rewritten. This private copy is no longer used; it is kept as a backup.")
    print(f"migrated {describe(before)} into {target}; {rewritten} artifact paths rewritten, {files} files copied")
    print(f"the private board at {legacy} is left in place as a backup and will no longer be read")


def main() -> int:
    root = argparse.ArgumentParser(description=__doc__)
    root.add_argument("--actor", required=True)
    root.add_argument("--abandon", action="store_true", help="set the private board aside without copying it")
    args = root.parse_args()
    try:
        migrate(args)
    except (ValueError, sqlite3.Error, OSError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
