const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'workers', 'index.mjs');
const src = fs.readFileSync(file, 'utf8');

let inTemplate = false;
let templateStart = null;
let btCount = 0;
let braceStack = [];
let line = 1, col = 0;
let i = 0;
function loc() { return { line, col }; }

function advance(ch) {
  if (ch === '\n') { line++; col = 0; } else { col++; }
}

while (i < src.length) {
  const ch = src[i];
  const prev = src[i - 1];
  const next = src[i + 1];

  // log potential starts like "return `"
  if (!inTemplate && ch === '`' && src.slice(Math.max(0, i-8), i) .includes('return ')) {
    console.log('Potential return ` at', loc(), 'context:', JSON.stringify(src.slice(i-12, i+12)));
  }

  // track braces outside template literals for basic sanity
  if (!inTemplate) {
    if (ch === '{') braceStack.push({ ch, ...loc() });
    else if (ch === '}') braceStack.pop();
  }

  // detect backticks with escape handling
  if (ch === '`') {
    if (prev !== '\\') {
      btCount++;
      inTemplate = !inTemplate;
      if (inTemplate) {
        templateStart = loc();
        console.log('` OPEN at', templateStart);
      } else {
        console.log('` CLOSE at', loc());
        templateStart = null;
      }
    }
    advance(ch); i++; continue;
  }

  // inside template literal: handle ${ ... } nesting
  if (inTemplate) {
    if (ch === '$' && next === '{') {
      braceStack.push({ ch: '{', ...loc() });
      advance(ch); i++;
      advance('{'); i++;
      continue;
    }
    if (ch === '}' && braceStack.length && braceStack[braceStack.length - 1].ch === '{') {
      braceStack.pop();
      advance(ch); i++;
      continue;
    }
  }

  advance(ch);
  i++;
}
// Probe: find generateDockerCompose return opener char code
const lines = src.split(/\r?\n/);
for (let li = 0; li < lines.length; li++) {
  const L = lines[li];
  if (L.includes('function generateDockerCompose')) {
    // look ahead a few lines for 'return '
    for (let j = li; j < Math.min(li + 10, lines.length); j++) {
      const r = lines[j];
      const idx = r.indexOf('return ');
      if (idx >= 0 && idx + 7 < r.length) {
        const ch = r[idx + 7];
        console.log('generateDockerCompose return opener at line', j + 1, 'col', idx + 8, 'char', JSON.stringify(ch), 'code', ch.codePointAt(0));
        break;
      }
    }
    break;
  }
}
console.log('Total backticks:', btCount);
if (inTemplate) {
  console.log('Unclosed template literal started at', templateStart);
}
if (braceStack.length) {
  console.log('Unbalanced braces, remaining stack top at', braceStack[braceStack.length - 1]);
}
process.exit(inTemplate || braceStack.length ? 1 : 0);
}
console.log('No obvious unclosed templates or braces found.');
