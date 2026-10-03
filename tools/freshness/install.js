#!/usr/bin/env node
'use strict';
/*
 * Installer for the machine-level freshness SessionStart hook (BL-0022 crit 1).
 *
 *   node tools/freshness/install.js [--target-dir DIR] [--settings FILE] [--dry-run]
 *
 * Copies check.js and session-freshness.js into the target dir (so the hook
 * never depends on a checkout) and adds ONE SessionStart entry to the Claude
 * Code settings file, only if that exact command is absent. Backs the settings
 * file up first. Refuses (writes nothing) if the settings file is missing or
 * not valid JSON. --dry-run writes nothing and prints a diff.
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const FILES = ['check.js', 'session-freshness.js'];

function parseArgs(argv) {
  const home = os.homedir();
  const o = { targetDir: path.join(home, '.claude', 'hooks'), settings: path.join(home, '.claude', 'settings.json'), dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--target-dir') o.targetDir = argv[++i];
    else if (argv[i] === '--settings') o.settings = argv[++i];
    else if (argv[i] === '--dry-run') o.dryRun = true;
    else throw new Error(`unknown argument: ${argv[i]}`);
  }
  if (!o.targetDir || !o.settings) throw new Error('missing value for an option');
  return o;
}

const fwd = (p) => path.resolve(p).replace(/\\/g, '/');

function detectIndent(text) {
  const m = text.match(/\n([ \t]+)"/);
  return m ? m[1] : 2;
}

function unifiedDiff(a, b, label) {
  const A = a.split('\n'), B = b.split('\n');
  let s = 0;
  while (s < A.length && s < B.length && A[s] === B[s]) s++;
  let ea = A.length, eb = B.length;
  while (ea > s && eb > s && A[ea - 1] === B[eb - 1]) { ea--; eb--; }
  const c = 3, from = Math.max(0, s - c);
  const tailA = Math.min(A.length, ea + c);
  const out = [`--- ${label}`, `+++ ${label} (with freshness hook)`, `@@ -${from + 1},${tailA - from} +${from + 1},${tailA - from + (eb - s) - (ea - s)} @@`];
  for (let i = from; i < s; i++) out.push(' ' + A[i]);
  for (let i = s; i < ea; i++) out.push('-' + A[i]);
  for (let i = s; i < eb; i++) out.push('+' + B[i]);
  for (let i = ea; i < tailA; i++) out.push(' ' + A[i]);
  return out.join('\n');
}

function install(opts, log) {
  if (!fs.existsSync(opts.settings)) return { code: 1, msg: `refusing: settings file not found: ${opts.settings}` };
  const original = fs.readFileSync(opts.settings, 'utf8');
  let json;
  try { json = JSON.parse(original); } catch (e) { return { code: 1, msg: `refusing: settings file is not valid JSON (${e.message}); nothing written` }; }
  if (json === null || typeof json !== 'object' || Array.isArray(json)) return { code: 1, msg: 'refusing: settings JSON is not an object; nothing written' };

  const command = `node "${fwd(opts.targetDir)}/session-freshness.js"`;
  const hooks = json.hooks && typeof json.hooks === 'object' ? json.hooks : null;
  if (json.hooks !== undefined && !hooks) return { code: 1, msg: 'refusing: "hooks" is not an object; nothing written' };
  if (hooks && hooks.SessionStart !== undefined && !Array.isArray(hooks.SessionStart)) return { code: 1, msg: 'refusing: hooks.SessionStart is not an array; nothing written' };
  const present = ((hooks && hooks.SessionStart) || []).some((e) => e && Array.isArray(e.hooks) && e.hooks.some((h) => h && h.command === command));

  const copies = FILES.map((f) => [path.join(__dirname, f), path.join(opts.targetDir, f)]);
  let next = original;
  if (!present) {
    json.hooks = json.hooks || {};
    json.hooks.SessionStart = json.hooks.SessionStart || [];
    json.hooks.SessionStart.push({ matcher: 'startup|resume', hooks: [{ type: 'command', command, timeout: 10 }] });
    next = JSON.stringify(json, null, detectIndent(original)) + (original.endsWith('\n') ? '\n' : '');
  }

  if (opts.dryRun) {
    log(`dry-run: would copy ${copies.map(([, d]) => d).join(', ')}`);
    log(present ? 'dry-run: hook already present; settings unchanged' : unifiedDiff(original, next, opts.settings));
    return { code: 0, changed: false };
  }
  fs.mkdirSync(opts.targetDir, { recursive: true });
  for (const [src, dst] of copies) fs.copyFileSync(src, dst);
  log(`copied ${FILES.join(', ')} to ${opts.targetDir}`);
  if (present) { log('hook already present; settings unchanged (no backup written)'); return { code: 0, changed: false }; }
  const stamp = new Date().toISOString().replace(/[-:.]/g, '').replace('T', '-').replace('Z', '');
  const backup = `${opts.settings}.bak-freshness-${stamp}`;
  fs.copyFileSync(opts.settings, backup);
  fs.writeFileSync(opts.settings, next);
  log(`backup: ${backup}`);
  log(`added SessionStart hook: ${command}`);
  return { code: 0, changed: true, backup };
}

module.exports = { install, parseArgs };

if (require.main === module) {
  let r;
  try { r = install(parseArgs(process.argv.slice(2)), (m) => console.log(m)); } catch (e) { r = { code: 1, msg: `error: ${e.message}` }; }
  if (r.msg) console.error(r.msg);
  process.exitCode = r.code;
}
