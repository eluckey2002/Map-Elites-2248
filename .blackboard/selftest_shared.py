"""Self-test for the shared board: worktrees, leases, stamps, schema upgrade, migration.

Run through `python .blackboard/board.py self-test`.  It builds throwaway git repositories and worktrees in a
temporary directory and drives the real command line with real processes, because a mock of "two worktrees share
one board" would only test the mock.  It never touches the project's own repository, worktrees or board.
"""
from __future__ import annotations

import argparse
import contextlib
import hashlib
import io
import json
import os
import shutil
import sqlite3
import stat
import subprocess
import sys
import tempfile
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path

import leases
import locate

PY = sys.executable
ENV = {key: value for key, value in os.environ.items() if key != locate.ENV_RUNTIME}

V1_DDL = (
    """CREATE TABLE tasks (id TEXT PRIMARY KEY, diagnostic_question TEXT NOT NULL, specialty TEXT NOT NULL,
       scope TEXT NOT NULL, acceptance TEXT NOT NULL, dependencies TEXT NOT NULL DEFAULT '', reviewer TEXT NOT NULL,
       stop_condition TEXT NOT NULL, state TEXT NOT NULL CHECK(state IN ('queued','claimed','submitted','accepted','repair_requested')),
       assignee TEXT, claimed_at TEXT, last_reported_at TEXT, submitted_at TEXT, reviewed_at TEXT, artifact_path TEXT,
       review_note TEXT, stale_after_seconds INTEGER NOT NULL CHECK(stale_after_seconds > 0))""",
    """CREATE TABLE events (sequence INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL,
       kind TEXT NOT NULL CHECK(kind IN ('created','claimed','progress_reported','submitted','defect_recorded','accepted','repair_requested','defect_disposition')),
       task_id TEXT REFERENCES tasks(id), actor TEXT NOT NULL, detail TEXT NOT NULL)""",
    """CREATE TABLE defects (id INTEGER PRIMARY KEY AUTOINCREMENT, task_id TEXT NOT NULL REFERENCES tasks(id),
       summary TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'open' CHECK(state IN ('open','fixed','dismissed')),
       reported_at TEXT NOT NULL, disposition TEXT NOT NULL DEFAULT '')""",
)


class Clock:
    def __init__(self) -> None:
        self.now = datetime(2026, 1, 1, tzinfo=timezone.utc)

    def __call__(self) -> datetime:
        return self.now

    def advance(self, seconds: int) -> None:
        self.now += timedelta(seconds=seconds)


def ns(**fields) -> argparse.Namespace:
    return argparse.Namespace(**fields)


def expect(condition: object, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def expect_error(call, fragment: str) -> None:
    try:
        call()
    except ValueError as error:
        expect(fragment in str(error), f"error {str(error)!r} does not mention {fragment!r}")
        return
    raise AssertionError(f"expected an error mentioning {fragment!r}")


@contextmanager
def patched(owner, name: str, value):
    original = getattr(owner, name)
    setattr(owner, name, value)
    try:
        yield
    finally:
        setattr(owner, name, original)


@contextmanager
def using_board(rt, folder: Path):
    folder.mkdir(parents=True, exist_ok=True)
    original = rt.RUNTIME, rt.DATABASE
    rt.RUNTIME, rt.DATABASE = folder, folder / "board.sqlite"
    try:
        yield
    finally:
        rt.RUNTIME, rt.DATABASE = original


@contextmanager
def db(path: Path):
    """A connection that is committed and CLOSED on exit (sqlite3's own `with` leaves it open, and Windows
    will not delete a database file that is still open)."""
    connection = sqlite3.connect(path)
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def sha(path: Path) -> str:
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def git(*args: str, cwd: Path) -> None:
    subprocess.run(["git", "-c", "user.name=selftest", "-c", "user.email=selftest@example.invalid", *args],
                   cwd=str(cwd), check=True, capture_output=True, text=True)


def remove_tree(path: Path) -> None:
    def force(function, target, _error):  # git object files are read-only, which Windows will not delete
        os.chmod(target, stat.S_IWRITE)
        function(target)
    if sys.version_info >= (3, 12):
        shutil.rmtree(path, onexc=force)
    else:
        shutil.rmtree(path, onerror=force)


def make_repo(base: Path, name: str, branches: tuple[str, ...] = ()) -> tuple[Path, list[Path]]:
    """A throwaway repository holding this tool, plus one real worktree per branch."""
    repo = base / name
    repo.mkdir()
    git("init", "-q", "-b", "main", cwd=repo)
    shutil.copytree(locate.TOOL_ROOT, repo / ".blackboard", ignore=shutil.ignore_patterns("runtime", "__pycache__", "*.pyc"))
    git("add", "-A", cwd=repo)
    git("commit", "-q", "-m", "tool", cwd=repo)
    trees = []
    for branch in branches:
        tree = base / f"{name}-{branch}"
        git("worktree", "add", "-q", "-b", branch, str(tree), cwd=repo)
        trees.append(tree)
    return repo, trees


def command(root: Path, *args: str) -> list[str]:
    return [PY, str(Path(root) / ".blackboard" / "board.py"), *args]


def cli(root: Path, *args: str, cwd: Path | None = None, env: dict | None = None) -> subprocess.CompletedProcess:
    return subprocess.run(command(root, *args), cwd=str(cwd or root), capture_output=True, text=True, encoding="utf-8",
                          errors="replace", env=env if env is not None else ENV, timeout=120)


def create_args(identifier: str, stale_after: int = 300) -> list[str]:
    return ["create", "--actor", "t", "--id", identifier, "--question", "q", "--specialty", "s", "--scope", "bounded",
            "--acceptance", "a", "--reviewer", "checker", "--stop-condition", "done", "--stale-after", str(stale_after)]


def claim_args(identifier: str, who: str, reason: str = "") -> list[str]:
    args = ["claim", "--actor", who, "--id", identifier, "--assignee", who]
    return args + ["--reason", reason] if reason else args


def record(root: Path, identifier: str, cwd: Path | None = None) -> dict:
    done = cli(root, "query", "task", identifier, cwd=cwd)
    expect(done.returncode == 0, f"query task {identifier} failed: {done.stdout}{done.stderr}")
    return json.loads(done.stdout)


def make_v1_board(path: Path, artifact: Path | None) -> dict[str, int]:
    """A board exactly as the pre-shared tool wrote it: old DDL, user_version 0, absolute artifact path."""
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path)
    for statement in V1_DDL:
        connection.execute(statement)
    when = "2026-09-27T01:00:00+00:00"
    rows = [
        ("old-queued", "queued", None, None, None, None),
        ("old-claimed", "claimed", "legacy-agent", when, None, None),
        ("old-done", "accepted", "legacy-agent", when, when, str(artifact) if artifact else None),
    ]
    for identifier, state, assignee, claimed, reviewed, artifact_path in rows:
        connection.execute(
            "INSERT INTO tasks(id, diagnostic_question, specialty, scope, acceptance, reviewer, stop_condition, state, assignee,"
            " claimed_at, reviewed_at, artifact_path, stale_after_seconds) VALUES (?, 'q', 's', 'b', 'a', 'checker', 'd', ?, ?, ?, ?, ?, 300)",
            (identifier, state, assignee, claimed, reviewed, artifact_path),
        )
    events = [("created", "old-queued"), ("created", "old-claimed"), ("claimed", "old-claimed"), ("created", "old-done"),
              ("claimed", "old-done"), ("submitted", "old-done"), ("accepted", "old-done")]
    for kind, identifier in events:
        connection.execute("INSERT INTO events(at, kind, task_id, actor, detail) VALUES (?, ?, ?, 'legacy-agent', 'legacy event')",
                           (when, kind, identifier))
    connection.execute("INSERT INTO defects(task_id, summary, reported_at) VALUES ('old-done', 'a defect', ?)", (when,))
    connection.commit()
    connection.close()
    return {"tasks": len(rows), "events": len(events), "defects": 1}


