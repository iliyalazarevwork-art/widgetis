/**
 * Real-world Horoshop page-type detection.
 *
 * Loads each HTML fixture under __fixtures__/horoshop/{domain}/{type}.html
 * into a DOM and asserts detectPageType returns the file's name as the type.
 *
 * Regenerate fixtures with:  node scripts/fetch-horoshop-fixtures.mjs --limit=N
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { detectPageType, type PageType } from './page-type';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIX_DIR = resolve(__dirname, '__fixtures__/horoshop');

const CACHE_KEY = '__WIDGETIS_PAGE_TYPE__';

// File name → expected PageType. Files named "about"/"contacts" are content
// pages and should resolve to 'other'.
const EXPECTED_BY_FILE: Record<string, PageType> = {
  home: 'home',
  product: 'product',
  category: 'category',
  cart: 'cart',
  checkout: 'checkout',
  about: 'other',
  contacts: 'other',
};

function listDomains(): string[] {
  if (!existsSync(FIX_DIR)) return [];
  return readdirSync(FIX_DIR)
    .filter((name) => statSync(join(FIX_DIR, name)).isDirectory())
    .sort();
}

function parseDoc(html: string): Document {
  const doc = document.implementation.createHTMLDocument('fixture');
  // We need a full parse, not the safe-empty document. Use the documentElement
  // outerHTML route so <meta property="og:type"> in <head> lands correctly.
  doc.documentElement.innerHTML = html
    .replace(/^[\s\S]*?<html[^>]*>/i, '')
    .replace(/<\/html>[\s\S]*$/i, '');
  return doc;
}

const domains = listDomains();

describe('detectPageType — real Horoshop HTML', () => {
  if (domains.length === 0) {
    it.skip('no fixtures — run scripts/fetch-horoshop-fixtures.mjs first', () => {});
    return;
  }

  for (const domain of domains) {
    const dir = join(FIX_DIR, domain);
    const files = readdirSync(dir).filter((f) => f.endsWith('.html'));
    for (const file of files) {
      const base = file.replace(/\.html$/, '');
      const expected = EXPECTED_BY_FILE[base];
      if (!expected) continue;

      it(`${domain} · ${base} → ${expected}`, () => {
        delete (window as any)[CACHE_KEY];
        const html = readFileSync(join(dir, file), 'utf-8');
        const doc = parseDoc(html);
        expect(detectPageType(doc, undefined)).toBe(expected);
      });
    }
  }
});
