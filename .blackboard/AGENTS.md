# Blackboard

This folder contains the project's independent task ledger and read-only status board.
Use `python .blackboard/board.py` from the project root for commands.

- There is one board per repository, shared by every worktree. It lives in git's common directory, not in your checkout; `where` prints its folder and `audit` lists claims that have lapsed.
- Read `query summary` at the start of a coordinated session; `query tasks` lists IDs (add `--state claimed` to filter); use `query task ID` for details.
- Create bounded tasks with a named reviewer, acceptance criteria, and stop condition.
- Claim before working; record progress when something materially changes.
- A claim lapses when its worktree is removed, or when nothing is reported for the task's `--stale-after` seconds (default 3600). Another agent may then take it over with `claim --reason ...`, and `reap` returns lapsed claims to the queue; until one of them does, the holder can still report progress and so renew the claim. Only the current holder can report progress or submit. For long work, set a `--stale-after` longer than your longest quiet stretch, or report progress.
- After a branch is updated to this version, its `.blackboard` uses the shared board. A worktree still on an older branch keeps writing to its own private board; `audit` lists those. Merge this into long-lived branches before using the board from them.
- Put the result at `<id>.md` (or `.json` / `.txt`) in the folder `where` prints, then submit it.
- Only the predeclared reviewer can accept or request repair; the reviewer must differ from the producer and submitter.
- Task state records updates. It does not prove an agent is running or a result is correct.
- Do not edit the SQLite database directly. Use the writer commands.
- A checkout that still holds its own `.blackboard/runtime/board.sqlite` from before boards were shared refuses to run until you `migrate --actor <you>` it, or set it aside with `migrate --abandon`. Run `migrate` while no other agent is using the board: it holds off writers that use the board's own lock and refuses if files change underneath it, but it cannot stop a process that writes into the folder directly in the last instant.

The board does not launch agents, schedule tasks, enforce a swarm-wide concurrency limit, or collect updates automatically.
