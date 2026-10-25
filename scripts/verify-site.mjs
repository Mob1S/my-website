import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { legacyFiles } from './legacy-files.mjs';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? walk(resolve(dir, entry.name)) : resolve(dir, entry.name)))).flat();
}
const files = await walk(root);
for (const name of ['index.html', ...legacyFiles]) assert.ok((await stat(resolve(root, name))).isFile(), name);
assert.ok(!files.some(file => /[\\/](?:server\.js|\.env(?:\.|$))/.test(file)), 'Server code or environment in output');
assert.ok(!files.some(file => /[\\/](?:images|admin[\\/]data)[\\/]/.test(file)), 'Runtime content in output');
const html = await readFile(resolve(root, 'index.html'), 'utf8');
assert.ok(!html.includes('/src/main.ts'), 'Unbuilt Vue entry');
for (const file of files.filter(file => file.endsWith('.html'))) {
  const content = (await readFile(file, 'utf8')).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  for (const match of content.matchAll(/(?:src|href)="([^"<>${}]+)"/g)) {
    const url = match[1];
    if (/^(?:https?:|data:|#|mailto:)/.test(url) || url.startsWith('images/') || url.startsWith('admin/data/')) continue;
    const name = decodeURIComponent(url.split(/[?#]/)[0]);
    if (!name) continue;
    const target = name.startsWith('/') ? resolve(root, '.' + name) : resolve(dirname(file), name);
    assert.ok(files.includes(target), `${file}: missing resource ${url}`);
  }
}
const assets = await readdir(resolve(root, 'assets'));
assert.ok(assets.some(file => file.startsWith('map-data-')), 'Map must be loaded in its own chunk');
assert.ok(assets.some(file => file.startsWith('particles-')), 'Particles must be loaded in their own chunk');
console.log(`Verified ${files.length} output files, HTML references, legacy pages, and lazy chunks.`);
