/**
 * Apply a color theme from demo-themes.json to demo-config.json.
 *
 * Usage:
 *   node_modules/.bin/jiti apply-theme.ts                  # uses "active" theme from demo-themes.json
 *   node_modules/.bin/jiti apply-theme.ts --theme rosé     # apply named theme
 *   node_modules/.bin/jiti apply-theme.ts --list           # list available themes
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface Theme {
  primary: string;
  primaryText: string;
  background: string;
  text: string;
  muted: string;
  border: string;
  marqueeBg: string;
  marqueeText: string;
  stockBg: string;
  stockText: string;
  stockAccent: string;
  gradientStart: string;
  gradientEnd: string;
  progressiveBg: string;
  progressiveAchievedBg: string;
  progressiveText: string;
  progressiveAccent: string;
  prizeBg: string;
  prizeText: string;
  prizeAccent: string;
  prizeBorder: string;
}

interface ThemesFile {
  active: string;
  themes: Record<string, Theme & { $comment?: string }>;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf-8')) as T;
}

function applyTheme(config: Record<string, unknown>, theme: Theme): void {
  const modules = config['modules'] as Record<string, { config: Record<string, unknown> }>;

  const smsOtp = modules['module-sms-otp-checkout']?.config;
  if (smsOtp) {
    const colors = (smsOtp['colors'] ??= {}) as Record<string, unknown>;
    colors['gradientStart'] = theme.gradientStart;
    colors['gradientEnd'] = theme.gradientEnd;
  }

  const stock = modules['module-stock-left']?.config;
  if (stock) {
    stock['backgroundColor'] = theme.stockBg;
    stock['textColor'] = theme.stockText;
    stock['accentColor'] = theme.stockAccent;
  }

  const exitPopup = modules['module-exit-intent-popup']?.config;
  if (exitPopup) {
    exitPopup['backgroundColor'] = theme.background;
    exitPopup['textColor'] = theme.text;
    exitPopup['accentColor'] = theme.primary;
    exitPopup['accentTextColor'] = theme.primaryText;
    exitPopup['borderColor'] = theme.border;
  }

  const trust = modules['module-trust-badges']?.config;
  if (trust) {
    trust['textColor'] = theme.text;
    trust['iconColor'] = theme.primary;
    trust['borderColor'] = theme.border;
  }

  const messengers = modules['module-floating-messengers']?.config;
  if (messengers) {
    messengers['bubbleColor'] = theme.primary;
    messengers['bubbleIconColor'] = theme.primaryText;
    messengers['expandedBackground'] = theme.background;
    messengers['expandedTextColor'] = theme.text;
    messengers['borderColor'] = theme.border;
  }

  const recentlyViewed = modules['module-recently-viewed']?.config;
  if (recentlyViewed) {
    recentlyViewed['textColor'] = theme.text;
    recentlyViewed['priceColor'] = theme.primary;
    recentlyViewed['mutedColor'] = theme.muted;
    recentlyViewed['borderColor'] = theme.border;
  }

  const spin = modules['module-spin-the-wheel']?.config;
  if (spin) {
    // palette, decorativeColor (wheel ring/pointer/tab) — frozen in demo-config.json, not theme-driven
    spin['backgroundColor'] = theme.background;
    spin['textColor'] = theme.text;
    spin['accentColor'] = theme.primary;
    spin['accentTextColor'] = theme.primaryText;
    spin['borderColor'] = theme.border;
  }

  const cartGoal = modules['module-cart-goal']?.config;
  if (cartGoal) {
    cartGoal['background'] = theme.progressiveBg;
    cartGoal['achievedBackground'] = theme.progressiveAchievedBg;
    cartGoal['textColor'] = theme.progressiveText;
  }

  const progressive = modules['module-progressive-discount']?.config;
  if (progressive) {
    progressive['background'] = theme.progressiveBg;
    progressive['achievedBackground'] = theme.progressiveAchievedBg;
    progressive['textColor'] = theme.progressiveText;
    progressive['accentColor'] = theme.progressiveAccent;
  }

  const prize = modules['module-prize-banner']?.config;
  if (prize) {
    prize['backgroundColor'] = theme.prizeBg;
    prize['textColor'] = theme.prizeText;
    prize['accentColor'] = theme.prizeAccent;
    prize['borderColor'] = theme.prizeBorder;
  }

  const marquee = modules['module-marquee']?.config;
  if (marquee) {
    const colors = (marquee['colors'] ??= {}) as Record<string, Record<string, unknown>>;
    colors['desktop'] ??= {};
    colors['mobile'] ??= {};
    colors['desktop']['backgroundColor'] = theme.marqueeBg;
    colors['desktop']['textColor'] = theme.marqueeText;
    colors['mobile']['backgroundColor'] = theme.marqueeBg;
    colors['mobile']['textColor'] = theme.marqueeText;
  }
}

function main(): void {
  const args = process.argv.slice(2);

  const themesPath = resolve(process.cwd(), 'demo-themes.json');
  const configPath = resolve(process.cwd(), 'demo-config.json');

  const themesFile = readJson<ThemesFile>(themesPath);

  if (args.includes('--list')) {
    console.log('Available themes:');
    for (const [name, t] of Object.entries(themesFile.themes)) {
      const active = name === themesFile.active ? ' ← active' : '';
      const comment = (t as { $comment?: string }).$comment ?? '';
      console.log(`  ${name}${active}  —  ${comment}`);
    }
    return;
  }

  const nameIdx = args.indexOf('--theme');
  const themeName = nameIdx !== -1 ? args[nameIdx + 1] : themesFile.active;

  if (!themeName || !(themeName in themesFile.themes)) {
    const available = Object.keys(themesFile.themes).join(', ');
    throw new Error(`Theme "${themeName}" not found. Available: ${available}`);
  }

  const theme = themesFile.themes[themeName] as Theme;
  const config = readJson<Record<string, unknown>>(configPath);

  applyTheme(config, theme);

  if (nameIdx !== -1) {
    themesFile.active = themeName;
    writeFileSync(themesPath, JSON.stringify(themesFile, null, 2) + '\n');
  }

  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  console.log(`✓ Applied theme "${themeName}" to demo-config.json`);
}

main();
