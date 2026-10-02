"""Where the Blackboard lives, and which checkout is asking.

The board is one SQLite ledger per repository, kept in git's shared directory
(`<git-common-dir>/blackboard/`).  Every worktree of a repository shares that directory,
so every worktree sees the same claims; nothing in it is committed, so branches cannot
conflict over it.  Outside git, or with BLACKBOARD_RUNTIME set, the board lives in a plain
folder instead.

Every module that touches the ledger resolves its path here.  Four modules once did it
separately, and one of them drifting is how a board silently splits in two.
"""
from __future__ import annotations

import hashlib
import json
import os
import sqlite3
import subprocess
from contextlib import contextmanager
from functools import lru_cache
from pathlib import Path
from typing import Iterator

SCHEMA_VERSION = 2
ENV_RUNTIME = "BLACKBOARD_RUNTIME"
MIGRATED_MARKER = "MIGRATED.txt"
TOOL_ROOT = Path(__file__).resolve().parent  # the .blackboard folder of the checkout running this copy


class BoardError(ValueError):
    """A problem with where the board is or which version it is; the message says what to do."""


def legacy_runtime() -> Path:
    """Where a pre-shared board lives: a private runtime folder inside this checkout."""
    return TOOL_ROOT / "runtime"


def norm(path: str | Path) -> str:
    """One comparable spelling of a path (case, separators, links) for equality checks."""
    return os.path.normcase(os.path.realpath(str(path)))


def git(*args: str, cwd: str | Path | None = None) -> str | None:
    """Run git and return its stdout, or None when git is missing or the command fails."""
    try:
        # git writes UTF-8; without saying so Python decodes it with the Windows ANSI codepage and any path
        # with an accent comes back as mojibake, which makes a live worktree look like it no longer exists.
        done = subprocess.run(
            ["git", *args], cwd=str(cwd if cwd is not None else TOOL_ROOT),
            capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=15,
        )
    except (OSError, subprocess.SubprocessError):
        return None
    return done.stdout.strip() if done.returncode == 0 else None


def common_dir(cwd: str | Path | None = None) -> Path | None:
    """The git directory shared by every worktree of the repository containing `cwd`."""
    out = git("rev-parse", "--path-format=absolute", "--git-common-dir", cwd=cwd)
    if out is None:  # git older than 2.31 has no --path-format
        out = git("rev-parse", "--git-common-dir", cwd=cwd)
        if out is None:
            return None
        found = Path(out)
        return (found if found.is_absolute() else Path(cwd if cwd is not None else TOOL_ROOT) / found).resolve()
    return Path(out).resolve()


def location() -> tuple[str, Path]:
    """("env" | "shared" | "local" | "unavailable", folder holding board.sqlite, its artifacts and snapshots).

    "unavailable" is a git checkout where git could not answer (missing, failing, timed out).  Falling back to a
    private board there would recreate exactly the split this module exists to prevent, so callers refuse instead.
    """
    override = os.environ.get(ENV_RUNTIME)
    if override:
        return "env", Path(override).resolve()
    common = common_dir()
    if common is not None:
        return "shared", common / "blackboard"
    if (TOOL_ROOT.parent / ".git").exists():
        return "unavailable", legacy_runtime()
    return "local", legacy_runtime()


def runtime_dir() -> Path:
    return location()[1]


def require_migrated() -> None:
    """Refuse to run beside an old private board that the shared board would silently ignore."""
    kind, shared = location()
    legacy = legacy_runtime()
    if kind == "unavailable":
        raise BoardError(
            "git could not be run here (is it on PATH?), so the shared board cannot be located; refusing to fall "
            "back to a private board inside a git checkout"
        )
    if kind == "shared" and (legacy / "board.sqlite").is_file() and not (legacy / MIGRATED_MARKER).exists():
        raise BoardError(
            f"this checkout still has its own board at {legacy}, but boards are now shared per repository at "
            f"{shared}, so it would be ignored. Run `python .blackboard/board.py migrate --actor <you>` to copy "
            f"it into the shared board, or add --abandon to set it aside without copying."
        )


@lru_cache(maxsize=64)
def _identity(cwd: str, tool_root: str) -> tuple[str | None, str | None]:
    here = common_dir(cwd)
    if here is None:
        return None, None  # the caller is not inside any git repository
    board = common_dir(tool_root)
    if board is not None and norm(here) != norm(board):
        return None, None  # the caller is in a different repository than the board's
    top = git("rev-parse", "--show-toplevel", cwd=cwd)
    branch = git("branch", "--show-current", cwd=cwd)
    return (str(Path(top).resolve()) if top else None), (branch or "(detached)")


def identity() -> dict[str, str | None]:
    """The worktree and branch the caller is working in, as stamped on claims and events.

    Both are None when the caller is outside the board's repository: a claim must not look
    orphaned just because its author ran the tool from somewhere unrelated.
    """
    worktree, branch = _identity(os.getcwd(), str(TOOL_ROOT))
    return {"worktree": worktree, "branch": branch}


