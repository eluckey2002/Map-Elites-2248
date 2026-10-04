"""Continue the already-authorized, frozen experiment once selection is complete.

No seed replay, new budget, new policy search, network writes, merge or adoption.
This coordinator only monitors, freezes the actual audited selection, preregisters
the conditional F protocol, and calls the existing frozen one-shot runner.
"""
import datetime
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[3]
RUNS = ROOT / 'solver/policy-lab/runs'
DIR = ROOT / 'docs/goals/policy-terms-loop'
ACTOR = 'codex-policy-terms-20261003'
TASK = 'POLICY-TERMS-RESUME-20261004'
SOURCE_SHA256 = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
MARKER = RUNS / 'resume-reviewed-advance-launch.log'

def command(args, *, capture=False):
    return subprocess.run(args, cwd=ROOT, check=True, text=True,
                          stdout=subprocess.PIPE if capture else None,
                          stderr=subprocess.PIPE if capture else None).stdout

def progress(detail):
    try:
        command(['python', '.blackboard/board.py', 'progress', '--actor', ACTOR,
                 '--id', TASK, '--detail', detail])
    except subprocess.CalledProcessError as error:
        print('OPERATIONAL_PROGRESS_WARNING', error, flush=True)

def audited_selection(raw):
    if raw.get('status') != 'EXPLORATION_COMPLETE' or raw.get('path') != 'CONFIRMATION_REGISTRATION_PENDING' or not raw.get('selected'):
        raise RuntimeError('complete actual selected exploration required')
    output = command(['node', 'solver/policy-lab/resume-proposal-recompute.js'], capture=True)
    if 'PASS completed proposal journal jobs' not in output or 'MATCH retained proposal arithmetic' not in output or 'UNVERIFIED' in output:
        raise RuntimeError('independent complete exploration audit required')
    return raw['selected']['policy']

def pipeline_live():
    launch = json.loads((RUNS / 'resume-controls.pid').read_text())
    pid = int(launch['pid'])
    try:
        os.kill(pid, 0)
        stat = Path(f'/proc/{pid}/stat').read_text()
        return stat.rsplit(')', 1)[1].split()[0] != 'Z'
    except (ProcessLookupError, FileNotFoundError):
        return False

def assert_runtime_identity(*, source=None, marker=None, expected_sha=None, expected_pid=None):
    source = Path(source) if source is not None else Path(__file__)
    marker = Path(marker) if marker is not None else MARKER
    expected_sha = expected_sha if expected_sha is not None else SOURCE_SHA256
    expected_pid = expected_pid if expected_pid is not None else os.getpid()
    launch = json.loads(marker.read_text())
    current = hashlib.sha256(source.read_bytes()).hexdigest()
    if launch.get('sourceSha256') != expected_sha or current != expected_sha or launch.get('pid') != expected_pid:
        raise RuntimeError('running coordinator source identity differs; stop before writes')

def assert_committed_source():
    committed = command(['git', 'show', 'HEAD:docs/goals/policy-terms-loop/advance-resume-reviewed.py'], capture=True)
    if hashlib.sha256(committed.encode()).hexdigest() != SOURCE_SHA256:
        raise RuntimeError('running coordinator must equal its committed source')

def assert_selection_checkout(*, execute=None):
    execute = execute or command
    # The index must be empty before any write or add; commit --only also
    # confines each subsequent commit if a concurrent staged change appears.
    if execute(['git', 'diff', '--cached', '--name-only', '-z'], capture=True):
        raise RuntimeError('pre-staged changes prevent selection commit')
    dirty = execute(['git', 'status', '--porcelain', '-z', '--untracked-files=all'], capture=True)
    for record in dirty.split('\0'):
        if not record:
            continue
        name = record[3:]
        if record[:2] != '??' or not (name.startswith('solver/policy-lab/runs/resume/') or name == 'solver/policy-lab/runs/proposals.csv'):
            raise RuntimeError('unknown checkout change prevents selection commit: ' + name)

def reject_existing_outputs(*, root=None, before_registration=True):
    root = Path(root) if root is not None else ROOT
    outputs = ['experiments/RESULT-0082/raw-pairs.json', 'experiments/RESULT-0082/verdict.json',
               'solver/policy-lab/runs/resume/confirmation']
    if before_registration:
        outputs += ['experiments/RESULT-0082/protocol.md', 'experiments/RESULT-0082/registered-protocol.md',
                    'experiments/RESULT-0082/closeout-contract.json', 'experiments/RESULT-0082/closure.json',
                    'experiments/RESULT-0082/report.md', 'solver/policy-lab/resume-frozen-candidate.js']
    for existing in outputs:
        if (root / existing).exists():
            raise RuntimeError('existing registration/confirmation output prevents dispatch: ' + existing)

