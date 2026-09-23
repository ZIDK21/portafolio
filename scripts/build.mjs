import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPage } from '../src/render.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

async function load(lang) {
  const path = join(root, 'src', 'content', `${lang}.json`);
  return JSON.parse(await readFile(path, 'utf8'));
}

function resourcePaths(content) {
  const paths = ['assets/profile/portrait.jpg'];
  if (content.about.cv?.href) paths.push(content.about.cv.href);
  for (const project of content.projects) {
    if (project.evidence.image) paths.push(project.evidence.image);
    if (project.conceptual?.asset) paths.push(project.conceptual.asset);
    paths.push(...project.downloads.map((download) => download.href));
  }
  return paths;
}

function validateResourcePath(value) {
  if (!/^(?:assets|downloads)\/[A-Za-z0-9_./-]+$/.test(value) || value.includes('..')) {
    throw new Error(`Invalid public resource path: ${value}`);
  }
}

const [es, en] = await Promise.all([load('es'), load('en')]);
for (const resource of new Set([...resourcePaths(es), ...resourcePaths(en)])) {
  validateResourcePath(resource);
  await readFile(join(root, 'public', resource));
}

await rm(dist, { recursive: true, force: true });
await mkdir(join(dist, 'en'), { recursive: true });
await cp(join(root, 'public'), dist, { recursive: true });
await cp(join(root, 'src', 'styles.css'), join(dist, 'styles.css'));
await cp(join(root, 'src', 'main.js'), join(dist, 'main.js'));
await writeFile(join(dist, 'index.html'), renderPage(es, 'es'), 'utf8');
await writeFile(join(dist, 'en', 'index.html'), renderPage(en, 'en'), 'utf8');

console.log('Built dist/index.html and dist/en/index.html');
