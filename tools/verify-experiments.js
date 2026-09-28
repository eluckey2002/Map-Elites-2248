#!/usr/bin/env node
// Gate: a claim that generalizes beyond what it measured must have said, in
// advance and in writing, what it was testing and what would falsify it.
//
// A result whose proof_class is only direct_source / exact_result /
// owner_decision is an observation or a ruling, not an experiment, and needs
// no protocol. A result carrying heuristic_observation does.
//
// The version freeze is checked here in the two forms that stay true forever:
// while a protocol is still `registered` its frozen files must match the tree
// (this is what experiments/README.md item 4 has always claimed), and once it
// is `complete` every source hash its ARTIFACT recorded must be one the
// protocol froze. solver/experiment-guard.js additionally re-checks the tree at
// run time, before any compute. What is deliberately NOT checked is a frozen
// file moving after a completed run: that is a fact about the present, not
// about the evidence, and clause (b) already pins what the evidence was made
// from.

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { assessFailedRunLedger } = require('./failed-run-ledger');

const ROOT = path.join(__dirname, '..');
const LEDGER = path.join(ROOT, 'EVIDENCE_LEDGER.md');
const EXPERIMENTS = path.join(ROOT, 'experiments');
const GRANDFATHER = path.join(EXPERIMENTS, 'GRANDFATHERED.md');

const REQUIRES_PROTOCOL = 'heuristic_observation';

function readLedgerResults(text) {
  const results = [];
  const lines = text.split('\n');
  let current = null;
  for (const line of lines) {
    const heading = /^### (RESULT-\d+)\b/.exec(line);
    if (heading) {
      current = { id: heading[1], body: [] };
      results.push(current);
      continue;
    }
    if (/^#{2,3} /.test(line)) { current = null; continue; }
    if (current) current.body.push(line);
  }
  return results.map(({ id, body }) => {
    const joined = body.join('\n');
    const pc = /^- \*\*proof_class:\*\*(.*)$/m.exec(joined);
    return { id, proofClass: pc ? pc[1] : '', body: joined };
  });
}

function parseFrontmatter(text) {
  const m = /^---\n([\s\S]*?)\n---/.exec(text);
  if (!m) return null;
  const out = {};
  let key = null;
  for (const line of m[1].split('\n')) {
    const top = /^([a-z_]+):\s*(.*)$/.exec(line);
    if (top) { key = top[1]; out[key] = top[2] === '' ? {} : top[2]; continue; }
    const nested = /^\s+([^:]+):\s*(.*)$/.exec(line);
    if (nested && key && typeof out[key] === 'object') out[key][nested[1].trim()] = nested[2].trim();
  }
  return out;
}

function declaredChecks(text) {
  return [...text.matchAll(/^### ([CP]\d+)(?:['′])?\s*[—-]/gm)].map((m) => m[1]);
}

// Paths a ledger record cites as evidence. Code-span citations are reportable
// run artifacts and therefore require registration stamps. Markdown links can
// also name supporting receipts (qualification and closure files), so they
// participate in existence and identity checks without acquiring that
// requirement merely because the ledger rendered them as links.
function artifactCitations(body) {
  const citations = new Map();
  for (const match of body.matchAll(/`([A-Za-z0-9._/\-]+\.json)`/g)) {
    citations.set(match[1], { rel: match[1], requiresRegistration: true });
  }
  for (const match of body.matchAll(/\[[^\]]*\]\(([A-Za-z0-9._/\-]+\.json)\)/g)) {
    if (!citations.has(match[1])) {
      citations.set(match[1], { rel: match[1], requiresRegistration: false });
    }
  }
  return [...citations.values()];
}

function citedArtifacts(body) {
  return artifactCitations(body).map(({ rel }) => rel);
}

// An --exploratory run is allowed to exist; it is not allowed to be the
// evidence under a claim that generalizes. Without this the --exploratory
// hatch has no teeth, and the guard's own error message promises it does.
function assessArtifactStamps(result, exempt) {
  const problems = [];
  if (exempt.has(result.id)) return problems;
  for (const { rel, requiresRegistration } of artifactCitations(result.body)) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) continue;
    let artifact;
    try { artifact = JSON.parse(fs.readFileSync(abs, 'utf8')); } catch { continue; }
    const stamp = artifact.registration;
    if (!stamp) {
      if (requiresRegistration) {
        problems.push(`${result.id}: ${rel} carries no registration stamp; it cannot back a ${REQUIRES_PROTOCOL} claim`);
      }
    } else if (stamp.exploratory) {
      problems.push(`${result.id}: ${rel} was produced by an --exploratory run and cannot back a ${REQUIRES_PROTOCOL} claim. Register a protocol and re-run.`);
    } else if (stamp.protocol && stamp.protocol !== result.id) {
      problems.push(`${result.id}: ${rel} was produced under ${stamp.protocol}, not ${result.id}`);
    }
  }
  return problems;
}

