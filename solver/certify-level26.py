#!/usr/bin/env python3
"""Exact bounded-model certifier for Level 26, seed 0.

The target query is exact: SAT produces a replay-checked legal witness and
UNSAT proves that score >= 13,000 is unreachable in at most 32 moves.  A
timeout is reported as UNKNOWN and is never converted into a score claim.
"""

import argparse
import hashlib
import json
import sys

from z3 import And, Array, If, Implies, Int, IntSort, Or, Select, Solver, Sum, sat, unsat


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


def multiplier_points(length, chain_sum):
    return If(
        length >= 9,
        chain_sum * 5,
        If(length >= 7, chain_sum * 3, If(length >= 5, chain_sum * 2, (chain_sum * 3) / 2)),
    )


def build_solver(width, height, moves, min_chain, initial, spawns, target):
    """Encode every legal path, score, gravity step, and column-major spawn."""
    cells = width * height
    solver = Solver()
    stream = Array("frozen_spawn_stream", IntSort(), IntSort())
    for index, value in enumerate(spawns):
        solver.add(Select(stream, index) == value)

    boards = [Array(f"board_{turn}", IntSort(), IntSort()) for turn in range(moves + 1)]
    lengths = [Int(f"len_{turn}") for turn in range(moves)]
    cursors = [Int(f"cursor_{turn}") for turn in range(moves + 1)]
    scores = [Int(f"score_{turn}") for turn in range(moves + 1)]
    paths = [[Int(f"p_{turn}_{step}") for step in range(cells)] for turn in range(moves)]
    lasts = [Int(f"last_{turn}") for turn in range(moves)]

    solver.add(cursors[0] == 0, scores[0] == 0)
    for cell, value in enumerate(initial):
        solver.add(Select(boards[0], cell) == value)

    for turn in range(moves):
        active = lengths[turn] > 0
        solver.add(Or(lengths[turn] == 0, And(lengths[turn] >= min_chain, lengths[turn] <= cells)))
        # The shipped game ends immediately on reaching the target.
        solver.add(Implies(scores[turn] >= target, lengths[turn] == 0))
        solver.add(Implies(scores[turn] < target, lengths[turn] >= min_chain))

        for step in range(cells):
            solver.add(Implies(step < lengths[turn], And(paths[turn][step] >= 0, paths[turn][step] < cells)))
            solver.add(Implies(step >= lengths[turn], paths[turn][step] == -1))
            for later in range(step + 1, cells):
                solver.add(Implies(later < lengths[turn], paths[turn][step] != paths[turn][later]))

        for step in range(1, cells):
            previous = paths[turn][step - 1]
            current = paths[turn][step]
            px, py = previous % width, previous / width
            cx, cy = current % width, current / width
            adjacent = And(px - cx >= -1, px - cx <= 1, py - cy >= -1, py - cy <= 1, previous != current)
            solver.add(Implies(step < lengths[turn], adjacent))
            previous_value = Select(boards[turn], previous)
            current_value = Select(boards[turn], current)
            if step == 1:
                solver.add(Implies(step < lengths[turn], previous_value == current_value))
            else:
                solver.add(Implies(step < lengths[turn], Or(current_value == previous_value, current_value == previous_value * 2)))

        last = Sum([If(lengths[turn] == step + 1, paths[turn][step], 0) for step in range(cells)])
        solver.add(If(active, lasts[turn] == last, lasts[turn] == -1))
        chain_sum = Sum([If(step < lengths[turn], Select(boards[turn], paths[turn][step]), 0) for step in range(cells)])
        points = multiplier_points(lengths[turn], chain_sum)
        solver.add(scores[turn + 1] == If(active, scores[turn] + points, scores[turn]))
        solver.add(cursors[turn + 1] == If(active, cursors[turn] + lengths[turn] - 1, cursors[turn]))
        solver.add(cursors[turn] >= 0, cursors[turn] < len(spawns))

        pre_gravity = []
        for cell in range(cells):
            selected = Or([And(step < lengths[turn], paths[turn][step] == cell) for step in range(cells)])
            pre_gravity.append(
                If(And(active, lasts[turn] == cell), chain_sum, If(And(active, selected), 0, Select(boards[turn], cell)))
            )

        gravity = [None] * cells
        for x in range(width):
            for destination in range(height):
                sources = []
                for source_row in range(height):
                    source = source_row * width + x
                    rank = Sum([If(pre_gravity[row * width + x] != 0, 1, 0) for row in range(source_row, height)])
                    sources.append(If(And(pre_gravity[source] != 0, height - rank == destination), pre_gravity[source], 0))
                gravity[destination * width + x] = Sum(sources)

        for cell in range(cells):
            x, y = cell % width, cell // width
            spawn_offset = Sum(
                [
                    If(gravity[previous_y * width + previous_x] == 0, 1, 0)
                    for previous_x in range(width)
                    for previous_y in range(height)
                    if previous_x < x or (previous_x == x and previous_y < y)
                ]
            )
            solver.add(
                Implies(
                    gravity[cell] == 0,
                    And(cursors[turn] + spawn_offset >= 0, cursors[turn] + spawn_offset < len(spawns)),
                )
            )
            after_move = If(gravity[cell] == 0, Select(stream, cursors[turn] + spawn_offset), gravity[cell])
            solver.add(Select(boards[turn + 1], cell) == If(active, after_move, Select(boards[turn], cell)))
            solver.add(Select(boards[turn + 1], cell) > 0)

    solver.add(scores[moves] >= target)
    return solver, boards, paths, lengths, scores