def test_worktrees_share_one_board(base: Path) -> None:
    repo, (wt_a, wt_b) = make_repo(base, "shared", ("wt-a", "wt-b"))
    shared = repo / ".git" / "blackboard"
    for place in (repo, wt_a, wt_b):
        out = cli(place, "where")
        expect(out.returncode == 0, f"where failed in {place}: {out.stderr}")
        line = next(item for item in out.stdout.splitlines() if item.startswith("board:"))
        reported = line[len("board:"):].split("  (")[0].strip()
        expect(locate.norm(reported) == locate.norm(shared), f"{place} reports board {reported}, expected {shared}")
    expect(cli(wt_a, "init").returncode == 0, "init failed")
    for tree in (repo, wt_a, wt_b):
        expect(not (tree / ".blackboard" / "runtime" / "board.sqlite").exists(), f"{tree} grew a private board")
    expect((shared / "board.sqlite").is_file(), "the shared board was not created in the git common directory")

    expect(cli(wt_a, *create_args("t1")).returncode == 0, "create failed")
    expect(cli(wt_a, *claim_args("t1", "agent-a")).returncode == 0, "claim failed")
    seen = record(wt_b, "t1")["task"]  # read from the OTHER worktree
    expect(seen["state"] == "claimed" and seen["assignee"] == "agent-a", "wt-b cannot see wt-a's claim")
    expect(locate.norm(seen["claim_worktree"]) == locate.norm(wt_a), f"claim stamped with {seen['claim_worktree']}")
    expect(seen["claim_branch"] == "wt-a", f"claim stamped with branch {seen['claim_branch']}")
    refused = cli(wt_b, *claim_args("t1", "agent-b", "taking over"))
    expect(refused.returncode == 1 and "live claim" in refused.stderr, f"a live claim was not protected: {refused.stderr}")

    cli(wt_a, *create_args("race"))
    racers = [subprocess.Popen(command(tree, *claim_args("race", name)), cwd=str(tree), env=ENV, text=True,
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE) for name, tree in (("agent-a", wt_a), ("agent-b", wt_b))]
    codes = sorted(racer.wait(timeout=120) for racer in racers)
    [racer.communicate() for racer in racers]
    expect(codes == [0, 1], f"two worktrees racing for one claim must give exactly one winner, got exit codes {codes}")

    outside = base / "outside"
    outside.mkdir()
    cli(repo, *create_args("o1"))
    expect(cli(repo, *claim_args("o1", "stray"), cwd=outside).returncode == 0, "claim from outside the repository failed")
    expect(record(repo, "o1")["task"]["claim_worktree"] is None, "a caller outside the repository was stamped with a worktree")

    git("worktree", "remove", "--force", str(wt_a), cwd=repo)  # the agent's worktree disappears; its claim is still on the board
    audit = cli(repo, "audit")
    expect(audit.returncode == 1 and "t1" in audit.stdout and "orphaned" in audit.stdout, f"audit missed an orphaned claim: {audit.stdout}")
    expect("o1" not in audit.stdout, "a claim made from outside the repository was flagged as orphaned")
    quiet = cli(wt_b, *claim_args("t1", "agent-b"))
    expect(quiet.returncode == 1 and "requires --reason" in quiet.stderr, f"reclaiming without a reason was allowed: {quiet.stderr}")
    expect(cli(wt_b, *claim_args("t1", "agent-b", "agent-a's worktree is gone")).returncode == 0, "reclaiming an orphaned claim failed")
    after = record(wt_b, "t1")
    expect(after["task"]["assignee"] == "agent-b" and "lease_expired" in [e["kind"] for e in after["events"]],
           "takeover left no lease_expired event")

    cli(wt_b, *create_args("r1"))
    cli(wt_b, *claim_args("r1", "agent-b"))
    git("worktree", "remove", "--force", str(wt_b), cwd=repo)
    dry = cli(repo, "reap", "--actor", "t", "--dry-run")
    expect(dry.returncode == 0 and "would release r1" in dry.stdout, f"dry run: {dry.stdout}{dry.stderr}")
    expect(record(repo, "r1")["task"]["state"] == "claimed", "a dry run changed the board")
    expect(cli(repo, "reap", "--actor", "t").returncode == 0, "reap failed")
    released = record(repo, "r1")["task"]
    expect(released["state"] == "queued" and released["assignee"] is None, "reap did not return the claim to the queue")
    expect(record(repo, "t1")["task"]["state"] == "queued", "reap missed the second orphaned claim")
    final = cli(repo, "audit")
    expect(final.returncode == 0 and "no problems" in final.stdout, f"audit still reports problems after reap: {final.stdout}")


