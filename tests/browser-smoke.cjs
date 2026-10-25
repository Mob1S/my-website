const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');

// Uses a separate production preview; no real chat messages or admin writes.
async function main() {
  const origin = 'http://127.0.0.1:4175';
  const vite = path.join(path.dirname(require.resolve('vite/package.json')), 'bin/vite.js');
  const preview = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', '4175', '--strictPort'], { stdio: 'pipe', windowsHide: true });
  let browser, logs = '';
  preview.stdout.on('data', text => { logs += text; });
  preview.stderr.on('data', text => { logs += text; });
  try {
    for (let i = 0; ; i++) {
      if (preview.exitCode !== null) throw new Error(logs);
      if (await fetch(origin).then(r => r.ok, () => false)) break;
      if (i === 50) throw new Error(`Preview startup timed out: ${logs}`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const channel = process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined);
    browser = await chromium.launch({ headless: true, channel });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.addInitScript(() => {
      const raf = requestAnimationFrame, cancel = cancelAnimationFrame;
      const interval = setInterval, clear = clearInterval;
      window.activeFrames = new Set(); window.activeIntervals = new Set();
      window.requestAnimationFrame = callback => {
        const id = raf(time => { activeFrames.delete(id); callback(time); });
        activeFrames.add(id); return id;
      };
      window.cancelAnimationFrame = id => { activeFrames.delete(id); cancel(id); };
      window.setInterval = (...args) => { const id = interval(...args); activeIntervals.add(id); return id; };
      window.clearInterval = id => { activeIntervals.delete(id); clear(id); };
    });
    let requests = 0, fail = true;
    await page.route('**/admin/data/traveled-cities.json', route => {
      requests++;
      return fail ? route.fulfill({ status: 503, body: 'unavailable' }) : route.continue();
    });
    await page.goto(origin, { waitUntil: 'networkidle' });
    await page.locator('.layer-top #mymap').scrollIntoViewIfNeeded();
    await page.locator('.layer-top .map-placeholder button').waitFor();
    assert.equal(requests, 1);
    fail = false;
    await page.locator('.layer-top .map-placeholder button').click();
    await page.waitForSelector('.layer-top .province-path');
    assert.equal(requests, 2);
    assert.equal(await page.locator('.layer-bottom .province-path').count(), 34);
    await fs.mkdir('test-results', { recursive: true });
    for (const width of [1440, 768, 375, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      const result = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        duplicateIds: [...document.querySelectorAll('[id]')].map(el => el.id).filter((id, i, ids) => ids.indexOf(id) !== i),
        heights: [...document.querySelectorAll('.layer-top .section')].map((el, i) => Math.round(el.getBoundingClientRect().height - document.querySelectorAll('.layer-bottom .section')[i].getBoundingClientRect().height)),
      }));
      assert.equal(result.overflow, false, `Overflow at ${width}px`);
      assert.deepEqual(result.duplicateIds, []);
      assert.deepEqual(result.heights, [0, 0, 0, 0, 0]);
      await page.screenshot({ path: `test-results/home-${width}.png`, fullPage: true });
    }
    await page.route('**/api/chat', route => route.fulfill({ contentType: 'text/event-stream', body: 'data: {"choices":[{"delta":{"content":"模拟回复"}}]}\n\ndata: [DONE]\n\n' }));
    await page.locator('.layer-top #chat').scrollIntoViewIfNeeded();
    await page.locator('#chatInput').fill('模拟消息');
    await page.locator('#chatSendBtn').click();
    await page.waitForFunction(() => document.querySelector('#chatMessages').textContent.includes('模拟回复'));
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForFunction(() => scrollY === 0);
    const points = await page.locator('.layer-top .track-detect').evaluate(el => {
      const points = [], matrix = el.getScreenCTM();
      for (let d = 0; d < el.getTotalLength(); d += 8) {
        const p = el.getPointAtLength(d), screen = new DOMPoint(p.x, p.y).matrixTransform(matrix);
        points.push({ x: screen.x, y: screen.y });
      }
      return points;
    });
    for (const point of points) await page.mouse.move(point.x, point.y);
    await page.locator('[role=dialog]').waitFor();
    assert.equal(await page.locator('.layer-top').getAttribute('inert'), '');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[role=dialog]').count(), 0);
    await page.mouse.move(700, 500);
    await page.waitForFunction(() => document.querySelector('.layer-top').style.maskImage !== 'none');
    // The paper/carbon reveal remains available while reading below the hero.
    await page.evaluate(() => document.getElementById('about').scrollIntoView({ behavior: 'instant' }));
    await page.mouse.move(700, 400);
    await page.waitForFunction(() => document.querySelector('.layer-top').style.maskImage !== 'none');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForFunction(() => document.querySelector('.layer-top').style.maskImage !== 'none');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => document.querySelector('.layer-top').style.maskImage === 'none');
    await page.waitForFunction(() => !document.querySelector('#particle-canvas'));
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForFunction(() => Number(document.querySelector('.telemetry-bar .tel-item:nth-child(4) .tel-value').textContent) > 0);
    assert.equal(await page.locator('#particle-canvas').evaluate(canvas => canvas.getContext('webgl2').isContextLost()), false);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => document.querySelector('#app').__vue_app__.unmount());
    await page.waitForTimeout(100);
    assert.deepEqual(await page.evaluate(() => ({ frames: activeFrames.size, timers: activeIntervals.size })), { frames: 0, timers: 0 });
    for (const url of ['detail.html?id=verstappen', 'city-detail.html?id=610000_xian', 'map-detail.html?id=610000', 'gallery.html?src=person&id=verstappen', 'credits.html', 'purpose-about.html', 'purpose-hobbies.html', 'purpose-map.html', 'purpose-ai.html', 'admin/admin.html']) {
      const response = await page.goto(`${origin}/${url}`, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200, url);
      assert.ok(await page.title(), url);
    }
    const asset = (await fs.readdir('dist/assets')).find(file => file.startsWith('particles-'));
    for (const [url, type] of [[`assets/${asset}`, 'javascript'], ['style.css', 'text/css'], ['admin/data/traveled-cities.json', 'application/json']]) {
      const response = await page.request.get(`${origin}/${url}`);
      assert.ok(response.headers()['content-type'].includes(type), url);
    }
    assert.equal((await page.request.get(`${origin}/images/missing-test-image.png`)).status(), 404);
    assert.deepEqual(errors, []);
    console.log('Browser regression passed: 4 viewports, shared map retry, mocked chat, track, full-page dual-layer reveal, motion, lifecycle, 10 legacy pages, content types.');
  } finally {
    await browser?.close();
    preview.kill();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
