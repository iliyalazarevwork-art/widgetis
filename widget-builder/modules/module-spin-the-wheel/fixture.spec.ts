import { test, expect } from '@playwright/test';
import { goToFixture, waitForWidget, runCleanup } from '../../tests/fixtures/fixture-helpers';

// spin-the-wheel creates #wdg-stw-host (shadow DOM host) after delaySec * 1000 ms.
// Set delaySec: 0 to trigger immediately.
const MODULE = 'module-spin-the-wheel';

const SEGMENTS = [
  { label: '10%', code: 'SPIN10', weight: 1, iconType: 'percent' },
  { label: '20%', code: 'SPIN20', weight: 1, iconType: 'percent' },
  { label: 'Спробуйте ще', code: '', weight: 1, iconType: 'try-again' },
];

const CONFIG = {
  enabled: true,
  delaySec: 0,
  cooldownHours: 0,
  triggerOnExitIntent: false,
  requireEmail: false,
  requireConsent: false,
  segments: SEGMENTS,
  palette: ['#f87171', '#fb923c', '#fbbf24'],
  backgroundColor: '#ffffff',
  textColor: '#111827',
  accentColor: '#ef4444',
  accentTextColor: '#ffffff',
  borderColor: '#e5e7eb',
  borderRadius: 24,
  decorativeColor: '#ef4444',
  wheelTextColor: '#ffffff',
  zIndex: 9999,
  hideOnUtmSources: [],
};

const I18N = {
  ua: {
    title: 'Крутіть колесо!',
    subtitle: 'Виграйте знижку',
    spinButton: 'Крутити',
    tabLabel: 'Знижка',
    tabAriaLabel: 'Відкрити колесо фортуни',
    tabCloseAriaLabel: 'Закрити вкладку',
    closeLabel: 'Закрити',
    emailPlaceholder: 'Email',
    consentText: 'Я погоджуюсь з умовами',
    spinningLabel: 'Крутиться...',
    resultTitleWin: 'Вітаємо!',
    resultTitleLose: 'Наступного разу',
    resultSubtitleWin: 'Ви виграли знижку!',
    resultSubtitleLose: 'Спробуйте ще раз',
    copyButton: 'Копіювати',
    copiedLabel: 'Скопійовано!',
    errorEmptyEmail: 'Введіть email',
    errorInvalidEmail: 'Невірний email',
  },
};

test.describe(MODULE, () => {
  test('mounts host element on any page after delay 0', async ({ page }) => {
    // Clear any previous cooldown from localStorage
    await page.addInitScript(() => {
      localStorage.removeItem('wty_spin_seen_at');
      localStorage.removeItem('wty_spin_dismissed');
    });

    await goToFixture(page, {
      fixturePage: 'any',
      module: MODULE,
      config: CONFIG,
      i18n: I18N,
    });

    await waitForWidget(page);
    // delaySec:0 → host appended immediately
    await expect(page.locator('#wdg-stw-host')).toBeAttached({ timeout: 5000 });
  });

  test('does not mount when disabled', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'any',
      module: MODULE,
      config: { ...CONFIG, enabled: false },
      i18n: I18N,
    });

    await page.waitForTimeout(500);
    await expect(page.locator('#wdg-stw-host')).not.toBeAttached();
  });

  test('does not mount when cooldown is active', async ({ page }) => {
    // Simulate a recent visit so cooldown blocks display
    await page.addInitScript(() => {
      localStorage.setItem('wty_spin_seen_at', String(Date.now()));
    });

    await goToFixture(page, {
      fixturePage: 'any',
      module: MODULE,
      config: { ...CONFIG, cooldownHours: 24 },
      i18n: I18N,
    });

    await page.waitForTimeout(500);
    await expect(page.locator('#wdg-stw-host')).not.toBeAttached();
  });

  test('cleanup removes host element', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('wty_spin_seen_at');
      localStorage.removeItem('wty_spin_dismissed');
    });

    await goToFixture(page, {
      fixturePage: 'any',
      module: MODULE,
      config: CONFIG,
      i18n: I18N,
    });

    await waitForWidget(page);
    await expect(page.locator('#wdg-stw-host')).toBeAttached({ timeout: 5000 });

    await runCleanup(page);
    await expect(page.locator('#wdg-stw-host')).not.toBeAttached();
  });
});