def test_leases(rt, base: Path) -> None:
    clock = Clock()
    stamp = {"worktree": "/w/one", "branch": "b1"}
    with using_board(rt, base / "leases"), patched(leases, "_NOW", clock), \
            patched(locate, "live_worktrees", lambda: None), patched(locate, "identity", lambda: stamp):
        rt.init(ns())

        def create(identifier: str, stale_after: int) -> None:
            rt.create(ns(id=identifier, question="q", specialty="s", scope="b", acceptance="a", dependencies="",
                         reviewer="checker", stop_condition="d", stale_after=stale_after, actor="t"))

        def claim(identifier: str, who: str, reason: str = "") -> None:
            rt.claim(ns(id=identifier, assignee=who, actor=who, reason=reason))

        def row(identifier: str) -> dict:
            with rt.transaction() as connection:
                return dict(rt.one(connection, identifier))

        create("a", 60)
        claim("a", "x")
        expect_error(lambda: claim("a", "y", "please"), "live claim")
        clock.advance(59)
        rt.progress(ns(id="a", actor="x", detail="still here"))  # renews the lease
        clock.advance(60)
        expect_error(lambda: claim("a", "y", "please"), "live claim")  # exactly at the limit is still held
        clock.advance(1)
        expect_error(lambda: claim("a", "y"), "requires --reason")
        claim("a", "y", "x went quiet")
        taken = row("a")
        expect(taken["assignee"] == "y" and taken["last_reported_at"] is None, "takeover did not reset the claim")
        expect((taken["claim_worktree"], taken["claim_branch"]) == ("/w/one", "b1"), "claim was not stamped with worktree and branch")
        # the agent whose claim was taken over must not be able to keep writing to it
        expect_error(lambda: rt.progress(ns(id="a", actor="x", detail="still mine?")), "only y")
        expect_error(lambda: rt.submit(ns(id="a", actor="x", artifact="unused", detail="mine")), "only y")
        with rt.transaction() as connection:
            events = connection.execute("SELECT kind, detail, worktree, branch FROM events WHERE task_id='a' ORDER BY sequence").fetchall()
        expect([e["kind"] for e in events] == ["created", "claimed", "progress_reported", "lease_expired", "claimed"],
               f"unexpected event order {[e['kind'] for e in events]}")
        expect("x" in events[3]["detail"] and all(e["worktree"] == "/w/one" for e in events), "events were not stamped or the lapse was not explained")

        create("b", 3600)
        claim("b", "x")
        with patched(locate, "live_worktrees", lambda: {locate.norm("/w/one")}):
            expect_error(lambda: claim("b", "y", "try"), "live claim")  # worktree exists and the lease is fresh
        with patched(locate, "live_worktrees", lambda: {locate.norm("/w/other")}):
            claim("b", "y", "its worktree is gone")  # orphaned: reclaimable even though the lease is fresh
        with rt.transaction() as connection:
            detail = connection.execute("SELECT detail FROM events WHERE task_id='b' AND kind='lease_expired'").fetchone()["detail"]
        expect("no longer exists" in detail, f"orphan takeover not explained: {detail}")

        for identifier, stale in (("c1", 60), ("c2", 3600), ("c3", 60)):
            create(identifier, stale)
            claim(identifier, "x")
        with rt.transaction() as connection:  # c3 was claimed to repair reviewed work
            connection.execute("UPDATE tasks SET review_note='fix it', reviewed_at=? WHERE id='c3'", (rt.utcnow(),))
        clock.advance(120)
        buffer = io.StringIO()
        with contextlib.redirect_stdout(buffer):
            rt.reap(ns(actor="reaper", dry_run=True))
        expect("would release c1" in buffer.getvalue() and "c2" not in buffer.getvalue(), f"dry run output: {buffer.getvalue()}")
        expect(row("c1")["state"] == "claimed", "a dry run changed the board")
        with contextlib.redirect_stdout(io.StringIO()):
            rt.reap(ns(actor="reaper", dry_run=False))
        c1, c2, c3 = row("c1"), row("c2"), row("c3")
        expect((c1["state"], c1["assignee"], c1["claim_worktree"]) == ("queued", None, None), f"c1 after reap: {c1}")
        expect(c2["state"] == "claimed", "reap released a claim that was still held")
        expect(c3["state"] == "repair_requested", "a lapsed repair claim must go back to repair, not the plain queue")
        with rt.transaction() as connection:
            before = connection.execute("SELECT COUNT(*) FROM events").fetchone()[0]
        again = io.StringIO()
        with contextlib.redirect_stdout(again):
            rt.reap(ns(actor="reaper", dry_run=False))
        with rt.transaction() as connection:
            after = connection.execute("SELECT COUNT(*) FROM events").fetchone()[0]
        expect("no lapsed claims" in again.getvalue() and before == after, "a second reap changed the board")

        # one unreadable timestamp must not stop the others from being judged
        for identifier in ("n1", "g1", "ok1"):
            create(identifier, 3600)
            claim(identifier, "x")
        with rt.transaction() as connection:
            connection.execute("UPDATE tasks SET claimed_at=? WHERE id='n1'", (clock.now.replace(tzinfo=None).isoformat(timespec="seconds"),))
            connection.execute("UPDATE tasks SET claimed_at='garbage' WHERE id='g1'")
        with contextlib.redirect_stdout(io.StringIO()):
            rt.reap(ns(actor="reaper", dry_run=False))
        expect(row("n1")["state"] == "claimed", "a timestamp without a timezone was judged lapsed")
        expect(row("g1")["state"] == "queued", "an unreadable timestamp was not treated as lapsed")
        expect(row("ok1")["state"] == "claimed", "a healthy claim was released")

        # A holder that went quiet past its limit but was NOT replaced may still report: the lease only matters once
        # someone takes the claim over, and the single write lock orders a renewal and a takeover one way or the other.
        create("slow", 60)
        claim("slow", "x")
        clock.advance(61)
        rt.progress(ns(id="slow", actor="x", detail="slow but alive"))
        expect_error(lambda: claim("slow", "y", "try"), "live claim")
        clock.advance(61)
        claim("slow", "y", "x went quiet again")
        expect_error(lambda: rt.progress(ns(id="slow", actor="x", detail="too late")), "only y")


