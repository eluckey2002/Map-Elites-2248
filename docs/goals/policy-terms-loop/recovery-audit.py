"""Read-only recovery audit. Writes only its own diagnostic receipt; plays no games."""
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent


def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT, text=True)


def digest(file):
    return hashlib.sha256((ROOT / file).read_bytes()).hexdigest()


plan_path = "docs/goals/policy-terms-loop/EXPLORATION_PLAN.md"
plan_text = (ROOT / plan_path).read_text()
config = json.loads(re.search(r"```json\n([\s\S]*?)\n```", plan_text)[1])
raw = json.loads((ROOT / "solver/policy-lab/runs/controls-raw.json").read_text())
closure = json.loads((ROOT / "experiments/RESULT-0080/closure.json").read_text())
registration = raw["registration"]["explorationPlanCommit"]
assert git("show", f"{registration}:{plan_path}") == plan_text
assert raw["config"] == config
frozen = {file: digest(file) == expected for file, expected in config["harnessFreeze"].items()}
assert all(frozen.values()), "original frozen source drift"
assert raw["counts"] == closure["chargedAccounting"]

controls = {}
for panel in raw["panels"]:
    block = panel["block"]
    if not block.startswith("C"):
        continue
    start = config["blocks"][block]["start"]
    expected = {(level, seed) for level in config["levels"] for seed in range(start, start + 10)}
    addresses = [(game["level"], game["seed"]) for game in panel["games"]]
    assert len(addresses) == 580 and set(addresses) == expected
    controls.setdefault(block, []).append(panel["arm"])
required_arms = {"champion", "zero", "handicap10", "handicap5"}
complete = [block for block, arms in controls.items() if len(arms) == 4 and set(arms) == required_arms]
assert complete == ["C1", "C2"]
assert set(controls["C3"]) == {"champion", "zero"}

proposed_start, proposed_end = 60052000, 60052009
assert 60000000 <= proposed_start <= proposed_end <= 69999999
assert all(proposed_end < b["start"] or proposed_start >= b["start"] + b["count"]
           for b in config["blocks"].values())
refs = git("for-each-ref", "--format=%(refname)", "refs/remotes").splitlines()
seed_collisions, seed_refs = [], []
for ref in refs:
    result = subprocess.run(["git", "show", f"{ref}:experiments/SEEDS.md"], cwd=ROOT,
                            text=True, capture_output=True)
    if result.returncode:
        continue
    seed_refs.append(ref)
    for line in result.stdout.splitlines():
        if not line.startswith("|"):
            continue
        column = line.split("|")[1]
        intervals = [(int(a.replace(",", "")), int(b.replace(",", "")))
                     for a, b in re.findall(r"(\d[\d,]*)\s*[–-]\s*(\d[\d,]*)", column)]
        singles = [int(n.replace(",", "")) for n in re.findall(r"\d[\d,]*", column)]
        if any(a <= proposed_end and b >= proposed_start for a, b in intervals) or any(
                proposed_start <= n <= proposed_end for n in singles):
            seed_collisions.append({"ref": ref, "declaration": line})
assert not seed_collisions, "proposed replacement collides with a declared seed range"

charged = closure["chargedAccounting"]
remaining_controls = 10 * 580 * 4
projected_controls = charged["controls"] + remaining_controls
assert projected_controls == 29580 < config["budgets"]["controls"]
receipt = {
    "purpose": "recovery proposal audit, not a preregistration or scientific result",
    "head": git("rev-parse", "HEAD").strip(),
    "originMain": git("rev-parse", "origin/main").strip(),
    "oldRegistration": registration,
    "originalPlanUnchanged": True,
    "frozenSourceMatches": frozen,
    "originalRawSha256": digest("solver/policy-lab/runs/controls-raw.json"),
    "originalClosureSha256": digest("experiments/RESULT-0080/closure.json"),
    "retainedControlArms": controls,
    "completeControlBlocks": complete,
    "chargedAccountingCarriedForward": charged,
    "totalAlreadyCharged": sum(charged.values()),
    "proposalRoundsAlreadyCharged": closure["proposalRounds"],
    "proposedReplacementC3": {"start": proposed_start, "end": proposed_end, "reserved": False},
    "fetchedRemoteRefsWithSeedDeclarations": seed_refs,
    "declaredSeedCollisions": seed_collisions,
    "freshnessLimit": "Declared ranges only; check again immediately before reservation. No seeds reserved by this audit.",
    "additionalControlGames": remaining_controls,
    "projectedTotalControlGames": projected_controls,
    "remainingControlAllowanceAfterCompletion": config["budgets"]["controls"] - projected_controls,
    "remainingTotalAllowanceNow": config["maxGames"] - sum(charged.values()),
    "newScientificGamesPlayed": 0,
    "status": "DRAFT_REQUIRES_OWNER_EXCEPTION_FOR_RECOVERY_REGISTRATION_AND_EXISTING_TEST_INVENTORY",
}
text = json.dumps(receipt, indent=2) + "\n"
(HERE / "recovery-audit.json").write_text(text)
print(text, end="")
