import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import spinTheWheel, { pickSegment } from './index';
import { getDefaultI18n, getDefaultConfig, type SpinSegment } from './schema';

vi.mock('@laxarevii/core', () => ({
  getLanguage: () => 'ua',
}));

vi.mock('lucky-canvas', () => ({
  LuckyWheel: class {
    constructor() {}
    init() { return Promise.resolve(); }
    play() {}
    stop() {}
    endCallback: ((prize: unknown) => void) | null = null;
    startCallback: (() => void) | null = null;
  },
}));

const HOST_SELECTOR = '#wdg-stw-host';

/** Convenience: get the shadow root of the host element */
function getShadow(): ShadowRoot | null {
  return document.getElementById('wdg-stw-host')?.shadowRoot ?? null;
}

/** Query inside the shadow root */
function sq<T extends Element = Element>(selector: string): T | null {
  return getShadow()?.querySelector<T>(selector) ?? null;
}

const baseConfig = getDefaultConfig();
const i18n = getDefaultI18n();

// Helper — fire exit-intent mouse-leave
function fireMouseLeave(): void {
  const ev = new MouseEvent('mouseleave', { bubbles: true });
  Object.defineProperty(ev, 'clientY', { value: -5 });
  Object.defineProperty(ev, 'relatedTarget', { value: null });
  document.dispatchEvent(ev);
}

