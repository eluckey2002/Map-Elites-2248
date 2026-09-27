# Blackboard

This folder contains the project's independent task ledger and read-only status board.
Use `python .blackboard/board.py` from the project root for commands.

- Read `query summary` at the start of a coordinated session; `query tasks` lists IDs (add `--state claimed` to filter); use `query task ID` for details.
- Create bounded tasks with a named reviewer, acceptance criteria, and stop condition.
- Claim before working; record progress when something materially changes.
- Put the result in `.blackboard/runtime/ID.md` (or `.json` / `.txt`), then submit it.
- Only the predeclared reviewer can accept or request repair; the reviewer must differ from the producer and submitter.
- Task state records updates. It does not prove an agent is running or a result is correct.
- Do not edit the SQLite database directly. Use the writer commands.

The board does not launch agents, schedule tasks, enforce a swarm-wide concurrency limit, or collect updates automatically.
