import fs from 'node:fs';

const path = 'workers/index.mjs';
const s = fs.readFileSync(path, 'utf8');

let line = 1, col = 0;
let inSL = false, inML = false; // // and /* */ comments
let inS = false, inD = false;   // ' and " strings
let inTpl = false;              // template literal
let esc = false;                // escape state inside current context
const stack = [];

function push(t){ stack.push({ t, line, col }); }
function pop(exp){
  const x = stack.pop();
  if (!x || x.t !== exp) {
    console.log(`Mismatch: expected ${exp}, got ${x ? x.t : 'none'} at ${line}:${col}`);
    process.exitCode = 1;
  }
}

for (let i = 0; i < s.length; i++) {
  let ch = s[i];
  let n = s[i + 1];

  if (ch === '\n') { line++; col = 0; } else { col++; }

  // single-line comments
  if (inSL) { if (ch === '\n') inSL = false; continue; }
  // multi-line comments
  if (inML) { if (ch === '*' && n === '/') { inML = false; i++; col++; } continue; }

  // template literal content
  if (inTpl) {
    if (!esc && ch === '`') { inTpl = false; continue; }
    if (!esc && ch === '\\') { esc = true; continue; }
    esc = false;
    // handle ${ ... } blocks inside template
    if (ch === '$' && n === '{') {
      i += 2; col += 2;
      let depth = 1; let le = false; let lc = col, ll = line;
      while (i < s.length && depth > 0) {
        ch = s[i]; n = s[i+1];
        if (ch === '\n') { line++; col = 0; } else { col++; }
        if (!le && ch === '{') depth++;
        else if (!le && ch === '}') depth--;
        if (!le && ch === '\\') le = true; else le = false;
        i++;
      }
      i--; // adjust for for-loop increment
      continue;
    }
    continue;
  }

  // single-quoted string
  if (inS) {
    if (!esc && ch === '\\') { esc = true; continue; }
    if (!esc && ch === '\'') { inS = false; continue; }
    esc = false; continue;
  }
  // double-quoted string
  if (inD) {
    if (!esc && ch === '\\') { esc = true; continue; }
    if (!esc && ch === '"') { inD = false; continue; }
    esc = false; continue;
  }

  // comment starts
  if (ch === '/' && n === '/') { inSL = true; i++; col++; continue; }
  if (ch === '/' && n === '*') { inML = true; i++; col++; continue; }

  // string starts
  if (ch === '\'') { inS = true; esc = false; continue; }
  if (ch === '"') { inD = true; esc = false; continue; }

  // template literal start
  if (ch === '`') { inTpl = true; esc = false; continue; }

  // delimiters
  if (ch === '(') push(')');
  else if (ch === ')') pop(')');
  else if (ch === '[') push(']');
  else if (ch === ']') pop(']');
  else if (ch === '{') push('}');
  else if (ch === '}') pop('}');
}

if (inTpl) {
  console.log(`Unclosed template at ${line}:${col}`);
  process.exitCode = 1;
}

if (stack.length) {
  console.log('Unclosed delimiters:');
  for (const x of stack) console.log(`  ${x.t} opened at ${x.line}:${x.col}`);
  process.exitCode = 1;
} else if (!process.exitCode) {
  console.log('All (),[],{} balanced.');
}
