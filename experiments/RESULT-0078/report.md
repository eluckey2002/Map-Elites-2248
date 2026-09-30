# RESULT-0078 — mergeable bomb-defusal challenger

## Status

**INVALID closeout.** The frozen closer encoded a failed primary hypothesis as
a failed closure claim, then incorrectly emitted `CLOSED`; the independent
verifier rejected it. The retained raw corpus and byte-identical primary
recomputation show a **raw FALSIFIED safety signal**, but this receipt makes no
valid domain conclusion and cannot support promotion. The champion is
unchanged.

## Retained raw recomputation

The complete fixed panel contains 1,160 paired cells (2,320 games). Its raw
recomputation found P1 FAIL: no champion-only wins, but 60 mutual wins where
the champion reaches the target sooner. It also found 109 faster challenger
cells, positive mean target-cost reduction of 0.14310344827586208 moves, and
runtime ratio 1.0190248080038975. Those diagnostics are retained below, not
promoted into an outcome because the closeout is invalid.

{
  "schemaVersion": 1,
  "result": "RESULT-0078",
  "qualification": false,
  "artifactIdentity": "c2ac058157619aff8ac66383a017a2e6905714dfc788828023e524257ad09cbc",
  "finalSubjectIdentity": "bcce8a0a83a163e7cd1839c2c38e6a527bace4fab71ff2c1b31639b120f0d50c",
  "primaryOutcome": "FALSIFIED",
  "counts": {
    "pairs": 1160,
    "championOnlyWin": 0,
    "challengerOnlyWin": 0,
    "championFaster": 60,
    "challengerFaster": 109,
    "sameSpeed": 991,
    "changedTrace": 206
  },
  "levelBreadth": {
    "beneficial": [
      40,
      41,
      42,
      43,
      44,
      45,
      47,
      49,
      50,
      55,
      58
    ],
    "regressing": [
      40,
      41,
      42,
      43,
      44,
      45,
      47,
      49,
      50,
      55,
      58
    ]
  },
  "moveEffect": {
    "estimand": "champion target cost minus challenger target cost",
    "estimate": 0.14310344827586208,
    "se": 0.052687143417166606,
    "confidence95": [
      0.03983664717821553,
      0.24637024937350863
    ]
  },
  "compute": {
    "championNs": 545060654009,
    "challengerNs": 555430328302,
    "ratio": 1.0190248080038975
  },
  "claims": {
    "P1": {
      "outcome": "FAIL"
    },
    "P2": {
      "outcome": "PASS"
    },
    "P3": {
      "outcome": "PASS"
    }
  }
}
