import type { Page } from '@playwright/test';

export interface DomInfo {
  inDOM: boolean;
  width: number;
  height: number;
  text: string;
  childCount: number;
  visible: boolean;
}

export async function getDomInfo(page: Page, selector: string): Promise<DomInfo | null> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      inDOM: el.isConnected,
      width: Math.round(r.width),
      height: Math.round(r.height),
      text: (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 150),
      childCount: el.children.length,
      visible: r.width > 0 && r.height > 0,
    };
  }, selector);
}

export async function getShadowDomInfo(
  page: Page,
  hostSelector: string,
): Promise<{ hostInDOM: boolean; shadowChildCount: number } | null> {
  return page.evaluate((sel) => {
    const host = document.querySelector(sel);
    if (!host) return null;
    return {
      hostInDOM: host.isConnected,
      shadowChildCount: host.shadowRoot?.children.length ?? 0,
    };
  }, hostSelector);
}

export async function getComputedColor(
  page: Page,
  selector: string,
  property: 'backgroundColor' | 'color',
): Promise<string | null> {
  return page.evaluate(
    ([sel, prop]) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      return getComputedStyle(el)[prop as 'backgroundColor' | 'color'];
    },
    [selector, property] as const,
  );
}
