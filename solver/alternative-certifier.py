#!/usr/bin/env python3
"""Alternative exact CP-SAT feasibility model for frozen Level 26 seed 0.

Unlike ``certify-level26.py``'s Z3 array model, this formulation uses finite
integer domains, a sentinel-terminated path at each turn, reified cell
membership, and an explicit stable-compaction network for gravity.  SAT is
accepted only after a separate concrete replay.  A time limit is UNKNOWN.
"""

import argparse
import hashlib
import json
import sys

from ortools.sat.python import cp_model


MASK = 0xFFFFFFFF
LEVEL = {"level": 26, "width": 5, "height": 8, "moves": 32, "min_chain": 4, "target": 13000}


def mulberry32(seed):
    state = seed & MASK
    while True:
        state = (state + 0x6D2B79F5) & MASK
        value = state
        value = ((value ^ (value >> 15)) * (value | 1)) & MASK
        value ^= (value + (((value ^ (value >> 7)) * (value | 61)) & MASK)) & MASK
        yield ((value ^ (value >> 14)) & MASK) / 4294967296


def seeded_level_values(seed, cells, future_draws):
    rng = mulberry32(seed)
    initial = []
    for _ in range(cells):
        draw = next(rng)
        initial.append(2 if draw < 0.5 else 4 if draw < 0.8 else 8 if draw < 0.95 else 16)
    spawns = []
    for _ in range(future_draws):
        draw = next(rng)
        spawns.append(2 if draw < 0.6 else 4 if draw < 0.9 else 8)
    return initial, spawns


def multiplier(length):
    if length >= 9:
        return 5
    if length >= 7:
        return 3
    if length >= 5:
        return 2
    return 1.5


def replay(width, height, min_chain, initial, spawns, paths, target):
    """Concrete rule replay independent of the CP-SAT constraints."""
    board = list(initial)
    cursor = 0
    score = 0
    boards = []
    for turn, path in enumerate(paths, start=1):
        if score >= target:
            raise AssertionError("witness contains a move after reaching the target")
        if len(path) < min_chain or len(path) != len(set(path)):
            raise AssertionError(f"turn {turn}: invalid chain length or repeated cell")
        values = []
        for step, cell in enumerate(path):
            if not 0 <= cell < width * height:
                raise AssertionError(f"turn {turn}: off-board cell")
            if step:
                previous = path[step - 1]
                px, py = previous % width, previous // width
                cx, cy = cell % width, cell // width
                if max(abs(px - cx), abs(py - cy)) != 1:
                    raise AssertionError(f"turn {turn}: non-adjacent cells")
                if step == 1 and board[cell] != board[previous]:
                    raise AssertionError(f"turn {turn}: first extension is not equal")
                if step > 1 and board[cell] not in (board[previous], board[previous] * 2):
                    raise AssertionError(f"turn {turn}: illegal value extension")
            values.append(board[cell])

        chain_sum = sum(values)
        score += int(chain_sum * multiplier(len(path)))
        endpoint = path[-1]
        selected = set(path)
        pre = [chain_sum if cell == endpoint else 0 if cell in selected else board[cell]
               for cell in range(width * height)]
        board = [0] * (width * height)
        for x in range(width):
            kept = [pre[y * width + x] for y in range(height) if pre[y * width + x] != 0]
            for offset, value in enumerate(kept):
                board[(height - len(kept) + offset) * width + x] = value
        for x in range(width):
            for y in range(height):
                cell = y * width + x
                if board[cell] == 0:
                    board[cell] = spawns[cursor]
                    cursor += 1
        boards.append(list(board))
    return {"score": score, "moves": len(paths), "cursor": cursor,
            "reaches_target": score >= target, "boards": boards}


def _iff_equal(model, variable, value, name):
    literal = model.new_bool_var(name)
    model.add(variable == value).only_enforce_if(literal)
    model.add(variable != value).only_enforce_if(~literal)
    return literal


