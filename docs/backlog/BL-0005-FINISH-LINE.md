---
id: BL-0005-FINISH-LINE
title: Finish line for BL-0005 — what done means, and the five things BL-0005 does not know
status: done
milestone: experiment-discipline
depends_on: [BL-0005]
updated: 2026-09-01
---

# Finish line — BL-0005

> **Reached 2026-09-01 as `RESULT-0020`**, with three deviations recorded
> rather than smoothed over. P3, a declared compute check, breached and is
> reported as a breach. Rows 4 and 5 below were written with wrong numbers —
> corrected in place on 2026-09-01 after an adversarial review recomputed
> them; the substance they demanded was met at the corrected denominator, but
> the figures as first written were not achievable. Row 4 also asked for C2 to
> be recorded before the holdout, and it was not: C2 has no artifact and
> survives only in `report.md`, committed afterward.

## Authority

This record is an acceptance test, not evidence. Proof standing lives in the
[evidence ledger](../../EVIDENCE_LEDGER.md); nothing here upgrades a claim.

It **amends two steps** of [BL-0005](BL-0005-retrofit-result-0018-protocol.md)
and adds five facts verified against `main` at commit `849dcb7` on 2026-08-31.
Everything BL-0005 says that is not amended below still stands, including its
`READ THIS FIRST` section and its `Not to be done instead` list.

---

## Read this before running anything

BL-0005 warns about one trap: both arms are now the same policy, so a naive
re-run produces a null result after ~30 minutes of compute. That warning is
correct and it is now **measured, not predicted** — see fact 2.

There are four more traps it does not know about. Two of them stop the run
before it starts, one of them fails a gate after the run, and one of them makes
`tools/new-experiment.js` refuse the id.

---

## Fact 1 — the run command in BL-0005 step 5 does not parse

`solver/target-aware-evaluation.js` runs its registration guard against raw
`process.argv`, but `parseArgs` throws on any flag it does not recognise, and
it does not recognise `--protocol` or `--exploratory`:

```bash
node -e "require('./solver/target-aware-evaluation.js').parseArgs(['--holdout','--out','x.json','--protocol','RESULT-0020'])"
# Error: unknown argument --protocol
```

So the guard passes and then the script dies on its own flag. The documented
command cannot run as written.

**Fixing this is part of the work.** `parseArgs` must accept and ignore
`--protocol <id>` and `--exploratory` — the guard has already consumed them.
Do this in the same commit as the champion-arm change, and declare both in the
protocol's *change under test* section. It is measurement plumbing, not a
silent edit.

`solver/tests/targetAwareEvaluation.test.js:20` asserts that an unknown
argument throws, using `--seeds`. That assertion stays true; add cases proving
`--protocol RESULT-0020` and `--exploratory` now parse.

**The defect is local to this script — already checked, do not re-check.**
`map-elites`, `policy-ablation`, `routing-ablation`, and `policy-search` were
wired to the same guard in the same session, but all four read flags by lookup
and ignore unrecognised ones, so `--protocol` passes through them harmlessly.
`target-aware-evaluation.js` is the only one with a strict parser, which is why
it is the only one that breaks.

## Fact 2 — the null result is measured, not predicted

Using the evaluator's own `playToTerminal`, across all 52 holdout levels at
holdout seeds 13,000,000–13,000,002 (156 paired plays):

| Control | Result |
| --- | --- |
| today's `chooseMove` vs `chooseTargetAwareMove` — the two arms as shipped | **156 identical move sequences, 0 differing** |

Both arms are the same policy on every board tested. This is the protocol's
C2 positive control failing in advance, and it is why the run must not start
until the champion arm is moved.

## Fact 3 — `chooseBaseMove` is faithful to the original champion

The pre-promotion champion is recoverable. `solver/bot.js` at commit
`52f500c` has sha256 `9abe8ca8…`, which is exactly the champion hash recorded
in RESULT-0018's holdout artifact. Compared against today's `chooseBaseMove`
through the same `playToTerminal`, same 52 levels x 3 holdout seeds:

| Control | Result |
| --- | --- |
| `bot.js@52f500c` `chooseMove` vs today's `chooseBaseMove` | **156 identical move sequences, 0 differing** |

This is what makes the re-run a replication rather than a new experiment:
pointing the champion arm at `chooseBaseMove` restores the comparison
RESULT-0018 actually measured. **Declare this as C1 and widen it** — 52 levels
x 10 seeds costs seconds and is the single cheapest thing that proves the
instrument is reading the right two policies.

Reproduce both controls:

```bash
git show 52f500c:solver/bot.js | sed "s#require('./engine')#require('$PWD/solver/engine')#" > /tmp/oldbot.js
node -e "
const oldBot=require('/tmp/oldbot.js');
const { chooseBaseMove, chooseMove }=require('./solver/bot.js');
const { chooseTargetAwareMove }=require('./solver/target-aware-challenger.js');
const { playToTerminal }=require('./solver/target-aware-evaluation.js');
const { LEVELS }=require('./src/game');
let a=0,b=0;
for(const lv of LEVELS.filter(l=>l.level<=52)) for(let s=13000000;s<13000003;s++){
  if(JSON.stringify(playToTerminal(lv,s,oldBot.chooseMove))===JSON.stringify(playToTerminal(lv,s,chooseBaseMove))) a++;
  if(JSON.stringify(playToTerminal(lv,s,chooseMove).sequence)===JSON.stringify(playToTerminal(lv,s,chooseTargetAwareMove).sequence)) b++;
}
console.log('C1 champion fidelity identical:',a,'/156');
console.log('C2 arms currently identical:',b,'/156  (must become 0 after the champion-arm change)');
"
```

## Fact 4 — de-grandfathering RESULT-0018 fails the experiment gate

BL-0005 step 7 says to remove RESULT-0018 from
[GRANDFATHERED.md](../../experiments/GRANDFATHERED.md). Doing that fails
`tools/verify-experiments.js`. The record still cites its two original
2026-08-30 artifacts, both of which predate registration stamps, and the
grandfather entry is the only thing suppressing the artifact-stamp check:

```bash
node -e "
const fs=require('fs');
const { readLedgerResults, assessArtifactStamps }=require('./tools/verify-experiments.js');
const r=readLedgerResults(fs.readFileSync('EVIDENCE_LEDGER.md','utf8')).find(x=>x.id==='RESULT-0018');
console.log(assessArtifactStamps(r,new Set()).join('\n'));
"
# RESULT-0018: …/holdout.json carries no registration stamp; it cannot back a heuristic_observation claim
# RESULT-0018: …/verification.json carries no registration stamp; it cannot back a heuristic_observation claim
```

Deleting those citations to clear the gate would break the append-only rule in
`AGENTS.md`. Rewording them so the gate's regex stops reading them would pass
the gate on punctuation. Widening the gate to accept a "historical" marker
would reopen `experiments/README.md`'s **Settled: there is no escape hatch**,
decided the same day.

**Amendment — the re-run lands as a new ledger record, and RESULT-0018 is not
touched at all.** See *Amendments* below.

## Fact 5 — `RESULT-0019` is burned; the next free id is `RESULT-0020`

`RESULT-0019` was registered at commit `fd96ec7` while `new-experiment.js` was
being built, and deleted again at `da774aa`. The tool takes the *oldest* add,
so it refuses the id forever:

```bash
node -e "const{addedIn}=require('./tools/verify-experiments.js');console.log(addedIn('experiments/RESULT-0019/protocol.md'));"
# fd96ec7b5d7c97785ff76a078878646e8373b4ef
```

`RESULT-0020` has never been registered.

---

## Amendments to BL-0005

**Step 2 becomes:** `node tools/new-experiment.js RESULT-0020`.

**Step 7 becomes:** RESULT-0018 is not edited and not removed from the
grandfather list. Instead:

1. Add `RESULT-0020` to the ledger as a **registered replication** of
   RESULT-0018's holdout, at its own honest `proof_class`, citing only its own
   new artifacts. Its `supersedes` stays `[]` — a replication that agrees is a
   confirmation, not a supersession.
2. Add one line to RESULT-0018's `notes:` pointing forward to RESULT-0020.
   Do not touch its `statement`, `evidence`, `proof_class`, or `status`.
3. Rewrite the **RESULT-0018 is the load-bearing exemption** section of
   `GRANDFATHERED.md` to say it is no longer load-bearing, and why. The list
   entry itself stays — that file's own text says the list is the record that
   the exception existed.
4. Note on `DECISION-0004` that the evidence under it now has a registered,
   reproducible replication.
5. Regenerate the Universe Map (`node tools/build-universe-map.js`) because
   the ledger hash moves.

Everything else in BL-0005 stands unchanged, including the whole
*If the re-run disagrees with the original* section — with the one
substitution that the correction attaches to `RESULT-0020`'s finding and
RESULT-0018 gets its `status` and `superseded_by` updated only in that case.

---

## Hashes the protocol must disclose, and what each one means

