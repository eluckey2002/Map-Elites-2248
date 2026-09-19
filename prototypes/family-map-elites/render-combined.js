#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');
const baseline = JSON.parse(fs.readFileSync(path.join(ROOT, 'experiments/RESULT-0046/output/archive.json'), 'utf8'));
const family = JSON.parse(fs.readFileSync(path.join(__dirname, 'output/archive.json'), 'utf8'));
const baselineByCell = new Map(baseline.archive.map((entry) => [entry.cell, entry]));
const familyByCell = new Map(family.archive.map((entry) => [entry.cell, entry]));

function escape(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

const cells = [];
for (let y = 6; y >= 0; y--) {
  for (let x = 0; x < 7; x++) {
    const cell = `${x},${y}`;
    const original = baselineByCell.get(cell);
    const additions = familyByCell.get(cell);
    const classes = ['cell'];
    if (original) classes.push('baseline');
    if (additions) classes.push('family');
    if (!original && !additions) classes.push('empty');
    const familyCards = additions?.elites.map((elite) => `
      <li><b>Family ${elite.candidate.family}</b> · ${escape(elite.candidate.template)}
      <small>${escape(elite.candidate.name)}</small></li>`).join('') || '';
    const originalCards = original?.elites.map((elite) => `
      <li><b>Existing</b> · ${escape(elite.candidate.name)}</li>`).join('') || '';
    cells.push(`<article class="${classes.join(' ')}" data-cell="${cell}">
      <h3>${cell}</h3>
      ${original ? `<span class="tag old">Existing · ${original.elites.length}</span>` : ''}
      ${additions ? `<span class="tag new">Family · ${additions.elites.length}</span>` : ''}
      ${(original || additions) ? `<ul>${originalCards}${familyCards}</ul>` : '<p>Empty</p>'}
    </article>`);
  }
}

const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Family openings · 7×7 Board MAP-Elites</title><style>
:root{font-family:Inter,ui-sans-serif,system-ui,sans-serif;color:#eee7dc;background:#100d0b}*{box-sizing:border-box}body{margin:0;padding:28px;background:radial-gradient(circle at 20% 0,#31221a 0,#100d0b 48rem)}main{max-width:1480px;margin:auto}h1{font-family:Georgia,serif;font-size:40px;margin:0 0 8px;color:#f4d893}.lede{max-width:85ch;color:#bdb2a5;line-height:1.55;margin-bottom:18px}.summary{display:flex;gap:12px;flex-wrap:wrap;margin:18px 0}.summary b{font-size:24px;color:#fff}.summary span{padding:12px 16px;border:1px solid #5e4934;border-radius:10px;background:#1a1511}.legend{display:flex;gap:16px;margin:14px 0;color:#c8bcad}.dot{display:inline-block;width:11px;height:11px;border-radius:50%;margin-right:6px}.old-dot{background:#c29a4b}.new-dot{background:#925bd6}.axis{font-weight:750;color:#e3c885;margin:12px 0 8px}.wrap{overflow:auto;padding-bottom:12px}.grid{display:grid;grid-template-columns:repeat(7,minmax(170px,1fr));gap:8px;min-width:1260px}.cell{min-height:162px;padding:10px;border-radius:10px;border:1px solid #3a3028;background:#171310}.cell h3{margin:0 0 8px;color:#978a7d}.cell.empty{border-style:dashed;opacity:.5}.cell.baseline{border-color:#9d793b;background:linear-gradient(145deg,#2c2416,#18140f)}.cell.family{border-color:#8755bd;background:linear-gradient(145deg,#281b34,#17121b)}.cell.baseline.family{background:linear-gradient(145deg,#30231d,#23192c)}.tag{display:inline-block;padding:3px 7px;margin:0 4px 6px 0;border-radius:999px;font-size:11px;font-weight:750}.tag.old{background:#4a391c;color:#f4d893}.tag.new{background:#44275e;color:#ddb9ff}ul{padding-left:18px;margin:4px 0}li{margin:5px 0;color:#ddd1c4}small{display:block;color:#96899e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}p{color:#756b62}
</style></head><body><main><h1>Family openings on the 7×7 map</h1>
<p class="lede">The playable board is still 5×8. This is the 49-cell board-authoring archive: successful plan breadth runs left to right; harvesting advantage runs bottom to top. Purple cells are newly occupied by family-island openings. Gold cells are the existing RESULT-0046 archive.</p>
<div class="summary"><span><b>80</b><br>family boards evaluated</span><span><b>${family.comparison.baselineOccupiedCells} → ${family.comparison.unionOccupiedCells}</b><br>occupied cells</span><span><b>${family.comparison.newCells.length}</b><br>new cells</span></div>
<div class="legend"><span><i class="dot old-dot"></i>Existing archive</span><span><i class="dot new-dot"></i>Family additions</span></div>
<div class="axis">Harvesting advantage ↑</div><div class="wrap"><div class="grid">${cells.join('')}</div></div><div class="axis">Successful plan breadth →</div>
</main></body></html>\n`;

fs.writeFileSync(path.join(__dirname, 'output', 'combined-map.html'), html);
process.stdout.write(`WROTE prototypes/family-map-elites/output/combined-map.html (${family.comparison.unionOccupiedCells}/49 occupied)\n`);
