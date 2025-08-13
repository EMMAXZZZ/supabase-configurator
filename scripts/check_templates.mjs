import fs from 'node:fs';

const path = 'workers/index.mjs';
const src = fs.readFileSync(path, 'utf8');

let line = 1, col = 0;
let inSL = false, inML = false; // // and /* */ comments
let inS = false, inD = false;   // ' and " strings
let inTpl = false;              // template literal
let esc = false;                // escape state inside current context
let tplOpen = null;             // { line, col } of current template open

function pos() { return `${line}:${col}`; }

for (let i = 0; i < src.length; i++) {
  let ch = src[i];
  let n = src[i + 1];

  if (ch === '\n') { line++; col = 0; } else { col++; }

  // Handle end of single-line comment
  if (inSL) {
    if (ch === '\n') inSL = false;
    continue;
  }

  // Handle end of multi-line comment
  if (inML) {
    if (ch === '*' && n === '/') { inML = false; i++; col++; }
    continue;
  }

  // If inside a template literal
  if (inTpl) {
    if (!esc && ch === '`') { // close template
      inTpl = false;
      tplOpen = null;
      continue;
    }

    // escape handling inside template
    if (!esc && ch === '\\') { esc = true; continue; }
    esc = false;

    // Handle interpolation ${ ... }
    if (ch === '$' && n === '{') {
      // Enter interpolation: parse until matching }
      i += 2; col += 2; // skip "${"
      let depth = 1; let localEsc = false;
      while (i < src.length && depth > 0) {
        ch = src[i]; n = src[i + 1];
        if (ch === '\n') { line++; col = 0; } else { col++; }
        if (!localEsc && ch === '`') {
          // backtick inside interpolation is okay in JS, but useful to note
          // console.log(`Note: backtick inside \\${} at ${pos()}`);
        }
        if (!localEsc && ch === '{') depth++;
        else if (!localEsc && ch === '}') depth--;
        if (!localEsc && ch === '\\') { localEsc = true; } else { localEsc = false; }
        i++;
      }
      i--; // step back one to align outer for-loop increment
      continue;
    }

    // continue scanning inside template
    continue;
  }

  // Not in template: handle normal strings first
  if (inS) {
    if (!esc && ch === '\\') { esc = true; continue; }
    if (!esc && ch === '\'') { inS = false; continue; }
    esc = false; continue;
  }
  if (inD) {
    if (!esc && ch === '\\') { esc = true; continue; }
    if (!esc && ch === '"') { inD = false; continue; }
    esc = false; continue;
  }

  // Start of comments
  if (ch === '/' && n === '/') { inSL = true; i++; col++; continue; }
  if (ch === '/' && n === '*') { inML = true; i++; col++; continue; }

  // Start of normal strings
  if (ch === '\'') { inS = true; esc = false; continue; }
  if (ch === '"') { inD = true; esc = false; continue; }

  // Start of template literal
  if (ch === '`') {
    inTpl = true; esc = false; tplOpen = { line, col };
    // console.log(`Template OPEN at ${pos()}`);
    continue;
  }
}

if (inTpl && tplOpen) {
  console.log(`Unclosed template starting at ${tplOpen.line}:${tplOpen.col}`);
  process.exitCode = 1;
} else {
  console.log('All template literals are balanced.');
}