RESULT-0018's artifact recorded five source hashes. Four have moved. The
protocol says so plainly rather than hiding it:

| Source | At the original run | Today | What moved |
| --- | --- | --- | --- |
| champion `solver/bot.js` | `9abe8ca8…` | `8d0dec5f…` | `DECISION-0004` promoted the challenger into the bot. The original champion is recoverable at `52f500c` and is behaviourally identical to today's `chooseBaseMove` (fact 3). |
| challenger `solver/target-aware-challenger.js` | `ba75b5a6…` | `6b375b15…` | **`ba75b5a6…` has never existed at that path.** `git rev-list --objects --all` finds exactly one blob ever associated with `solver/target-aware-challenger.js` across every ref, and it hashes to `6b375b15…`. `git log --all --full-history` finds the same two commits, one of them RESULT-0018's own evidence commit `6a07294`. The challenger could have lived under another name at run time; what is certain is that this path never held that content. The original run was made from an uncommitted working tree. Disclose this; it is the sharpest existing argument for why the replication is worth running. |
| engine `solver/engine.js` | `4e2323b9…` | `4e2323b9…` | Unchanged. |
| levels `src/game.js` | `9493407c…` | `541baa1c…` | Level 53 was added. Levels 1–52 are unchanged — verified by comparing the parsed `LEVELS` arrays from `6a07294` and `HEAD` for structural equality, not by hashing the file. The holdout only runs levels 1–52. |
| evaluator `solver/target-aware-evaluation.js` | `53aa4b2e…` | `1ed88514…` | Will move again once the champion-arm and `--protocol` parsing changes land. Both are declared in *change under test*. |

---

## The finish line

Done means every line below is true, each proved by the command beside it.
Nothing here is satisfied by inspection or by asserting it in a record.

| # | Done means | Proof |
| --- | --- | --- |
| 1 | Started from a clean `main` with the baseline gate green | `node tools/verify-repo-baseline.js` exits 0 before anything else |
| 2 | `RESULT-0020` registered, committed, and its commit predates every artifact | `node tools/new-experiment.js RESULT-0020`; the artifact's `registration.protocolCommit` names it |
| 3 | The protocol declares the champion-arm change, the `--protocol` parsing fix, and all five hash movements | read `experiments/RESULT-0020/protocol.md` |
| 4 | The two arms genuinely differ before the holdout runs | C2 returns **40 identical of 520** (52 levels x 10 screen seeds), every level showing a differing cell. *Originally written as "0 identical of 156" — false at any denominator: at 52 levels x 3 holdout seeds it is 5 of 156, not 0.* Record it in its own artifact, not only in the report |
| 5 | The champion arm reproduces the pre-promotion bot | C1 returns **520 identical of 520**, at 52 levels x 10 screen seeds. *Originally written as "156 identical of 156, at 52 levels x 10 seeds" — 52 x 10 is 520, so the stated count could not arise from the stated denominator* |
| 6 | Screen ran first, holdout ran exactly once, both stamped | two artifacts, each with `registration.exploratory === false` and `registration.protocol === "RESULT-0020"` |
| 7 | The holdout is complete and its identity verifies | `validateArtifact` returns 15,600 cells; seeds 13,000,000–13,000,299 x 52 levels |
| 8 | Every declared check is resolved by name, including any that came out badly | `node tools/verify-experiments.js` exits 0 with `report.md` present |
| 9 | The protocol commit is a strict ancestor of the report commit | the gate's ordering check; commit them separately |
| 10 | RESULT-0018 is unedited and still grandfathered | `git diff` shows no change to its `statement`, `evidence`, `proof_class`, or `status` |
| 11 | Universe Map regenerated after the ledger moved | `node tools/build-universe-map.js` then `node tools/verify-universe-map.js` exits 0 |
| 12 | All four gates green | `verify-loop`, `verify-universe-map`, `verify-repo-baseline`, `verify-experiments` all exit 0 |
| 13 | The same three receipt failures and **no others**. The total moves above 268 once the `--protocol` parse tests land, which is correct — count failures by name, not the pass ratio | `node --test solver/tests/*.test.js` |
| 14 | Working tree clean and **pushed** | the baseline gate fails unless `origin/main` equals local `HEAD` — commit and push, do not leave it local |

The three permitted failures at line 13, by name:

- `candidate-levels-52.json has a receipt that verifies against the current bot`
- `candidate-levels-54.json has a receipt that verifies against the current bot`
- `candidate-levels.json has a receipt that verifies against the current bot`

They are known, decided, and must not be "fixed".

---

## Sequencing that the gates force

