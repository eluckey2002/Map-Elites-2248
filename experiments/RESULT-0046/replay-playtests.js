#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const { playBot } = require('../../solver/human-benchmark');
const { replay } = require('../../solver/recording-replay');

const ROOT = path.join(__dirname, '..', '..');
const ARCHIVE = path.join(__dirname, 'output', 'archive.json');
const RECORDINGS = [
  ['gen-0006', 'efc156d36033580dacfc95e003b038f3285121c497f875d4e3a88ee85ff05a6f.json'],
  ['gen-0003', 'e3f484119b650659e2a1a546a26a94af3f3e75a375cf61e645b23a444867c703.json'],
  ['gen-0002', '86e778a28499b151f237fd25eb4924a018f94065410f4437028d3619b09acb93.json'],
  ['gen-0010', 'ef9f371939c637162d49b2e551ffa18a5e783934fb78e6034b925c69465ae497.json'],
  ['gen-0004', '0e612993635c924ec12aaa6b331b0419c850e08495a8eecdcc49a0054405c56c.json'],
];

function policyMoves(evaluation, seed, policy) {
  const row = evaluation.descriptors.harvest.rows.find(
    (candidate) => candidate.seed === seed && candidate.policy === policy,
  );
  if (!row || row.standing !== 'replayed_win') {
    throw new Error(`${evaluation.candidate.name} lacks a replayed ${policy} win for seed ${seed}`);
  }
  return row.moves;
}

function main() {
  const archive = JSON.parse(fs.readFileSync(ARCHIVE, 'utf8'));
  const rows = [];

  for (const [expectedName, filename] of RECORDINGS) {
    const recordingPath = path.join(ROOT, 'recordings', filename);
    const recording = JSON.parse(fs.readFileSync(recordingPath, 'utf8'));
    const evaluation = archive.evaluations.find(
      (candidate) => candidate.receipt.candidateIdentity === recording.candidateIdentity,
    );
    if (!evaluation) throw new Error(`${filename} does not resolve in the RESULT-0046 archive`);
    if (evaluation.candidate.name !== expectedName) {
      throw new Error(`${filename} resolved to ${evaluation.candidate.name}, expected ${expectedName}`);
    }

    const replayed = replay(evaluation.candidate, recording);
    if (replayed.problems.length) {
      throw new Error(`${filename} failed replay: ${replayed.problems.join('; ')}`);
    }

    const referenceBot = playBot(evaluation.candidate, recording.seed);
    const maximumChain = recording.chains.reduce(
      (best, chain, index) => (chain.points > best.points ? { move: index + 1, points: chain.points } : best),
      { move: 0, points: -Infinity },
    );

    rows.push({
      board: expectedName,
      cell: `${evaluation.descriptors.breadth.bin.index},${evaluation.descriptors.harvest.bin.index}`,
      seed: recording.seed,
      recording: filename.slice(0, 8),
      target: evaluation.candidate.target,
      human: { outcome: recording.outcome, moves: recording.movesUsed, score: recording.score },
      referenceBot,
      mappedPolicies: {
        immediateMoves: policyMoves(evaluation, recording.seed, 'immediate'),
        harvestMoves: policyMoves(evaluation, recording.seed, 'harvest'),
      },
      maximumChain,
    });
  }

  process.stdout.write(`${JSON.stringify({ rows }, null, 2)}\n`);
}

main();