def register_and_confirm(raw):
    if command(['git', 'branch', '--show-current'], capture=True).strip() != 'codex/latest-main-20261002':
        raise RuntimeError('wrong branch; never act in another checkout')
    assert_runtime_identity()
    assert_committed_source()
    reject_existing_outputs()
    assert_selection_checkout()
    policy = audited_selection(raw)
    assert_runtime_identity()
    reject_existing_outputs()
    assert_selection_checkout()
    candidate = ROOT / 'solver/policy-lab/resume-frozen-candidate.js'
    body = "'use strict';\nmodule.exports = " + json.dumps(policy, indent=2) + ';\n'
    with candidate.open('x') as stream:
        stream.write(body)
        stream.flush()
        os.fsync(stream.fileno())
    # Commit only owned paths even if another staged change appears after preflight.
    owned = ['solver/policy-lab/resume-frozen-candidate.js',
             'solver/policy-lab/runs/resume', 'solver/policy-lab/runs/proposals.csv']
    command(['git', 'add', '--', *owned])
    command(['git', 'commit', '--only', '-m', 'Freeze audited policy selection and completed exploration before F', '--', *owned])
    # Require a genuinely clean checkout. Unknown changes stop, never get hidden,
    # discarded or automatically committed by this coordinator.
    if command(['git', 'status', '--porcelain'], capture=True).strip():
        raise RuntimeError('uncommitted changes prevent protocol registration')
    tests = command(['node', 'docs/goals/policy-terms-loop/live-suite.js'], capture=True)
    assert_runtime_identity()
    (DIR / 'resume-before-confirmation-tests.txt').write_text(tests)
    command(['git', 'add', 'docs/goals/policy-terms-loop/resume-before-confirmation-tests.txt'])
    command(['git', 'commit', '--only', '-m', 'Retain actual current suite before one-shot preregistration', '--', 'docs/goals/policy-terms-loop/resume-before-confirmation-tests.txt'])
    assert_runtime_identity()
    assert_committed_source()
    command(['node', 'tools/new-experiment.js', 'RESULT-0082'])
    command(['node', 'docs/goals/policy-terms-loop/prepare-resume-registration.js'])
    command(['git', 'add', 'experiments/RESULT-0082/protocol.md',
             'experiments/RESULT-0082/registered-protocol.md', 'experiments/RESULT-0082/closeout-contract.json'])
    # Amend the freshly generated template only, before any F evidence exists.
    command(['git', 'commit', '--only', '--amend', '--no-edit', '--',
             'experiments/RESULT-0082/protocol.md', 'experiments/RESULT-0082/registered-protocol.md',
             'experiments/RESULT-0082/closeout-contract.json'])
    command(['node', 'tools/verify-experiments.js'])
    if command(['git', 'status', '--porcelain'], capture=True).strip():
        raise RuntimeError('unknown checkout changes prevent confirmation dispatch')
    progress('Actual selected candidate frozen and one-shot RESULT82 protocol committed before F; starting the reserved17400games with at most4workers. No scientific acceptance or adoption.')
    assert_runtime_identity()
    assert_committed_source()
    reject_existing_outputs(before_registration=False)
    command(['node', 'solver/policy-lab/resume-confirmation.js', '--protocol', 'RESULT-0082'])
    independent = command(['node', 'solver/policy-lab/resume-proposal-recompute.js', '--confirmation'], capture=True)
    (DIR / 'resume-confirmation-recompute-output.txt').write_text(independent)
    print(independent, flush=True)
    progress('One-shot F measurement and independent arithmetic finished. Ready for actual report, provisional ledger, closed-evidence pin and PR review; no merge or adoption.')

def main():
    # A permanent exclusive marker prevents a second registration/confirmation
    # attempt if this process or its transport is lost.
    marker = MARKER
    with marker.open('x') as stream:
        json.dump({'pid': os.getpid(), 'sourceSha256': SOURCE_SHA256,
                   'relaunchAllowed': False, 'startedUtc': datetime.datetime.now(datetime.timezone.utc).isoformat()}, stream)
        stream.flush()
        os.fsync(stream.fileno())
    assert_runtime_identity()
    assert_committed_source()
    last = None
    while True:
        assert_runtime_identity()
        file = RUNS / 'resume/proposals-raw.json'
        raw = json.loads(file.read_text()) if file.exists() else None
        if raw:
            state = (raw['status'], raw['proposalRounds'], len(raw['panels']))
            if state != last:
                progress(f'Observed frozen exploration status={state[0]}, rounds={state[1]}, retained panels={state[2]}; counts={json.dumps(raw["counts"])}. No replay or new policy changes.')
                last = state
            if raw['status'] == 'BUDGET_STOP':
                progress('Actual PathD budget/effort stop retained; no F will run. Ready for bounded-source closeout.')
                return
            if raw['status'] not in ('RUNNING', 'EXPLORATION_COMPLETE'):
                raise RuntimeError('measurement stopped; preserve charges and never restart')
            if raw['status'] == 'EXPLORATION_COMPLETE':
                # Written by the frozen pipeline only after its pool is closed
                # and its own independent complete-exploration audit succeeds.
                done = RUNS / 'resume/proposal-recompute-output.txt'
                if done.exists():
                    if raw['path'] == 'B':
                        progress('Actual PathB NO_CANDIDATE; no F will run. Ready for direct-source closeout.')
                        return
                    register_and_confirm(raw)
                    return
        if not pipeline_live():
            raise RuntimeError('pipeline is no longer live without complete audited selection; never relaunch')
        time.sleep(30)

if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print('ADVANCE_STOP', repr(error), flush=True)
        progress(f'Conditional coordinator stopped: {error}; preserve measured data and charges; never retry registration/F or replay a seed.')
        sys.exit(1)