The order is not a preference; three tools constrain it.

1. `new-experiment.js` **refuses a dirty tree**, so the champion-arm and
   `--protocol` fixes must be committed *before* registration.
2. Registration freezes `solver/bot.js`, `solver/engine.js`,
   `solver/policy-eval.js`, and `src/game.js`. The guard re-checks those
   hashes at run time and refuses if any moved. **Do not touch those four
   files between registering and running.** `target-aware-evaluation.js` and
   `target-aware-worker.js` are *not* frozen — which is exactly why the
   champion-arm error would go undetected, and why C2 is load-bearing.
3. `writeArtifact` **refuses to overwrite**. Pick the output paths once.
4. `verify-repo-baseline` fails on a dirty tree *and* on `origin/main`
   trailing local `HEAD`. Commit and push after each step, not at the end.
5. The Universe Map hashes **`CURRENT.md` as well as the ledger**
   (`currentNavigationSha256`). Any edit to either needs
   `node tools/build-universe-map.js` or `verify-universe-map` reports
   `generated output drift: universe/resolved.json`. BL-0005 step 7 only
   mentions the ledger.

Suggested artifact paths, following the existing convention (the original
run's artifacts are tracked in git, so these get committed too — the holdout
is ~6.5 MB):

```
.orch/runs/result-0020-target-aware-replication-<YYYY-MM-DD>/evidence/screen.json
.orch/runs/result-0020-target-aware-replication-<YYYY-MM-DD>/evidence/holdout.json
```

---

## Predeclare against these

BL-0005 lists the original findings. State each as a P-check with explicit
`SUPPORTED` / `FALSIFIED` / `INCONCLUSIVE` thresholds **before** running, and
decide now what counts as reproduction — the numbers below are exact counts,
and demanding exact equality on all of them is a defensible bar given that
engine and levels 1–52 are unchanged:

- 9,354 existing wins made faster
- 6,186 tied
- 0 made slower
- 0 champion-win regressions
- 9 champion losses converted to wins
- mean saving 1.271 moves
- challenger compute 1.45x

All eight recompute exactly from the original artifact — BL-0005 transcribed
them correctly, so they can be predeclared as written:

```bash
node -e "
const a=require('./.orch/runs/level51-target-aware-evaluation-v2-2026-08-30/evidence/holdout.json');
let f=0,t=0,s=0,r=0,w=0,save=0;const lv=new Set();
for(const c of a.cells){const cw=c.champion.win,lw=c.challenger.win;
  if(cw&&lw){const d=c.champion.movesToTarget-c.challenger.movesToTarget;
    if(d>0){f++;lv.add(c.level)}else if(d===0)t++;else s++}
  else if(cw&&!lw)r++; else if(!cw&&lw)w++;
  save+=c.champion.moves-c.challenger.moves;}
console.log({cells:a.cells.length,faster:f,tied:t,slower:s,regressions:r,converted:w,
  levels:lv.size,meanSaving:+(save/a.cells.length).toFixed(4),
  compute:+(a.timings.challengerMs/a.timings.championMs).toFixed(3)});
"
# { cells: 15600, faster: 9354, tied: 6186, slower: 0, regressions: 0,
#   converted: 9, levels: 52, meanSaving: 1.271, compute: 1.453 }
```

Two gate behaviours were smoke-tested by injecting a throwaway `RESULT-0020`
record into the ledger and reverting it: the experiment gate correctly refuses
a new `heuristic_observation` record with no protocol, and the Universe Map
regenerates and verifies cleanly with an extra record present.

---

## Not the agent's call, and not to be done

- **`solver/bot.js` does not change.** `DECISION-0004` is an `owner_decision`;
  a measurement does not overturn one. If the replication disagrees, record
  the correction, leave the code alone, and re-put the question to the owner.
- The three receipt failures are not fixed.
- RESULT-0018 is not edited, not removed from the grandfather list, and not
  reconciled.
- No re-run on fresh seeds to get a cleaner number, and no widened threshold.
- `tools/verify-experiments.js` is not loosened to make step 7 work. That was
  considered and rejected here — see fact 4.

---

## The one way this still ends in a null result

Changing `const { chooseMove } = require('./bot')` at
`solver/target-aware-evaluation.js:14` is the whole measurement fix, and
nothing in the freeze, the guard, or the gate will catch it if it is skipped —
`target-aware-evaluation.js` is not a frozen file. The C2 control is the only
thing standing between that omission and 30 minutes of compute producing
15,600 cells of zero.

Run C2 first. Record its number in the protocol. Then run the holdout.
