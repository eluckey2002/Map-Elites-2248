# RESULT-0081: preregistered journaled continuation of RESULT-0080

This registration is introduced and committed before the first recovery game.
It implements only the two owner-approved exceptions documented in
RECOVERY_APPROVAL.txt and RECOVERY_PROPOSAL.txt. The owner said "Ok, proceed"
in response to the explicit request for these exceptions. All bytes of this
registration and every frozen measurement source below are immutable after
the first recovery game. The original plan, raw data and failed closure stay
unchanged and retain their historical standing.

## Result identity collision rule

Before any recovery game, a freshly fetched remote-ref scan found RESULT-0080
occupied and the maximum used RESULT identity at 80. The original GOAL.txt
assignment explicitly directs using the next unused ID above all branches when
80 is occupied. recovery-result-id-check.json therefore assigns RESULT-0081
to this continuation and its one conditional confirmation, extending the
original parameterized result-path allowance to experiments/RESULT-0081/.
Preserve all historical RESULT-0080 paths and evidence unchanged. Never create
a new protocol in experiments/RESULT-0080/: its legacy failed closure is not a
modern confirmation contract. No second confirmation, budget reset, threshold
change, additional seed replacement or broader existing-test edit is allowed.

## Exact recovery boundary

Reuse the retained G reference, exact parity/inert checks, and complete C1/C2
panels. Exclude both old partial C3 panels from the aggregate but preserve their
raw evidence and all charges. C3 alone is replaced with 60,052,000–60,052,009;
C4–C12 keep their original reserved ranges. The replacement is declared in
SEEDS.md before use. Every measured control remains 58 levels x 10 seeds per
arm, with one shared champion reference per block and the same zero/mild/strong
policies. Do not replay an old dispatched job or restart either controller.

Carry forward controls=6380, proposals=580, replays=1380, all other spending=0:
8340 total charges and zero proposal rounds. The loss includes 580 dispatched
games with an unknown completion count. Controls remaining cost 23200 games,
projecting 29580/30000. Retained included control games at completion are 27840;
the extra 1740 charges are the old excluded champion/zero panels (1160) plus
lost dispatch (580). Never discount these or invent outcomes for them.

## Rules inherited without change

All original item 2/3 historical results and the GENERATION branch remain as
registered. All 12 complete control blocks must be retained before aggregate
verdict: zero accepts at most 1/12; the every-fifth-move handicap must be detected
with negative moves-saved CI in at least 10/12 blocks (80%). Both handicaps and
all zero-effect numbers print per block. Twelve blocks only catch false-accept
rates around 17% or more: a sanity check, not calibration. Report maximum
historical/zero-control detectable gain; adding seeds cannot shrink the level
axis error. A failing aggregate closes Path C and no idea is judged.

PROMISING: original decision.js and ruler/core.js unchanged, net wins >=0 and
mean moves saved >0. ACCEPTED: original fresh recheck rule, net wins >=0 and
lower 95% moves-saved endpoint >0. Use the unchanged ruler's statistics.
Only if controls pass, follow the original 15 generation proposals: occupancy
weights .001,1,8,128,1000000; widths 28,32,40,48,64; beams 10,12,16,20,24.
Every round reads at least three historical owner-faster boards in a separate
planning step and creates one candidate configuration as code and a hypothesis.
Do not read recordings in any measurement path. Per-round configuration files
may be produced as the original proposal log requires; measurement harness
and statistical code remain frozen. Additional phase orchestration may only
call these unchanged measurement paths, and its identity must be pinned in its
raw artifact. It cannot amend this registration or the original thresholds.
Keep at most 20 rounds, 11 one-use rechecks, conditional joint search, and at
most one candidate frozen and confirmed once. Before any confirmation game,
register the RESULT-0081 protocol with tools/new-experiment.js and its exact
candidate and runner hashes; the prior failed closure is preserved separately
from the confirmation artifact and is not retrospectively relabelled.

Keep all six original sub-budgets, total120000, protected confirmation reserve,
no subagents and max4workers. A budget unable to fund the next full registered
panel triggers Path D before dispatch; no partial panel is a passing panel.
A new execution loss/malformed result/changed frozen source is UNVERIFIED, stop
and report it; do not replace another block or repeat an in-flight game.
Path A/B/C/D definitions remain the original goal's. Exploration stays outside
experiments/, all headlines require independent arithmetic re-implementation,
and checked_by stays unset. No scientific acceptance, adoption, or merge.

