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

// Paths a ledger record cites as evidence. Only artifacts we can open are
// checked; prose citations are the ordering check's job, not this one.
function citedArtifacts(body) {
  return [...body.matchAll(/`([A-Za-z0-9._/\-]+\.json)`/g)].map((m) => m[1]);
}

// An --exploratory run is allowed to exist; it is not allowed to be the
// evidence under a claim that generalizes. Without this the --exploratory
// hatch has no teeth, and the guard's own error message promises it does.
function assessArtifactStamps(result, exempt) {
  const problems = [];
  if (exempt.has(result.id)) return problems;
  for (const rel of citedArtifacts(result.body)) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) continue;
    let artifact;
    try { artifact = JSON.parse(fs.readFileSync(abs, 'utf8')); } catch { continue; }
    const stamp = artifact.registration;
    if (!stamp) {
      problems.push(`${result.id}: ${rel} carries no registration stamp; it cannot back a ${REQUIRES_PROTOCOL} claim`);
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

// Reachable from HEAD, not merely present in the object store: an amended-away
// commit still resolves locally and would not exist in a fresh clone.
function reachableFromHead(sha) {
  if (!/^[0-9a-f]{40}$/.test(sha)) return false;
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', sha, 'HEAD'], { cwd: ROOT, stdio: 'ignore' });
    return true;
  } catch { return false; }
}

function pathExistsAtCommit(sha, relPath) {
  try {
    execFileSync('git', ['cat-file', '-e', `${sha}:${relPath}`], { cwd: ROOT, stdio: 'ignore' });
    return true;
  } catch { return false; }
}

