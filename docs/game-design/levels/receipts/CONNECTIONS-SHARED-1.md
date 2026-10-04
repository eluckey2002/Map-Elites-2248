# CONNECTIONS-SHARED-1

Prepared 2026-10-01 by codex. Reviewer: owner. Local prototype, not acceptance.

Connections runs at http://127.0.0.1:8277. Three visible objectives share a
board: A and B follow marked tiles; C stays at cells. Any completion order,
persistent checkmarks, live sum, preview, undo, deterministic restart and
separate replay capture are implemented. Endpoint protection is an announced
prototype assumption. Opening and refill diversity were not broadened.

Code lives in `prototypes/connections/`; shared server gained optional app/style
asset inputs with unchanged defaults. No shipped game/solver rules edited.

Executed checks: three winning replays and browser/local/HTTP-capture parity;
two authored-origin routes; shared-resource consequence; moving-mark gravity;
fixed coordinates; protected endpoints; interior-only non-completion; undo;
terminal-state rejection; wrong/missing level and identity rejection; actual
HTML/app through the DOM stand-in for live sum, preview, goals, win, undo,
restart and invalid selections. Existing 19 prototype tests pass; syntax and
whitespace checks pass. QA captures are separate temporary agent-labeled files.

Browser rendering, console and native mouse/touch remain unverified. Isolated
Chrome sessions were unavailable; native Chrome inspection was blocked by risk
review and permission was requested. No workaround attempted. Owner tabs were
not inspected or changed. All older server identities remain unchanged.

README and PDL-012 retain owner feedback and narrow evidence standing. Await
owner play and judgment of whether the objectives interact meaningfully.
