// Motion sobrio CSS-first: la página sigue completa sin JS, y cada reveal respeta las preferencias del sistema.
document.documentElement.classList.add('js');
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
let reduce = motionQuery.matches;
const revealElements = [...document.querySelectorAll('[data-reveal]')];
let revealObserver = null;

function showReveal(element) {
  element.classList.add('is-visible');
}

function showAllReveals() {
  revealElements.forEach(showReveal);
}

function observeReveals() {
  if (reduce || !('IntersectionObserver' in window)) {
    showAllReveals();
    return;
  }

  revealObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      showReveal(entry.target);
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
  revealElements.forEach((element) => revealObserver.observe(element));
}

observeReveals();

function onMotionPreferenceChange(event) {
  reduce = event.matches;
  if (!reduce) return;
  revealObserver?.disconnect();
  showAllReveals();
}

if (typeof motionQuery.addEventListener === 'function') {
  motionQuery.addEventListener('change', onMotionPreferenceChange);
} else {
  motionQuery.addListener?.(onMotionPreferenceChange);
}

const languageLink = document.querySelector('[data-language-link]');
const header = document.querySelector('.site-header');
const scrollProgress = document.querySelector('.scroll-progress');
const nativeScrollProgress = typeof CSS !== 'undefined' && CSS.supports('animation-timeline: scroll()');

function currentSectionId() {
  let hashId = '';
  try { hashId = decodeURIComponent(location.hash.slice(1)); } catch { hashId = ''; }
  const headerBottom = header?.getBoundingClientRect().bottom ?? 0;
  const hashElement = hashId ? document.getElementById(hashId) : null;
  if (hashElement) {
    const hashRect = hashElement.getBoundingClientRect();
    const hashIsVisible = hashRect.bottom > headerBottom + 1 && hashRect.top < innerHeight;
    if (hashIsVisible || performance.now() < preserveHashUntil) return hashId;
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
let preserveHashUntil = 0;
const initialHashId = location.hash.slice(1);
if (initialHashId && initialHashId !== navSections[0]?.id && document.getElementById(initialHashId)) {
  preserveHashUntil = performance.now() + 1200;
}

function updateFallbackProgress(sectionId) {
  if (!scrollProgress || nativeScrollProgress || reduce) return;
  const index = navSections.findIndex((section) => section.id === sectionId);
  const progress = index >= 0 && navSections.length > 1 ? index / (navSections.length - 1) : 0;
  scrollProgress.style.transform = `scaleX(${progress.toFixed(4)})`;
}

const setActiveSection = (sectionId) => {
  navLinks.forEach((link) => {
    const isActive = link.getAttribute('href') === `#${sectionId}`;
    link.classList.toggle('is-active', isActive);
    if (isActive) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  updateFallbackProgress(sectionId);
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

addEventListener('hashchange', () => {
  preserveHashUntil = performance.now() + 1200;
  setActiveSection(sectionFromHash());
  updateLanguageDestination();
});

languageLink?.addEventListener('focus', updateLanguageDestination);
languageLink?.addEventListener('pointerdown', updateLanguageDestination);
languageLink?.addEventListener('click', updateLanguageDestination);

const dialog = document.querySelector('.image-dialog');
const dialogImage = dialog?.querySelector('img');
const closeButton = dialog?.querySelector('[data-dialog-close]');
let dialogOpener = null;
let dialogAnimation = null;

function playDialogEntrance() {
  if (!dialog || reduce || typeof dialog.animate !== 'function') return;
  dialog.style.animation = 'none';
  dialogAnimation?.cancel();
  dialogAnimation = dialog.animate([
    { opacity: 0, transform: 'scale(.985)' },
    { opacity: 1, transform: 'scale(1)' }
  ], {
    duration: 180,
    easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
    fill: 'both'
  });
}

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
    if (typeof dialog.animate === 'function') dialog.style.animation = 'none';
    dialog.showModal();
    playDialogEntrance();
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
  dialogAnimation?.cancel();
  dialogAnimation = null;
  dialog?.style.removeProperty('animation');
  dialogImage?.removeAttribute('src');
  if (dialogImage) dialogImage.alt = '';
  dialogOpener?.focus();
  dialogOpener = null;
});