// The file as it was at a commit, or null. The registration commit is the only
// copy of a protocol that carries a point in time, so it is the only copy whose
// freeze means anything; the working tree is whatever the experimenter last
// wrote.
function showAtCommit(sha, relPath, cwd = ROOT, { raw = false } = {}) {
  try {
    const out = execFileSync('git', ['show', `${sha}:${relPath}`], {
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
  return citedArtifacts(result.body).map((rel) => {
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
    return { rel, abs, looksLikePath: rel.includes('/'), exists, artifact, parseError };
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
  for (const { rel, artifact } of opened) {
    if (!artifact || typeof artifact.artifactIdentity !== 'string') continue;
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

// Vocabularies from the ledger's own Status and proof-class tables.
const STATUSES = new Set(['accepted', 'provisional', 'open', 'superseded', 'narrowed', 'stale', 'rejected']);
const PROOF_CLASSES = new Set([
  'direct_source', 'exact_result', 'replayed_lower_bound', 'replayed_upper_bound', 'proven_upper_bound',
  'heuristic_observation', 'UNKNOWN', 'unresolved', 'owner_decision', 'hypothesis',
]);
const TYPE_OF_PREFIX = {
  FACT: 'fact', RESULT: 'result', DECISION: 'decision', HYPOTHESIS: 'hypothesis', QUESTION: 'question', CORRECTION: 'correction',
};
const REQUIRED_FIELDS = ['type', 'status', 'scope', 'evidence', 'proof_class', 'as_of', 'reverify', 'updated', 'supersedes', 'superseded_by'];

// Every record, not just RESULTs: the rules in the ledger header that code can
// check. It does not judge whether a claim is true or its class is earned.
function assessLedgerStructure(text) {
  const problems = [];
  const records = [];
  let current = null;
  for (const line of text.split('\n')) {
    // A near-miss heading would silently drop the whole record from checking.
    if (/^#{1,6}\s*[A-Za-z]+-\d+/i.test(line) && !/^### [A-Z]+-\d{4}\b/.test(line)) {
      problems.push(`malformed record heading: ${line.trim()}`);
    }
    const heading = /^### ([A-Z]+)-(\d{4})\b/.exec(line);
    if (heading) {
      current = { id: `${heading[1]}-${heading[2]}`, prefix: heading[1], body: [] };
      records.push(current);
      continue;
    }
    if (/^#{2,3} /.test(line)) { current = null; continue; }
    if (current) current.body.push(line);
  }
  if (!records.length) return ['EVIDENCE_LEDGER.md contains no records'];

  const seen = new Set();
  for (const { id, prefix, body } of records) {
    if (seen.has(id)) problems.push(`${id}: duplicate record ID`);
    seen.add(id);
    const text = body.join('\n');
    const field = (name) => {
      const all = [...text.matchAll(new RegExp(`^- \\*\\*${name}:\\*\\*[ \\t]*(.*)$`, 'gm'))];
      if (all.length > 1) problems.push(`${id}: field ${name} appears ${all.length} times`);
      const value = all.length ? all[0][1].trim() : '';
      return value === '' ? null : value;
    };
    const expectedType = TYPE_OF_PREFIX[prefix];
    if (!expectedType) { problems.push(`${id}: unknown record type prefix ${prefix}`); continue; }
    for (const name of REQUIRED_FIELDS) {
      if (field(name) === null) problems.push(`${id}: missing field ${name}`);
    }
    if (field('statement') === null && field('question') === null) problems.push(`${id}: missing field statement`);
    const type = field('type');
    if (type !== null && type !== expectedType) problems.push(`${id}: type ${type} does not match its ID prefix (${expectedType})`);
    const status = field('status');
    if (status !== null && !STATUSES.has(status)) problems.push(`${id}: status ${status} is not in the status vocabulary`);
    const asOf = field('as_of');
    if (asOf !== null && !/^`?(\d{4}-\d{2}-\d{2}|not_time_sensitive)\b/.test(asOf)) problems.push(`${id}: as_of ${asOf} is not a date or not_time_sensitive`);
    const supersededBy = field('superseded_by');
    if ((status === 'superseded' || status === 'narrowed') && (supersededBy === null || /^`?\[\s*\]`?$/.test(supersededBy))) {
      problems.push(`${id}: status ${status} but superseded_by is empty`);
    }
    const proofClass = field('proof_class');
    if (proofClass !== null) {
      const tokens = [...proofClass.matchAll(/`([^`]+)`/g)].map((m) => m[1])
        .filter((t) => !/^[A-Z]+-\d+$/.test(t));
      const bad = tokens.filter((t) => !PROOF_CLASSES.has(t));
      if (bad.length) problems.push(`${id}: proof_class ${bad.join(', ')} is not in the proof-class vocabulary`);
      if (!tokens.some((t) => PROOF_CLASSES.has(t))) problems.push(`${id}: proof_class names no class`);
    }
  }
  return problems;
}

// Every repository path and labelled commit a record's evidence or reverify
// field cites must exist. Paths are path-shaped tokens inside backtick spans
// (so paths inside commands count); a bare filename or `RESULT-NNNN/...`
// shorthand may also resolve under the record's or the named experiments/ dir.
// A commit counts when labelled (`commit abc1234`, `Commit = abc1234`) and must
// be reachable from HEAD or an origin/evidence/* branch, not merely present locally. Absolute paths are
// machine-specific and rejected. Notes are skipped: they may cite a file
// precisely because it is absent.
// Does NOT check unbackticked paths, that a file says what the record claims,
// or content hashes.
// Citation gaps in append-only history, each excused only by the correction
// that records it (BL-0016 F12). The excuse fails if that correction is absent.
const KNOWN_CITATION_GAPS = new Map([
  ['RESULT-0001 solver/target-witness-search/verify.js', 'CORRECTION-0010'],
  ['RESULT-0004 solver/hinted-cp-sat/verify-result.js', 'CORRECTION-0010'],
  ['RESULT-0041 /Users/eluckey/.codex/skills/close-experiment/scripts/verify_closure.py', 'CORRECTION-0011'],
  ['DECISION-0004 6a07294571644d963a5a9b728f8e4aed3b29a835', 'CORRECTION-0012'],
  // These run from a snapshot of 8e1e232^, where the files still exist.
  ['CORRECTION-0010 solver/target-witness-search/verify.js', 'CORRECTION-0010'],
  ['CORRECTION-0010 solver/hinted-cp-sat/verify-result.js', 'CORRECTION-0010'],
]);

function assessLedgerCitations(text, {
  exists = (rel) => fs.existsSync(path.join(ROOT, rel)),
  isCommit = (sha) => {
    try {
      execFileSync('git', ['merge-base', '--is-ancestor', sha, 'HEAD'], { cwd: ROOT, stdio: 'ignore' });
      return true;
    } catch {
      // Evidence kept off main is preserved on an origin/evidence/* branch.
      try {
        return execFileSync('git', ['branch', '-r', '--contains', sha, '--list', 'origin/evidence/*'], {
          cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
        }).trim() !== '';
      } catch { return false; }
    }
  },
} = {}) {
  const problems = [];
  for (const [gap, correction] of KNOWN_CITATION_GAPS) {
    if (!new RegExp(`^### ${correction}\\b`, 'm').test(text)) problems.push(`${gap.split(' ')[0]}: known gap excused by missing ${correction}`);
  }
  for (const record of text.split(/^### (?=[A-Z]+-\d{4}\b)/m).slice(1)) {
    const id = /^[A-Z]+-\d{4}/.exec(record)[0];
    // A field runs until the next `- **field:**` line or heading, so list-form
    // continuation lines are included.
    const fields = [...record.matchAll(/^- \*\*(evidence|reverify):\*\*([\s\S]*?)(?=^- \*\*[a-z_]+:\*\*|^#|(?![\s\S]))/gm)]
      .map((m) => m[2]).join('\n');
    // A bare filename may be named relative to any directory the record cites.
    const dirs = [...new Set([...record.matchAll(/`((?:[\w.-]+\/)+)[\w.-]*`/g)].map((m) => m[1].replace(/\/$/, '')))];
    for (const span of fields.matchAll(/`([^`]+)`/g)) {
      for (const m of span[1].matchAll(/(?:^|[\s=(,'"])((?:\.{0,2}\/)?(?:[\w.-]+\/)*[\w-][\w.-]*\.[A-Za-z][A-Za-z0-9]*)(?=$|[\s:#),'"])/g)) {
        const rel = m[1];
        // Without a slash, only a known file extension marks a path (not `Game.loadLevel`).
        if (!rel.includes('/') && !/\.(js|mjs|json|jsonl|md|py|html|txt|tsv|csv|sh|png)$/.test(rel)) continue;
        if (/^\/(private\/)?tmp\//.test(rel)) continue; // scratch output of a command, not a citation
        if (rel.startsWith('/')) { if (!KNOWN_CITATION_GAPS.has(`${id} ${rel}`)) problems.push(`${id}: cited path ${rel} is absolute`); continue; }
        const clean = rel.replace(/^\.\//, '');
        const named = /^(RESULT-\d{4})\//.test(clean) ? [`experiments/${clean}`] : [];
        if (clean.startsWith('-')) continue; // suffix shorthand for the previous path
        const local = clean.includes('/') ? [] : [`experiments/${id}`, ...dirs].map((d) => `${d}/${clean}`);
        if (![clean, ...named, ...local].some(exists) && !KNOWN_CITATION_GAPS.has(`${id} ${rel}`)) {
          problems.push(`${id}: cited path ${rel} does not exist`);
        }
      }
    }
    for (const m of fields.matchAll(/\bcommits?\s*[:=]?\s*`?([0-9a-fA-F]{7,40})\b/gi)) {
      if (!isCommit(m[1].toLowerCase()) && !KNOWN_CITATION_GAPS.has(`${id} ${m[1]}`)) problems.push(`${id}: cited commit ${m[1]} is not in this branch's history`);
    }
  }
  return problems;
}

function ledgerRecords(text) {
  const records = new Map();
  for (const record of text.split(/^### (?=[A-Z]+-\d{4}\b)/m).slice(1)) {
    const id = /^[A-Z]+-\d{4}/.exec(record)[0];
    const fields = {};
    for (const m of record.matchAll(/^- \*\*([a-z_]+):\*\*[ \t]*(.*)$/gm)) fields[m[1]] ??= m[2].trim();
    records.set(id, fields);
  }
  return records;
}
const linkIds = (value) => [...(value || '').matchAll(/[A-Z]+-\d{4}/g)].map((m) => m[0]);

// supersedes and superseded_by must name each other, both ways.
function assessLedgerLinks(text) {
  const problems = [];
  const records = ledgerRecords(text);
  for (const [id, f] of records) {
    for (const [field, back] of [['supersedes', 'superseded_by'], ['superseded_by', 'supersedes']]) {
      for (const other of linkIds(f[field])) {
        if (!records.has(other)) problems.push(`${id}: ${field} names missing record ${other}`);
        else if (!linkIds(records.get(other)[back]).includes(id)) problems.push(`${id}: ${field} ${other}, but ${other}'s ${back} does not name ${id}`);
      }
    }
  }
  return problems;
}

// Append-only: compared with the base ledger, no record disappears, no claim
// field changes, links and notes only grow. Status may change; the structure
// and link checks require a matching correction when it does.
// Does NOT catch a wrong new record, or rewrites already on the base.
const FROZEN_FIELDS = ['type', 'scope', 'statement', 'question', 'evidence', 'proof_class', 'as_of', 'reverify'];
function assessLedgerHistory(text, baseText) {
  const problems = [];
  const now = ledgerRecords(text);
  for (const [id, before] of ledgerRecords(baseText)) {
    const after = now.get(id);
    if (!after) { problems.push(`${id}: record removed; append a correction instead`); continue; }
    for (const field of FROZEN_FIELDS) {
      if ((before[field] ?? null) !== (after[field] ?? null)) problems.push(`${id}: ${field} was rewritten; append a correction instead`);
    }
    for (const field of ['supersedes', 'superseded_by']) {
      const kept = new Set(linkIds(after[field]));
      for (const other of linkIds(before[field])) if (!kept.has(other)) problems.push(`${id}: ${field} dropped ${other}`);
    }
    if (before.notes && !(after.notes || '').includes(before.notes)) problems.push(`${id}: notes were rewritten; only additions are allowed`);
  }
  return problems;
}

// The ledger as of the branch point with origin/main, or HEAD when on it, so
// uncommitted and branch edits are both compared against shared history.
function baseLedgerText() {
  const git = (args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1e8 });
  try {
    let base = git(['merge-base', 'HEAD', 'origin/main']).trim();
    if (base === git(['rev-parse', 'HEAD']).trim()) base = 'HEAD';
    return git(['show', `${base}:EVIDENCE_LEDGER.md`]);
  } catch { return null; }
}

function assessExperiments() {
  const problems = [];
  if (!fs.existsSync(LEDGER)) return ['EVIDENCE_LEDGER.md is missing'];
  const ledgerText = fs.readFileSync(LEDGER, 'utf8');
  problems.push(...assessLedgerStructure(ledgerText));
  problems.push(...assessLedgerCitations(ledgerText));
  problems.push(...assessLedgerLinks(ledgerText));
  const baseText = baseLedgerText();
  if (baseText === null) problems.push('cannot read the base ledger from git; history check did not run');
  else problems.push(...assessLedgerHistory(ledgerText, baseText));
  const results = readLedgerResults(ledgerText);
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
  REQUIRES_PROTOCOL, addedIn, assessArtifactStamps, assessLedgerCitations, assessLedgerHistory, assessLedgerLinks, assessLedgerStructure, assessExperiments, citedArtifacts,
  declaredChecks, isStrictAncestor,
  parseFrontmatter, readLedgerResults, sha16,
  assessArtifactIdentity, assessCitationsResolve, assessReportAnswers, assessStampProvenance,
  assessProtocolDrift, assessProtocolLifecycle, assessVersionFreeze, canonicalJson, freezeProblem,
  committedVersions, openCitedArtifacts, protocolDrift, reachableFromHead, reportSection, showAtCommit, utf8Text,
};
