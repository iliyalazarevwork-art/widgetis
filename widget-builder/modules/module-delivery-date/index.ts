import { deliveryDateSchema, deliveryDateI18nSchema, type DeliveryDateInput, type DeliveryDateI18n } from './schema';
import { getLanguage, isHoroshopProductPage } from '@laxarevii/core';
import { injectStyles } from './styles';
import { createBadge, insertElement, removeExistingBadges } from './dom';
import { computeDeliveryDate, formatDate } from './date';

export default function deliveryDate(
  rawConfig: DeliveryDateInput,
  rawI18n: DeliveryDateI18n,
): (() => void) | void {
  if (typeof document === 'undefined') return;

  const config = deliveryDateSchema.parse(rawConfig);
  const i18nMap = deliveryDateI18nSchema.parse(rawI18n);
  if (!config.enabled) { console.warn('[widgetality] delivery-date: ⚠️ disabled'); return; }
  if (config.selectors.length === 0) { console.warn('[widgetality] delivery-date: ⚠️ no selectors configured — widget skipped'); return; }
  if (!isHoroshopProductPage()) { console.warn('[widgetality] delivery-date: ⚠️ skipped — not a product page'); return; }
  console.log('[widgetality] delivery-date: ✅ activated');

  const lang = getLanguage();
  const i18n = i18nMap[lang] ?? i18nMap.ua ?? i18nMap.ru ?? Object.values(i18nMap)[0]!;

  const date = computeDeliveryDate(config.offsetDays);
  const dateString = formatDate(date, config.offsetDays, i18n);

  injectStyles();

  const badges: HTMLElement[] = [];

  for (const { selector, insert } of config.selectors) {
    const reference = document.querySelector(selector);
    if (!reference) continue;

    removeExistingBadges(reference);

    if (!reference.isConnected) continue;

    try {
      const badge = createBadge(i18n.prefix, dateString);
      insertElement(reference, badge, insert);
      badges.push(badge);
    } catch {
      // selector failed, continue to next
    }
  }

  return () => {
    for (const b of badges) b.remove();
    document.getElementById('delivery-date-styles')?.remove();
  };
}
