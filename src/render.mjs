const entities = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'};
const siteOrigin = 'https://zidk21.github.io/portafolio';

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => entities[character]);
}

function safeAssetPath(value) {
  if (!/^(?:assets|downloads)\/[A-Za-z0-9_./-]+$/.test(value) || value.includes('..')) {
    throw new Error(`Invalid local asset path: ${value}`);
  }
  return value;
}

function domId(value) {
  return String(value).replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'item';
}

function safeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

const renderList = (items, className, renderItem) =>
  `<ul class="${className}">${items.map(renderItem).join('')}</ul>`;

const serviceIcons = {
  operations: `<svg class="service-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7M4 7h16v12H4zM4 12h16M10 12v2h4v-2"/></svg>`,
  automation: `<svg class="service-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="6" cy="7" r="2"/><circle cx="18" cy="17" r="2"/><path d="M8 7h4a3 3 0 0 1 3 3v4a3 3 0 0 0 3 3M6 9v8a3 3 0 0 0 3 3h7"/></svg>`,
  support: `<svg class="service-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 13a8 8 0 0 1 16 0v2a2 2 0 0 1-2 2h-2v-5h4M4 14v1a2 2 0 0 0 2 2h2v-5H4M8 19h4a2 2 0 0 0 2-2"/></svg>`
};

function serviceIcon(id) {
  return serviceIcons[id] ?? serviceIcons.operations;
}

