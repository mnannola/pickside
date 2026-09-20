import { test, expect, type Page } from '@playwright/test';

const origin = 'http://localhost:3100';
async function expectPairFits(page: Page, sideBySide: boolean) {
  const cards = page.locator('.matchup-stage .choice-card');
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0)).toBeVisible();
  await expect(cards.nth(1)).toBeVisible();
  const bounds = await cards.evaluateAll(elements => elements.map(element => {
    const { top, bottom, left, right, height } = element.getBoundingClientRect();
    return { top, bottom, left, right, height };
  }));
  const viewport = page.viewportSize()!;
  for (const card of bounds) {
    expect(card.top).toBeGreaterThanOrEqual(0);
    expect(card.bottom).toBeLessThanOrEqual(viewport.height);
    expect(card.left).toBeGreaterThanOrEqual(0);
    expect(card.right).toBeLessThanOrEqual(viewport.width);
    expect(card.height).toBeGreaterThanOrEqual(44);
  }
  if (sideBySide) expect(bounds[0].right).toBeLessThan(bounds[1].left);
  else expect(bounds[0].bottom).toBeLessThan(bounds[1].top);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
}

for (const viewport of [
  { width: 320, height: 568 }, { width: 360, height: 640 },
  { width: 390, height: 664 }, { width: 430, height: 740 },
  { width: 568, height: 320 }, { width: 844, height: 390 },
]) {
  test('both choices and results fit ' + viewport.width + 'x' + viewport.height, async ({ page, request }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Phone viewport coverage');
    await page.setViewportSize(viewport);
    const created = await request.post('/api/matchups', {
      headers: { Origin: origin },
      data: { a: { title: 'Gladiator', subtitle: 'Are you not entertained?' }, b: { title: 'Braveheart', subtitle: 'A little freedom. A lot of heart.' }, category: 'Movie night' },
    });
    expect(created.status()).toBe(201);
    const { slug } = await created.json();
    await page.goto('/m/' + slug + '?created=1');
    await expect(page.getByRole('button', { name: 'Vote for Gladiator' })).toBeEnabled();
    await expectPairFits(page, viewport.width > viewport.height);
    await page.screenshot({ path: testInfo.outputPath('vote.png') });
    await page.getByRole('button', { name: 'Vote for Gladiator' }).click();
    await expect(page).toHaveURL(origin + '/m/' + slug + '/results');
    await expectPairFits(page, viewport.width > viewport.height);
    await expect(page.getByRole('article', { name: 'Gladiator: 100%, 1 votes' })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('results.png') });
  });
}

test('long and enlarged text grows without clipping or overlapping sharing controls', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Phone accessibility coverage');
  await page.setViewportSize({ width: 320, height: 568 });
  const created = await request.post('/api/matchups', {
    headers: { Origin: origin },
    data: { a: { title: 'A'.repeat(80), subtitle: 'A'.repeat(120) }, b: { title: 'B'.repeat(80), subtitle: 'B'.repeat(120) }, category: 'C'.repeat(32) },
  });
  expect(created.status()).toBe(201);
  const { slug } = await created.json();
  for (const suffix of ['', '/results']) {
    await page.goto('/m/' + slug + suffix);
    const cards = page.locator('.matchup-stage .choice-card');
    await expect(cards).toHaveCount(2);
    // Streamed content may exist in the DOM before Next reveals it.
    await expect(cards.nth(0)).toBeVisible();
    await expect(cards.nth(1)).toBeVisible();
    await expect(page.locator('.share-box')).toBeVisible();
    await page.addStyleTag({ content: 'html { font-size: 200%; }' });
    const measurement = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.matchup-stage .choice-card'));
      return {
        cardsHaveHeight: cards.every(card => card.getBoundingClientRect().height >= 44),
        cardsFitContent: cards.every(card => card.scrollHeight <= card.clientHeight + 1),
        stageBottom: document.querySelector('.matchup-stage')!.getBoundingClientRect().bottom,
        pairBottom: cards[1].getBoundingClientRect().bottom,
        shareTop: document.querySelector('.share-box')!.getBoundingClientRect().top,
        width: document.documentElement.scrollWidth,
      };
    });
    expect(measurement.cardsHaveHeight).toBe(true);
    expect(measurement.cardsFitContent).toBe(true);
    expect(measurement.stageBottom).toBeGreaterThanOrEqual(measurement.pairBottom);
    expect(measurement.shareTop).toBeGreaterThan(measurement.pairBottom);
    expect(measurement.width).toBeLessThanOrEqual(320);
  }
});