describe('spinTheWheel module', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    window.localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    // Remove any lingering host element
    document.getElementById('wdg-stw-host')?.remove();
  });

  // ── 1. disabled ──────────────────────────────────────────────────────────────
  it('returns undefined when enabled=false', () => {
    const result = spinTheWheel({ ...baseConfig, enabled: false }, i18n);
    expect(result).toBeUndefined();
    expect(document.querySelector(HOST_SELECTOR)).toBeNull();
  });

  // ── 2. cooldown ───────────────────────────────────────────────────────────────
  it('returns undefined when cooldown is active', () => {
    window.localStorage.setItem('wty_spin_seen_at', String(Date.now()));
    const result = spinTheWheel({ ...baseConfig, cooldownHours: 168 }, i18n);
    expect(result).toBeUndefined();
  });

  // ── 3. utm suppression ────────────────────────────────────────────────────────
  it('returns undefined when UTM source is in hideOnUtmSources', () => {
    const url = new URL('http://localhost/?utm_source=google');
    Object.defineProperty(window, 'location', { value: url, configurable: true });
    const result = spinTheWheel({ ...baseConfig, hideOnUtmSources: ['google'] }, i18n);
    expect(result).toBeUndefined();
    // Reset
    Object.defineProperty(window, 'location', {
      value: new URL('http://localhost/'),
      configurable: true,
    });
  });

  // ── 4. delay trigger ──────────────────────────────────────────────────────────
  it('does NOT show popup before delaySec elapses', () => {
    const cleanup = spinTheWheel({ ...baseConfig, delaySec: 5, triggerOnExitIntent: false }, i18n);
    vi.advanceTimersByTime(4000);
    expect(document.querySelector(HOST_SELECTOR)).toBeNull();
    cleanup?.();
  });

  it('shows popup after delaySec elapses', () => {
    const cleanup = spinTheWheel({ ...baseConfig, delaySec: 2, triggerOnExitIntent: false }, i18n);
    vi.advanceTimersByTime(2100);
    expect(document.querySelector(HOST_SELECTOR)).not.toBeNull();
    cleanup?.();
  });

  // ── 5. exit-intent trigger ────────────────────────────────────────────────────
  it('shows popup on exit-intent mouseleave when triggerOnExitIntent=true', () => {
    const cleanup = spinTheWheel(
      { ...baseConfig, delaySec: 999, triggerOnExitIntent: true },
      i18n,
    );
    fireMouseLeave();
    expect(document.querySelector(HOST_SELECTOR)).not.toBeNull();
    cleanup?.();
  });

  it('does NOT show popup on exit-intent when triggerOnExitIntent=false', () => {
    const cleanup = spinTheWheel(
      { ...baseConfig, delaySec: 999, triggerOnExitIntent: false },
      i18n,
    );
    fireMouseLeave();
    expect(document.querySelector(HOST_SELECTOR)).toBeNull();
    cleanup?.();
  });

  // ── 6. popup content ─────────────────────────────────────────────────────────
  it('renders title and spin button in email-gate stage', () => {
    const cleanup = spinTheWheel({ ...baseConfig, delaySec: 0 }, i18n);
    vi.advanceTimersByTime(50);
    expect(document.querySelector(HOST_SELECTOR)).not.toBeNull();
    expect(sq('.stw__title')?.textContent).toContain(i18n.ua.title);
    expect(sq('.stw__cta')?.textContent).toContain(i18n.ua.spinButton);
    cleanup?.();
  });

  // ── 7. email validation ───────────────────────────────────────────────────────
  it('shows inline error when submitting an invalid email', () => {
    const cleanup = spinTheWheel(
      { ...baseConfig, delaySec: 0, requireEmail: true, triggerOnExitIntent: false },
      i18n,
    );
    vi.advanceTimersByTime(50);
    const input = sq<HTMLInputElement>('.stw__email-input')!;
    input.value = 'not-an-email';
    sq<HTMLFormElement>('.stw__email-form')!.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    const errEl = sq<HTMLElement>('.stw__email-error')!;
    expect(errEl.style.display).toBe('block');
    expect(errEl.textContent?.length).toBeGreaterThan(0);
    // Still on email-gate (wheel not shown yet)
    expect(sq('.stw__email-form')).not.toBeNull();
    cleanup?.();
  });

  // ── 8. email saved to localStorage ───────────────────────────────────────────
  it('saves valid email to localStorage on form submit', () => {
    const cleanup = spinTheWheel(
      { ...baseConfig, delaySec: 0, requireEmail: true, triggerOnExitIntent: false },
      i18n,
    );
    vi.advanceTimersByTime(50);
    const input = sq<HTMLInputElement>('.stw__email-input')!;
    input.value = 'winner@example.com';
    sq<HTMLFormElement>('.stw__email-form')!.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    expect(window.localStorage.getItem('wty_spin_email')).toBe('winner@example.com');
    cleanup?.();
  });

  // ── 9. consent checkbox renders when requireConsent=true ─────────────────────
  it('renders consent checkbox when requireConsent=true', () => {
    const cleanup = spinTheWheel(
      { ...baseConfig, delaySec: 0, requireConsent: true, triggerOnExitIntent: false },
      i18n,
    );
    vi.advanceTimersByTime(50);
    const checkbox = sq<HTMLInputElement>('.stw__consent-input')!;
    expect(checkbox).not.toBeNull();
    expect(checkbox.checked).toBe(true);
    cleanup?.();
  });

  // ── 10. cleanup removes popup ─────────────────────────────────────────────────
  it('cleanup removes host element', () => {
    const cleanup = spinTheWheel({ ...baseConfig, delaySec: 0 }, i18n)!;
    vi.advanceTimersByTime(50);
    expect(document.querySelector(HOST_SELECTOR)).not.toBeNull();
    cleanup();
    expect(document.querySelector(HOST_SELECTOR)).toBeNull();
  });

  // ── 11. styles are inside shadow root ─────────────────────────────────────────
  it('injects a <style> tag with CSS vars inside shadow root', () => {
    const cleanup = spinTheWheel(
      { ...baseConfig, delaySec: 0, accentColor: '#ff0000' },
      i18n,
    );
    vi.advanceTimersByTime(50);
    const shadow = getShadow();
    expect(shadow).not.toBeNull();
    const style = shadow!.querySelector('style[data-stw]');
    expect(style).not.toBeNull();
    expect(style?.textContent).toContain('#ff0000');
    cleanup?.();
  });

  // ── 12. cooldown stored on first show ─────────────────────────────────────────
  it('stores seen timestamp in localStorage when modal opens', () => {
    const cleanup = spinTheWheel({ ...baseConfig, delaySec: 0 }, i18n);
    vi.advanceTimersByTime(50);
    expect(window.localStorage.getItem('wty_spin_seen_at')).toBeTruthy();
    cleanup?.();
  });

  // ── 13. popup shown only once ─────────────────────────────────────────────────
  it('only shows popup once even if trigger fires multiple times', () => {
    const cleanup = spinTheWheel(
      { ...baseConfig, delaySec: 0, triggerOnExitIntent: true },
      i18n,
    );
    vi.advanceTimersByTime(50);
    fireMouseLeave();
    fireMouseLeave();
    expect(document.querySelectorAll(HOST_SELECTOR).length).toBe(1);
    cleanup?.();
  });

  // ── 14. shadow DOM — new test ─────────────────────────────────────────────────
  it('mounts a shadow root on the host', () => {
    const cleanup = spinTheWheel({ ...baseConfig, delaySec: 0 }, i18n);
    vi.advanceTimersByTime(50);
    const host = document.getElementById('wdg-stw-host');
    expect(host).not.toBeNull();
    expect(host!.shadowRoot).not.toBeNull();
    cleanup?.();
  });

  // ── 15. styles scoped to shadow root only — new test ──────────────────────────
  it('styles are scoped to shadow root, not document', () => {
    const cleanup = spinTheWheel({ ...baseConfig, delaySec: 0 }, i18n);
    vi.advanceTimersByTime(50);
    // No style tag should leak into document.head
    expect(document.head.querySelector('style[data-stw]')).toBeNull();
    // But shadow root must have at least one <style>
    const shadow = getShadow();
    expect(shadow).not.toBeNull();
    expect(shadow!.querySelectorAll('style').length).toBeGreaterThanOrEqual(1);
    cleanup?.();
  });
});

