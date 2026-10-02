"""Move this checkout's private board into the repository's shared board, or set it aside on purpose.

Nothing here deletes the private board: it is copied (SQLite's backup API, so a write in flight cannot
tear the copy), the copy is checked against the original, and the private folder is left in place
with a MIGRATED.txt marker that stops it being picked up again.
"""
from __future__ import annotations

import argparse
import os
import re
import shutil
import sqlite3
import sys
import time
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

import leases
import locate
import runtime

SKIP = set(locate.DB_FILES) | {locate.MIGRATED_MARKER}
BOARD_FILES = {"board.sqlite", "board.sqlite-journal"}  # what a shared board with nothing in it consists of
HOOKS: dict = {}  # tests put callables here (after_copy, before_swap, after_aside) to play another worktree at the worst moment
SLIPPED = ("another worktree wrote to the shared board at {target} while this migration was being prepared; "
           "nothing was changed. Run migrate again.")


def counts(connection: sqlite3.Connection) -> dict[str, int]:
    return {
        table: connection.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        for table in ("tasks", "events", "defects")
    }


def fire(name: str) -> None:
    hook = HOOKS.get(name)
    if hook is not None:
        hook()


def holds_nothing(folder: Path, connection: sqlite3.Connection) -> bool:
    """True only if the board has no rows AND its folder holds nothing but the database.  A snapshot or an artifact that
    another worktree adds is a file, not a row, so counting rows alone would let a board with content be set aside."""
    return not any(counts(connection).values()) and {p.name for p in folder.iterdir()} <= BOARD_FILES


def describe(found: dict[str, int]) -> str:
    return f"{found['tasks']} tasks, {found['events']} events, {found['defects']} defects"


def recorded_migration(shared_db: Path, legacy: Path) -> tuple[dict[str, int], str | None] | None:
    """(row counts, digest of the files beside the database) that a previous migration from this very folder recorded,
    or None if the shared board records none."""
    try:
        with locate.readonly(shared_db) as connection:
            row = connection.execute(
                "SELECT detail FROM events WHERE kind='board_migrated' AND instr(detail, ?) = 1 ORDER BY sequence DESC LIMIT 1",
                (f"Migrated from {legacy} ",),
            ).fetchone()
    except sqlite3.Error:
        return None
    found = re.findall(r"\((\d+) tasks, (\d+) events, (\d+) defects\)", row["detail"]) if row else []
    if not found:
        return None
    tasks, events, defects = map(int, found[0])
    digest = re.search(r"; files=([0-9a-f]{16})\b", row["detail"])
    return {"tasks": tasks, "events": events, "defects": defects}, (digest.group(1) if digest else None)


def write_marker(legacy: Path, message: str) -> None:
    """The marker records the private database's size and modification time as they are NOW, so a later write by an
    older tool shows up however soon after the marker it happens (a bare time comparison would need a tolerance,
    and anything inside the tolerance would be invisible for good)."""
    (legacy / locate.MIGRATED_MARKER).write_text(
        f"{message}\nfingerprint: {locate.db_fingerprint(legacy)}\nfiles: {locate.files_digest(locate.folder_files(legacy))}\n",
        encoding="utf-8")


@contextmanager
def writers_paused(database: Path) -> Iterator[sqlite3.Connection]:
    """Hold a database's write lock so nothing else can commit to it meanwhile.  Nothing is written by us: the lock
    is taken with BEGIN IMMEDIATE and released by rolling back, so the file is never modified."""
    guard = sqlite3.connect(database, timeout=10, isolation_level=None)
    guard.row_factory = sqlite3.Row
    try:
        guard.execute("BEGIN IMMEDIATE")
        locate.check_schema_version(guard)
        yield guard
    finally:
        try:
            guard.execute("ROLLBACK")
        except sqlite3.Error:
            pass
        guard.close()


def copy_files(legacy: Path, stage: Path) -> tuple[int, list[str]]:
    """Copy artifacts and snapshots (everything except the database itself); return (files copied, links skipped).

    A link directly inside the folder is skipped, never followed: `copytree(symlinks=True)` only keeps links found
    *beneath* the directory it is given, so a top-level link to a directory would be copied as the whole tree it
    points at, wherever that is.
    """
    copied, skipped = 0, []
    for item in legacy.iterdir():
        if item.name in SKIP:
            continue
        if item.is_symlink():
            skipped.append(item.name)
            continue
        if item.is_dir():
            shutil.copytree(item, stage / item.name, symlinks=True)  # copy a link as a link; never follow it out of the folder
            copied += sum(1 for p in (stage / item.name).rglob("*") if p.is_file())
        else:
            shutil.copy2(item, stage / item.name)
            copied += 1
    return copied, skipped


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
    with writers_paused(source) as guard:
        settle(args, legacy, source, target, guard)