def replay(width, height, min_chain, initial, spawns, paths, target):
    """Independent concrete replay of a SAT model, with no symbolic values."""
    board = list(initial)
    cursor = 0
    score = 0
    for turn, path in enumerate(paths, start=1):
        if score >= target:
            raise AssertionError("witness contains a move after the game reached its target")
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
        last = path[-1]
        selected = set(path)
        pre = [chain_sum if cell == last else 0 if cell in selected else board[cell] for cell in range(width * height)]
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
    return {"score": score, "moves": len(paths), "cursor": cursor, "reaches_target": score >= target}


def fixture_check():
    initial = [2, 2, 4, 4]
    spawns = [2, 2, 2]
    above, _, _, _, _ = build_solver(4, 1, 1, 4, initial, spawns, 19)
    at, _, _, _, _ = build_solver(4, 1, 1, 4, initial, spawns, 18)
    above_result = above.check()
    at_result = at.check()
    if above_result != unsat or at_result != sat:
        raise AssertionError(f"fixture mismatch: >=19 {above_result}, >=18 {at_result}")

    # Freeze one two-column path to check gameplay's column-major spawn order.
    column, boards, paths, _, _ = build_solver(2, 2, 1, 4, initial, [2, 4, 8], 18)
    for step, cell in enumerate([0, 1, 2, 3]):
        column.add(paths[0][step] == cell)
    if column.check() != sat:
        raise AssertionError("column-major fixture path should be legal")
    model = column.model()
    after = [model.eval(Select(boards[1], cell)).as_long() for cell in range(4)]
    if after != [2, 8, 4, 12]:
        raise AssertionError(f"column-major spawn mismatch: {after}")
    return {"verdict": "PASS", "exact_maximum": 18, "score_ge_18": "SAT", "score_ge_19": "UNSAT", "column_major_after": after}


def frozen_query(timeout_ms):
    cells = LEVEL["width"] * LEVEL["height"]
    initial, spawns = seeded_level_values(0, cells, LEVEL["moves"] * (cells - 1))
    frozen_hash = hashlib.sha256(bytes(initial + spawns)).hexdigest()
    solver, _, paths, lengths, scores = build_solver(
        LEVEL["width"], LEVEL["height"], LEVEL["moves"], LEVEL["min_chain"], initial, spawns, LEVEL["target"]
    )
    solver.set(timeout=timeout_ms)
    result = solver.check()
    common = {"level": 26, "seed": 0, "query": "score >= 13000", "timeout_ms": timeout_ms, "frozen_values_sha256": frozen_hash}
    if result == unsat:
        return {**common, "verdict": "UNSAT", "upper_bound": 12999, "reaches_target": False}, 0
    if result != sat:
        return {**common, "verdict": "UNKNOWN", "reason": solver.reason_unknown(), "score_claim": None}, 2

    model = solver.model()
    witness = []
    for turn in range(LEVEL["moves"]):
        length = model.eval(lengths[turn]).as_long()
        if not length:
            break
        witness.append([model.eval(paths[turn][step]).as_long() for step in range(length)])
    checked = replay(LEVEL["width"], LEVEL["height"], LEVEL["min_chain"], initial, spawns, witness, LEVEL["target"])
    symbolic_score = model.eval(scores[-1]).as_long()
    if checked["score"] != symbolic_score or not checked["reaches_target"]:
        raise AssertionError(f"symbolic/concrete replay mismatch: symbolic={symbolic_score}, replay={checked}")
    return {**common, "verdict": "SAT", "score": symbolic_score, "replay": checked, "witness": witness}, 0


def main():
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--fixture", action="store_true", help="prove the max=18 fixture and spawn-order fixture")
    mode.add_argument("--target", action="store_true", help="decide frozen Level 26 seed-0 score >= 13,000")
    parser.add_argument("--timeout-ms", type=int, default=120000, help="Z3 target-query timeout (UNKNOWN is exit 2)")
    args = parser.parse_args()
    if args.fixture:
        print(json.dumps(fixture_check(), sort_keys=True))
        return 0
    payload, exit_code = frozen_query(args.timeout_ms)
    print(json.dumps(payload, sort_keys=True))
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