def worktree_paths() -> list[str] | None:
    """Paths of this repository's existing worktrees, or None when git cannot say."""
    out = git("worktree", "list", "--porcelain", "-z")  # NUL-separated, so no path can break the parsing
    separator, gap = "\0", "\0\0"
    if out is None:  # git older than 2.36 has no -z
        out = git("worktree", "list", "--porcelain")
        separator, gap = "\n", "\n\n"
    if out is None:
        return None
    blocks = out.replace("\r\n", "\n").split(gap) if separator == "\n" else out.split(gap)
    paths: list[str] = []
    for block in blocks:
        fields = block.split(separator)
        path = next((field[len("worktree "):] for field in fields if field.startswith("worktree ")), None)
        if path and not any(field.startswith("prunable") for field in fields) and Path(path).is_dir():
            paths.append(path)
    return paths


def live_worktrees() -> set[str] | None:
    """Normalised paths of this repository's existing worktrees, or None when git cannot say."""
    paths = worktree_paths()
    return None if paths is None else {norm(path) for path in paths}


DB_FILES = frozenset({"board.sqlite", "board.sqlite-journal", "board.sqlite-wal", "board.sqlite-shm"})


def content_hash(path: Path) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for block in iter(lambda: handle.read(1 << 20), b""):
            digest.update(block)
    return digest.hexdigest()[:16]


def folder_files(folder: Path) -> list[tuple[str, int, str]]:
    """Name, size and a hash of the CONTENTS of every file in a private board's folder except the database and the
    marker (artifacts, snapshots).  Links are not followed.  The write lock covers the database only, so these are
    how a write beside it is noticed.  Contents, not modification times: a same-length overwrite that puts the old
    time back changes nothing a timestamp can see."""
    found = []
    for directory, _subdirs, names in os.walk(folder, followlinks=False):
        for name in names:
            path = Path(directory) / name
            if name not in DB_FILES and name not in (MIGRATED_MARKER, MIGRATED_MARKER + ".tmp") and not path.is_symlink():
                found.append((str(path.relative_to(folder)), path.stat().st_size, content_hash(path)))
    return sorted(found)


def files_digest(files: list[tuple[str, int, str]]) -> str:
    return hashlib.sha256(json.dumps(files).encode("utf-8")).hexdigest()[:16]


def db_fingerprint(folder: Path) -> str:
    """A fingerprint of what the board CONTAINS: a hash of every row of the ledger's tables, read through SQLite.

    Fingerprinting the files instead (size, modification time, the write-ahead log) is fragile both ways: a commit can
    sit in the log while the main file is untouched, and merely closing a reader can checkpoint the log and change the
    file's time with nothing written.  What SQLite returns does not depend on either."""
    path = Path(folder) / "board.sqlite"
    if not path.is_file():
        return ""
    digest = hashlib.sha256()
    try:
        connection = sqlite3.connect(readonly_uri(path), uri=True, timeout=2)
        try:
            for table in ("tasks", "events", "defects"):
                for row in connection.execute(f"SELECT * FROM {table} ORDER BY 1"):
                    digest.update(repr(tuple(row)).encode("utf-8"))
        finally:
            connection.close()
    except sqlite3.Error:
        return "unreadable"
    return digest.hexdigest()[:16]


def readonly_uri(database: Path | str) -> str:
    """SQLite URI for read-only access.  The path is percent-encoded: spliced in raw, a `?`, `#` or `%` in the
    repository path is parsed as URI syntax and SQLite opens the wrong (empty) database."""
    return Path(database).resolve().as_uri() + "?mode=ro"


def open_readonly(database: Path) -> sqlite3.Connection:
    """A read-only connection to the ledger.  Raises BoardError for a newer schema without leaking the connection."""
    connection = sqlite3.connect(readonly_uri(database), uri=True)
    connection.row_factory = sqlite3.Row
    try:
        check_schema_version(connection)
    except BaseException:
        connection.close()
        raise
    return connection


@contextmanager
def readonly(database: Path) -> Iterator[sqlite3.Connection]:
    """open_readonly as a context manager that CLOSES on exit (sqlite3's own `with` only commits, and an open
    file blocks renames and deletes on Windows)."""
    connection = open_readonly(database)
    try:
        yield connection
    finally:
        connection.close()


def check_schema_version(connection) -> None:
    """Stop an older tool from touching a ledger written by a newer one."""
    version = connection.execute("PRAGMA user_version").fetchone()[0]
    if version > SCHEMA_VERSION:
        raise BoardError(
            f"this board uses schema v{version} but this copy of the tool only understands up to "
            f"v{SCHEMA_VERSION}; update .blackboard from a newer branch (a newer tool wrote it)"
        )
