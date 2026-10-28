// Builds one self-contained page (engine inlined) for the Climb Artifact.
// The Artifact viewer does not reliably load a script file published next to
// the page, so the page must carry the engine itself.
// Usage: node prototypes/climb/build.js [out.html]
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, file), 'utf8');
const tag = '<script src="engine.js"></script>';
const page = read('page.html');
if (!page.includes(tag)) throw new Error(`page.html no longer has ${tag}`);
const engine = read('engine.js').replace(/<\/script/gi, '<\\/script');
const out = process.argv[2] || path.join(__dirname, 'climb.html');
fs.writeFileSync(out, page.replace(tag, () => `<script>\n${engine}\n</script>`));
console.log('wrote', out);