function grandfathered() {
  if (!fs.existsSync(GRANDFATHER)) return new Set();
  const text = fs.readFileSync(GRANDFATHER, 'utf8');
  return new Set([...text.matchAll(/^- (RESULT-\d+)\b/gm)].map((m) => m[1]));
}

// The commit that FIRST added a path (oldest), so delete-and-re-add cannot
// reset the clock. Null when the path is not committed yet.
function addedIn(relPath, cwd = ROOT) {
  try {
    const out = execFileSync('git', ['log', '--diff-filter=A', '--format=%H', '--', relPath], {
      cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim().split('\n').filter(Boolean);
    return out.length ? out[out.length - 1] : null;
  } catch { return null; }
}

function isStrictAncestor(a, b) {
  if (!a || !b || a === b) return false;
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', a, b], { cwd: ROOT, stdio: 'ignore' });
    return true;
  } catch { return false; }
}

function sha16(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 16);
}

// Duplicated from solver/target-aware-evaluation.js rather than imported:
// solver/experiment-guard.js requires THIS file, so requiring solver code from
// here would close a cycle that runs on every worker thread of every run.
function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function resolveInside(root, rel) {
  if (typeof rel !== 'string' || path.isAbsolute(rel)) return null;
  const resolved = path.resolve(root, rel);
  return resolved === root || resolved.startsWith(`${root}${path.sep}`) ? resolved : null;
}

// Reachable from HEAD, not merely present in the object store: an amended-away
// commit still resolves locally and would not exist in a fresh clone.
function reachableFromHead(sha) {
  if (!/^[0-9a-f]{40}$/.test(sha)) return false;
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', sha, 'HEAD'], { cwd: ROOT, stdio: 'ignore' });
    return true;
  } catch { return false; }
}

function gitObjectPath(relPath) {
  return String(relPath).replaceAll('\\', '/');
}

function pathExistsAtCommit(sha, relPath) {
  try {
    execFileSync('git', ['cat-file', '-e', `${sha}:${gitObjectPath(relPath)}`], { cwd: ROOT, stdio: 'ignore' });
    return true;
  } catch { return false; }
}

// The file as it was at a commit, or null. The registration commit is the only
// copy of a protocol that carries a point in time, so it is the only copy whose
// freeze means anything; the working tree is whatever the experimenter last
// wrote.
function showAtCommit(sha, relPath, cwd = ROOT, { raw = false } = {}) {
  try {
    const out = execFileSync('git', ['show', `${sha}:${gitObjectPath(relPath)}`], {
      cwd, stdio: ['ignore', 'pipe', 'ignore'], ...(raw ? {} : { encoding: 'utf8' }),
    });
    return out;
  } catch { return null; }
}

// The protocol as a whole, not just its freeze, is what was pre-registered.
// Exactly one line may legitimately change after registration: the lifecycle
// marker `status:` in the frontmatter (registered -> complete). Every other
// byte -- question, checks, thresholds, stopping rules, seeds, prose -- must
// equal the registration commit, or the record is a reconstruction. Returns
// null when they agree, else a one-line description of the first divergence.
// Accepts a Buffer (preferred: exact bytes) or a string. Invalid UTF-8 decodes
// to U+FFFD, so two different byte strings could compare equal after
// decoding (Codex review on PR #7, seventh round); a copy that does not
// round-trip through UTF-8 is drift, not text.
function utf8Text(input, label) {
  if (typeof input === 'string') return { text: input };
  if (!Buffer.isBuffer(input)) return { problem: `${label} unavailable` };
  const text = input.toString('utf8');
  if (!Buffer.from(text, 'utf8').equals(input)) return { problem: `${label} is not valid UTF-8; protocols are UTF-8 text` };
  return { text };
}