// ---------------------------------------------------------------------------
// pickSegment unit tests
// ---------------------------------------------------------------------------

describe('pickSegment', () => {
  const segments: SpinSegment[] = [
    { label: 'A', code: 'A10', weight: 10 },
    { label: 'B', code: 'B5', weight: 5 },
    { label: 'C', code: '', weight: 1 },
  ];

  it('returns a valid segment from the list', () => {
    const { segment } = pickSegment(segments);
    expect(segments).toContain(segment);
  });

  it('respects weights — high-weight segment chosen when Math.random -> 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { index } = pickSegment(segments);
    // totalWeight=16, rand=0 → first segment consumed immediately
    expect(index).toBe(0);
  });

  it('picks last segment when Math.random -> ~1', () => {
    // random() * 16 = 15.999 → subtract 10 → 5.999, subtract 5 → 0.999, subtract 1 → -0.001 ≤ 0 → index 2
    vi.spyOn(Math, 'random').mockReturnValue(0.9999);
    const { index } = pickSegment(segments);
    expect(index).toBe(2);
  });

  it('always returns an index within bounds', () => {
    for (let i = 0; i < 50; i++) {
      const { index } = pickSegment(segments);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(segments.length);
    }
  });

  it('handles single-segment array', () => {
    const single: SpinSegment[] = [{ label: 'Only', code: 'ONE', weight: 1 }];
    const { index, segment } = pickSegment(single);
    expect(index).toBe(0);
    expect(segment.code).toBe('ONE');
  });

  it('returns correct index for mid-range random', () => {
    // totalWeight=16, rand=0.5*16=8 → subtract 10 → -2 ≤ 0 → index 0
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const { index } = pickSegment(segments);
    expect(index).toBe(0);
  });

  it('falls through zero-weight segments to weighted ones', () => {
    // totalWeight = 0+1 = 1. rand = Math.random()*1.
    // With random=0.9999: rand=0.9999, subtract 0 (zero-weight) → still 0.9999,
    // subtract 1 → -0.0001 ≤ 0 → index 1 (the weighted segment).
    const withZero: SpinSegment[] = [
      { label: 'Zero', code: 'Z', weight: 0 },
      { label: 'One', code: 'O', weight: 1 },
    ];
    vi.spyOn(Math, 'random').mockReturnValue(0.9999);
    const { index } = pickSegment(withZero);
    expect(index).toBe(1);
  });
});