def build_model(width, height, moves, min_chain, initial, spawns, target, fixed_paths=None):
    """Build an exact finite-domain transition system for the bounded game."""
    cells = width * height
    sentinel = cells
    mass_cap = sum(initial) + sum(spawns)
    score_cap = moves * 5 * mass_cap
    model = cp_model.CpModel()

    boards = [[model.new_int_var(1, mass_cap, f"board_{turn}_{cell}")
               for cell in range(cells)] for turn in range(moves + 1)]
    for cell, value in enumerate(initial):
        model.add(boards[0][cell] == value)

    lengths = [model.new_int_var(0, cells, f"length_{turn}") for turn in range(moves)]
    cursors = [model.new_int_var(0, len(spawns), f"cursor_{turn}") for turn in range(moves + 1)]
    scores = [model.new_int_var(0, score_cap, f"score_{turn}") for turn in range(moves + 1)]
    paths = [[model.new_int_var(0, sentinel, f"path_{turn}_{step}")
              for step in range(cells)] for turn in range(moves)]
    model.add(cursors[0] == 0)
    model.add(scores[0] == 0)

    adjacency = [(a, b) for a in range(cells) for b in range(cells)
                 if a != b and max(abs(a % width - b % width), abs(a // width - b // width)) == 1]

    for turn in range(moves):
        active = model.new_bool_var(f"active_{turn}")
        model.add(lengths[turn] >= min_chain).only_enforce_if(active)
        model.add(lengths[turn] == 0).only_enforce_if(~active)
        model.add(scores[turn] <= target - 1).only_enforce_if(active)
        model.add(scores[turn] >= target).only_enforce_if(~active)

        step_active = []
        cell_at_step = []
        values = []
        for step in range(cells):
            enabled = model.new_bool_var(f"step_active_{turn}_{step}")
            model.add(lengths[turn] >= step + 1).only_enforce_if(enabled)
            model.add(lengths[turn] <= step).only_enforce_if(~enabled)
            model.add(paths[turn][step] < cells).only_enforce_if(enabled)
            model.add(paths[turn][step] == sentinel).only_enforce_if(~enabled)
            step_active.append(enabled)

            value = model.new_int_var(0, mass_cap, f"path_value_{turn}_{step}")
            model.add_element(paths[turn][step], boards[turn] + [0], value)
            values.append(value)

            indicators = []
            for cell in range(cells):
                indicators.append(_iff_equal(model, paths[turn][step], cell,
                                             f"at_{turn}_{step}_{cell}"))
            cell_at_step.append(indicators)

            if step:
                model.add_allowed_assignments([paths[turn][step - 1], paths[turn][step]], adjacency).only_enforce_if(enabled)
                if step == 1:
                    model.add(values[step] == values[step - 1]).only_enforce_if(enabled)
                else:
                    same = model.new_bool_var(f"same_value_{turn}_{step}")
                    model.add(values[step] == values[step - 1]).only_enforce_if([enabled, same])
                    model.add(values[step] == 2 * values[step - 1]).only_enforce_if([enabled, ~same])

        for later in range(1, cells):
            for earlier in range(later):
                model.add(paths[turn][earlier] != paths[turn][later]).only_enforce_if(step_active[later])

        length_cases = [_iff_equal(model, lengths[turn], step + 1, f"is_length_{turn}_{step + 1}")
                        for step in range(cells)]
        last = model.new_int_var(0, cells - 1, f"last_{turn}")
        model.add(last == 0).only_enforce_if(~active)
        for step, length_case in enumerate(length_cases):
            model.add(last == paths[turn][step]).only_enforce_if(length_case)

        selected = []
        endpoint = []
        removed = []
        for cell in range(cells):
            chosen = model.new_bool_var(f"selected_{turn}_{cell}")
            model.add(sum(cell_at_step[step][cell] for step in range(cells)) == chosen)
            selected.append(chosen)
            end = model.new_bool_var(f"endpoint_{turn}_{cell}")
            model.add(last == cell).only_enforce_if(end)
            model.add(last != cell).only_enforce_if([active, ~end])
            model.add(end == 0).only_enforce_if(~active)
            endpoint.append(end)
            gone = model.new_bool_var(f"removed_{turn}_{cell}")
            model.add(gone <= chosen)
            model.add(gone + end == chosen)
            removed.append(gone)

        chain_sum = model.new_int_var(0, mass_cap, f"chain_sum_{turn}")
        model.add(chain_sum == sum(values))
        points = model.new_int_var(0, 5 * mass_cap, f"points_{turn}")
        model.add(points == 0).only_enforce_if(~active)
        for length in range(min_chain, cells + 1):
            condition = length_cases[length - 1]
            factor_num, factor_den = ((3, 2) if length == 4 else
                                      (2, 1) if length <= 6 else
                                      (3, 1) if length <= 8 else (5, 1))
            model.add(factor_den * points == factor_num * chain_sum).only_enforce_if(condition)
        model.add(scores[turn + 1] == scores[turn] + points)

        pre = []
        for cell in range(cells):
            value = model.new_int_var(0, mass_cap, f"pre_{turn}_{cell}")
            model.add(value == 0).only_enforce_if(removed[cell])
            model.add(value == chain_sum).only_enforce_if(endpoint[cell])
            model.add(value == boards[turn][cell]).only_enforce_if(~selected[cell])
            pre.append(value)

        removed_by_column = []
        gravity = [None] * cells
        for x in range(width):
            column_removed = [removed[y * width + x] for y in range(height)]
            count = model.new_int_var(0, height, f"removed_col_{turn}_{x}")
            model.add(count == sum(column_removed))
            removed_by_column.append(count)

            contributions = [[] for _ in range(height)]
            for source_y in range(height):
                source = source_y * width + x
                destination = model.new_int_var(source_y, height - 1, f"destination_{turn}_{source}")
                model.add(destination == source_y + sum(column_removed[source_y + 1:]))
                source_landings = []
                for destination_y in range(source_y, height):
                    lands = model.new_bool_var(f"lands_{turn}_{source}_{destination_y}")
                    model.add(destination == destination_y).only_enforce_if(lands)
                    model.add(lands == 0).only_enforce_if(removed[source])
                    source_landings.append(lands)
                    contribution = model.new_int_var(0, mass_cap, f"contribution_{turn}_{source}_{destination_y}")
                    model.add_multiplication_equality(contribution, [pre[source], lands])
                    contributions[destination_y].append(contribution)
                model.add(sum(source_landings) == 1).only_enforce_if(~removed[source])

            for destination_y in range(height):
                destination = destination_y * width + x
                value = model.new_int_var(0, mass_cap, f"gravity_{turn}_{destination}")
                model.add(value == sum(contributions[destination_y]))
                gravity[destination] = value

        removed_total = model.new_int_var(0, cells - 1, f"removed_total_{turn}")
        model.add(removed_total == sum(removed))
        model.add(cursors[turn + 1] == cursors[turn] + removed_total)

        prior_removed = 0
        for x in range(width):
            for y in range(height):
                destination = y * width + x
                hole = model.new_bool_var(f"spawn_hole_{turn}_{destination}")
                model.add(removed_by_column[x] >= y + 1).only_enforce_if(hole)
                model.add(removed_by_column[x] <= y).only_enforce_if(~hole)
                spawn_index = model.new_int_var(0, len(spawns) - 1, f"spawn_index_{turn}_{destination}")
                model.add(spawn_index == cursors[turn] + prior_removed + y).only_enforce_if(hole)
                model.add(spawn_index == 0).only_enforce_if(~hole)
                spawn_value = model.new_int_var(min(spawns), max(spawns), f"spawn_value_{turn}_{destination}")
                model.add_element(spawn_index, spawns, spawn_value)
                model.add(boards[turn + 1][destination] == spawn_value).only_enforce_if(hole)
                model.add(boards[turn + 1][destination] == gravity[destination]).only_enforce_if(~hole)
            prior_removed += removed_by_column[x]

        if fixed_paths is not None:
            path = fixed_paths[turn]
            model.add(lengths[turn] == len(path))
            for step, cell in enumerate(path):
                model.add(paths[turn][step] == cell)

    model.add(scores[moves] >= target)
    return model, boards, paths, lengths, scores, cursors


def solve_exact(width, height, moves, min_chain, initial, spawns, target, timeout_seconds,
                fixed_paths=None):
    model, boards, paths, lengths, scores, cursors = build_model(
        width, height, moves, min_chain, initial, spawns, target, fixed_paths=fixed_paths)
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = timeout_seconds
    solver.parameters.num_search_workers = 8
    solver.parameters.random_seed = 0
    status = solver.solve(model)
    if status == cp_model.INFEASIBLE:
        return {"verdict": "UNSAT", "upper_bound": target - 1, "reaches_target": False,
                "wall_time_seconds": solver.wall_time}, None
    if status not in (cp_model.FEASIBLE, cp_model.OPTIMAL):
        return {"verdict": "UNKNOWN", "reason": solver.status_name(status), "score_claim": None,
                "wall_time_seconds": solver.wall_time}, None
    witness = []
    for turn in range(moves):
        length = solver.value(lengths[turn])
        if length == 0:
            break
        witness.append([solver.value(paths[turn][step]) for step in range(length)])
    checked = replay(width, height, min_chain, initial, spawns, witness, target)
    symbolic_score = solver.value(scores[-1])
    symbolic_cursor = solver.value(cursors[-1])
    symbolic_boards = [[solver.value(value) for value in boards[turn + 1]]
                       for turn in range(len(witness))]
    if (checked["score"] != symbolic_score or checked["cursor"] != symbolic_cursor
            or checked["boards"] != symbolic_boards or not checked["reaches_target"]):
        raise AssertionError(
            f"symbolic/concrete mismatch: symbolic score/cursor={symbolic_score}/{symbolic_cursor}, "
            f"symbolic boards={symbolic_boards}, replay={checked}")
    return {"verdict": "SAT", "score": symbolic_score,
            "replay": {key: checked[key] for key in ("score", "moves", "cursor", "reaches_target")},
            "witness": witness, "wall_time_seconds": solver.wall_time}, checked


def fixture_check(timeout_seconds):
    initial = [2, 2, 4, 4]
    at, _ = solve_exact(4, 1, 1, 4, initial, [2, 2, 2], 18, timeout_seconds)
    above, _ = solve_exact(4, 1, 1, 4, initial, [2, 2, 2], 19, timeout_seconds)
    if at["verdict"] != "SAT" or above["verdict"] != "UNSAT":
        raise AssertionError(f"fixture mismatch: >=18 {at}, >=19 {above}")
    column, checked = solve_exact(2, 2, 1, 4, initial, [2, 4, 8], 18,
                                  timeout_seconds, fixed_paths=[[0, 1, 2, 3]])
    if column["verdict"] != "SAT" or checked["boards"][-1] != [2, 8, 4, 12]:
        raise AssertionError(f"column-major fixture mismatch: {column}, {checked}")
    early_stop, early_checked = solve_exact(4, 1, 2, 4, initial, [2, 2, 2, 2, 2, 2],
                                            18, timeout_seconds)
    if early_stop["verdict"] != "SAT" or early_checked["moves"] != 1:
        raise AssertionError(f"game-end fixture mismatch: {early_stop}, {early_checked}")
    return {"verdict": "PASS", "exact_maximum": 18, "score_ge_18": "SAT",
            "score_ge_19": "UNSAT", "column_major_after": checked["boards"][-1],
            "early_stop_moves": early_checked["moves"]}


def frozen_query(timeout_seconds):
    cells = LEVEL["width"] * LEVEL["height"]
    initial, spawns = seeded_level_values(0, cells, LEVEL["moves"] * (cells - 1))
    identity = hashlib.sha256(bytes(initial + spawns)).hexdigest()
    result, _ = solve_exact(LEVEL["width"], LEVEL["height"], LEVEL["moves"],
                            LEVEL["min_chain"], initial, spawns, LEVEL["target"], timeout_seconds)
    return {"level": 26, "seed": 0, "query": "score >= 13000",
            "timeout_seconds": timeout_seconds, "frozen_values_sha256": identity,
            **result}


def main():
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--fixture", action="store_true")
    mode.add_argument("--target", action="store_true")
    parser.add_argument("--timeout-seconds", type=float, default=120.0)
    args = parser.parse_args()
    if args.timeout_seconds <= 0:
        parser.error("--timeout-seconds must be positive")
    if args.fixture:
        print(json.dumps(fixture_check(args.timeout_seconds), sort_keys=True))
        return 0
    result = frozen_query(args.timeout_seconds)
    print(json.dumps(result, sort_keys=True))
    return 0 if result["verdict"] in ("SAT", "UNSAT") else 2


if __name__ == "__main__":
    sys.exit(main())
