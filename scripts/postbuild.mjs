import { cpSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const dist = resolve(root, 'dist');
const source = resolve(root, 'src', 'enhance-fix.js');
const target = resolve(dist, 'assets', 'enhance-fix.js');

if (!existsSync(source) || !existsSync(dist)) throw new Error('Missing enhance fix source or dist directory.');
cpSync(source, target);

function walk(directory) {
  for (const name of readdirSync(directory)) {
    const path = resolve(directory, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (name.endsWith('.html')) {
      const html = readFileSync(path, 'utf8');
      if (!html.includes('/Site100/assets/enhance.js') || html.includes('/Site100/assets/enhance-fix.js')) continue;
      writeFileSync(path, html.replace('</body>', '<script type="module" src="/Site100/assets/enhance-fix.js"></script></body>'));
    }
  }
}

walk(dist);
console.log('Applied Site100 v2 compatibility layer to generated interactive pages.');
