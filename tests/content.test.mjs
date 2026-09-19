import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { renderPage } from '../src/render.mjs';

const root = process.cwd();
const jobKnowledgeRoot = process.env.JOB_KNOWLEDGE_ROOT
  ? resolve(process.env.JOB_KNOWLEDGE_ROOT)
  : resolve(root, '..', '..', '..');
const documentsRoot = resolve(jobKnowledgeRoot, '..');
const freelanceKnowledgeRoot = process.env.FREELANCE_KNOWLEDGE_ROOT
  ? resolve(process.env.FREELANCE_KNOWLEDGE_ROOT)
  : resolve(documentsRoot, 'Freelance Knowledge');
const ids = ['tusa', 'notion-calendar', 'dlro', 'hornitos', 'dns'];
const languages = ['es', 'en'];
const load = async (lang) => JSON.parse(await readFile(join(root, 'src', 'content', `${lang}.json`), 'utf8'));
const evidenceMapPath = process.env.EVIDENCE_MAP_PATH
  ? resolve(process.env.EVIDENCE_MAP_PATH)
  : join(root, 'evidence-map.json');
const readMap = async () => readFile(evidenceMapPath, 'utf8')
  .then((value) => JSON.parse(value))
  .catch((error) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
const exists = async (relativePath) => access(join(root, relativePath));
const sourceRoots = {
  'job-knowledge': jobKnowledgeRoot,
  'freelance-knowledge': freelanceKnowledgeRoot,
  web: root
};

const projectClaimFields = [
  'title', 'summary', 'problem', 'action', 'result', 'stack',
  'evidence.caption', 'evidence.provenance', 'evidence.image', 'downloads'
];
const expectedClaimKeys = [
  'meta.title', 'meta.description', 'nav.labels', 'hero.name', 'hero.role', 'hero.summary',
  'metrics.tusa-cuts', 'metrics.calendar-time', 'metrics.dlro-checks', 'metrics.hornitos-use',
  'about.title', 'about.summary', 'about.timeline', 'about.education', 'about.certifications', 'about.cv',
  'services.title', 'services.operations', 'services.automation', 'services.support',
  ...ids.flatMap((id) => projectClaimFields.map((field) => `projects.${id}.${field}`)),
  'working.title', 'working.paragraphs',
  'contact.title', 'contact.summary', 'contact.email', 'contact.phone', 'contact.linkedin', 'contact.reasons',
  'ui.labels'
];

const walkFiles = async (directory) => {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(absolute));
    else files.push(absolute);
  }
  return files;
};

const publicRelativeFiles = async () => (await walkFiles(join(root, 'public')))
  .map((file) => relative(join(root, 'public'), file).replaceAll('\\', '/'))
  .sort();

const referencedResources = (contents) => {
  const references = new Map();
  for (const content of contents) {
    for (const project of content.projects) {
      if (project.evidence.image) references.set(project.evidence.image, 'image');
      for (const download of project.downloads) references.set(download.href, 'download');
    }
    if (content.about.cv?.href) references.set(content.about.cv.href, 'download');
    for (const item of content.services.items) {
      if (item.image) references.set(item.image, 'image');
    }
  }
  return references;
};

const assertSignature = async (relativePath) => {
  const bytes = await readFile(join(root, 'public', relativePath));
  const extension = extname(relativePath).toLowerCase();
  if (extension === '.png') assert.equal(bytes.subarray(0, 4).toString('hex'), '89504e47', relativePath);
  if (extension === '.jpg' || extension === '.jpeg') assert.equal(bytes.subarray(0, 3).toString('hex'), 'ffd8ff', relativePath);
  if (extension === '.woff2') assert.equal(bytes.subarray(0, 4).toString('ascii'), 'wOF2', relativePath);
  if (extension === '.pdf') assert.equal(bytes.subarray(0, 4).toString('ascii'), '%PDF', relativePath);
};

const visibleText = (content) => {
  const chunks = [
    content.meta.title, content.meta.description,
    ...content.nav.map((item) => item.label),
    content.hero.name, content.hero.role, content.hero.summary,
    ...content.metrics.flatMap((metric) => [metric.value, metric.context]),
    content.about.title, content.about.summary,
    ...content.about.timeline.flatMap((item) => [item.date, item.text]),
    content.about.education, ...content.about.certifications,
    content.services.title, ...content.services.items.flatMap((item) => [item.title, item.description]),
    ...content.projects.flatMap((project) => [
      project.title, project.summary, project.problem, project.action, project.result,
      ...project.stack, project.evidence.caption, project.evidence.provenance,
      ...project.downloads.map((download) => download.label)
    ]),
    content.working.title, ...content.working.paragraphs,
    content.contact.title, content.contact.summary, content.contact.emailLabel,
    content.contact.phoneLabel, content.contact.linkedinLabel,
    ...content.contact.reasons.flatMap((reason) => [reason.label, reason.subject]),
    ...Object.values(content.ui)
  ];
  return chunks.join('\n');
};

