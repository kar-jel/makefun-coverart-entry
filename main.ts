import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repository = fileURLToPath(new URL('.', import.meta.url));

function resolveOutputDir() {
  return resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');
}

function ensureFolder(path) {
  mkdirSync(path, { recursive: true });
}

function appFileCount(path) {
  let total = 0;
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    total += entry.isDirectory() ? appFileCount(child) : 1;
  }
  return total;
}

function copyApp(destination) {
  const origin = join(repository, 'app');
  if (!existsSync(join(origin, 'index.html'))) {
    throw new Error('Cannot prepare entry: app/index.html is missing.');
  }
  const count = appFileCount(origin);
  if (count < 5) console.warn(`Warning: app/ contains only ${count} files (expected at least five).`);
  ensureFolder(destination);
  cpSync(origin, join(destination, 'app'), { recursive: true });
  return count;
}

function copyScreenshots(destination) {
  const target = join(destination, 'screenshots');
  ensureFolder(target);
  const source = join(repository, 'screenshots');
  if (existsSync(source)) cpSync(source, target, { recursive: true });
}

function writeDossier(destination) {
  const content = buildDossier(destination, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  });
  writeFileSync(join(destination, 'dossier.json'), content);
  return Buffer.byteLength(content, 'utf8');
}

function run() {
  const destination = resolveOutputDir();
  ensureFolder(destination);
  const files = copyApp(destination);
  copyScreenshots(destination);
  const dossierBytes = writeDossier(destination);
  console.log(`Prepared ${destination}: ${files} app files copied; dossier.json is ${dossierBytes} bytes.`);
}

run();
