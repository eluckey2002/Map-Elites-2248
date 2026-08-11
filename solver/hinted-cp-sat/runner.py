#!/usr/bin/env python3
"""Hinted CP-SAT threshold escalation for frozen Level 26 seed 0.

This wrapper leaves ``alternative-certifier.py`` read-only. It imports that
exact transition model, adds a complete replay-derived solution hint, and
independently replays the starting witness and every emitted SAT witness
through the JavaScript headless engine before reporting them.
"""

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys

from ortools.sat.python import cp_model


ROOT = Path(__file__).resolve().parents[2]
CERTIFIER_PATH = ROOT / "solver" / "alternative-certifier.py"
BASE_WITNESS_PATH = ROOT / "solver" / "target-witness-search" / "frozen-run.json"
REPLAYER_PATH = Path(__file__).with_name("replay-witness.js")
EXPECTED_INPUT_SHA256 = "edc6889cbd4b20f62a2ca11b72246cc520ee45073f91ee037c17b9d05c8fb880"
DEFAULT_SCHEDULE = [12336, 12400, 12600, 12800, 13000]


def _load_certifier():
    spec = importlib.util.spec_from_file_location("alternative_certifier", CERTIFIER_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load {CERTIFIER_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


CERTIFIER = _load_certifier()


def load_base_artifact():
    artifact = json.loads(BASE_WITNESS_PATH.read_text())
    required = {"level": 26, "seed": 0, "target": 13000, "inputIdentity": EXPECTED_INPUT_SHA256}
    for key, expected in required.items():
        if artifact.get(key) != expected:
            raise AssertionError(f"base artifact {key} mismatch: {artifact.get(key)!r}")
    if not isinstance(artifact.get("witness"), list):
        raise AssertionError("base artifact has no machine-readable witness")
    return artifact


def coordinate_paths_to_cells(witness, width, height):
    paths = []
    for turn, coordinates in enumerate(witness, start=1):
        path = []
        for coordinate in coordinates:
            if not isinstance(coordinate, list) or len(coordinate) != 2:
                raise AssertionError(f"turn {turn}: malformed coordinate")
            x, y = coordinate
            if not (0 <= x < width and 0 <= y < height):
                raise AssertionError(f"turn {turn}: off-board coordinate")
            path.append(y * width + x)
        paths.append(path)
    return paths


def cell_paths_to_coordinates(paths, width):
    return [[[cell % width, cell // width] for cell in path] for path in paths]


def frozen_values():
    level = CERTIFIER.LEVEL
    cells = level["width"] * level["height"]
    initial, spawns = CERTIFIER.seeded_level_values(0, cells, level["moves"] * (cells - 1))
    identity = hashlib.sha256(bytes(initial + spawns)).hexdigest()
    if identity != EXPECTED_INPUT_SHA256:
        raise AssertionError(f"Python frozen input identity changed: {identity}")
    return initial, spawns


def independent_replay(coordinate_witness, threshold, claimed_score=None):
    request = {
        "level": 26,
        "seed": 0,
        "threshold": threshold,
        "inputIdentity": EXPECTED_INPUT_SHA256,
        "claimedScore": claimed_score,
        "witness": coordinate_witness,
    }
    completed = subprocess.run(
        ["node", str(REPLAYER_PATH)],
        cwd=ROOT,
        input=json.dumps(request),
        text=True,
        capture_output=True,
        check=False,
    )
    if completed.returncode != 0:
        raise AssertionError(f"independent replay failed: {completed.stderr.strip()}")
    return json.loads(completed.stdout)


def build_hint_trace(width, height, min_chain, initial, spawns, hint_paths):
    full = CERTIFIER.replay(width, height, min_chain, initial, spawns, hint_paths, 10**18)
    scores = [0]
    cursors = [0]
    for end in range(1, len(hint_paths) + 1):
        prefix = CERTIFIER.replay(width, height, min_chain, initial, spawns, hint_paths[:end], 10**18)
        scores.append(prefix["score"])
        cursors.append(prefix["cursor"])
    return {
        "boards": [list(initial), *full["boards"]],
        "scores": scores,
        "cursors": cursors,
        "score": full["score"],
        "cursor": full["cursor"],
    }


def add_solution_hint(model, variables, hint_paths, trace, width, height, moves):
    boards, paths, lengths, scores, cursors = variables
    cells = width * height
    if len(hint_paths) != moves:
        raise AssertionError(f"hint has {len(hint_paths)} turns, expected {moves}")
    for turn in range(moves + 1):
        for cell in range(cells):
            model.add_hint(boards[turn][cell], trace["boards"][turn][cell])
        model.add_hint(scores[turn], trace["scores"][turn])
        model.add_hint(cursors[turn], trace["cursors"][turn])
    for turn, path in enumerate(hint_paths):
        model.add_hint(lengths[turn], len(path))
        for step in range(cells):
            model.add_hint(paths[turn][step], path[step] if step < len(path) else cells)


def solve_hinted(width, height, moves, min_chain, initial, spawns, threshold,
                 timeout_seconds, hint_paths, fixed_paths=None):
    model, boards, paths, lengths, scores, cursors = CERTIFIER.build_model(
        width, height, moves, min_chain, initial, spawns, threshold, fixed_paths=fixed_paths)
    trace = build_hint_trace(width, height, min_chain, initial, spawns, hint_paths)
    add_solution_hint(
        model,
        (boards, paths, lengths, scores, cursors),
        hint_paths,
        trace,
        width,
        height,
        moves,
    )

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = timeout_seconds
    solver.parameters.num_search_workers = 8
    solver.parameters.random_seed = 0
    status = solver.solve(model)
    common = {
        "threshold": threshold,
        "hintScore": trace["score"],
        "hintCursor": trace["cursor"],
        "wallTimeSeconds": solver.wall_time,
    }
    if status == cp_model.INFEASIBLE:
        return {"verdict": "UNSAT", **common}
    if status not in (cp_model.FEASIBLE, cp_model.OPTIMAL):
        return {"verdict": "UNKNOWN", "reason": solver.status_name(status), **common}

    witness = []
    for turn in range(moves):
        length = solver.value(lengths[turn])
        if length == 0:
            break
        witness.append([solver.value(paths[turn][step]) for step in range(length)])
    checked = CERTIFIER.replay(width, height, min_chain, initial, spawns, witness, threshold)
    symbolic_score = solver.value(scores[-1])
    symbolic_cursor = solver.value(cursors[-1])
    symbolic_boards = [
        [solver.value(value) for value in boards[turn + 1]]
        for turn in range(len(witness))
    ]
    if (checked["score"] != symbolic_score or checked["cursor"] != symbolic_cursor
            or checked["boards"] != symbolic_boards or checked["score"] < threshold):
        raise AssertionError("symbolic result disagrees with concrete Python replay")
    return {
        "verdict": "SAT",
        "score": symbolic_score,
        "cursor": symbolic_cursor,
        "moves": len(witness),
        "cellWitness": witness,
        **common,
    }


def base_replay():
    artifact = load_base_artifact()
    replay = independent_replay(artifact["witness"], 12336, artifact["scoreClaim"])
    if replay["score"] != 12336 or replay["moves"] != 32 or replay["cursor"] != 520:
        raise AssertionError(f"base replay mismatch: {replay}")
    return replay


def base_model_acceptance(timeout_seconds):
    artifact = load_base_artifact()
    level = CERTIFIER.LEVEL
    initial, spawns = frozen_values()
    paths = coordinate_paths_to_cells(artifact["witness"], level["width"], level["height"])
    result = solve_hinted(
        level["width"], level["height"], level["moves"], level["min_chain"],
        initial, spawns, 12336, timeout_seconds, paths, fixed_paths=paths)
    if result["verdict"] != "SAT" or result["score"] != 12336:
        raise AssertionError(f"hinted model did not accept base witness: {result}")
    coordinates = cell_paths_to_coordinates(result.pop("cellWitness"), level["width"])
    result["replay"] = independent_replay(coordinates, 12336, result["score"])
    result["matchesStartingWitness"] = coordinates == artifact["witness"]
    if not result["matchesStartingWitness"]:
        raise AssertionError("fixed hinted acceptance changed the starting witness")
    return result


def fixture_check(timeout_seconds):
    initial = [2, 2, 4, 4]
    spawns = [2, 4, 8, 2, 2, 2]
    hint = [[0, 1, 2, 3]]
    at = solve_hinted(4, 1, 1, 4, initial, spawns, 18, timeout_seconds, hint)
    above = solve_hinted(4, 1, 1, 4, initial, spawns, 19, timeout_seconds, hint)
    column = solve_hinted(
        2, 2, 1, 4, initial, spawns, 18, timeout_seconds, hint, fixed_paths=hint)
    if at["verdict"] != "SAT" or at["score"] != 18 or above["verdict"] != "UNSAT":
        raise AssertionError(f"18/19 fixture mismatch: {at}, {above}")
    column_checked = CERTIFIER.replay(2, 2, 4, initial, spawns, hint, 18)
    if column["verdict"] != "SAT" or column_checked["boards"][-1] != [2, 8, 4, 12]:
        raise AssertionError(f"column-major fixture mismatch: {column}, {column_checked}")
    return {
        "verdict": "PASS",
        "scoreGe18": "SAT",
        "scoreGe19": "UNSAT",
        "columnMajorAfter": column_checked["boards"][-1],
    }


def run_schedule(schedule, timeout_seconds):
    if not schedule or 13000 not in schedule or schedule[0] != 12336:
        raise AssertionError("schedule must start at 12336 and include 13000")
    if schedule != sorted(set(schedule)):
        raise AssertionError("schedule must be strictly increasing")
    artifact = load_base_artifact()
    level = CERTIFIER.LEVEL
    initial, spawns = frozen_values()
    hint_paths = coordinate_paths_to_cells(artifact["witness"], level["width"], level["height"])
    results = []
    for threshold in schedule:
        # The first rung is the validated starting point, not a rediscovery
        # attempt. Fixing its already replayed path lets CP-SAT check that the
        # exact model accepts it; all higher rungs remain hint-guided searches.
        fixed_paths = hint_paths if threshold == artifact["scoreClaim"] else None
        result = solve_hinted(
            level["width"], level["height"], level["moves"], level["min_chain"],
            initial, spawns, threshold, timeout_seconds, hint_paths,
            fixed_paths=fixed_paths)
        result["startingWitnessFixed"] = fixed_paths is not None
        if result["verdict"] == "SAT":
            coordinates = cell_paths_to_coordinates(result.pop("cellWitness"), level["width"])
            result["witness"] = coordinates
            result["replay"] = independent_replay(coordinates, threshold, result["score"])
        results.append(result)
    return results


def full_run(schedule, timeout_seconds):
    replay = base_replay()
    acceptance = base_model_acceptance(timeout_seconds)
    fixture = fixture_check(timeout_seconds)
    threshold_results = run_schedule(schedule, timeout_seconds)
    target = next(result for result in threshold_results if result["threshold"] == 13000)
    target_reached = target["verdict"] == "SAT" and target["replay"]["reachesTarget"]
    return {
        "kind": "hinted-cp-sat-threshold-escalation",
        "scope": {"level": 26, "seed": 0, "width": 5, "height": 8, "moves": 32,
                  "minChain": 4, "target": 13000, "blockers": []},
        "inputIdentity": EXPECTED_INPUT_SHA256,
        "budget": {"timeoutSecondsPerSolve": timeout_seconds, "thresholdSchedule": schedule},
        "startingWitness": {"replay": replay, "hintedAcceptance": acceptance},
        "fixture": fixture,
        "thresholdResults": threshold_results,
        "targetReached": target_reached,
        "interpretation": (
            "replayed reachability witness only; no maximum or upper-bound claim"
            if target_reached else
            "bounded hinted search did not emit a replayed target witness; UNKNOWN results are non-decisive"
        ),
    }


def parse_schedule(value):
    try:
        return [int(item) for item in value.split(",")]
    except ValueError as error:
        raise argparse.ArgumentTypeError("schedule must be comma-separated integers") from error


def main():
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--base-replay", action="store_true")
    mode.add_argument("--base-model", action="store_true")
    mode.add_argument("--fixture", action="store_true")
    mode.add_argument("--thresholds", action="store_true")
    mode.add_argument("--run", action="store_true")
    parser.add_argument("--timeout-seconds", type=float, default=20.0)
    parser.add_argument("--schedule", type=parse_schedule,
                        default=DEFAULT_SCHEDULE)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    if args.timeout_seconds <= 0:
        parser.error("--timeout-seconds must be positive")

    if args.base_replay:
        result = base_replay()
    elif args.base_model:
        result = base_model_acceptance(args.timeout_seconds)
    elif args.fixture:
        result = fixture_check(args.timeout_seconds)
    elif args.thresholds:
        result = {"thresholdResults": run_schedule(args.schedule, args.timeout_seconds)}
    else:
        result = full_run(args.schedule, args.timeout_seconds)
    rendered = json.dumps(result, indent=2, sort_keys=True)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(f"{rendered}\n")
    print(rendered)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (AssertionError, RuntimeError) as error:
        print(json.dumps({"verdict": "FAIL", "error": str(error)}, sort_keys=True), file=sys.stderr)
        sys.exit(1)