def test_schema_upgrade_and_guard(rt, base: Path) -> None:
    import query_liveboard
    path = base / "v1" / "board.sqlite"
    make_v1_board(path, None)
    with db(path) as connection:
        old_events = connection.execute("SELECT sequence, kind, detail FROM events ORDER BY sequence").fetchall()
        expect(connection.execute("PRAGMA user_version").fetchone()[0] == 0, "fixture is not a pre-versioned board")
    for _ in range(2):  # the second pass proves the upgrade is idempotent
        with rt.transaction(path) as connection:
            rt.schema(connection)
    with db(path) as connection:
        expect(connection.execute("SELECT sequence, kind, detail FROM events ORDER BY sequence").fetchall() == old_events,
               "upgrading rewrote or lost events")
        columns = {row[1] for row in connection.execute("PRAGMA table_info(events)")}
        task_columns = {row[1] for row in connection.execute("PRAGMA table_info(tasks)")}
        expect({"worktree", "branch"} <= columns and {"claim_worktree", "claim_branch"} <= task_columns, "new columns missing")
        expect(connection.execute("PRAGMA user_version").fetchone()[0] == locate.SCHEMA_VERSION, "schema version not recorded")
    with rt.transaction(path) as connection:
        rt.emit(connection, "lease_expired", None, "t", "new kind accepted")
        newest = connection.execute("SELECT MAX(sequence) FROM events").fetchone()[0]
    expect(newest == len(old_events) + 1, "event sequence did not continue after the upgrade")
    with db(path) as connection:
        connection.execute("PRAGMA user_version = 99")
    def write_to_newer() -> None:
        with rt.transaction(path) as connection:
            rt.schema(connection)
    expect_error(write_to_newer, "newer tool wrote it")
    expect_error(lambda: query_liveboard.connection_for(path), "newer tool wrote it")