## Persistence and authorized close-out change

The reviewed journal adapter exclusively records every dispatch and fsyncs and
atomically retains every completed level job before panel aggregation. The
controller atomically checkpoints counters and full panels, verifies registration
ancestry/source identities, rejects reused output directories and checks exact
coverage, duplicate/substituted cells and carried-forward charges before verdict.
The long-running controller is detached from the interactive execution session;
its logs, PID and journal remain local. Detachment is not a guarantee against
an environment loss; never infer completed games from charged games.

The only approved existing-test change adds RESULT-0080 to the failed-closure
inventory list; no assertion is skipped or removed. Preserve the old strict
close-out script and old refusal outputs. A recovery-specific close-out audit
must compare this exact one-line exception and all protected sources to the
original baseline, require the same three named failures and one skip in the
actual current full suite, and pass experiment/authorship/index/failed-run gates.
Finish with PR open, gate green, completed Codex review and every finding answered.

## Machine-readable frozen recovery settings

```json
{
  "result": "RESULT-0081",
  "actor": "codex-policy-terms-20261003",
  "task": "POLICY-TERMS-CONTINUE-20261003",
  "levels": [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    21,
    22,
    23,
    24,
    25,
    26,
    27,
    28,
    29,
    30,
    31,
    32,
    33,
    34,
    35,
    36,
    37,
    38,
    39,
    40,
    41,
    42,
    43,
    44,
    45,
    46,
    47,
    48,
    49,
    50,
    51,
    52,
    53,
    54,
    55,
    56,
    57,
    58
  ],
  "panelSeeds": 10,
  "workers": 4,
  "blocks": {
    "G": {
      "start": 60000000,
      "count": 10
    },
    "S": {
      "start": 60010000,
      "count": 10
    },
    "R1": {
      "start": 60020000,
      "count": 10
    },
    "R2": {
      "start": 60021000,
      "count": 10
    },
    "R3": {
      "start": 60022000,
      "count": 10
    },
    "R4": {
      "start": 60023000,
      "count": 10
    },
    "R5": {
      "start": 60024000,
      "count": 10
    },
    "R6": {
      "start": 60025000,
      "count": 10
    },
    "R7": {
      "start": 60026000,
      "count": 10
    },
    "R8": {
      "start": 60027000,
      "count": 10
    },
    "R9": {
      "start": 60028000,
      "count": 10
    },
    "R10": {
      "start": 60029000,
      "count": 10
    },
    "R11": {
      "start": 60030000,
      "count": 10
    },
    "C1": {
      "start": 60040000,
      "count": 10
    },
    "C2": {
      "start": 60041000,
      "count": 10
    },
    "C3": {
      "start": 60052000,
      "count": 10
    },
    "C4": {
      "start": 60043000,
      "count": 10
    },
    "C5": {
      "start": 60044000,
      "count": 10
    },
    "C6": {
      "start": 60045000,
      "count": 10
    },
    "C7": {
      "start": 60046000,
      "count": 10
    },
    "C8": {
      "start": 60047000,
      "count": 10
    },
    "C9": {
      "start": 60048000,
      "count": 10
    },
    "C10": {
      "start": 60049000,
      "count": 10
    },
    "C11": {
      "start": 60050000,
      "count": 10
    },
    "C12": {
      "start": 60051000,
      "count": 10
    },
    "F": {
      "start": 60100000,
      "count": 150
    }
  },
  "budgets": {
    "controls": 30000,
    "proposals": 25000,
    "jointSearch": 20000,
    "confirmation": 20000,
    "replays": 5000,
    "buffer": 20000
  },
  "maxGames": 120000,
  "maxProposalRounds": 20,
  "plannedProposalRounds": 15,
  "branch": "GENERATION",
  "N_MIN": 30,
  "historicalMde": 0.22953479009586256,
  "historicalReplayGames": 180,
  "zeroLookaheadBase": 997654321,
  "harnessFreeze": {
    "solver/policy-lab/play.js": "9ae72e532be4034a6849060e17fa0336ced60f8ba9c987f82dd9660ad8b55985",
    "solver/policy-lab/chooser.js": "3a043470c5eeeecc7c3d8e4390cfc8513596374f76e9052c4d3d97e59a92b895",
    "solver/policy-lab/pool.js": "48a2c4019407628c5b5090e60453c1923d7aa56ee04b7ef949a2d836d993a95f",
    "solver/policy-lab/worker.js": "681a40646a04950f2a9ce8893cfa1c74250b0780308047eefa12c294f3a00904",
    "solver/policy-lab/settings.js": "7678a525fc7a867ef764374cc1f038a0fb83523b1f155c074631968bf716c084",
    "solver/policy-lab/decision.js": "1db3eeee3d9752bf39ee601a1d4bb69f4d09798de203e596f6d14ec9e3107ab1",
    "solver/policy-lab/run-controls.js": "b37827fafd876e49440aef76213e0c7c2d808708afc466ebcddbdf7a7537305c",
    "solver/ruler/core.js": "fcf02b2a2cdded6b3d8cb7b2023685aadee6b313b409b8d0f26b554e348f3836",
    "solver/ruler/game.js": "c87b519c34d735d28a705f8d94a04ef7db16eb2b031bc43a4cb034e1332b7ed4",
    "solver/bot.js": "3efd50ce4b4cc8adda8874361fbc009d04716364d0f34c832515b80d6cbd2e65",
    "solver/engine.js": "0ed4b31004df13e3eae45b1cd0ad692f5956c636630b89e1f96f068e5a451873",
    "src/game.js": "3d405595707621ce28ab2ff4a8f509b8e3099462d42e8e0b304d3459907936c1",
    "solver/behavior-descriptors.js": "b87820b67b8ea004d3bb170edc59bb725deb2f5cfacafb2c2efc14023113df15",
    "docs/goals/policy-terms-loop/GOAL.txt": "eb1ab4968afdc6d782dc18ae5ba2f1479eecbc1d631e4159db773ece90145241",
    "solver/policy-lab/recovery-core.js": "5e91e10ac4563969301fc58c932d359d5512c80cb4eeedb246c250e35e693c4d",
    "solver/policy-lab/recovery-controls.js": "97c66e61a8f243cd06ce73de3b9e1d6c1db263818bc01052e6b64696de6a82b3",
    "solver/policy-lab/journaled-pool.js": "9deb9952e3fed0d41cf51dabf5ff4da6b0dc768c9c0683ad97b97c91f6c11ae3",
    "solver/policy-lab/registration.js": "9f3ec75e36484b94832382515d298240747e627c7ec05a8da61c4f68befbddbb",
    "solver/tests/failedRunLedger.test.js": "80afa8e3680554080c24630112db129a1a83f5f5a9a6903c9dd855804f66700e"
  },
  "runId": "RESULT-0081-journaled-recovery-60052000",
  "carryForward": {
    "counts": {
      "controls": 6380,
      "proposals": 580,
      "jointSearch": 0,
      "confirmation": 0,
      "replays": 1380,
      "buffer": 0
    },
    "proposalRounds": 0,
    "originalPlanCommit": "e76f3ec4af2496495697322851bafca0ab73b253",
    "sourceHashes": {
      "docs/goals/policy-terms-loop/EXPLORATION_PLAN.md": "2cca4f44105f3ae9b4e0b2199a33fb56b2c7d1876b10f1d363e8d5076bdb5ce7",
      "solver/policy-lab/runs/controls-raw.json": "deb60ca48b2bbb82bec829ecd0a6555681272006635af52f3ff56546a92ef974",
      "experiments/RESULT-0080/closure.json": "b65e04ac5db1c26fae9aefaccc3878a119a3c758dd7ceceaf32daba9d252796c",
      "docs/goals/policy-terms-loop/RECOVERY_APPROVAL.txt": "ce33804554c7c0bef4e919c4a759853526c44be875d650f78fd251c6f7bd4e3e",
      "docs/goals/policy-terms-loop/recovery-result-id-check.json": "81387dc2bea38be4e8433fcaf1532662d39ea5f802d24e6af4cb1327f6fbb071",
      "experiments/RESULT-0081/reservation.json": "47362b038f15d1ae30b6014d9453a454378eb469579ca432a86dbad1dc945e7d"
    }
  }
}
```
