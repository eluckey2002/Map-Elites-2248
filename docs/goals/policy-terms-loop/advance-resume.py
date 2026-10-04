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

def register_and_confirm(raw):
    if command(['git', 'branch', '--show-current'], capture=True).strip() != 'codex/latest-main-20261002':
        raise RuntimeError('wrong branch; never act in another checkout')
    for existing in ['experiments/RESULT-0082/protocol.md',
                     'experiments/RESULT-0082/raw-pairs.json',
                     'solver/policy-lab/resume-frozen-candidate.js',
                     'solver/policy-lab/runs/resume/confirmation']:
        if (ROOT / existing).exists():
            raise RuntimeError('registration or confirmation already attempted; never retry')
    policy = audited_selection(raw)
    candidate = ROOT / 'solver/policy-lab/resume-frozen-candidate.js'
    body = "'use strict';\nmodule.exports = " + json.dumps(policy, indent=2) + ';\n'
    with candidate.open('x') as stream:
        stream.write(body)
        stream.flush()
        os.fsync(stream.fileno())
    # Commit completed retained data only after the measurement pool has closed.
    command(['git', 'add', 'solver/policy-lab/resume-frozen-candidate.js',
             'solver/policy-lab/runs/resume', 'solver/policy-lab/runs/proposals.csv'])
    command(['git', 'commit', '-m', 'Freeze audited policy selection and completed exploration before F'])
    # Require a genuinely clean checkout. Unknown changes stop, never get hidden,
    # discarded or automatically committed by this coordinator.
    if command(['git', 'status', '--porcelain'], capture=True).strip():
        raise RuntimeError('uncommitted changes prevent protocol registration')
    tests = command(['node', 'docs/goals/policy-terms-loop/live-suite.js'], capture=True)
    (DIR / 'resume-before-confirmation-tests.txt').write_text(tests)
    command(['git', 'add', 'docs/goals/policy-terms-loop/resume-before-confirmation-tests.txt'])
    command(['git', 'commit', '-m', 'Retain actual current suite before one-shot preregistration'])
    command(['node', 'tools/new-experiment.js', 'RESULT-0082'])
    command(['node', 'docs/goals/policy-terms-loop/prepare-resume-registration.js'])
    command(['git', 'add', 'experiments/RESULT-0082/protocol.md',
             'experiments/RESULT-0082/registered-protocol.md', 'experiments/RESULT-0082/closeout-contract.json'])
    # Amend the freshly generated template only, before any F evidence exists.
    command(['git', 'commit', '--amend', '--no-edit'])
    command(['node', 'tools/verify-experiments.js'])
    progress('Actual selected candidate frozen and one-shot RESULT82 protocol committed before F; starting the reserved17400games with at most4workers. No scientific acceptance or adoption.')
    command(['node', 'solver/policy-lab/resume-confirmation.js', '--protocol', 'RESULT-0082'])
    independent = command(['node', 'solver/policy-lab/resume-proposal-recompute.js', '--confirmation'], capture=True)
    (DIR / 'resume-confirmation-recompute-output.txt').write_text(independent)
    print(independent, flush=True)
    progress('One-shot F measurement and independent arithmetic finished. Ready for actual report, provisional ledger, closed-evidence pin and PR review; no merge or adoption.')

def main():
    # A permanent exclusive marker prevents a second registration/confirmation
    # attempt if this process or its transport is lost.
    marker = RUNS / 'resume-advance-launch.log'
    with marker.open('x') as stream:
        json.dump({'pid': os.getpid(), 'sourceSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                   'relaunchAllowed': False, 'startedUtc': datetime.datetime.now(datetime.timezone.utc).isoformat()}, stream)
        stream.flush()
        os.fsync(stream.fileno())
    last = None
    while True:
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