def test_migrate(base: Path) -> None:
    repo, _ = make_repo(base, "legacy")
    private = repo / ".blackboard" / "runtime"
    private.mkdir()
    artifact = private / "old-done.md"
    artifact.write_text("evidence", encoding="utf-8")
    (private / "snapshots").mkdir()
    (private / "snapshots" / "snap1.json").write_text("{}", encoding="utf-8")
    made = make_v1_board(private / "board.sqlite", artifact)
    original = sha(private / "board.sqlite")
    # a link out of the folder is not part of the board and must not be followed (copytree would copy its whole target)
    secret = base / "outside-secret"
    secret.mkdir()
    (secret / "secret.txt").write_text("not part of the board", encoding="utf-8")
    try:
        os.symlink(secret, private / "linked", target_is_directory=True)
        linked = True
    except OSError:
        linked = False  # creating links needs a privilege some machines lack
        print("  (note: the symlink case was skipped; this machine cannot create links)")

    summary = cli(repo, "query", "summary")
    expect(summary.returncode == 2 and "migrate" in summary.stdout, f"query ran beside an unmigrated board: {summary.stdout}")
    init = cli(repo, "init")
    expect(init.returncode == 1 and "migrate" in init.stderr, "init created a second board beside an unmigrated one")
    expect("UNMIGRATED" in cli(repo, "where").stdout, "where does not mention the unmigrated board")
    unmigrated = cli(repo, "audit")
    expect(unmigrated.returncode == 1 and "UNMIGRATED" in unmigrated.stdout, "audit missed the unmigrated board")

    done = cli(repo, "migrate", "--actor", "t")
    expect(done.returncode == 0, f"migrate failed: {done.stdout}{done.stderr}")
    totals = json.loads(cli(repo, "query", "summary").stdout)["summary"]
    expect((totals["task_count"], totals["event_count"], totals["defect_count"]) == (made["tasks"], made["events"] + 1, made["defects"]),
           f"counts changed in migration: {totals}")
    shared = repo / ".git" / "blackboard"
    moved = record(repo, "old-done")["task"]
    expect(locate.norm(moved["artifact_path"]) == locate.norm(shared / "old-done.md"), f"artifact path not rewritten: {moved['artifact_path']}")
    expect(Path(moved["artifact_path"]).read_text(encoding="utf-8") == "evidence", "artifact was not copied")
    expect((shared / "snapshots" / "snap1.json").is_file(), "snapshots were not copied")
    if linked:
        expect(not (shared / "linked").exists(), "a link out of the folder was followed and its target copied into the board")
        expect("not followed" in done.stdout, f"the skipped link was not reported: {done.stdout}")
    expect(sha(private / "board.sqlite") == original, "the private board was modified")
    expect((private / locate.MIGRATED_MARKER).is_file(), "no migrated marker left behind")
    expect(cli(repo, "migrate", "--actor", "t").returncode == 1, "migrating twice was allowed")
    # a run that copied the board and then died before leaving its marker must be finishable, not a dead end
    (private / locate.MIGRATED_MARKER).unlink()
    resumed = cli(repo, "migrate", "--actor", "t")
    expect(resumed.returncode == 0 and "already migrated" in resumed.stdout, f"an interrupted migration could not be finished: {resumed.stdout}{resumed.stderr}")
    expect((private / locate.MIGRATED_MARKER).is_file(), "finishing an interrupted migration left no marker")
    expect(json.loads(cli(repo, "query", "summary").stdout)["summary"]["event_count"] == made["events"] + 1, "finishing wrote a second migration")
    # ...but if the private board changed in the meantime, restoring the marker would silently drop those writes.
    # A file beside the database counts too: the write lock covers rows, not an artifact an older tool saves.
    (private / locate.MIGRATED_MARKER).unlink()
    (private / "late.txt").write_text("saved by an older tool after the copy", encoding="utf-8")
    stray = cli(repo, "migrate", "--actor", "t")
    expect(stray.returncode == 1 and "changed after it was copied" in stray.stderr, f"a stray file was declared migrated: {stray.stdout}{stray.stderr}")
    expect(not (private / locate.MIGRATED_MARKER).exists(), "a marker was written over a stranded file")
    (private / "late.txt").unlink()
    with db(private / "board.sqlite") as connection:
        connection.execute("INSERT INTO events(at, kind, task_id, actor, detail) VALUES "
                           "('2026-10-01T00:00:00+00:00', 'progress_reported', 'old-claimed', 'legacy-agent', 'a late write by an older tool')")
    late = cli(repo, "migrate", "--actor", "t")
    expect(late.returncode == 1 and "changed after it was copied" in late.stderr, f"a changed private board was declared migrated: {late.stdout}{late.stderr}")
    expect(not (private / locate.MIGRATED_MARKER).exists(), "a marker was written over unmigrated changes")
    expect(cli(repo, "migrate", "--actor", "t", "--abandon").returncode == 0, "setting the changed board aside on purpose failed")
    claimed = cli(repo, "audit")
    expect("old-claimed" in claimed.stdout and "expired" in claimed.stdout and "UNMIGRATED" not in claimed.stdout,
           f"a migrated legacy claim was not judged by its lease: {claimed.stdout}")
    # an older tool that resumes writing to a settled private board leaves the marker alone.  Make the write land only
    # 0.1s after the marker, by moving the marker's own time: a comparison with a tolerance could never see that.
    with db(private / "board.sqlite") as connection:
        connection.execute("INSERT INTO events(at, kind, task_id, actor, detail) VALUES "
                           "('2026-10-02T00:00:00+00:00', 'progress_reported', 'old-claimed', 'legacy-agent', 'a write after the marker')")
    written = (private / "board.sqlite").stat().st_mtime
    os.utime(private / locate.MIGRATED_MARKER, (written - 0.1, written - 0.1))
    diverged = cli(repo, "audit")
    expect(diverged.returncode == 1 and "CHANGED after it was set aside" in diverged.stdout, f"a write after the marker went unnoticed: {diverged.stdout}")

    both, _ = make_repo(base, "both")
    expect(cli(both, "init").returncode == 0, "init failed")
    expect(cli(both, *create_args("already-here")).returncode == 0, "create failed")  # a shared board with something in it
    stray = both / ".blackboard" / "runtime"
    make_v1_board(stray / "board.sqlite", None)
    expect(cli(both, "query", "summary").returncode == 2, "query ran beside an unmigrated board")
    refused = cli(both, "migrate", "--actor", "t")
    expect(refused.returncode == 1 and "already exists" in refused.stderr and "--abandon" in refused.stderr, f"merge was not refused: {refused.stderr}")
    expect(not (stray / locate.MIGRATED_MARKER).exists(), "a refused migration left a marker")
    expect(cli(both, "migrate", "--actor", "t", "--abandon").returncode == 0, "abandon failed")
    expect(json.loads(cli(both, "query", "summary").stdout)["summary"]["task_count"] == 1, "the shared board was disturbed")

    # the realistic rollout: a sibling worktree runs `init` before the owner has migrated the real board
    real, (sibling,) = make_repo(base, "rollout", ("sib",))
    held = real / ".blackboard" / "runtime"
    made = make_v1_board(held / "board.sqlite", None)
    expect(cli(sibling, "init").returncode == 0, "the sibling's init failed")
    done = cli(real, "migrate", "--actor", "t")
    expect(done.returncode == 0, f"an empty shared board blocked migrating the real one: {done.stdout}{done.stderr}")
    expect(json.loads(cli(real, "query", "summary").stdout)["summary"]["task_count"] == made["tasks"], "the real board did not win")
    expect(list((real / ".git").glob("blackboard.empty-*")), "the empty board was deleted instead of set aside")

    # a shared board in WAL mode keeps -wal and -shm files while it is open; they are part of the database, not content
    wal_repo, (sibling5,) = make_repo(base, "walshared", ("sib",))
    make_v1_board(wal_repo / ".blackboard" / "runtime" / "board.sqlite", None)
    expect(cli(sibling5, "init").returncode == 0, "the fifth sibling's init failed")
    with db(wal_repo / ".git" / "blackboard" / "board.sqlite") as connection:
        connection.execute("PRAGMA journal_mode=WAL")
    done = cli(wal_repo, "migrate", "--actor", "t")
    expect(done.returncode == 0, f"an empty WAL-mode shared board blocked migrating the real one: {done.stdout}{done.stderr}")

    # an explicit BLACKBOARD_RUNTIME is the caller's choice, but `where` must not claim there is no old board
    chosen = {**ENV, locate.ENV_RUNTIME: str(base / "chosen")}
    told = cli(both, "where", env=chosen)
    expect(told.returncode == 0 and locate.ENV_RUNTIME in told.stdout, f"where in env mode: {told.stdout}")
    older = cli(real, "where", env=chosen)
    expect("not used because" in older.stdout, f"where hid an old board that env mode ignores: {older.stdout}")


def test_web_view(rt, base: Path) -> None:
    import server
    folder = base / "web"
    with using_board(rt, folder), patched(server, "DATABASE", folder / "board.sqlite"), patched(locate, "live_worktrees", lambda: None):
        rt.init(ns())
        rt.create(ns(id="srv", question="q", specialty="s", scope="b", acceptance="a", dependencies="", reviewer="checker",
                     stop_condition="d", stale_after=60, actor="t"))
        client = server.app.test_client()
        data = client.get("/api/snapshot").get_json()
        expect(data["service_state"] == "available" and data["tasks"][0]["id"] == "srv" and "claim_worktree" in data["tasks"][0],
               "the web view cannot read a v2 board")
        with db(folder / "board.sqlite") as connection:
            connection.execute("PRAGMA user_version = 99")
        expect(client.get("/api/snapshot").status_code == 503, "the web view served a board written by a newer tool")


def test_awkward_paths(base: Path) -> None:
    """A live claim must never look orphaned because its worktree path has an accent or a space."""
    repo, _ = make_repo(base, "awkward")
    trees = [base / "wé x", base / "plain space"]
    for number, tree in enumerate(trees):
        git("worktree", "add", "-q", "-b", f"br{number}", str(tree), cwd=repo)
        if number == 0:
            expect(cli(tree, "init").returncode == 0, "init failed")
        expect(cli(tree, *create_args(f"w{number}", 99999)).returncode == 0, "create failed")
        expect(cli(tree, *claim_args(f"w{number}", "agent")).returncode == 0, "claim failed")
    audit = cli(repo, "audit")
    expect(audit.returncode == 0 and "no problems" in audit.stdout, f"a live claim in {trees} looked lapsed: {audit.stdout}")
    expect(locate.norm(record(repo, "w0")["task"]["claim_worktree"]) == locate.norm(trees[0]), "the accented path was stamped wrongly")
    # a lapse has consequences now, so a task made without --stale-after must not lapse after five quiet minutes
    plain = ["create", "--actor", "t", "--id", "dflt", "--question", "q", "--specialty", "s", "--scope", "b", "--acceptance", "a",
             "--reviewer", "checker", "--stop-condition", "done"]
    expect(cli(repo, *plain).returncode == 0, "create without --stale-after failed")
    expect(record(repo, "dflt")["task"]["stale_after_seconds"] == 3600, "the default --stale-after is not an hour")