def settle(args: argparse.Namespace, legacy: Path, source: Path, target: Path, guard: sqlite3.Connection) -> None:
    """Everything after the checks, run while no other writer can commit to the private board."""
    before = counts(guard)
    shared_db = target / "board.sqlite"

    if args.abandon:
        write_marker(legacy, f"Set aside by {args.actor}; NOT copied. It held {describe(before)} that the shared board at {target} does not have.")
        print(f"set aside the private board at {legacy} ({describe(before)}); it was not copied and is not deleted")
        return

    aside = None
    if shared_db.exists():
        previous = recorded_migration(shared_db, legacy)
        if previous is not None:  # a previous run copied the board and stopped before leaving its marker
            recorded, digest = previous
            if recorded != before or (digest is not None and digest != locate.files_digest(locate.folder_files(legacy))):
                # Something kept writing to the private board in between (an older tool would), rows or files beside
                # them. Restoring the marker now would declare it migrated and silently drop those writes.
                raise ValueError(
                    f"the private board at {legacy} changed after it was copied (its rows or the files beside it): it now "
                    f"holds {describe(before)}, and the migration recorded {describe(recorded)}. Those changes are not in the "
                    f"shared board, and boards are not merged. Re-run with --abandon to set it aside knowingly, or carry "
                    f"them over by hand first."
                )
            write_marker(legacy, f"Already migrated to {target} (marker restored by {args.actor}).")
            print(f"the private board at {legacy} was already migrated into {target}; its marker is restored")
            return
        with locate.readonly(shared_db) as connection:
            existing = counts(connection)
            empty = holds_nothing(target, connection)
        # An agent in another worktree may have run `init` first; that leaves a shared board with nothing in it.
        # Set it aside (never delete it) rather than make the real board lose to an empty one.
        if empty:
            aside = target.parent / f"{target.name}.empty-{int(time.time())}"
        else:
            raise ValueError(
                f"a shared board already exists at {target} ({describe(existing)}) and the private board holds "
                f"{describe(before)}. Boards are not merged. Re-run with --abandon to set the private board aside, "
                f"or move one of the two away first."
            )
    elif target.exists() and any(target.iterdir()):
        raise ValueError(f"{target} exists and is not empty, but holds no board; clear it first")

    stage = target.parent / f"{target.name}.migrating-{os.getpid()}"
    shutil.rmtree(stage, ignore_errors=True)
    try:
        stage.mkdir(parents=True)
        # The guard holds the write lock but must not be the backup's source: SQLite cannot back up from the very
        # connection that holds the lock, and Python's backup() then retries forever.  Readers are not blocked by it.
        source_connection = locate.open_readonly(source)
        copy = sqlite3.connect(stage / "board.sqlite")
        try:
            source_connection.backup(copy)
        finally:
            copy.close()
            source_connection.close()
        files_before = locate.folder_files(legacy)
        files, skipped = copy_files(legacy, stage)
        fire("after_copy")
        with runtime.transaction(stage / "board.sqlite") as connection:
            runtime.schema(connection)
            rewritten = rewrite_artifact_paths(connection, legacy, target)
            runtime.emit(
                connection, "board_migrated", None, args.actor,
                f"Migrated from {legacy} ({describe(before)}); {rewritten} artifact paths rewritten, {files} files copied; "
                f"files={locate.files_digest(files_before)}",
            )
        with locate.readonly(stage / "board.sqlite") as connection:
            after = counts(connection)
            intact = connection.execute("PRAGMA integrity_check").fetchone()[0] == "ok" and not connection.execute("PRAGMA foreign_key_check").fetchall()
        expected = {**before, "events": before["events"] + 1}
        if after != expected or not intact:
            raise ValueError(f"the copy does not match the original (expected {expected}, got {after}); nothing was changed")
        fire("before_swap")
        if locate.folder_files(legacy) != files_before:
            # The write lock covers the database, not a snapshot or artifact an older tool writes beside it.
            raise ValueError(f"files in the private folder {legacy} changed while it was being copied; nothing was changed. Run migrate again.")
        if aside is not None:
            with writers_paused(shared_db) as shared_guard:  # nothing may be written to a board that is about to be replaced
                if not holds_nothing(target, shared_guard):
                    raise ValueError(SLIPPED.format(target=target))
            target.rename(aside)
            fire("after_aside")
            with locate.readonly(aside / "board.sqlite") as late:
                slipped = not holds_nothing(aside, late)
            if slipped:
                aside.rename(target)  # a write landed during the rename itself; put the board back untouched
                raise ValueError(SLIPPED.format(target=target))
        elif target.exists():
            target.rmdir()
        try:
            stage.rename(target)
        except BaseException:
            if aside is not None:
                if not target.exists():
                    aside.rename(target)  # put the empty board back; nothing was lost
                else:  # something recreated the folder in the instant it was free: put the board file back inside it
                    for item in aside.iterdir():
                        if not (target / item.name).exists():
                            os.replace(item, target / item.name)
            raise
    except BaseException:
        shutil.rmtree(stage, ignore_errors=True)
        raise
    write_marker(legacy, f"Migrated to {target} by {args.actor}: {describe(before)}, {rewritten} artifact paths rewritten. This private copy is no longer used; it is kept as a backup.")
    print(f"migrated {describe(before)} into {target}; {rewritten} artifact paths rewritten, {files} files copied")
    print(f"the private board at {legacy} is left in place as a backup and will no longer be read")
    if aside is not None:
        print(f"an empty shared board that was in the way was set aside at {aside}")
    if skipped:
        print(f"not followed, not copied: {len(skipped)} link(s) in the private folder ({', '.join(skipped)})")
    with locate.readonly(target / "board.sqlite") as connection:
        held = connection.execute("SELECT * FROM tasks WHERE state='claimed'").fetchall()
    lapsed = sum(1 for row in held if leases.claim_status(row, leases.now(), locate.live_worktrees())[0] != "held")
    if held:
        print(f"{len(held)} task(s) are claimed, {lapsed} of them already lapsed under their own limits; claims keep the "
              f"--stale-after they were made with. Run `python .blackboard/board.py audit` to see them.")


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
