# Diagrams

Interactive HTML diagrams of this repo, generated with the
[archify](https://github.com/tt-a1i/archify) skill from the JSON specs beside
them. Open the `.html` files in a browser. Each one has light/dark themes,
pan/zoom, search, relationship tracing, three guided views, and PNG/SVG export.

| Diagram | Spec | What it shows |
|---|---|---|
| [subsystems.html](subsystems.html) | `subsystems.architecture.json` | The seven subsystems and how they connect. Source links are pinned to commit `4dd9321`. |
| [experiment-lifecycle.html](experiment-lifecycle.html) | `experiment-lifecycle.workflow.json` | How a generalizing claim gets from a written protocol into the evidence ledger, and where it is refused. |

The `.visual-check.json` files are the browser-evidence receipts: every page
was rendered at 1440x900, 1600x1000, 1920x1080 and 2048x1320 in light and dark
and confirmed not to overflow.

## Regenerate

The skill lives at `~/.claude/skills/archify`. From the repo root:

```bash
A=~/.claude/skills/archify/bin/archify.mjs
node $A deliver architecture docs/diagrams/subsystems.architecture.json docs/diagrams/subsystems.html --quality showcase --repo-root .
node $A deliver workflow docs/diagrams/experiment-lifecycle.workflow.json docs/diagrams/experiment-lifecycle.html --quality showcase
node $A visual-check docs/diagrams/subsystems.html --json
node $A visual-check docs/diagrams/experiment-lifecycle.html --json
```

`deliver` refuses to write if validation fails, so a non-zero exit means the
spec needs fixing, not that the page is stale. The screenshots `visual-check`
writes are not committed.

These are a reading aid, not evidence. The ledger and its cited artifacts
remain the only source of proof standing.