def test_migration_races(rt, base: Path) -> None:
    """Nothing may commit to a board between the moment migrate reads it and the moment it is settled."""
    import migrate

    path = base / "lock" / "board.sqlite"
    make_v1_board(path, None)
    with migrate.writers_paused(path):
        other = sqlite3.connect(path, timeout=0.2, isolation_level=None)
        try:
            try:
                other.execute("BEGIN IMMEDIATE")
                raise AssertionError("another writer got in while the board was held")
            except sqlite3.OperationalError:
                pass
        finally:
            other.close()
    freed = sqlite3.connect(path, timeout=1, isolation_level=None)  # and the hold is released afterwards
    freed.execute("BEGIN IMMEDIATE")
    freed.execute("ROLLBACK")
    freed.close()

    # another worktree writes the first task into the empty shared board just before it would be set aside
    repo, (sibling,) = make_repo(base, "swap", ("sib",))
    make_v1_board(repo / ".blackboard" / "runtime" / "board.sqlite", None)
    expect(cli(sibling, "init").returncode == 0, "the sibling's init failed")
    shared = repo / ".git" / "blackboard"

    def other_worktree_writes() -> None:
        with using_board(rt, shared):
            rt.create(ns(id="first", question="q", specialty="s", scope="b", acceptance="a", dependencies="", reviewer="checker",
                         stop_condition="d", stale_after=60, actor="sib"))

    with patched(locate, "TOOL_ROOT", repo / ".blackboard"), patched(migrate, "HOOKS", {"before_swap": other_worktree_writes}):
        expect_error(lambda: migrate.migrate(ns(actor="t", abandon=False)), "another worktree wrote")
    with db(shared / "board.sqlite") as connection:
        expect(connection.execute("SELECT COUNT(*) FROM tasks").fetchone()[0] == 1, "the concurrent task was lost")
    expect(not list((repo / ".git").glob("blackboard.empty-*")), "a board that gained data was set aside")
    expect(not list((repo / ".git").glob("blackboard.migrating-*")), "a half-built stage was left behind")
    expect(not (repo / ".blackboard" / "runtime" / locate.MIGRATED_MARKER).exists(), "the private board was marked migrated anyway")
    with patched(locate, "TOOL_ROOT", repo / ".blackboard"):  # with the shared board now holding data, merging is refused
        expect_error(lambda: migrate.migrate(ns(actor="t", abandon=False)), "Boards are not merged")

    # ...or another worktree captures a snapshot, which adds a FILE to the shared folder but changes no row count
    other, (sibling2,) = make_repo(base, "swap2", ("sib",))
    make_v1_board(other / ".blackboard" / "runtime" / "board.sqlite", None)
    expect(cli(sibling2, "init").returncode == 0, "the second sibling's init failed")
    shared2 = other / ".git" / "blackboard"

    def other_worktree_snapshots() -> None:
        (shared2 / "snapshots").mkdir()
        (shared2 / "snapshots" / "cap.json").write_text("{}", encoding="utf-8")

    with patched(locate, "TOOL_ROOT", other / ".blackboard"), patched(migrate, "HOOKS", {"before_swap": other_worktree_snapshots}):
        expect_error(lambda: migrate.migrate(ns(actor="t", abandon=False)), "another worktree wrote")
    expect((shared2 / "snapshots" / "cap.json").is_file(), "a snapshot captured meanwhile was lost")
    expect(not list((other / ".git").glob("blackboard.empty-*")), "a board holding a snapshot was set aside")

    # ...or an older tool writes a snapshot into the PRIVATE folder after it was copied.  The write lock covers only the
    # database, so without a recheck that file would be left behind in a board nobody reads any more.
    late, _ = make_repo(base, "late")
    private_late = late / ".blackboard" / "runtime"
    make_v1_board(private_late / "board.sqlite", None)

    def older_tool_snapshots() -> None:
        (private_late / "snapshots").mkdir(exist_ok=True)
        (private_late / "snapshots" / "late.json").write_text("{}", encoding="utf-8")

    with patched(locate, "TOOL_ROOT", late / ".blackboard"), patched(migrate, "HOOKS", {"after_copy": older_tool_snapshots}):
        expect_error(lambda: migrate.migrate(ns(actor="t", abandon=False)), "changed while it was being copied")
    expect(not (late / ".git" / "blackboard").exists(), "a migration that noticed a late file still installed a board")
    expect(not (private_late / locate.MIGRATED_MARKER).exists(), "the private board was marked migrated over a late file")
    with patched(locate, "TOOL_ROOT", late / ".blackboard"), contextlib.redirect_stdout(io.StringIO()):
        migrate.migrate(ns(actor="t", abandon=False))  # once nothing is changing it goes through, late file included
    expect((late / ".git" / "blackboard" / "snapshots" / "late.json").is_file(), "the late file was not carried over on the second run")

    # ...or a racer recreates the shared folder in the instant it is free: the board file must be put back, not stranded
    race, (sibling3,) = make_repo(base, "swap3", ("sib",))
    make_v1_board(race / ".blackboard" / "runtime" / "board.sqlite", None)
    expect(cli(sibling3, "init").returncode == 0, "the third sibling's init failed")
    shared3 = race / ".git" / "blackboard"

    def racer_recreates_folder() -> None:
        (shared3 / "snapshots").mkdir(parents=True)
        (shared3 / "snapshots" / "x.json").write_text("{}", encoding="utf-8")

    with patched(locate, "TOOL_ROOT", race / ".blackboard"), patched(migrate, "HOOKS", {"after_aside": racer_recreates_folder}):
        try:
            migrate.migrate(ns(actor="t", abandon=False))
            raise AssertionError("migration succeeded although the folder was recreated under it")
        except OSError:
            pass
    expect((shared3 / "board.sqlite").is_file(), "the board file was left stranded outside the active folder")
    expect((shared3 / "snapshots" / "x.json").is_file(), "the racer's file was lost")

    # ...or another worktree runs `init` right then, creating a database under the same name.  Both databases are empty
    # by construction (the original was checked under its lock), so keeping the racer's loses nothing and the board works.
    init_race, (sibling4,) = make_repo(base, "swap4", ("sib",))
    make_v1_board(init_race / ".blackboard" / "runtime" / "board.sqlite", None)
    expect(cli(sibling4, "init").returncode == 0, "the fourth sibling's init failed")
    shared4 = init_race / ".git" / "blackboard"

    def racer_runs_init() -> None:
        with using_board(rt, shared4):
            rt.init(ns())

    with patched(locate, "TOOL_ROOT", init_race / ".blackboard"), patched(migrate, "HOOKS", {"after_aside": racer_runs_init}):
        try:
            migrate.migrate(ns(actor="t", abandon=False))
            raise AssertionError("migration succeeded although a database was created under it")
        except OSError:
            pass
    with db(shared4 / "board.sqlite") as connection:
        expect(connection.execute("SELECT COUNT(*) FROM tasks").fetchone()[0] == 0, "the active board is not usable")
    asides = list((init_race / ".git").glob("blackboard.empty-*"))
    expect(len(asides) == 1, f"expected the original empty board to be kept aside, found {asides}")
    with db(asides[0] / "board.sqlite") as connection:
        expect(connection.execute("SELECT COUNT(*) FROM tasks").fetchone()[0] == 0, "the board that was set aside held data")