const numberTokens = (text) => text.match(/\d+/g) ?? [];

const assertSourceReference = async (entry) => {
  assert.ok(entry.sourceRoot in sourceRoots, `${entry.key}: unknown sourceRoot`);
  assert.ok(entry.path && !/^[A-Za-z]:[\\/]/.test(entry.path), `${entry.key}: source path must be relative`);
  const absolute = join(sourceRoots[entry.sourceRoot], entry.path);
  await access(absolute);
  const sourceText = await readFile(absolute, 'utf8').catch(() => null);
  if (entry.heading) {
    assert.ok(sourceText, `${entry.key}: heading requires text source`);
    assert.ok(sourceText.split(/\r?\n/).some((line) => line.trim() === entry.heading), `${entry.key}: heading not found`);
  }
  if (entry.lines) {
    assert.ok(sourceText, `${entry.key}: line range requires text source`);
    const [start, end] = entry.lines.split('-').map(Number);
    const lineCount = sourceText.split(/\r?\n/).length;
    assert.ok(Number.isInteger(start) && Number.isInteger(end) && start >= 1 && end >= start && end <= lineCount, `${entry.key}: invalid line range`);
  }
  if (!entry.heading && !entry.lines) {
    assert.match(extname(entry.path).toLowerCase(), /\.(png|jpe?g|woff2)$/i, `${entry.key}: binary source needs no heading`);
  }
};

test('five matching case IDs in both languages', async () => {
  const es = await load('es');
  const en = await load('en');
  assert.deepEqual(es.projects.map((project) => project.id), ids);
  assert.deepEqual(en.projects.map((project) => project.id), ids);
});

