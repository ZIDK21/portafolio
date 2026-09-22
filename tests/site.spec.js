import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('language control keeps a fixed ES/EN track and marks its active stop', async ({ page }) => {
  await page.goto('./#inicio');

  let switcher = page.locator('.language-switcher');
  await expect(switcher).toHaveAttribute('data-language', 'es');
  await expect(switcher.locator('[data-language-option]')).toHaveCount(2);
  await expect(switcher.locator('[data-language-option="es"]')).toHaveAttribute('aria-current', 'page');
  await expect(switcher.locator('[data-language-option="en"]')).toHaveText('English');
  await expect(switcher.locator('.language-indicator')).toHaveCSS('view-transition-name', 'language-indicator');

  const esPosition = await switcher.locator('[data-language-option="es"]').evaluate((element) => element.getBoundingClientRect().left);
  const enPosition = await switcher.locator('[data-language-option="en"]').evaluate((element) => element.getBoundingClientRect().left);
  expect(esPosition).toBeLessThan(enPosition);

  await page.getByRole('link', { name: 'English', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/#inicio$/);

  switcher = page.locator('.language-switcher');
  await expect(switcher).toHaveAttribute('data-language', 'en');
  await expect(switcher.locator('[data-language-option="en"]')).toHaveAttribute('aria-current', 'page');
  await expect(switcher.locator('[data-language-option="es"]')).toHaveText('Español');
  await expect(switcher.locator('.language-indicator')).toHaveCSS('view-transition-name', 'language-indicator');
});

test('language preserves the selected case in both directions', async ({ page }) => {
  await page.goto('./#dlro');
  await expect(page.locator('#dlro')).toBeInViewport();
  await page.getByRole('link', { name: 'English', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/#dlro$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#dlro')).toBeInViewport();
  await page.getByRole('link', { name: 'Español', exact: true }).click();
  await expect(page).toHaveURL(/\/portfolio-test\/#dlro$/);
});

test('evidence dialog opens, closes with Escape, and restores focus', async ({ page }) => {
  await page.goto('./#dns');
  const trigger = page.locator('[data-evidence-link]').first();
  await trigger.focus();
  await trigger.press('Enter');
  const dialog = page.locator('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button')).toBeFocused();
  await expect(dialog.locator('img')).toHaveAttribute('src', /assets\/dns\/01-cover\.png$/);
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test('language ignores a stale hash after the user scrolls to another case', async ({ page }) => {
  await page.goto('./#inicio');
  await page.locator('#dlro').scrollIntoViewIfNeeded();
  await page.getByRole('link', { name: 'English', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/#dlro$/);
});

test('an invalid encoded hash does not break the language switcher', async ({ page }) => {
  await page.goto('./#%E0%A4%A');
  await page.getByRole('link', { name: 'English', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/#inicio$/);
});

test('server redirects directory URLs and serves the SVG favicon with its MIME type', async ({ request }) => {
  const directory = await request.get('http://127.0.0.1:4173/portfolio-test/en', { maxRedirects: 0 });
  expect(directory.status()).toBe(308);
  expect(directory.headers().location).toBe('/portfolio-test/en/');
  const favicon = await request.get('http://127.0.0.1:4173/portfolio-test/favicon.svg');
  expect(favicon.status()).toBe(200);
  expect(favicon.headers()['content-type']).toBe('image/svg+xml');
  const traversal = await request.get('http://127.0.0.1:4173/portfolio-test/%2e%2e/package.json', { maxRedirects: 0 });
  expect([403, 404]).toContain(traversal.status());
});

test('service icons load from local Lucide SVG files in Spanish and English', async ({ page }) => {
  for (const path of ['./', './en/']) {
    await page.goto(path);
    const icons = page.locator('.service-icon');
    await expect(icons).toHaveCount(3);
    const sources = await icons.evaluateAll((nodes) => nodes.map((node) => new URL(node.src).pathname.split('/').at(-1)));
    expect(sources.sort()).toEqual(['briefcase-business.svg', 'headset.svg', 'workflow.svg']);
    for (const icon of await icons.all()) {
      await expect.poll(() => icon.evaluate((node) => node.complete && node.naturalWidth === 24)).toBe(true);
    }
  }
});

test('essential navigation and evidence remain available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/portfolio-test/#dns');
  await expect(page.locator('#dns')).toContainText('ProtonVPN');
  await expect(page.getByRole('link', { name: 'English', exact: true })).toHaveAttribute('href', './en/');
  await expect(page.locator('[data-evidence-link]')).toHaveAttribute('href', './assets/dns/01-cover.png');
  await context.close();
});

test('pages have no serious accessibility violations or failed resources', async ({ page }) => {
  const failures = [];
  await page.emulateMedia({ reducedMotion: 'reduce' });
  page.on('response', (response) => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
  for (const path of ['./', './en/']) {
    await page.goto(path);
    await expect(page.locator('[data-reveal="hero-copy"]')).toHaveCSS('opacity', '1');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact))).toEqual([]);
  }
  expect(failures).toEqual([]);
});

test('both languages reflow without page or navigation overflow', async ({ page }) => {
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['./', './en/']) {
      await page.goto(path);
      await page.evaluate(() => document.fonts?.ready);
      const dimensions = await page.locator('html').evaluate((element) => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }));
      expect(dimensions.scrollWidth, `${path} at ${width}px`).toBeLessThanOrEqual(dimensions.clientWidth + 1);
      const navFits = await page.locator('.nav-links a').evaluateAll((links) => links.every((link) => {
        const box = link.getBoundingClientRect();
        return box.left >= -1 && box.right <= document.documentElement.clientWidth + 1;
      }));
      expect(navFits, `navigation ${path} at ${width}px`).toBe(true);
    }
  }
});

test('accessibility preferences keep content stable and lazy evidence loads', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await page.goto('./#dns');
  const preferences = await page.locator('.site-header').evaluate((header) => ({
    backdrop: getComputedStyle(header).backdropFilter,
    scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
  }));
  expect(preferences.backdrop).toBe('none');
  expect(preferences.scrollBehavior).toBe('auto');
  const evidence = page.locator('[data-evidence-link] img');
  await evidence.scrollIntoViewIfNeeded();
  await expect.poll(() => evidence.evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
});

test('reduced motion disables transitions', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto('./#proyectos');
  const t = await page.locator('.button-primary').evaluate(e => getComputedStyle(e).transitionDuration);
  expect(['0s', '0.01ms']).toContain(t);
});

test('reveals content on entry and keeps section wayfinding current', async ({ page }) => {
  await page.goto('./#inicio');
  await expect(page.locator('[data-reveal="hero-copy"]')).toHaveClass(/is-visible/);
  await page.locator('#servicios').scrollIntoViewIfNeeded();
  await expect(page.locator('#servicios .service').first()).toHaveClass(/is-visible/);
  await expect(page.locator('.nav-links a[aria-current="location"]')).toHaveAttribute('href', '#servicios');
  const progressTransform = await page.locator('.scroll-progress').evaluate((element) => getComputedStyle(element).transform);
  expect(progressTransform).not.toBe('none');
});

test('hash navigation updates wayfinding immediately', async ({ page }) => {
  await page.goto('./#inicio');
  await page.evaluate(() => {
    history.pushState(null, '', '#servicios');
    dispatchEvent(new HashChangeEvent('hashchange'));
  });
  await expect(page.locator('.nav-links a[aria-current="location"]')).toHaveAttribute('href', '#servicios');
});

test('scroll progress uses native scroll-driven motion when available', async ({ page }) => {
  await page.goto('./#inicio');
  const progress = await page.locator('.scroll-progress').evaluate((element) => ({
    inlineTransform: element.style.transform,
    animationName: getComputedStyle(element).animationName,
    supportsScrollTimeline: CSS.supports('animation-timeline: scroll()')
  }));
  expect(progress.inlineTransform).toBe('');
  if (progress.supportsScrollTimeline) expect(progress.animationName).toContain('scroll-progress');
});

test('turning on reduced motion after load reveals pending content', async ({ page }) => {
  await page.goto('./#inicio');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const hiddenReveals = await page.locator('[data-reveal]').evaluateAll((elements) => elements.filter((element) => {
    const styles = getComputedStyle(element);
    return styles.opacity === '0' || styles.transform !== 'none';
  }).length);
  expect(hiddenReveals).toBe(0);
});

test('reduced motion keeps reveal content visible without movement', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  const hiddenReveals = await page.locator('[data-reveal]').evaluateAll((elements) => elements.filter((element) => {
    const styles = getComputedStyle(element);
    return styles.opacity === '0' || styles.transform !== 'none';
  }).length);
  expect(hiddenReveals).toBe(0);
});