export function renderPage(content, lang) {
  if (!['es', 'en'].includes(lang)) throw new Error(`Unsupported language: ${lang}`);
  const prefix = lang === 'en' ? '../' : './';
  const otherHref = lang === 'en' ? '../' : './en/';
  const otherLabel = lang === 'en' ? 'Español' : 'English';
  const isEs = lang === 'es';
  const canonicalUrl = `${siteOrigin}${isEs ? '/' : '/en/'}`;
  const spanishUrl = `${siteOrigin}/`;
  const englishUrl = `${siteOrigin}/en/`;
  const portraitUrl = `${siteOrigin}/assets/profile/portrait.jpg`;
  const structuredData = safeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Jose Navas',
    url: canonicalUrl,
    image: portraitUrl,
    jobTitle: content.hero.role,
    description: content.meta.description,
    sameAs: ['https://www.linkedin.com/in/jose-navas21'],
    knowsAbout: content.services.items.map((item) => item.title)
  });
  const navLinks = content.nav.map((item) =>
    `<li><a href="#${escapeHtml(item.id)}">${escapeHtml(item.label)}</a></li>`).join('');
  const metrics = content.metrics.map((metric) => `
    <div class="metric" data-reveal="metric" data-motion-item="metric" data-metric="${escapeHtml(metric.id)}">
      <dt>${escapeHtml(metric.value)}</dt>
      <dd>${escapeHtml(metric.context)}</dd>
    </div>`).join('');
  const timeline = content.about.timeline.map((item) => `
    <li><span class="timeline-date">${escapeHtml(item.date)}</span><p>${escapeHtml(item.text)}</p></li>`).join('');
  const certifications = renderList(content.about.certifications, 'certification-list', (item) =>
    `<li>${escapeHtml(item)}</li>`);
  const cv = content.about.cv ? `
    <a class="text-link" href="${prefix}${safeAssetPath(content.about.cv.href)}" download>
      ${escapeHtml(content.about.cv.label)}
    </a>` : '';
  const services = content.services.items.map((item, index) => `
    <div class="service service-${index + 1}" id="service-${escapeHtml(item.id)}" data-reveal="service" data-motion-item="service" role="listitem" aria-labelledby="service-${domId(item.id)}-title">
      <img class="service-image" src="${prefix}${safeAssetPath(item.image)}" alt="${escapeHtml(item.alt)}" width="800" height="800" loading="lazy" decoding="async">
      <h3 id="service-${domId(item.id)}-title"><span class="service-icon-wrap">${serviceIcon(item.id)}</span><span>${escapeHtml(item.title)}</span></h3>
      <p>${escapeHtml(item.description)}</p>
    </div>`).join('');
  const projects = content.projects.map((project, index) => {
    const projectKey = domId(project.id);
    const projectTitleId = `${projectKey}-title`;
    const sectionTitleId = (key) => `${projectKey}-${key}-title`;
    const evidence = project.evidence.image ? `
      <a class="evidence-link" href="${prefix}${safeAssetPath(project.evidence.image)}" data-evidence-link>
        <img src="${prefix}${safeAssetPath(project.evidence.image)}" alt="${escapeHtml(project.evidence.alt)}" width="1024" height="768" loading="lazy" decoding="async">
        <span>${escapeHtml(content.ui.expandLabel)}</span>
      </a>` : '';
    const downloads = project.downloads.length ? `
      <div class="downloads">
        <h4>${escapeHtml(content.ui.pdfLabel)}</h4>
        ${project.downloads.map((download) => `<a href="${prefix}${safeAssetPath(download.href)}" download>${escapeHtml(download.label)}</a>`).join('')}
      </div>` : '';
    const stack = renderList(project.stack, 'stack-list', (item) => `<li>${escapeHtml(item)}</li>`);
    return `
      <article data-reveal="project" data-motion-item="project" class="project project-${index + 1}" data-project-index="${String(index + 1).padStart(2, '0')}" id="${escapeHtml(project.id)}" aria-labelledby="${projectTitleId}">
        <header class="project-heading">
          <h3 id="${projectTitleId}">${escapeHtml(project.title)}</h3>
          <p class="project-summary">${escapeHtml(project.summary)}</p>
        </header>
        <div class="project-body">
          <div class="project-copy">
            <section aria-labelledby="${sectionTitleId('problem')}"><h4 id="${sectionTitleId('problem')}">${escapeHtml(content.ui.problemLabel)}</h4><p>${escapeHtml(project.problem)}</p></section>
            <section aria-labelledby="${sectionTitleId('action')}"><h4 id="${sectionTitleId('action')}">${escapeHtml(content.ui.actionLabel)}</h4><p>${escapeHtml(project.action)}</p></section>
            <section aria-labelledby="${sectionTitleId('result')}"><h4 id="${sectionTitleId('result')}">${escapeHtml(content.ui.resultLabel)}</h4><p>${escapeHtml(project.result)}</p></section>
            <section aria-labelledby="${sectionTitleId('stack')}"><h4 id="${sectionTitleId('stack')}">${escapeHtml(content.ui.stackLabel)}</h4>${stack}</section>
          </div>
          <aside class="evidence" aria-labelledby="${sectionTitleId('evidence')}">
            <h4 id="${sectionTitleId('evidence')}">${escapeHtml(content.ui.evidenceLabel)}</h4>
            ${evidence}
            <p class="evidence-caption">${escapeHtml(project.evidence.caption)}</p>
            <p class="evidence-provenance">${escapeHtml(project.evidence.provenance)}</p>
            ${downloads}
          </aside>
        </div>
      </article>`;
  }).join('');
  const working = content.working.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('');
  const reasonLinks = content.contact.reasons.map((reason) => {
    const subject = encodeURIComponent(reason.subject);
    return `<li><a href="mailto:${escapeHtml(content.contact.emailLabel)}?subject=${subject}">${escapeHtml(reason.label)}</a></li>`;
  }).join('');
  const telephone = content.contact.phoneLabel.replace(/[^+\d]/g, '');

  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(content.meta.description)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="theme-color" content="#f5f7fa">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Jose Navas">
  <meta property="og:locale" content="${isEs ? 'es_ES' : 'en_US'}">
  <meta property="og:locale:alternate" content="${isEs ? 'en_US' : 'es_ES'}">
  <meta property="og:title" content="${escapeHtml(content.meta.title)}">
  <meta property="og:description" content="${escapeHtml(content.meta.description)}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${portraitUrl}">
  <meta property="og:image:alt" content="${escapeHtml(isEs ? 'Retrato de Jose Navas' : 'Portrait of Jose Navas')}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(content.meta.title)}">
  <meta name="twitter:description" content="${escapeHtml(content.meta.description)}">
  <meta name="twitter:image" content="${portraitUrl}">
  <title>${escapeHtml(content.meta.title)}</title>
  <link rel="icon" href="${prefix}favicon.svg" type="image/svg+xml">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="alternate" hreflang="es" href="${spanishUrl}">
  <link rel="alternate" hreflang="en" href="${englishUrl}">
  <link rel="alternate" hreflang="x-default" href="${spanishUrl}">
  <link rel="preload" href="${prefix}assets/fonts/SpaceGrotesk-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="${prefix}assets/fonts/Manrope-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${prefix}styles.css">
  <script type="application/ld+json">${structuredData}</script>
  <script type="module" src="${prefix}main.js"></script>
