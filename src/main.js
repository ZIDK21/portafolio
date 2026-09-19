// Motion sobrio CSS-first: WAAPI/Motion solo bajo este guard; sin JS la pagina queda completa y el cambio de idioma nunca espera animacion.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduce && 'animate' in Element.prototype) { /* animación WAAPI/Motion aquí — solo springs/gestos imposibles en CSS; sin uso actual: press/dialog/hover ya cubiertos en CSS */ }

const languageLink = document.querySelector('[data-language-link]');
const header = document.querySelector('.site-header');

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
