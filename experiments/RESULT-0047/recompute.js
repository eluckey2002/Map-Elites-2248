#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { analyze } = require('./verify');

const file = path.join(__dirname, 'corpus.json');
process.stdout.write(`${JSON.stringify(analyze(JSON.parse(fs.readFileSync(file, 'utf8'))), null, 2)}\n`);