function protocolDrift(diskInput, registeredInput) {
  const reg = utf8Text(registeredInput, 'registration commit');
  if (reg.problem) return reg.problem;
  const disk = utf8Text(diskInput, 'on-disk copy');
  if (disk.problem) return disk.problem;
  const diskText = disk.text;
  const registeredText = reg.text;
  // Protocols are LF text. A bare CR, or a Unicode line separator, is a line
  // end to `$` in multiline mode but not to `[^\n]`, so one could hide a
  // rewritten key behind the status line (Codex review on PR #7, third
  // round). Any such terminator is drift, whichever copy carries it.
  const oddTerminator = /[\r\u2028\u2029]/;
  if (oddTerminator.test(registeredText)) return 'registration commit contains a CR or Unicode line terminator; protocols are LF text';
  if (oddTerminator.test(diskText)) return 'on-disk copy contains a CR or Unicode line terminator; protocols are LF text';
  // Work on the frontmatter block alone (same delimiter rule as
  // parseFrontmatter), so a status line relocated into the body, or a
  // horizontal rule later in the body, cannot be mistaken for it (Codex
  // reviews on PR #7, 2026-09-03).
  const block = (text) => {
    const m = /^---\n([\s\S]*?)\n---/.exec(text);
    return m ? { inner: m[1], start: m.index, end: m.index + m[0].length } : null;
  };
  // Exactly one status line, and it must be the plain lifecycle value; the
  // line removed is that validated line and no other (Codex review on PR #7,
  // fourth round: a second, annotated status line could carry an edit).
  const lifecycle = /^status:[ \t]*(registered|complete)[ \t]*$/;
  const statusLines = (fm) => fm.inner.split('\n').filter((line) => /^status:/.test(line));
  const problem = (label, fm) => {
    if (!fm) return `${label} has no frontmatter`;
    const lines = statusLines(fm);
    if (lines.length !== 1) return `${label} has ${lines.length} status: lines in its frontmatter; exactly one is required`;
    if (!lifecycle.test(lines[0])) return `${label} has no status: registered|complete line in its frontmatter`;
    return null;
  };
  const r = block(registeredText);
  const d = block(diskText);
  const rp = problem('registration commit', r);
  if (rp) return rp;
  const dp = problem('on-disk copy', d);
  if (dp) return dp;
  const normalise = (text, fm) => `${text.slice(0, fm.start)}---\n${fm.inner.split('\n').filter((line) => !/^status:/.test(line)).join('\n')}\n---${text.slice(fm.end)}`;
  const a = normalise(diskText, d);
  const b = normalise(registeredText, r);
  if (a === b) return null;
  const al = a.split('\n');
  const bl = b.split('\n');
  for (let i = 0; i < Math.max(al.length, bl.length); i++) {
    if (al[i] !== bl[i]) {
      return `first divergence at line ${i + 1}: registered ${JSON.stringify(bl[i] ?? '<end>')}, on disk ${JSON.stringify(al[i] ?? '<end>')}`;
    }
  }
  return 'texts differ only in length';
}

