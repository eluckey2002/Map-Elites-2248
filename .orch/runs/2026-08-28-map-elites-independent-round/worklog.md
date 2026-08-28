# Worklog: MAP-Elites shared-axis independent round

## Goal

**Objective:** A verifier-accepted MAP-Elites archive exists on the original archive's exact behavior coordinates and wholly new evaluation seed ranges, with an honest comparison of coverage, selection fitness, holdout generalization, and champion standing.

**Acceptance:** The seven criteria in `.orch/runs/2026-08-28-map-elites-independent-round/spec.md`, frozen verbatim at creation.

- **spec:** `.orch/runs/2026-08-28-map-elites-independent-round/spec.md`
- **tickets:** `.orch/tickets/2026-08-28-map-elites-independent-round/`

## Iterations

1. **open:** Successor spec drafted only after predecessor code result `8508c3b4aa2bac9eceaac0bcaf91e3838e303a53` passed. One evidence lane and one dependent synthesis item cut.
2. **experiment:** Frozen command completed once. Archive `ab8ed417a7cf2f1f8adf95268b2ca2c3a7c96ed699ef95d74eb13874ad65fc22`; map `a94fc61469d36ab672bcb4722f1b08d628f9bee7d0137dfe0f4afb3568d7a0fb`; verifier PASS; 23 occupied cells.
3. **verification:** Exact axes, seed disjointness, representative holdout recomputation, code revision, and protected code/source hashes PASS. Frozen expected prior transition map hash FAILS because the spec expanded a remembered prefix to the wrong full identity. Prior accepted ticket `T-001` confirms unchanged actual identity `d69c0dcf583ad41361a46609b49672f12f24be2d67515c29660a923b7f7a1201`.

## Blame classes

- **input/spec defect -> orch-spec:** incorrect frozen full SHA-256 for a prior artifact.

## Failed approaches

- Treating a remembered `d69c0dcf...` prefix as sufficient to mint the full prior map identity; rejected by live SHA-256 and the prior accepted ticket.

## Queued scope

[]

## Terminal

- **failed:** acceptance criterion 4 cannot pass against the defective frozen identity. Valid partial experiment artifacts are retained; a corrected no-rerun verification run consumes them by fixed SHA-256.
