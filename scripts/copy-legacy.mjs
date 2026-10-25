import { cp, access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { legacyFiles, legacyDirectories, optionalLegacyFiles } from './legacy-files.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const version = new Date().toISOString().slice(0, 10);
const optionalFiles = [];
for (const name of optionalLegacyFiles) {
  if (await access(resolve(root, name)).then(() => true, () => false)) optionalFiles.push(name);
}
for (const name of [...legacyFiles, ...optionalFiles, ...legacyDirectories]) {
  const source = resolve(root, name), target = resolve(root, 'dist', name);
  await access(source);
  const exists = await access(target).then(() => true, () => false);
  if (exists) throw new Error(`Refusing to overwrite build output: ${name}`);
  await mkdir(dirname(target), { recursive: true });
  if (/\.(html|js)$/.test(name)) {
    const text = await readFile(source, 'utf8');
    await writeFile(target, text.replaceAll('{{VERSION}}', version));
  } else await cp(source, target, { recursive: true, errorOnExist: true, force: false });
}
await mkdir(resolve(root, 'dist/licenses'), { recursive: true });
for (const [name, packageName] of [['Manrope', '@fontsource-variable/manrope'], ['IBM-Plex-Mono', '@fontsource/ibm-plex-mono']]) {
  await cp(resolve(root, 'node_modules', packageName, 'LICENSE'), resolve(root, 'dist/licenses', `${name}-OFL.txt`));
}
console.log(`Copied ${legacyFiles.length + optionalFiles.length} legacy files, geographic data, and font licenses. Runtime content excluded.`);