// Every committed version of a path, newest first, as { sha, text }. Used to
// ask whether a protocol was EVER committed in a non-registered state, which
// a later commit cannot undo (Codex review on PR #7, ninth round: delete the
// report, commit the protocol back to registered, run again).
function committedVersions(relPath, cwd = ROOT) {
  let shas = [];
  try {
    shas = execFileSync('git', ['log', '--format=%H', '--', relPath], {
      cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim().split('\n').filter(Boolean);
  } catch { return []; }
  return shas.map((sha) => ({ sha, text: showAtCommit(sha, relPath, cwd) })).filter((v) => v.text !== null);
}

// A freeze that is missing, empty, or still holds TEMPLATE.md placeholders
// enforces nothing: every hash comparison is skipped and the protocol passes
// as if it had frozen the code. Only tools/new-experiment.js writes real
// hashes; a hand-copied template is the way a protocol ends up like this.
function freezeProblem(freeze) {
  if (!freeze || typeof freeze !== 'object' || Object.keys(freeze).length === 0) {
    return 'freezes nothing: version_freeze is missing or empty';
  }
  const placeholders = Object.entries(freeze).filter(([, value]) => String(value).startsWith('<'));
  if (placeholders.length) {
    return `still holds template placeholders in version_freeze (${placeholders.map(([file]) => file).join(', ')})`;
  }
  return null;
}

// One read per cited artifact, shared by every artifact-level assertion below,
// because the holdouts are 6.5 MB each.
function openCitedArtifacts(result) {
  return artifactCitations(result.body).map(({ rel, requiresRegistration }) => {
    const abs = path.join(ROOT, rel);
    const exists = fs.existsSync(abs);
    let artifact = null;
    let parseError = null;
    if (exists) {
      try { artifact = JSON.parse(fs.readFileSync(abs, 'utf8')); } catch (error) { parseError = error.message; }
    }
    // A citation with no slash is a filename named in prose, not a path into
    // the repo. Four such exist in the ledger today ("-52.receipt.json"), and
    // reading them as paths would make this gate red on English.
    return { rel, abs, looksLikePath: rel.includes('/'), exists, artifact, parseError, requiresRegistration };
  });
}

// A path-shaped citation that does not resolve is a dead receipt. This is the
// exact failure experiments/README.md cites as motivating the gate — "two
// ledger citations rotted to paths that never resolved" — and that nothing
// checked. Grandfathering waives the protocol requirement, never the
// requirement that a receipt be a real file.
function assessCitationsResolve(result, opened) {
  const problems = [];
  for (const { rel, looksLikePath, exists, parseError } of opened) {
    if (looksLikePath && !exists) {
      problems.push(`${result.id}: cited artifact ${rel} does not exist; a citation that resolves to nothing is not evidence`);
    }
    if (exists && parseError) {
      problems.push(`${result.id}: cited artifact ${rel} is not parseable JSON (${parseError})`);
    }
  }
  return problems;
}

// An artifact that publishes its own identity must still hash to it. The ledger
// cites these identities as direct_source facts; until now nothing recomputed
// one, so any cell could be edited and every gate stayed green.
function assessArtifactIdentity(result, opened) {
  const problems = [];
  for (const { rel, artifact, requiresRegistration } of opened) {
    if (!artifact || typeof artifact.artifactIdentity !== 'string') continue;
    // A Markdown-linked recomputation receipt may repeat the source corpus's
    // identity without claiming that the receipt hashes to that value. A
    // registered artifact, or one explicitly cited as a run artifact with a
    // code-span path, does make the gate's historical self-identity claim.
    if (!requiresRegistration && !artifact.registration) continue;
    const { artifactIdentity, registration, ...body } = artifact;
    const actual = crypto.createHash('sha256').update(canonicalJson(body)).digest('hex');
    if (actual !== artifactIdentity) {
      problems.push(
        `${result.id}: ${rel} does not hash to its own artifactIdentity `
        + `(recomputed ${actual.slice(0, 16)}…, recorded ${artifactIdentity.slice(0, 16)}…)`,
      );
    }
  }
  return problems;
}

function primaryOutcome(recomputation) {
  if (!recomputation || typeof recomputation !== 'object') return null;
  for (const key of ['primaryOutcome', 'primary_outcome', 'disposition', 'outcome', 'verdict']) {
    if (typeof recomputation[key] === 'string') return recomputation[key];
  }
  return null;
}

// A closure receipt is not self-authenticating: changing its verdict and then
// saving the file again must not leave a green gate. Bind it back to the
// closeout contract (including its protocol pin when one was registered),
// the artifact bytes it names, and a fresh execution of its recomputation.
function assessClosureReceipt(result, protocol, opened) {
  const problems = [];
  const resultDir = path.join(EXPERIMENTS, result.id);
  const closureEntries = opened.filter(({ rel }) => path.basename(rel) === 'closure.json');

  for (const entry of closureEntries) {
    const closure = entry.artifact;
    if (!closure) continue;
    const label = `${result.id}: ${entry.rel}`;
    const declaredClosed = result.body.includes('`CLOSED`');
    if (declaredClosed && closure.closure_status !== 'CLOSED') {
      problems.push(`${label} is ${JSON.stringify(closure.closure_status)}, but the ledger cites it as CLOSED`);
    }

    const contractRel = closure.contract && closure.contract.path;
    const contractPath = resolveInside(resultDir, contractRel);
    if (!contractPath || !fs.existsSync(contractPath)) {
      problems.push(`${label} names a missing or escaping closeout contract (${JSON.stringify(contractRel)})`);
      continue;
    }
    let contract;
    try { contract = JSON.parse(fs.readFileSync(contractPath, 'utf8')); } catch (error) {
      problems.push(`${label} closeout contract is not parseable JSON (${error.message})`);
      continue;
    }
    const contractHash = sha256(contractPath);
    if (!closure.contract || closure.contract.sha256 !== contractHash) {
      problems.push(`${label} closeout contract hash does not match ${contractRel}`);
    }
    const protocolNamesContract = protocol.includes(contractRel);
    if (protocolNamesContract && !protocol.includes(contractHash) && !protocol.includes(contractHash.slice(0, 16))) {
      problems.push(`${label} closeout contract hash is not pinned in protocol.md`);
    }

    const contractProtocolRel = contract.protocol && contract.protocol.path;
    const contractProtocolPath = resolveInside(resultDir, contractProtocolRel);
    if (!contractProtocolPath || !fs.existsSync(contractProtocolPath)) {
      problems.push(`${label} contract names a missing or escaping registered protocol (${JSON.stringify(contractProtocolRel)})`);
    } else if (contract.protocol.sha256 !== sha256(contractProtocolPath)) {
      problems.push(`${label} registered protocol hash does not match ${contractProtocolRel}`);
    }

    const artifacts = Array.isArray(closure.artifacts) ? closure.artifacts : [];
    const artifactsById = new Map(artifacts.map((artifact) => [artifact.id, artifact]));
    for (const id of contract.required_artifacts || []) {
      if (!artifactsById.has(id)) problems.push(`${label} is missing required artifact ${id}`);
    }
    for (const artifact of artifacts) {
      const artifactPath = resolveInside(resultDir, artifact.path);
      if (!artifactPath || !fs.existsSync(artifactPath)) {
        problems.push(`${label} artifact ${artifact.id} is missing or escapes the result directory`);
      } else if (artifact.sha256 !== sha256(artifactPath)) {
        problems.push(`${label} artifact ${artifact.id} hash does not match ${artifact.path}`);
      }
    }

    if (closure.closure_status !== 'CLOSED') continue;
    if (closure.final_subject_identity !== contract.final_subject_identity) {
      problems.push(`${label} final subject identity does not match the closeout contract`);
    }
    const claims = Array.isArray(closure.claims) ? closure.claims : [];
    const claimsById = new Map(claims.map((claim) => [claim.id, claim]));
    for (const id of contract.required_claims || []) {
      const claim = claimsById.get(id);
      if (!claim) problems.push(`${label} is missing required claim ${id}`);
      else if (claim.status !== 'PASS') problems.push(`${label} required claim ${id} is ${JSON.stringify(claim.status)}, not PASS`);
      else if (claim.evidence_subject_identity !== contract.final_subject_identity) {
        problems.push(`${label} required claim ${id} is bound to the wrong subject identity`);
      }
    }

    const recomputation = contract.recomputation;
    const argv = recomputation && recomputation.argv;
    const recomputationCwdCandidate = path.resolve(resultDir, (recomputation && recomputation.cwd) || '.');
    const recomputationCwd = (
      recomputationCwdCandidate === ROOT || recomputationCwdCandidate.startsWith(`${ROOT}${path.sep}`)
    ) ? recomputationCwdCandidate : null;
    if (!Array.isArray(argv) || argv.length < 2 || argv[0] !== 'node' || !recomputationCwd) {
      problems.push(`${label} has no safe executable Node recomputation command`);
      continue;
    }
    let fresh;
    try {
      fresh = JSON.parse(execFileSync(argv[0], argv.slice(1), {
        cwd: recomputationCwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        maxBuffer: 64 * 1024 * 1024,
      }));
    } catch (error) {
      problems.push(`${label} recomputation command failed (${error.message})`);
      continue;
    }
    const outputArtifact = artifactsById.get(recomputation.output_artifact_id);
    const outputPath = outputArtifact && resolveInside(resultDir, outputArtifact.path);
    let retained = null;
    if (outputPath && fs.existsSync(outputPath)) {
      try { retained = JSON.parse(fs.readFileSync(outputPath, 'utf8')); } catch { retained = null; }
    }
    if (!retained || canonicalJson(fresh) !== canonicalJson(retained)) {
      problems.push(`${label} fresh recomputation does not match ${outputArtifact ? outputArtifact.path : 'the required output artifact'}`);
      continue;
    }
    const outcome = primaryOutcome(fresh);
    if (contract.requires_primary_outcome && !outcome) {
      problems.push(`${label} recomputation produced no primary outcome`);
    } else if (outcome && closure.primary_outcome !== outcome) {
      problems.push(`${label} primary outcome ${JSON.stringify(closure.primary_outcome)} contradicts recomputation ${JSON.stringify(outcome)}`);
    }
  }
  return problems;
}

// The stamp is the entire provenance argument: a commit sha that did not exist
// when the run started cannot be inside the artifact. Nothing checked that the
// sha is a real commit, that it carries this protocol, or that it precedes the
// report — so all three could be false and the gate passed.
function assessStampProvenance(result, opened, reportCommit) {
  const problems = [];
  const protocolRel = `experiments/${result.id}/protocol.md`;
  for (const { rel, artifact } of opened) {
    const stamp = artifact && artifact.registration;
    if (!stamp || stamp.exploratory) continue;
    const sha = stamp.protocolCommit;
    if (typeof sha !== 'string' || !/^[0-9a-f]{40}$/.test(sha)) {
      problems.push(`${result.id}: ${rel} registration.protocolCommit is not a full commit sha (${sha === undefined ? 'absent' : JSON.stringify(sha)})`);
      continue;
    }
    if (!reachableFromHead(sha)) {
      problems.push(`${result.id}: ${rel} registration.protocolCommit ${sha.slice(0, 8)} is not a commit reachable from HEAD`);
      continue;
    }
    if (!pathExistsAtCommit(sha, protocolRel)) {
      problems.push(`${result.id}: ${rel} registration.protocolCommit ${sha.slice(0, 8)} does not contain ${protocolRel}`);
    }
    if (reportCommit && !isStrictAncestor(sha, reportCommit)) {
      problems.push(
        `${result.id}: ${rel} registration.protocolCommit ${sha.slice(0, 8)} does not strictly precede `
        + `the commit adding report.md (${reportCommit.slice(0, 8)}). The artifact was not produced under this registration.`,
      );
    }
  }
  return problems;
}

// (a) While `status: registered`, the frozen files must still match the tree.
//     experiments/README.md item 4 has always said the gate enforces this; it
//     did not.
// (b) Once complete, every source hash the ARTIFACT recorded must be one the
//     protocol froze. That is the durable half: it stays checkable after a
//     frozen file legitimately moves on, and it goes red if the freeze list
//     never covered the files that carried the measurement.
// `registeredFront` is the frontmatter at the protocol's registration commit.
// When given, the freeze is read from there, not from `front` (the working
// tree): a freeze rewritten after registration is a reconstruction, and the
// registration commit is the only copy that cannot have been written after
// the data. Callers without git access pass nothing and get the old behaviour.
function assessVersionFreeze(result, front, opened, registeredFront = null) {
  const problems = [];
  const registered = registeredFront || front;
  const freeze = registered.version_freeze;
  if (!freeze || typeof freeze !== 'object') {
    // Without a registration commit to read, a missing freeze is out of this
    // check's reach (callers without git get the old behaviour). With one, a
    // protocol that froze nothing is a defect, not an exemption: until
    // 2026-09-03 this returned no problems and the ledger gate passed it.
    if (!registeredFront) return problems;
    problems.push(`${result.id}: protocol at its registration commit freezes nothing: version_freeze is missing. Register with tools/new-experiment.js, which records real hashes.`);
    return problems;
  }
  const emptiness = freezeProblem(freeze);
  if (emptiness) {
    problems.push(`${result.id}: protocol ${emptiness}. Register with tools/new-experiment.js, which records real hashes.`);
    return problems;
  }
  if (registeredFront && canonicalJson(front.version_freeze || null) !== canonicalJson(freeze)) {
    problems.push(
      `${result.id}: protocol.md version_freeze on disk differs from the copy at its registration commit. `
      + 'A freeze rewritten after registration is a reconstruction; supersede the record instead of editing it.',
    );
  }
  const frozenValues = new Set(Object.values(freeze).map((value) => String(value)));

  if (front.status === 'registered') {
    for (const [file, expected] of Object.entries(freeze)) {
      const target = path.join(ROOT, file);
      if (!fs.existsSync(target)) {
        problems.push(`${result.id}: version_freeze names ${file}, which is missing`);
        continue;
      }
      const actual = sha16(target);
      if (actual !== expected) {
        problems.push(
          `${result.id}: version_freeze broken while status: registered — ${file} is ${actual}, registered as ${expected}. `
          + 'Supersede this record with a new protocol; do not edit it.',
        );
      }
    }
  }

  for (const { rel, artifact } of opened) {
    const sources = artifact && artifact.sources;
    if (!sources || typeof sources !== 'object') continue;
    for (const [role, hash] of Object.entries(sources)) {
      if (typeof hash !== 'string') continue;
      if (!frozenValues.has(hash.slice(0, 16))) {
        problems.push(
          `${result.id}: ${rel} was produced against ${role} ${hash.slice(0, 16)}…, which no version_freeze entry covers. `
          + 'Either the run used an unfrozen file or the freeze list misses a file that carries the measurement.',
        );
      }
    }
  }
  return problems;
}

// The whole protocol, not only its freeze, must match the registration commit
// apart from the `status:` line. Closes BL-0007 item 1.
function assessProtocolDrift(result, diskText, registeredText) {
  const drift = protocolDrift(diskText, registeredText);
  if (!drift) return [];
  return [
    `${result.id}: protocol.md differs from its registration commit beyond the status line (${drift}). `
    + 'A protocol edited after registration is a reconstruction; supersede the record instead of editing it.',
  ];
}

function assessProtocolLifecycle(result, front, hasReport) {
  if (hasReport && front.status === 'registered') {
    return [
      `${result.id}: protocol has report.md but status is still registered; completed evidence must use status: complete`,
    ];
  }
  return [];
}

// A check is answered when it has a section of its own that states an outcome.
// The previous test was `\bC1\b` anywhere in the report, which a report could
// satisfy by naming the check and answering nothing — and which the real
// RESULT-0020 report satisfied for P1, P2 and P4 from incidental sentences in
// a different section, so those three could have been deleted wholesale.
const VERDICT = /\b(PASS|FAIL|SUPPORTED|FALSIFIED|INCONCLUSIVE|BREACH)\b/i;

function reportSection(report, check) {
  const heading = new RegExp(`^#{2,6}[ \\t]*${check}\\b`, 'm');
  const match = heading.exec(report);
  if (!match) return null;
  const rest = report.slice(match.index);
  const nextHeading = /\n#{1,6}[ \t]/.exec(rest);
  return nextHeading ? rest.slice(0, nextHeading.index) : rest;
}

function assessReportAnswers(result, protocol, report) {
  const problems = [];
  for (const check of declaredChecks(protocol)) {
    const section = reportSection(report, check);
    if (section === null) {
      problems.push(
        `${result.id}: declared check ${check} has no section of its own in report.md. `
        + 'Naming a check in passing is not answering it.',
      );
    } else if (!VERDICT.test(section)) {
      problems.push(
        `${result.id}: declared check ${check} has a section but states no outcome. `
        + 'Expected one of PASS / FAIL / SUPPORTED / FALSIFIED / INCONCLUSIVE / BREACH.',
      );
    }
  }
  return problems;
}

function assessExperiments() {
  const problems = [];
  if (!fs.existsSync(LEDGER)) return ['EVIDENCE_LEDGER.md is missing'];
  problems.push(...assessFailedRunLedger(ROOT));
  const results = readLedgerResults(fs.readFileSync(LEDGER, 'utf8'));
  const exempt = grandfathered();

  for (const result of results) {
    const needs = result.proofClass.includes(REQUIRES_PROTOCOL);
    const dir = path.join(EXPERIMENTS, result.id);
    const protocolPath = path.join(dir, 'protocol.md');
    const hasProtocol = fs.existsSync(protocolPath);
    const opened = openCitedArtifacts(result);

    // Universal, including grandfathered records: being exempt from the
    // protocol requirement never exempts a citation from resolving or an
    // artifact from hashing to the identity it publishes.
    problems.push(...assessCitationsResolve(result, opened));
    problems.push(...assessArtifactIdentity(result, opened));

    if (needs) problems.push(...assessArtifactStamps(result, exempt));

    if (needs && !hasProtocol && !exempt.has(result.id)) {
      problems.push(`${result.id} claims ${REQUIRES_PROTOCOL} with no experiments/${result.id}/protocol.md and no grandfather entry`);
      continue;
    }
    if (!hasProtocol) continue;

    const protocol = fs.readFileSync(protocolPath, 'utf8');
    const front = parseFrontmatter(protocol);
    if (!front) { problems.push(`${result.id}: protocol.md has no frontmatter`); continue; }
    problems.push(...assessClosureReceipt(result, protocol, opened));
    if (front.result !== result.id) {
      problems.push(`${result.id}: protocol declares result ${front.result}`);
    }

    const reportPath = path.join(dir, 'report.md');
    const hasReport = fs.existsSync(reportPath);
    problems.push(...assessProtocolLifecycle(result, front, hasReport));
    const protoRel = path.join('experiments', result.id, 'protocol.md');
    const protoCommit = addedIn(protoRel);
    // A registration commit that holds an empty or unreadable protocol is a
    // defect, not a reason to skip: an empty placeholder committed first and
    // filled in after the data would otherwise fall back to the on-disk copy
    // (Codex review on PR #7, sixth round).
    const registeredBytes = protoCommit ? showAtCommit(protoCommit, protoRel, ROOT, { raw: true }) : null;
    const registeredText = registeredBytes && registeredBytes.length ? registeredBytes.toString('utf8') : null;
    if (protoCommit && !registeredText) {
      problems.push(`${result.id}: protocol.md at its registration commit ${protoCommit.slice(0, 8)} is empty or unreadable; a placeholder registered first and filled in later is not a pre-registration.`);
    }
    const registeredFront = registeredText ? parseFrontmatter(registeredText) : null;
    if (protoCommit && registeredText && !registeredFront) {
      problems.push(`${result.id}: protocol.md at its registration commit ${protoCommit.slice(0, 8)} has no frontmatter.`);
    }
    if (registeredText) problems.push(...assessProtocolDrift(result, fs.readFileSync(path.join(dir, 'protocol.md')), registeredBytes));
    problems.push(...assessVersionFreeze(result, front, opened, registeredFront));

    if (hasReport) {
      const report = fs.readFileSync(reportPath, 'utf8');
      // Every check declared before the outcome must be answered, not just named.
      problems.push(...assessReportAnswers(result, protocol, report));
      // A protocol is a PRE-registration only if it was committed before the
      // report it justifies. Same commit means no ordering was ever recorded.
      const reportCommit = addedIn(path.join('experiments', result.id, 'report.md'));
      if (needs && !exempt.has(result.id)) {
        problems.push(...assessStampProvenance(result, opened, reportCommit));
      }
      if (protoCommit && reportCommit && !isStrictAncestor(protoCommit, reportCommit)) {
        problems.push(
          `${result.id}: protocol.md was not committed before report.md `
          + `(protocol ${protoCommit.slice(0, 8)}, report ${reportCommit.slice(0, 8)}). `
          + 'A protocol committed with or after its results is a reconstruction.',
        );
      }
    } else if (front.status === 'complete') {
      problems.push(`${result.id}: protocol is complete but has no report.md`);
    }
  }
  return problems;
}

function main() {
  const problems = assessExperiments();
  if (problems.length) {
    console.error('EXPERIMENT GATE FAILED');
    for (const p of problems) console.error(`- ${p}`);
    process.exitCode = 1;
    return;
  }
  console.log('EXPERIMENT GATE PASS');
}

if (require.main === module) main();

module.exports = {
  REQUIRES_PROTOCOL, addedIn, assessArtifactStamps, assessExperiments, citedArtifacts,
  declaredChecks, isStrictAncestor,
  parseFrontmatter, readLedgerResults, sha16,
  assessArtifactIdentity, assessCitationsResolve, assessClosureReceipt, assessReportAnswers, assessStampProvenance,
  assessProtocolDrift, assessProtocolLifecycle, assessVersionFreeze, canonicalJson, freezeProblem,
  committedVersions, openCitedArtifacts, protocolDrift, reachableFromHead, reportSection, showAtCommit, utf8Text,
};