def test_file_written_after_marker(base: Path) -> None:
    """An artifact or snapshot an older tool saves beside a settled private board changes no row."""
    repo, _ = make_repo(base, "afterfile")
    private = repo / ".blackboard" / "runtime"
    make_v1_board(private / "board.sqlite", None)
    expect(cli(repo, "migrate", "--actor", "t").returncode == 0, "migrate failed")
    expect("CHANGED after" not in cli(repo, "audit").stdout, "a freshly migrated board was reported as changed")
    (private / "snapshots").mkdir()
    (private / "snapshots" / "late.json").write_text("{}", encoding="utf-8")  # the database is not touched
    flagged = cli(repo, "audit")
    expect("CHANGED after it was set aside" in flagged.stdout, f"a file saved beside a settled board went unnoticed: {flagged.stdout}")

    # an older tool overwrites an artifact with different bytes of the same length and puts the old modification time back
    other, _ = make_repo(base, "overwrite")
    private2 = other / ".blackboard" / "runtime"
    make_v1_board(private2 / "board.sqlite", None)
    note = private2 / "note.md"
    note.write_text("OLD!", encoding="utf-8")
    expect(cli(other, "migrate", "--actor", "t").returncode == 0, "migrate failed")
    before = note.stat()
    note.write_text("NEW!", encoding="utf-8")
    os.utime(note, ns=(before.st_atime_ns, before.st_mtime_ns))
    expect(note.stat().st_size == before.st_size and note.stat().st_mtime_ns == before.st_mtime_ns, "the overwrite changed size or time")
    quiet = cli(other, "audit")
    expect("CHANGED after it was set aside" in quiet.stdout, f"a same-size overwrite that kept its mtime went unnoticed: {quiet.stdout}")


def test_wal_checkpoint_is_not_a_write(base: Path) -> None:
    """Closing a reader can checkpoint the log and change the database file's time although nothing was written; a
    fingerprint of the file would then report a change for ever.  A fingerprint of the contents does not."""
    repo, _ = make_repo(base, "walck")
    private = repo / ".blackboard" / "runtime"
    make_v1_board(private / "board.sqlite", None)
    with db(private / "board.sqlite") as connection:
        connection.execute("PRAGMA journal_mode=WAL")
    keep = sqlite3.connect(private / "board.sqlite")  # an older process that stays connected
    try:
        keep.execute("SELECT COUNT(*) FROM tasks").fetchall()
        writer = sqlite3.connect(private / "board.sqlite")
        writer.execute("INSERT INTO events(at, kind, task_id, actor, detail) VALUES "
                       "('2026-10-02T00:00:00+00:00', 'progress_reported', 'old-claimed', 'legacy-agent', 'committed, not yet checkpointed')")
        writer.commit()
        writer.close()  # the commit now lives in the log, because `keep` prevents a checkpoint
        done = cli(repo, "migrate", "--actor", "t")
        expect(done.returncode == 0, f"migrating with a live log failed: {done.stdout}{done.stderr}")
        expect("CHANGED after" not in cli(repo, "audit").stdout, "reported a change right after migrating")
    finally:
        keep.close()  # closing the last connection checkpoints the log and changes the file, though nothing was written
    expect("CHANGED after" not in cli(repo, "audit").stdout, "a checkpoint with no write was reported as a change")


def test_wal_commit_is_noticed(base: Path) -> None:
    """A commit that sits in the write-ahead log leaves the main database file untouched."""
    repo, _ = make_repo(base, "wal")
    private = repo / ".blackboard" / "runtime"
    make_v1_board(private / "board.sqlite", None)
    with db(private / "board.sqlite") as connection:
        connection.execute("PRAGMA journal_mode=WAL")
    done = cli(repo, "migrate", "--actor", "t")
    expect(done.returncode == 0, f"migrating a WAL-mode board failed: {done.stdout}{done.stderr}")
    expect("CHANGED after" not in cli(repo, "audit").stdout, "a migrated WAL board was reported as changed straight away")
    stay = sqlite3.connect(private / "board.sqlite")  # a long-lived older process keeps the log alive
    try:
        stay.execute("SELECT COUNT(*) FROM tasks").fetchall()
        with db(private / "board.sqlite") as writer:
            writer.execute("INSERT INTO events(at, kind, task_id, actor, detail) VALUES "
                           "('2026-10-02T00:00:00+00:00', 'progress_reported', 'old-claimed', 'legacy-agent', 'a commit in the log')")
        flagged = cli(repo, "audit")
        expect("CHANGED after it was set aside" in flagged.stdout, f"a commit sitting in the write-ahead log went unnoticed: {flagged.stdout}")
    finally:
        stay.close()


