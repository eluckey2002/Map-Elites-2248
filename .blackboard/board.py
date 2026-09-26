"""Project-local entry point: serve, query, snapshot, or any writer command."""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent


def main() -> int:
    args = sys.argv[1:]
    if not args or args[0] in {"-h", "--help"}:
        print("Blackboard: serve [--port 8766] | query summary|tasks|task ID | snapshot capture NAME")
        print("Writer: init | create | claim | progress | submit | review | defect | dispose-defect | self-test")
        print("Add --help after any command for its options. Artifacts go in .blackboard/runtime/.")
        return 0
    scripts = {"serve": "server.py", "query": "query_liveboard.py", "snapshot": "snapshot_liveboard.py"}
    script = scripts.get(args[0], "runtime.py")
    forwarded = args[1:] if args[0] in scripts else args
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
