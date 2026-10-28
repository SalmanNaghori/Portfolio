const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/opt/homebrew/lib/node_modules/rea-agents/node_modules/playwright-core');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');

// Simple static server for testing
function startStaticServer(dir, port) {
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.cjs': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(dir, reqPath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

(async () => {
  const port = 4185;
  const server = await startStaticServer(path.resolve(__dirname, '..'), port);
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
    acceptDownloads: true
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  const screenshotsDir = path.resolve(__dirname, '../docs/evidence');
  fs.mkdirSync(screenshotsDir, { recursive: true });

  try {
    await page.goto(`http://127.0.0.1:${port}`);

    // Verify Wall Section exists
    const wallSection = page.locator('#wall');
    await assert.equal(await wallSection.count(), 1, 'Wall section exists');

    // Verify initial notes rendered
    const initialCards = page.locator('#wall-grid .wall-card');
    const initialCount = await initialCards.count();
    assert.ok(initialCount >= 4, `Expected at least 4 default cards, got ${initialCount}`);

    // Verify badge
    const badge = page.locator('#wall-count-badge');
    const badgeText = await badge.textContent();
    assert.ok(badgeText.includes(`${initialCount} notes`), `Badge shows ${badgeText}`);

    // Open Drop Note Dialog
    await page.locator('#wall-drop-btn').click();
    const dialog = page.locator('#wall-dialog');
    assert.equal(await dialog.evaluate(el => el.open), true, 'Dialog is open');

    // Fill form
    await page.locator('#wall-name-input').fill('Sarah Connor');
    await page.locator('#wall-msg-input').fill('This interactive wall is awesome! Clean architecture!');

    // Select color swatch (e.g. 2nd color)
    const swatches = page.locator('.wall-color-swatch');
    await swatches.nth(1).click();

    // Draw on canvas
    const canvas = page.locator('#wall-canvas');
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 20, box.y + 20);
      await page.mouse.down();
      await page.mouse.move(box.x + 80, box.y + 50);
      await page.mouse.move(box.x + 140, box.y + 20);
      await page.mouse.up();
    }

    // Submit note
    await page.locator('#wall-form button[type="submit"]').click();

    // Check dialog closed
    assert.equal(await dialog.evaluate(el => el.open), false, 'Dialog closed');

    // Verify card added
    const updatedCount = await initialCards.count();
    assert.equal(updatedCount, initialCount + 1, 'Card count incremented');

    const firstCardName = await page.locator('#wall-grid .wall-card-name').first().textContent();
    assert.equal(firstCardName, 'Sarah Connor');

    const firstCardHasDrawing = await page.locator('#wall-grid .wall-card').first().locator('.wall-card-drawing img').count();
    assert.equal(firstCardHasDrawing, 1, 'Drawing image rendered');

    // Screenshot of the Wall section
    await page.locator('#wall').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(screenshotsDir, 'wall-desktop.png') });
    console.log('Saved screenshot: docs/evidence/wall-desktop.png');

    // Test Export to CSV
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#wall-export-btn').click()
    ]);

    assert.equal(download.suggestedFilename(), 'notes.csv', 'Download filename is notes.csv');
    const downloadPath = path.join(screenshotsDir, 'test-downloaded-notes.csv');
    await download.saveAs(downloadPath);

    const csvContent = fs.readFileSync(downloadPath, 'utf8');
    const csvLines = csvContent.trim().split('\n');
    assert.equal(csvLines[0], 'id,name,date,message,color,has_drawing', 'CSV header correct');
    assert.equal(csvLines.length, updatedCount + 1, 'CSV has header + all note lines');
    assert.ok(csvContent.includes('"Sarah Connor"'), 'CSV contains newly added note author');
    assert.ok(csvContent.includes('"This interactive wall is awesome! Clean architecture!"'), 'CSV contains message');

    fs.unlinkSync(downloadPath);
    console.log('All Wall browser tests passed successfully!');
  } finally {
    await browser.close();
    server.close();
  }
})();

