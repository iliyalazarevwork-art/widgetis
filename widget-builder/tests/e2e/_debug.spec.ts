import { test, expect } from '@playwright/test';

test('check console errors on benihome', async ({ page }) => {
  const errors: string[] = [];
  const logs: string[] = [];
  page.on('console', msg => {
    const t = msg.text();
    if (msg.type() === 'error') errors.push(t);
    if (t.includes('widgetality') || t.includes('wdg')) logs.push(t);
  });
  page.on('pageerror', e => errors.push(`PAGEERROR: ${e.message}`));
  await page.goto('http://localhost:3100/site/benihome.com.ua/', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load').catch(() => {});
  await page.waitForTimeout(5000);
  console.log('=== widgetality logs ===');
  for (const l of logs) console.log(l);
  console.log('=== errors ===');
  for (const e of errors) console.log(e);
  console.log('=== mounted widgets ===');
  const mounted = await page.evaluate(() => {
    const ids = ['wdg-stw-host', 'wdg-fmsg', 'wdg-prize-banner-host', 'wdg-exit-intent', 'cg-widget-floating'];
    return ids.map(id => `${id}: ${document.getElementById(id) ? 'YES' : 'NO'}`);
  });
  for (const m of mounted) console.log(m);
});
