"""Read-only: where is the board, and is anything wrong with it?  Commands: where, audit."""
from __future__ import annotations

import argparse
import sqlite3
import sys
from pathlib import Path

import leases
import locate

KIND_TEXT = {
    "shared": "shared by every worktree of this repository",
    "env": f"set by the {locate.ENV_RUNTIME} environment variable",
    "local": "private to this checkout (not inside a git repository)",
    "unavailable": "UNKNOWN: git could not be run, so the shared board cannot be located",
}


def legacy_state() -> tuple[str, str]:
    """("none" | "unmigrated" | "settled", one-line description) for this checkout's private board."""
    legacy = locate.legacy_runtime()
    kind = locate.location()[0]
    if kind == "local" or not (legacy / "board.sqlite").is_file():  # in local mode that folder IS the board
        return "none", "none"
    if kind != "shared":
        return "ignored", f"present at {legacy}, but not used because the board location is {kind}"
    if (legacy / locate.MIGRATED_MARKER).exists():
        return "settled", f"set aside, see {legacy / locate.MIGRATED_MARKER}"
    return "unmigrated", f"UNMIGRATED at {legacy} (ignored until you run migrate)"


def where() -> int:
    kind, folder = locate.location()
    database = folder / "board.sqlite"
    who = locate.identity()
    print(f"board:      {folder}  ({KIND_TEXT[kind]})")
    if database.is_file():
        with locate.readonly(database) as connection:
            tasks = connection.execute("SELECT COUNT(*) FROM tasks").fetchone()[0]
        print(f"database:   {database}  ({tasks} tasks)")
    else:
        print(f"database:   {database}  (not created yet: run `python .blackboard/board.py init`)")
    print(f"artifacts:  save a result as {folder / '<task-id>.md'} (or .json / .txt), then submit it")
    print(f"you:        {('worktree ' + who['worktree'] + ', branch ' + who['branch']) if who['worktree'] else 'not inside this repository'}")
    print(f"old board:  {legacy_state()[1]}")
    return 0


def problems() -> list[str]:
    found: list[str] = []
    state, text = legacy_state()
    if state == "unmigrated":
        found.append(f"this checkout's own board is {text}")
    if locate.location()[0] == "shared":
        # A worktree on a branch from before boards were shared keeps writing to its own private board; nothing
        # can stop that, but it can be seen here.
        here = locate.norm(locate.TOOL_ROOT.parent)
        for path in locate.worktree_paths() or []:
            private = Path(path) / ".blackboard" / "runtime"
            if locate.norm(path) != here and (private / "board.sqlite").is_file() and not (private / locate.MIGRATED_MARKER).exists():
                found.append(f"worktree {path} has its own private board at {private}; update its .blackboard from a branch that has "
                             f"shared boards, then run migrate there (only one board can be migrated; the others are set aside with --abandon)")
    database = locate.runtime_dir() / "board.sqlite"
    if not database.is_file():
        return found
    with locate.readonly(database) as connection:
        rows = connection.execute("SELECT * FROM tasks WHERE state='claimed' ORDER BY id").fetchall()
    at, live = leases.now(), locate.live_worktrees()
    for row in rows:
        status, why = leases.claim_status(row, at, live)
        if status != "held":
            found.append(f"task {row['id']} is claimed by {row['assignee']} but the claim is {status}: {why}")
    return found


def audit() -> int:
    found = problems()
    for line in found:
        print(f"problem: {line}")
    if found:
        print(f"{len(found)} problem(s). `python .blackboard/board.py reap --actor <you>` returns lapsed claims to the queue.")
        return 1
    print("no problems")
    return 0


def main() -> int:
    root = argparse.ArgumentParser(description=__doc__)
    commands = root.add_subparsers(dest="command", required=True)
    commands.add_parser("where", help="Show where the board lives and where to save artifacts")
    commands.add_parser("audit", help="Report lapsed claims and an ignored private board; exit 1 if any")
    args = root.parse_args()
    try:
        return where() if args.command == "where" else audit()
    except (locate.BoardError, sqlite3.Error) as error:
        print(f"error: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
