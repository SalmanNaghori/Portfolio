/* Use an installed Playwright or set PLAYWRIGHT_MODULE to playwright-core's directory. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const url = process.env.PORTFOLIO_URL || 'http://127.0.0.1:4173';
  const screenshots = path.resolve(__dirname, '../docs/evidence');
  fs.mkdirSync(screenshots, { recursive: true });
  try {
    await page.goto(url);
    const dialog = page.locator('#command-palette');
    const input = page.locator('#command-input');
    const resultTitles = () => page.locator('.search-result-title').allTextContents();
    const open = () => page.getByRole('button', { name: 'Search portfolio and navigation' }).click();
    await open();
    assert.equal(await input.evaluate(el => el === document.activeElement), true);
    await page.locator('#search-status').filter({ hasText: 'Search titles' }).waitFor();
    await page.screenshot({ path: path.join(screenshots, 'search-suggestions-desktop.png') });
    await input.fill('trex');
    assert.equal((await resultTitles())[0], 'TREX');
    await page.getByRole('button', { name: 'Projects', exact: true }).click();
    await input.fill('previously fetched');
    assert.deepEqual(await resultTitles(), ['HajiNaji']);
    assert.ok(await page.locator('.search-result mark').count() > 0);
    await input.fill('Flutter offline');
    assert.deepEqual(await resultTitles(), ['Educational eReader']);
    await input.fill('ObjectBox');
    assert.deepEqual(await resultTitles(), ['HajiNaji']);
    await page.getByRole('button', { name: 'All', exact: true }).click();
    await page.locator('#search-status').filter({ hasText: 'ObjectBox' }).waitFor();
    await page.screenshot({ path: path.join(screenshots, 'search-results-desktop.png') });
    await page.getByRole('button', { name: 'Skills', exact: true }).click();
    assert.deepEqual(await resultTitles(), ['Data & Device Features']);
    await page.getByRole('button', { name: 'Clear search text' }).click();
    assert.equal((await resultTitles()).length, 6);
    await page.getByRole('button', { name: 'Projects', exact: true }).click();
    assert.equal((await resultTitles()).length, 9);
    await input.fill('healthcare');
    assert.deepEqual(await resultTitles(), ['Hexia']);
    await input.fill('<img src=x onerror=alert(1)>');
    assert.equal(await page.locator('#search-empty').isVisible(), true);
    assert.equal(await page.locator('#search-empty img').count(), 0);
    await page.getByRole('button', { name: 'Reset search' }).click();
    assert.equal(await page.locator('#search-start').isVisible(), true);
    await page.getByRole('button', { name: 'Offline access' }).click();
    assert.equal(await input.inputValue(), 'offline');
    assert.ok((await resultTitles()).length > 0);
    await input.fill('hajinaji');
    await input.press('ArrowDown');
    assert.equal(await page.locator('.search-result').first().evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('ArrowUp');
    assert.equal(await input.evaluate(el => el === document.activeElement), true);
    await input.press('Enter');
    assert.equal(await dialog.evaluate(el => el.open), false);
    assert.ok(page.url().endsWith('#project-hajinaji'));
    assert.equal(await page.locator('#project-hajinaji').evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('Control+k');
    assert.equal(await dialog.evaluate(el => el.open), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#project-hajinaji').evaluate(el => el === document.activeElement), true);
    await open();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.command-trigger').evaluate(el => el === document.activeElement), true);
    await open();
    for (let i = 0; i < 24; i += 1) {
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.querySelector('#command-palette').contains(document.activeElement)), true);
    }
    await page.keyboard.press('Escape');
    await open();
    await page.mouse.click(5, 5);
    assert.equal(await dialog.evaluate(el => el.open), false);
    // Newly added published content is indexed on load, without a separate search database.
    await page.route('**/index.html', async route => {
      const response = await route.fetch();
      const html = await response.text();
      await route.fulfill({ response, body: html.replace('Travel-content platform', 'DistinctiveSearchFixture Travel-content platform') });
    });
    await page.goto(`${url}/index.html`);
    await open();
    await input.fill('DistinctiveSearchFixture');
    assert.deepEqual(await resultTitles(), ['TREX']);
    await page.unroute('**/index.html');
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(url);
      await open();
      await input.fill('flutter');
      await page.locator('#search-status').filter({ hasText: 'flutter' }).waitFor();
      const dimensions = await dialog.evaluate(el => ({ scroll: el.scrollWidth, client: el.clientWidth }));
      assert.ok(dimensions.scroll <= dimensions.client, `No horizontal overflow at ${width}px`);
      await page.locator('.search-result').last().focus();
      assert.equal(await page.locator('.search-result').last().evaluate(el => {
        const box = el.getBoundingClientRect();
        return box.top >= 0 && box.bottom <= window.innerHeight;
      }), true);
      await input.focus();
      if (width === 390) await page.screenshot({ path: path.join(screenshots, 'search-results-mobile.png') });
      await input.fill('no-such-project-123');
      assert.equal(await page.locator('#search-empty').isVisible(), true);
      if (width === 390) await page.screenshot({ path: path.join(screenshots, 'search-empty-mobile.png') });
    }
    assert.deepEqual(errors, []);
    console.log('PASS: ranking, content indexing, scopes, highlights, empty/reset states, safe text rendering, navigation, focus restoration/trap, shortcuts, backdrop, mobile overflow, and no browser errors.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