test('bilingual content follows the shared contract, privacy policy, and visible-claim parity', async () => {
  const es = await load('es');
  const en = await load('en');
  const topKeys = ['meta', 'nav', 'hero', 'metrics', 'about', 'services', 'projects', 'working', 'contact', 'ui'];
  const projectKeys = ['id', 'title', 'summary', 'problem', 'action', 'result', 'stack', 'evidence', 'downloads'];
  const sensitive = /(?:av(?:enida)?\.?\s+intercomunal|sector\s+dividive|(?<![A-Za-z0-9_])[A-Za-z]:[\\/]|file:\/\/|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|10\.2\.0\.1)/i;

  for (const [lang, content] of [['es', es], ['en', en]]) {
    assert.deepEqual(Object.keys(content).sort(), [...topKeys].sort());
    assert.deepEqual(content.nav.map((item) => item.id), ['inicio', 'resultados', 'sobre-mi', 'servicios', 'proyectos', 'metodo', 'contacto']);
    assert.deepEqual(content.services.items.map((item) => item.id), ['operations', 'automation', 'support']);
    for (const item of content.services.items) {
      assert.match(item.image, /^assets\/services\/[a-z-]+(-v[0-9]+)?\.jpg$/);
      assert.ok(item.alt.trim(), `${lang}/${item.id}: service image needs alt text`);
    }
    assert.equal(content.projects.length, ids.length);
    const raw = await readFile(join(root, 'src', 'content', `${lang}.json`), 'utf8');
    assert.doesNotMatch(raw, sensitive, `${lang}: sensitive content token`);
    for (const project of content.projects) {
      assert.deepEqual(Object.keys(project).sort(), [...projectKeys].sort());
      for (const field of ['title', 'summary', 'problem', 'action', 'result']) assert.ok(project[field].trim());
      assert.ok(project.stack.length >= 3);
      if (project.evidence.image) {
        assert.match(project.evidence.image, /^assets\//);
        assert.ok(project.evidence.alt.trim());
      } else {
        assert.equal(project.evidence.alt, '');
        assert.doesNotMatch(project.evidence.caption, /vista previa|preview/i, `${lang}/${project.id}: null image must use a text-only evidence label`);
      }
      for (const download of project.downloads) {
        assert.match(download.href, /^downloads\/[A-Za-z0-9_.-]+\.pdf$/);
        assert.ok(['es', 'en'].includes(download.lang));
      }
    }
    assert.equal(content.about.cv, null);
  }

  const publicTextExtensions = new Set(['.css', '.html', '.js', '.json', '.md', '.mjs', '.svg', '.txt']);
  for (const relativePath of await publicRelativeFiles()) {
    if (!publicTextExtensions.has(extname(relativePath).toLowerCase())) continue;
    const raw = await readFile(join(root, 'public', relativePath), 'utf8');
    assert.doesNotMatch(raw, sensitive, `public/${relativePath}: sensitive content token`);
  }

  assert.deepEqual(es.projects.map((project) => project.id), en.projects.map((project) => project.id));
  assert.deepEqual(es.metrics.map((metric) => metric.id), en.metrics.map((metric) => metric.id));
  assert.deepEqual(es.services.items.map((item) => item.id), en.services.items.map((item) => item.id));
  for (const [index, item] of es.services.items.entries()) {
    assert.equal(item.image, en.services.items[index].image);
  }
  assert.deepEqual(numberTokens(visibleText(es)), numberTokens(visibleText(en)));
  for (const index of es.projects.keys()) {
    assert.equal(es.projects[index].stack.length, en.projects[index].stack.length);
    assert.equal(es.projects[index].evidence.image !== null, en.projects[index].evidence.image !== null);
    assert.equal(es.projects[index].downloads.length, en.projects[index].downloads.length);
  }
});

test('public resources are referenced, signature-checked, and contain no public PDFs yet', async () => {
  const contents = await Promise.all(languages.map(load));
  const map = await readMap();
  const references = referencedResources(contents);
  const mapAssets = map?.assets.map((asset) => asset.publicAsset).filter(Boolean) ?? [];
  const staticPublicFiles = [
    'assets/dns/02-problem.png',
    'assets/dns/04-repair.png',
    'assets/dns/05-result.png',
    'assets/fonts/Manrope-latin.woff2',
    'assets/fonts/OFL-Manrope.txt',
    'assets/fonts/OFL-Space-Grotesk.txt',
    'assets/fonts/SOURCES.txt',
    'assets/fonts/SpaceGrotesk-latin.woff2',
    'assets/profile/portrait.jpg',
    'assets/services/SOURCES.txt',
    'favicon.svg'
  ];
  const allowed = new Set([...references.keys(), ...mapAssets, ...staticPublicFiles]);
  const publicFiles = await publicRelativeFiles();
  const publicPdfs = publicFiles.filter((file) => file.toLowerCase().endsWith('.pdf'));

  for (const relativePath of references.keys()) {
    await exists(join('public', relativePath));
    await assertSignature(relativePath);
  }
  for (const relativePath of mapAssets) {
    await exists(join('public', relativePath));
    await assertSignature(relativePath);
  }
  assert.deepEqual(publicPdfs, [], 'no PDF is public until a redacted resource is approved');
  assert.deepEqual(publicFiles.filter((file) => !allowed.has(file)).sort(), []);
  for (const omitted of map?.omittedAssets ?? []) {
    assert.ok(Array.isArray(omitted.publicPaths) && omitted.publicPaths.length > 0, `${omitted.source}: missing explicit omitted paths`);
    for (const relativePath of omitted.publicPaths) await assert.rejects(exists(join('public', relativePath)));
  }
});

test('evidence map has the exact claim set, unique keys, existing source references, and resolving headings', async (context) => {
  const map = await readMap();
  if (!map) return context.skip('private evidence map is not part of the public repository');
  assert.deepEqual(map.entries.map((entry) => entry.key).sort(), [...expectedClaimKeys].sort());
  assert.equal(new Set(map.entries.map((entry) => entry.key)).size, expectedClaimKeys.length);
  for (const entry of map.entries) {
    for (const field of ['key', 'source', 'section', 'publicAsset', 'sourceRoot', 'path']) assert.ok(field in entry, `${entry.key}: ${field}`);
    await assertSourceReference(entry);
    if (entry.publicAsset) await exists(join('public', entry.publicAsset));
  }
  for (const asset of map.assets) {
    for (const field of ['key', 'source', 'sourceRoot', 'path', 'publicAsset']) assert.ok(field in asset, `${asset.key}: ${field}`);
    await assertSourceReference(asset);
    await exists(join('public', asset.publicAsset));
  }
  assert.equal(map.entries.filter((entry) => entry.key.startsWith('projects.dns.')).length, projectClaimFields.length);
  assert.equal(map.assets.some((asset) => asset.publicAsset === 'assets/dns/03-evidence.png'), false);
});

test('renderer emits complete semantic ES and EN documents with portable resources', async () => {
  const es = await load('es');
  const en = await load('en');
  const esHtml = renderPage(es, 'es');
  const enHtml = renderPage(en, 'en');

  assert.match(esHtml, /<html lang="es">/);
  assert.match(enHtml, /<html lang="en">/);
  assert.equal((esHtml.match(/<article\b/g) ?? []).length, 5);
  assert.equal((enHtml.match(/<article\b/g) ?? []).length, 5);
  assert.match(esHtml, /href="\.\/en\/"[^>]*>English<\/a>/);
  assert.match(enHtml, /href="\.\.\/"[^>]*>Español<\/a>/);
  assert.match(enHtml, /src="\.\.\/assets\/dns\/01-cover\.png"/);
  assert.doesNotMatch(esHtml, /undefined|null|C:\\Users|file:\/\//i);
  assert.doesNotMatch(enHtml, /undefined|null|C:\\Users|file:\/\//i);
  assert.equal((esHtml.match(/<h1\b/g) ?? []).length, 1);
  assert.equal((enHtml.match(/<h1\b/g) ?? []).length, 1);
});