def test_lock_held_through_the_swap(base: Path) -> None:
    """Where a folder can be renamed under an open file (everywhere but Windows), the shared board's write lock must
    stay held until the replacement is installed, or a writer could begin a transaction in the gap and commit it into
    the board being set aside.  On Windows the open file itself blocks that rename, so there is nothing to check."""
    import migrate

    repo, (sibling,) = make_repo(base, "hold", ("sib",))
    make_v1_board(repo / ".blackboard" / "runtime" / "board.sqlite", None)
    expect(cli(sibling, "init").returncode == 0, "the sibling's init failed")
    outcome: list[bool] = []

    def competing_writer() -> None:  # runs right after the empty board was renamed aside, before the new one is in place
        if os.name == "nt":
            return
        aside = next((repo / ".git").glob("blackboard.empty-*"))
        other = sqlite3.connect(aside / "board.sqlite", timeout=0.2, isolation_level=None)
        try:
            try:
                other.execute("BEGIN IMMEDIATE")
                outcome.append(False)
            except sqlite3.OperationalError:
                outcome.append(True)
        finally:
            other.close()

    with patched(locate, "TOOL_ROOT", repo / ".blackboard"), patched(migrate, "HOOKS", {"after_aside": competing_writer}), \
            contextlib.redirect_stdout(io.StringIO()):
        migrate.migrate(ns(actor="t", abandon=False))
    expect(outcome in ([], [True]), "a writer got in while the board was being swapped")
    expect(os.name == "nt" or outcome == [True], "the swap hook never ran")


def test_odd_database_paths(base: Path) -> None:
    """Characters that mean something in a URI must not change which database is opened."""
    folder = base / "odd #1 %41 dir"
    folder.mkdir()
    path = folder / "board.sqlite"
    with db(path) as connection:
        connection.execute("CREATE TABLE tasks(id)")
        connection.execute("INSERT INTO tasks VALUES ('here')")
    with locate.readonly(path) as connection:
        found = [tuple(row) for row in connection.execute("SELECT id FROM tasks").fetchall()]  # Row objects never equal tuples
        expect(found == [("here",)], "opened the wrong database for a path with # and %")
    expect("%23" in locate.readonly_uri(path), "a # in the path was left raw in the URI")
    expect(locate.readonly_uri(Path("/tmp/a?b/board.sqlite")).count("?") == 1, "a ? in the path was left raw in the URI")


def test_git_unavailable(base: Path) -> None:
    """If git cannot be run inside a git checkout, refuse; falling back to a private board recreates the split."""
    repo, _ = make_repo(base, "nogit")
    nowhere = base / "empty-path"  # python is run by absolute path, so a PATH with nothing on it hides git everywhere
    nowhere.mkdir()
    bare_path = {**ENV, "PATH": str(nowhere)}
    init = cli(repo, "init", env=bare_path)
    expect(init.returncode == 1 and "git" in init.stderr, f"init proceeded without git: {init.stdout}{init.stderr}")
    expect(not (repo / ".blackboard" / "runtime" / "board.sqlite").exists(), "a private board was created inside a git checkout")
    expect(cli(repo, "query", "summary", env=bare_path).returncode == 2, "query proceeded without git")
    audited = cli(repo, "audit", env=bare_path)
    expect(audited.returncode == 1 and "nothing was audited" in audited.stdout, f"audit reported a clean bill without looking: {audited.stdout}")
    expect(cli(repo, "init").returncode == 0, "with git available init should work")


def test_old_worktree_boards_are_visible(base: Path) -> None:
    """A worktree on an older branch keeps a private board; nothing can stop it, but audit must show it."""
    repo, (old,) = make_repo(base, "oldbranch", ("old",))
    expect(cli(repo, "init").returncode == 0, "init failed")
    make_v1_board(old / ".blackboard" / "runtime" / "board.sqlite", None)
    found = cli(repo, "audit")
    expect(found.returncode == 1 and "has its own private board" in found.stdout and "old" in found.stdout, f"audit missed it: {found.stdout}")
    expect(cli(old, "migrate", "--actor", "t", "--abandon").returncode == 0, "abandon failed")
    expect(cli(repo, "audit").returncode == 0, "audit still reports a board that was set aside")


def run(rt) -> None:
    expect(shutil.which("git"), "the shared-board self-test needs git on PATH")
    base = Path(tempfile.mkdtemp(prefix="blackboard-selftest-"))
    try:
        for name, test in (
            ("two real worktrees share one board; claims, races and orphans", lambda: test_worktrees_share_one_board(base)),
            ("leases, takeover, stamps and reap (fake clock)", lambda: test_leases(rt, base)),
            ("schema upgrade is lossless and idempotent; a newer schema is refused", lambda: test_schema_upgrade_and_guard(rt, base)),
            ("migrate copies, rewrites artifact paths, and an unmigrated board is never ignored", lambda: test_migrate(base)),
            ("accented and spaced worktree paths are not mistaken for gone", lambda: test_awkward_paths(base)),
            ("a migration holds off writers and will not replace a board that gained data", lambda: test_migration_races(rt, base)),
            ("the shared board stays locked until the replacement is installed (non-Windows)", lambda: test_lock_held_through_the_swap(base)),
            ("a file saved beside a settled private board is noticed", lambda: test_file_written_after_marker(base)),
            ("a commit sitting in a write-ahead log is noticed after migration", lambda: test_wal_commit_is_noticed(base)),
            ("a checkpoint that wrote nothing is not reported as a change", lambda: test_wal_checkpoint_is_not_a_write(base)),
            ("a path with #, % or a space still opens the right database", lambda: test_odd_database_paths(base)),
            ("a git failure inside a checkout is refused, not worked around", lambda: test_git_unavailable(base)),
            ("a worktree's leftover private board shows up in audit", lambda: test_old_worktree_boards_are_visible(base)),
            ("web view reads v2 and refuses a newer schema", lambda: test_web_view(rt, base)),
        ):
            test()
            print(f"  ok: {name}")
    finally:
        remove_tree(base)
    print("self-test passed (shared board)")
