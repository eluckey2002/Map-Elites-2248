"""Project-local entry point: serve, query, snapshot, or any writer command."""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent


def main() -> int:
    args = sys.argv[1:]
    if not args or args[0] in {"-h", "--help"}:
        print("Blackboard: serve [--port 8766] | query summary|tasks|task ID | snapshot capture NAME")
        print("Checks: where | audit      Writer: init | create | claim | progress | submit | review | defect | dispose-defect | reap | migrate | self-test")
        print("Add --help after any command for its options. The board is shared by every worktree of the repository;")
        print("`where` prints its folder, which is where artifacts go.")
        return 0
    scripts = {"serve": "server.py", "query": "query_liveboard.py", "snapshot": "snapshot_liveboard.py",
               "where": "audit.py", "audit": "audit.py", "migrate": "migrate.py"}
    script = scripts.get(args[0], "runtime.py")
    # where/audit are subcommands of audit.py itself, so they keep their name; the others hand over only their options.
    forwarded = args[1:] if args[0] in scripts and args[0] not in {"where", "audit"} else args
    if args[0] == "serve":
        try:
            import flask  # noqa: F401
        except ImportError:
            print(f'Install the web dependency once: "{sys.executable}" -m pip install -r "{ROOT / "requirements.txt"}"', file=sys.stderr)
            return 1
    # Preserve the caller's working directory, including relative artifact paths.
    return subprocess.call([sys.executable, str(ROOT / script), *forwarded])


if __name__ == "__main__":
    raise SystemExit(main())