</head>
<body>
  <a class="skip-link" href="#main-content">${escapeHtml(content.ui.skipLabel)}</a>
  <div class="scroll-progress" aria-hidden="true"></div>
  <header class="site-header">
    <nav class="site-nav container" aria-label="${escapeHtml(isEs ? 'Navegación principal' : 'Primary navigation')}">
      <a class="brand" href="#inicio" aria-label="JN, ${escapeHtml(content.hero.name)}">JN</a>
      <ul class="nav-links">${navLinks}</ul>
      <div class="language-switcher" aria-label="${escapeHtml(content.ui.languageLabel)}">
        <span aria-current="page">${lang.toUpperCase()}</span>
        <a href="${otherHref}" data-language-link>${otherLabel}</a>
      </div>
    </nav>
  </header>
  <main id="main-content">
    <section class="hero section" id="inicio" aria-labelledby="hero-title">
      <div class="container hero-grid">
        <div class="hero-copy" data-reveal="hero-copy">
          <h1 id="hero-title">${escapeHtml(content.hero.name)}</h1>
          <p class="role">${escapeHtml(content.hero.role)}</p>
          <p class="hero-summary" id="hero-summary">${escapeHtml(content.hero.summary)}</p>
          <div class="hero-actions">
            <a class="button button-primary" href="#proyectos">${escapeHtml(content.hero.projectsLabel)}</a>
            <a class="button button-secondary" href="#contacto">${escapeHtml(content.hero.contactLabel)}</a>
          </div>
        </div>
        <figure class="hero-portrait" data-reveal="hero-portrait">
          <img src="${prefix}assets/profile/portrait.jpg" alt="${escapeHtml(isEs ? 'Retrato de Jose Navas' : 'Portrait of Jose Navas')}" width="480" height="640" fetchpriority="high" decoding="sync">
        </figure>
      </div>
    </section>
    <section class="metrics-section section" id="resultados" aria-labelledby="metrics-title">
      <div class="container">
        <h2 id="metrics-title" data-reveal="metrics-title">${escapeHtml(content.ui.metricsTitle)}</h2>
        <dl class="metrics-band" data-motion-group="metrics" aria-labelledby="metrics-title">${metrics}</dl>
      </div>
    </section>
    <section class="about section" id="sobre-mi" aria-labelledby="about-title">
      <div class="container about-grid">
        <div class="about-intro" data-reveal="about-intro"><h2 id="about-title">${escapeHtml(content.about.title)}</h2><p>${escapeHtml(content.about.summary)}</p>${cv}</div>
        <div class="about-details" data-reveal="about-details">
          <ol class="timeline">${timeline}</ol>
          <p class="education">${escapeHtml(content.about.education)}</p>
          ${certifications}
        </div>
      </div>
    </section>
    <section class="services section" id="servicios" aria-labelledby="services-title">
      <div class="container"><h2 id="services-title" data-reveal="services-title">${escapeHtml(content.services.title)}</h2><div class="services-grid" data-motion-group="services" role="list" aria-labelledby="services-title">${services}</div></div>
    </section>
    <section class="projects section" id="proyectos" aria-labelledby="projects-title">
      <div class="container"><h2 id="projects-title" data-reveal="projects-title">${escapeHtml(content.ui.projectsTitle)}</h2><div class="projects-list" data-motion-group="projects">${projects}</div></div>
    </section>
    <section class="working section" id="metodo" aria-labelledby="working-title">
      <div class="container working-panel" data-reveal="working"><h2 id="working-title">${escapeHtml(content.working.title)}</h2><div>${working}</div></div>
    </section>
    <section class="contact section" id="contacto" aria-labelledby="contact-title">
      <div class="container contact-grid">
        <div data-reveal="contact-copy"><h2 id="contact-title">${escapeHtml(content.contact.title)}</h2><p>${escapeHtml(content.contact.summary)}</p></div>
        <div class="contact-links" data-reveal="contact-links">
          <a href="mailto:${escapeHtml(content.contact.emailLabel)}">${escapeHtml(content.contact.emailLabel)}</a>
          <a href="tel:${escapeHtml(telephone)}">${escapeHtml(content.contact.phoneLabel)}</a>
          <a href="https://www.linkedin.com/in/jose-navas21">${escapeHtml(content.contact.linkedinLabel)}</a>
          <ul>${reasonLinks}</ul>
        </div>
      </div>
    </section>
  </main>
  <footer><div class="container"><p>© Jose Navas</p></div></footer>
  <dialog class="image-dialog" aria-label="${escapeHtml(content.ui.evidenceLabel)}">
    <button type="button" data-dialog-close>${escapeHtml(content.ui.closeLabel)}</button>
    <img alt="">
  </dialog>
</body>
</html>`;
}
