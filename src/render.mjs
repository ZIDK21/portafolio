const entities = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'};

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => entities[character]);
}

function safeAssetPath(value) {
  if (!/^(?:assets|downloads)\/[A-Za-z0-9_./-]+$/.test(value) || value.includes('..')) {
    throw new Error(`Invalid local asset path: ${value}`);
  }
  return value;
}

const renderList = (items, className, renderItem) =>
  `<ul class="${className}">${items.map(renderItem).join('')}</ul>`;

export function renderPage(content, lang) {
  if (!['es', 'en'].includes(lang)) throw new Error(`Unsupported language: ${lang}`);
  const prefix = lang === 'en' ? '../' : './';
  const otherHref = lang === 'en' ? '../' : './en/';
  const otherLabel = lang === 'en' ? 'Español' : 'English';
  const isEs = lang === 'es';
  const navLinks = content.nav.map((item) =>
    `<li><a href="#${escapeHtml(item.id)}">${escapeHtml(item.label)}</a></li>`).join('');
  const metrics = content.metrics.map((metric) => `
    <div class="metric" data-metric="${escapeHtml(metric.id)}">
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
    <div class="service service-${index + 1}" id="service-${escapeHtml(item.id)}">
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.description)}</p>
    </div>`).join('');
  const projects = content.projects.map((project, index) => {
    const evidence = project.evidence.image ? `
      <a class="evidence-link" href="${prefix}${safeAssetPath(project.evidence.image)}" data-evidence-link>
        <img src="${prefix}${safeAssetPath(project.evidence.image)}" alt="${escapeHtml(project.evidence.alt)}" width="1024" height="768" loading="lazy">
        <span>${escapeHtml(content.ui.expandLabel)}</span>
      </a>` : '';
    const downloads = project.downloads.length ? `
      <div class="downloads">
        <h4>${escapeHtml(content.ui.pdfLabel)}</h4>
        ${project.downloads.map((download) => `<a href="${prefix}${safeAssetPath(download.href)}" download>${escapeHtml(download.label)}</a>`).join('')}
      </div>` : '';
    const stack = renderList(project.stack, 'stack-list', (item) => `<li>${escapeHtml(item)}</li>`);
    return `
      <article class="project project-${index + 1}" id="${escapeHtml(project.id)}">
        <header class="project-heading">
          <h3>${escapeHtml(project.title)}</h3>
          <p class="project-summary">${escapeHtml(project.summary)}</p>
        </header>
        <div class="project-body">
          <div class="project-copy">
            <section><h4>${escapeHtml(content.ui.problemLabel)}</h4><p>${escapeHtml(project.problem)}</p></section>
            <section><h4>${escapeHtml(content.ui.actionLabel)}</h4><p>${escapeHtml(project.action)}</p></section>
            <section><h4>${escapeHtml(content.ui.resultLabel)}</h4><p>${escapeHtml(project.result)}</p></section>
            <section><h4>${escapeHtml(content.ui.stackLabel)}</h4>${stack}</section>
          </div>
          <aside class="evidence">
            <h4>${escapeHtml(content.ui.evidenceLabel)}</h4>
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
  <meta name="theme-color" content="#f5f7fa">
  <title>${escapeHtml(content.meta.title)}</title>
  <link rel="icon" href="${prefix}favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="${prefix}styles.css">
  <script type="module" src="${prefix}main.js"></script>
</head>
<body>
  <a class="skip-link" href="#main-content">${escapeHtml(content.ui.skipLabel)}</a>
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
    <section class="hero section" id="inicio">
      <div class="container hero-grid">
        <div class="hero-copy">
          <p class="role">${escapeHtml(content.hero.role)}</p>
          <h1>${escapeHtml(content.hero.name)}</h1>
          <p class="hero-summary">${escapeHtml(content.hero.summary)}</p>
          <div class="hero-actions">
            <a class="button button-primary" href="#proyectos">${escapeHtml(content.hero.projectsLabel)}</a>
            <a class="button button-secondary" href="#contacto">${escapeHtml(content.hero.contactLabel)}</a>
          </div>
        </div>
        <figure class="hero-portrait">
          <img src="${prefix}assets/profile/portrait.jpg" alt="${escapeHtml(isEs ? 'Retrato de Jose Navas' : 'Portrait of Jose Navas')}" width="480" height="640" fetchpriority="high">
        </figure>
      </div>
    </section>
    <section class="metrics-section section" id="resultados">
      <div class="container">
        <h2>${escapeHtml(content.ui.metricsTitle)}</h2>
        <dl class="metrics-band">${metrics}</dl>
      </div>
    </section>
    <section class="about section" id="sobre-mi">
      <div class="container about-grid">
        <div class="about-intro"><h2>${escapeHtml(content.about.title)}</h2><p>${escapeHtml(content.about.summary)}</p>${cv}</div>
        <div class="about-details">
          <ol class="timeline">${timeline}</ol>
          <p class="education">${escapeHtml(content.about.education)}</p>
          ${certifications}
        </div>
      </div>
    </section>
    <section class="services section" id="servicios">
      <div class="container"><h2>${escapeHtml(content.services.title)}</h2><div class="services-grid">${services}</div></div>
    </section>
    <section class="projects section" id="proyectos">
      <div class="container"><h2>${escapeHtml(content.ui.projectsTitle)}</h2><div class="projects-list">${projects}</div></div>
    </section>
    <section class="working section" id="metodo">
      <div class="container working-panel"><h2>${escapeHtml(content.working.title)}</h2><div>${working}</div></div>
    </section>
    <section class="contact section" id="contacto">
      <div class="container contact-grid">
        <div><h2>${escapeHtml(content.contact.title)}</h2><p>${escapeHtml(content.contact.summary)}</p></div>
        <div class="contact-links">
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
