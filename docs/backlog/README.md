# Backlog records

This directory stores durable project intent promoted from chat. It is navigation and planning, not evidence. Current proof standing belongs in the [evidence ledger](../../EVIDENCE_LEDGER.md); backlog records link to it rather than restating or strengthening its claims.

## Record unit and stable paths

One Markdown file is the default unit for one backlog record. Give each record a stable `BL-NNNN` ID and descriptive filename, then keep that path stable. Change `status` in metadata; do not move the file between status directories.

Use a directory only when one record owns an artifact bundle, such as several fixtures, images, or receipts that must travel together. Keep the record's Markdown file as the entry point to that bundle.

## Status vocabulary

Every record uses exactly one of these six statuses:

- `proposed` — captured for review but not yet accepted into the ready queue.
- `ready` — accepted intent with enough definition to begin.
- `active` — currently being worked.
- `blocked` — unable to proceed until its named dependency or decision clears.
- `done` — its acceptance criteria have been met and recorded.
- `dropped` — intentionally closed without completion; the reason remains in history.

A status describes planning state only. It never changes a claim's type, proof class, or standing in the evidence ledger.

## Minimal record schema

Each file contains:

```yaml
---
id: BL-NNNN
title: <short outcome-oriented title>
status: proposed | ready | active | blocked | done | dropped
milestone: <stable milestone name>
depends_on: []
updated: YYYY-MM-DD
---
```

After metadata, include these sections:

- `Authority` — state that the record is intent, not evidence, and link the ledger.
- `Desired outcome` — describe the observable change the record seeks.
- `Acceptance criteria` — list what must be demonstrated before `done`.
- `Current evidence` — link to relevant ledger records or primary repository evidence without upgrading their standing.
- `Next action` — name the smallest authorized step.
- `History` — append dated changes; never rewrite prior entries to hide a changed plan.

## From chat to a durable record

Chat is the management interface and may contain requests, options, or tentative recommendations. Promote work to a backlog file when the owner explicitly accepts it for durable tracking or asks to preserve it. Capture the accepted intent, links, dependencies, and date; do not treat conversational agreement as empirical evidence. Later chat updates the same stable record through metadata and append-only history.

Start with the [current-work page](../../CURRENT.md), which identifies the sole ready item and links the active milestone records.
