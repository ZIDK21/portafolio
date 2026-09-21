// Motion sobrio CSS-first: la página sigue completa sin JS, y cada reveal respeta las preferencias del sistema.
document.documentElement.classList.add('js');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealElements = [...document.querySelectorAll('[data-reveal]')];

function showReveal(element) {
  element.classList.add('is-visible');
}

if (reduce || !('IntersectionObserver' in window)) {
  revealElements.forEach(showReveal);
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      showReveal(entry.target);
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
  revealElements.forEach((element) => revealObserver.observe(element));
}

const languageLink = document.querySelector('[data-language-link]');
const header = document.querySelector('.site-header');
const scrollProgress = document.querySelector('.scroll-progress');

let progressFrame = 0;
function updateScrollProgress() {
  progressFrame = 0;
  if (!scrollProgress) return;
  const maxScroll = document.documentElement.scrollHeight - innerHeight;
  const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollY / maxScroll)) : 0;
  scrollProgress.style.setProperty('--scroll-scale', progress.toFixed(4));
}

function requestScrollProgress() {
  if (progressFrame) return;
  progressFrame = requestAnimationFrame(updateScrollProgress);
}

addEventListener('scroll', requestScrollProgress, { passive: true });
addEventListener('resize', requestScrollProgress, { passive: true });
updateScrollProgress();

function currentSectionId() {
  let hashId = '';
  try { hashId = decodeURIComponent(location.hash.slice(1)); } catch { hashId = ''; }
  const headerBottom = header?.getBoundingClientRect().bottom ?? 0;
  const hashElement = hashId ? document.getElementById(hashId) : null;
  if (hashElement) {
    const hashRect = hashElement.getBoundingClientRect();
    if (hashRect.bottom > headerBottom + 1 && hashRect.top < innerHeight) return hashId;
  }

  const candidates = [
    ...document.querySelectorAll('main article[id]'),
    ...document.querySelectorAll('main > section[id]')
  ];
  const visible = candidates
    .map((element) => ({ element, rect: element.getBoundingClientRect() }))
    .filter(({ rect }) => rect.bottom > headerBottom + 1 && rect.top < innerHeight)
    .sort((a, b) => {
      const aArticle = a.element.matches('article') ? 0 : 1;
      const bArticle = b.element.matches('article') ? 0 : 1;
      if (aArticle !== bArticle) return aArticle - bArticle;
      return Math.abs(a.rect.top - headerBottom) - Math.abs(b.rect.top - headerBottom);
    });
  return visible[0]?.element.id || 'inicio';
}

function updateLanguageDestination() {
  if (!languageLink) return;
  const destination = new URL(languageLink.getAttribute('href'), location.href);
  destination.hash = currentSectionId();
  languageLink.href = destination.href;
}

const navLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
const navSections = [...document.querySelectorAll('main > section[id]')];
const setActiveSection = (sectionId) => {
  navLinks.forEach((link) => {
    const isActive = link.getAttribute('href') === `#${sectionId}`;
    link.classList.toggle('is-active', isActive);
    if (isActive) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
};

function sectionFromHash() {
  const hash = location.hash.slice(1);
  const target = hash ? document.getElementById(hash) : null;
  return target?.closest('main > section[id]')?.id || (navSections[0]?.id ?? 'inicio');
}

setActiveSection(sectionFromHash());
if ('IntersectionObserver' in window && navSections.length) {
  const sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
    if (visible[0]) setActiveSection(visible[0].target.id);
  }, { rootMargin: '-42% 0px -48% 0px', threshold: [0, 0.2, 0.5] });
  navSections.forEach((section) => sectionObserver.observe(section));
}

languageLink?.addEventListener('focus', updateLanguageDestination);
languageLink?.addEventListener('pointerdown', updateLanguageDestination);
languageLink?.addEventListener('click', updateLanguageDestination);

const dialog = document.querySelector('.image-dialog');
const dialogImage = dialog?.querySelector('img');
const closeButton = dialog?.querySelector('[data-dialog-close]');
let dialogOpener = null;

document.querySelectorAll('[data-evidence-link]').forEach((link) => {
  link.addEventListener('click', (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!dialog || !dialogImage || typeof dialog.showModal !== 'function') return;
    event.preventDefault();
    const sourceImage = link.querySelector('img');
    if (!sourceImage) return;
    dialogOpener = link;
    dialogImage.src = link.href;
    dialogImage.alt = sourceImage.alt;
    dialog.showModal();
    closeButton?.focus();
  });
});

closeButton?.addEventListener('click', () => dialog?.close());
dialog?.addEventListener('keydown', (event) => {
  if (event.key === 'Tab' && closeButton) {
    event.preventDefault();
    closeButton.focus();
  }
});
dialog?.addEventListener('close', () => {
  dialogImage?.removeAttribute('src');
  if (dialogImage) dialogImage.alt = '';
  dialogOpener?.focus();
  dialogOpener = null;
});
