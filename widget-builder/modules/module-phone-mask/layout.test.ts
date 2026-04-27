/**
 * Подробные тесты на разметку и CSS виджета phone-mask.
 *
 * Цель: прибить дизайн-регрессии. Если кто-то поменяет структуру обёртки или
 * CSS так, что hint/error поедут в строку рядом с input, picker сожмёт поле,
 * или обёртка перестанет быть full-width — эти тесты упадут.
 *
 * Происхождение: бага из апреля 2026, когда `.wdg-pm-input` был
 * `display:flex` без `flex-direction: column`, и подсказка с ошибкой
 * выстраивались рядом с input в одну строку, ломая форму.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@laxarevii/core', () => ({
  getLanguage: () => 'ua',
}));

import phoneMask from './index';
import { getDefaultConfig, getDefaultI18n } from './schema';
import { buildCSS, STYLE_ID } from './styles';

const STYLE_TAG_ID = STYLE_ID; // 'wdg-phone-mask-styles'

function mountWithInput(html = '<input type="tel" name="phone">'): HTMLInputElement {
  const form = document.createElement('form');
  form.innerHTML = html;
  document.body.appendChild(form);
  phoneMask(getDefaultConfig(), getDefaultI18n());
  return document.querySelector<HTMLInputElement>('.wdg-pm-wrap input[type="tel"]')!;
}

beforeEach(() => {
  document.body.innerHTML = '';
  document.head.innerHTML = '';
  localStorage.clear();
});

// ─── Структура DOM ─────────────────────────────────────────────────────────
describe('layout: DOM structure', () => {
  it('обёртка .wdg-pm-wrap создаётся как ОБЫЧНЫЙ предок input — не вокруг input в form, а на его месте', () => {
    mountWithInput();
    const form = document.querySelector('form')!;
    const wrap = form.querySelector('.wdg-pm-wrap')!;
    expect(wrap.parentElement).toBe(form);
  });

  it('точно один picker, один input[type=tel], один dropdown, один hint, один error, одна row на input', () => {
    mountWithInput();
    expect(document.querySelectorAll('.wdg-pm-wrap').length).toBe(1);
    expect(document.querySelectorAll('.wdg-pm-row').length).toBe(1);
    expect(document.querySelectorAll('.wdg-pm-picker').length).toBe(1);
    expect(document.querySelectorAll('.wdg-pm-wrap input[type="tel"]').length).toBe(1);
    expect(document.querySelectorAll('.wdg-pm-dd').length).toBe(1);
    expect(document.querySelectorAll('.wdg-pm-hint').length).toBe(1);
    expect(document.querySelectorAll('.wdg-pm-error').length).toBe(1);
  });

  it('порядок прямых детей .wdg-pm-wrap: row → hint → error (hint/error full-width ниже строки)', () => {
    mountWithInput();
    const wrap = document.querySelector('.wdg-pm-wrap')!;
    const children = Array.from(wrap.children);
    expect(children.length).toBe(3);
    expect(children[0]?.classList.contains('wdg-pm-row')).toBe(true);
    expect(children[1]?.classList.contains('wdg-pm-hint')).toBe(true);
    expect(children[2]?.classList.contains('wdg-pm-error')).toBe(true);
  });

  it('порядок прямых детей .wdg-pm-row: picker → inputBox → dropdown', () => {
    mountWithInput();
    const row = document.querySelector('.wdg-pm-row')!;
    const children = Array.from(row.children);
    expect(children[0]?.classList.contains('wdg-pm-picker')).toBe(true);
    expect(children[1]?.classList.contains('wdg-pm-input')).toBe(true);
    expect(children[2]?.classList.contains('wdg-pm-dd')).toBe(true);
  });

  it('inputBox содержит ТОЛЬКО input — hint и error ВЫНЕСЕНЫ из него на уровень wrap', () => {
    mountWithInput();
    const inputBox = document.querySelector('.wdg-pm-input')!;
    const children = Array.from(inputBox.children);
    expect(children.length).toBe(1);
    expect(children[0]?.tagName).toBe('INPUT');
    // hint/error точно НЕ внутри inputBox
    expect(inputBox.querySelector('.wdg-pm-hint')).toBeNull();
    expect(inputBox.querySelector('.wdg-pm-error')).toBeNull();
  });

  it('hint и error — прямые дети .wdg-pm-wrap (full-width sibling строки)', () => {
    mountWithInput();
    const wrap = document.querySelector('.wdg-pm-wrap')!;
    const hint = document.querySelector('.wdg-pm-hint')!;
    const error = document.querySelector('.wdg-pm-error')!;
    expect(hint.parentElement).toBe(wrap);
    expect(error.parentElement).toBe(wrap);
  });

  it('hint и error НЕ внутри row (иначе сожмутся до ширины input)', () => {
    mountWithInput();
    const row = document.querySelector('.wdg-pm-row')!;
    expect(row.querySelector('.wdg-pm-hint')).toBeNull();
    expect(row.querySelector('.wdg-pm-error')).toBeNull();
  });

  it('input — прямой ребёнок inputBox (а не «голым» в row или form)', () => {
    const input = mountWithInput();
    expect(input.parentElement?.classList.contains('wdg-pm-input')).toBe(true);
  });

  it('inputBox — прямой ребёнок row (не выскочил наружу)', () => {
    mountWithInput();
    const inputBox = document.querySelector('.wdg-pm-input')!;
    expect(inputBox.parentElement?.classList.contains('wdg-pm-row')).toBe(true);
  });

  it('dropdown — прямой ребёнок row (его top отсчитывается от высоты picker)', () => {
    mountWithInput();
    const dd = document.querySelector('.wdg-pm-dd')!;
    expect(dd.parentElement?.classList.contains('wdg-pm-row')).toBe(true);
  });

  it('обёртка располагается там, где раньше был input — не выносится из формы', () => {
    const formHtml = '<label>Телефон</label><input type="tel" name="phone"><div class="below">below</div>';
    document.body.innerHTML = `<form>${formHtml}</form>`;
    phoneMask(getDefaultConfig(), getDefaultI18n());

    const form = document.querySelector('form')!;
    const kids = Array.from(form.children);
    // Должно стать: label → wrap → div.below
    expect(kids[0]?.tagName).toBe('LABEL');
    expect(kids[1]?.classList.contains('wdg-pm-wrap')).toBe(true);
    expect(kids[2]?.classList.contains('below')).toBe(true);
  });

  it('error по умолчанию скрыт через класс .wdg-pm-hidden', () => {
    mountWithInput();
    const err = document.querySelector('.wdg-pm-error')!;
    expect(err.classList.contains('wdg-pm-hidden')).toBe(true);
  });

  it('hint виден сразу и содержит dial-код + пример номера', () => {
    mountWithInput();
    const hint = document.querySelector<HTMLElement>('.wdg-pm-hint')!;
    expect(hint.classList.contains('wdg-pm-hidden')).toBe(false);
    expect(hint.textContent).toMatch(/\+380/);
    expect(hint.textContent).toMatch(/\(67\) 123-45-67/);
  });
});

// ─── CSS-правила ───────────────────────────────────────────────────────────
//
// CSS-инъекция — это контракт между виджетом и страницей. Если ключевое
// правило (типа flex-direction column для .wdg-pm-input) исчезнет — тест
// упадёт с понятной ошибкой ещё до того, как кто-то откроет страницу.

describe('layout: injected CSS', () => {
  it('тег <style> с фиксированным id вставлен в head', () => {
    mountWithInput();
    const style = document.getElementById(STYLE_TAG_ID);
    expect(style).not.toBeNull();
    expect(style!.tagName).toBe('STYLE');
  });

  it('CSS НЕ вставляется дважды для нескольких полей', () => {
    document.body.innerHTML = '<form><input type="tel" name="a"><input type="tel" name="b"></form>';
    phoneMask(getDefaultConfig(), getDefaultI18n());
    expect(document.querySelectorAll(`#${STYLE_TAG_ID}`).length).toBe(1);
  });

  // Отдельные правила, которые легко сломать одним рефакторингом styles.ts.
  const css = buildCSS();

  const rules: Array<[string, RegExp, string]> = [
    [
      '.wdg-pm-wrap — flex-column (строка + hint + error стекаются вертикально)',
      /\.wdg-pm-wrap\s*\{[^}]*display:\s*flex[^}]*flex-direction:\s*column[^}]*\}/,
      'без column hint/error лезут в строку с picker',
    ],
    [
      '.wdg-pm-wrap занимает 100% ширины родителя',
      /\.wdg-pm-wrap\s*\{[^}]*width:\s*100%[^}]*\}/,
      'обёртка должна быть full-width, иначе сожмётся в inline-flex',
    ],
    [
      '.wdg-pm-row — flex-row с gap между picker и input',
      /\.wdg-pm-wrap\s+\.wdg-pm-row\s*\{[^}]*display:\s*flex[^}]*\}/,
      'строка [picker][input] должна быть flex',
    ],
    [
      '.wdg-pm-row — position:relative (якорь дропдауна)',
      /\.wdg-pm-wrap\s+\.wdg-pm-row\s*\{[^}]*position:\s*relative[^}]*\}/,
      'без position:relative дропдаун (top:calc(44px+6px)) не привяжется к picker',
    ],
    [
      '.wdg-pm-row — gap между picker и input',
      /\.wdg-pm-wrap\s+\.wdg-pm-row\s*\{[^}]*gap:\s*\d+px[^}]*\}/,
      'gap нужен, чтобы picker не приклеивался к input',
    ],
    [
      '.wdg-pm-row — width:100%',
      /\.wdg-pm-wrap\s+\.wdg-pm-row\s*\{[^}]*width:\s*100%[^}]*\}/,
      'строка должна занимать всю обёртку, иначе сожмётся',
    ],
    [
      '.wdg-pm-input — flex:1 1 auto (занимает всё доступное место рядом с picker)',
      /\.wdg-pm-wrap\s+\.wdg-pm-input\s*\{[^}]*flex:\s*1[^}]*\}/,
      'без flex:1 input будет shrink-to-fit',
    ],
    [
      '.wdg-pm-input — min-width:0 (иначе input может "выпереть" обёртку)',
      /\.wdg-pm-wrap\s+\.wdg-pm-input\s*\{[^}]*min-width:\s*0[^}]*\}/,
      'flex-элемент с full-width input должен иметь min-width:0',
    ],
    [
      'input внутри inputBox имеет width:100%',
      /\.wdg-pm-wrap\s+\.wdg-pm-input\s+input\s*\{[^}]*width:\s*100%[^}]*\}/,
      'без width:100% поле сожмётся до собственного контента',
    ],
    [
      'input — display:block (а не inline)',
      /\.wdg-pm-wrap\s+\.wdg-pm-input\s+input\s*\{[^}]*display:\s*block[^}]*\}/,
      'inline-input нарушает column-flex и сжимается по содержимому',
    ],
    [
      'input — box-sizing:border-box (padding не выпирает за 100%)',
      /\.wdg-pm-wrap\s+\.wdg-pm-input\s+input\s*\{[^}]*box-sizing:\s*border-box[^}]*\}/,
      'без border-box width:100% + padding выйдет за обёртку',
    ],
    [
      'input — min-height:44px (тач-таргет)',
      /\.wdg-pm-wrap\s+\.wdg-pm-input\s+input\s*\{[^}]*min-height:\s*44px[^}]*\}/,
      'высота 44px нужна для accessibility/мобильного UX',
    ],
    [
      'picker — фиксированной высоты 44px (одинаково с input)',
      /\.wdg-pm-wrap\s+\.wdg-pm-picker\s*\{[^}]*height:\s*44px[^}]*\}/,
      'picker и input должны быть одной высоты',
    ],
    [
      'picker — flex:0 0 auto (не растягивается, не сжимается)',
      /\.wdg-pm-wrap\s+\.wdg-pm-picker\s*\{[^}]*flex:\s*0\s+0\s+auto[^}]*\}/,
      'picker должен быть фиксированной ширины',
    ],
    [
      'picker[hidden] — display:none (single-country mode)',
      /\.wdg-pm-wrap\s+\.wdg-pm-picker\[hidden\]\s*\{[^}]*display:\s*none[^}]*\}/,
      'без этого hidden=true даёт пустое место',
    ],
    [
      'hint — display:block + width:100% (full-width под всей строкой)',
      /\.wdg-pm-wrap\s+\.wdg-pm-hint\s*\{[^}]*display:\s*block[^}]*width:\s*100%[^}]*\}/,
      'hint должен быть full-width, чтобы текст не переносился под одной только шириной input',
    ],
    [
      'hint — color #667085 (gray-500)',
      /\.wdg-pm-wrap\s+\.wdg-pm-hint\s*\{[^}]*color:\s*#667085[^}]*\}/,
      'дизайн фиксирует цвет подсказки',
    ],
    [
      'error — display:block + width:100% (full-width под всей строкой)',
      /\.wdg-pm-wrap\s+\.wdg-pm-error\s*\{[^}]*display:\s*block[^}]*width:\s*100%[^}]*\}/,
      'error в строке с input — это и есть ломаная вёрстка',
    ],
    [
      'error — color #e03131 (red)',
      /\.wdg-pm-wrap\s+\.wdg-pm-error\s*\{[^}]*color:\s*#e03131[^}]*\}/,
      'красный — ожидаемый цвет ошибки',
    ],
    [
      'aria-invalid даёт красный border на input',
      /\.wdg-pm-wrap\s+\.wdg-pm-input\s+input\[aria-invalid="true"\]\s*\{[^}]*border-color:\s*#e03131[^}]*\}/,
      'без этой подсветки невалидное поле визуально не отличается от валидного',
    ],
    [
      '.wdg-pm-hidden — display:none',
      /\.wdg-pm-hidden[^{]*\{\s*display:\s*none\s*\}/,
      'класс-утилита для скрытия error',
    ],
    [
      '.wdg-pm-dd — position:absolute (поверх остальной формы)',
      /\.wdg-pm-dd\s*\{[^}]*position:\s*absolute[^}]*\}/,
      'дропдаун должен быть абсолютным, иначе раздвигает форму',
    ],
    [
      '.wdg-pm-dd — z-index достаточно высокий',
      /\.wdg-pm-dd\s*\{[^}]*z-index:\s*9999[^}]*\}/,
      'без высокого z-index дропдаун перекроется чужими элементами',
    ],
    [
      '.wdg-pm-dd скрыт по умолчанию (display:none)',
      /\.wdg-pm-dd\s*\{[^}]*display:\s*none[^}]*\}/,
      'до клика по picker дропдаун должен быть невидим',
    ],
    [
      '.wdg-pm-dd.open — display:block',
      /\.wdg-pm-dd\.open\s*\{\s*display:\s*block\s*\}/,
      'класс .open включает дропдаун',
    ],
    [
      '.wdg-pm-dd открывается прямо под picker (top = высота picker + gap)',
      /\.wdg-pm-dd\s*\{[^}]*top:\s*calc\(\s*44px\s*\+\s*6px\s*\)[^}]*\}/,
      'без этого дропдаун открывается под всей строкой (picker+input), а не под кнопкой страны',
    ],
    [
      '.wdg-pm-dd имеет box-sizing: border-box (padding/border не лезут за width)',
      /\.wdg-pm-dd\s*\{[^}]*box-sizing:\s*border-box[^}]*\}/,
      'без border-box max-width:95vw + border выходит за вьюпорт',
    ],
    [
      '.wdg-pm-dd .wdg-pm-search — position:sticky',
      /\.wdg-pm-dd\s+\.wdg-pm-search\s*\{[^}]*position:\s*sticky[^}]*\}/,
      'без sticky шапка не закрепляется при скролле списка',
    ],
    [
      '.wdg-pm-dd .wdg-pm-search — непрозрачный фон #fff',
      /\.wdg-pm-dd\s+\.wdg-pm-search\s*\{[^}]*background:\s*#fff[^}]*\}/,
      'без сплошного фона первая строка списка торчит из-под sticky-шапки',
    ],
    [
      '.wdg-pm-dd .wdg-pm-search — z-index ≥ 1 (поверх скроллящихся .wdg-pm-item)',
      /\.wdg-pm-dd\s+\.wdg-pm-search\s*\{[^}]*z-index:\s*\d+[^}]*\}/,
      'sticky без z-index в Safari может уйти под item-ы',
    ],
    [
      '.wdg-pm-dd .wdg-pm-search input — width:100%, box-sizing:border-box',
      /\.wdg-pm-dd\s+\.wdg-pm-search\s+input\s*\{[^}]*width:\s*100%[^}]*\}/,
      'поле поиска должно растягиваться на всю шапку',
    ],
    // Защита от host-CSS магазина: глобальные `img { ... }` правила Horoshop-тем.
    [
      'флаг-бокс: явные min/max width и height — host-CSS не растянет',
      /\.wdg-pm-flagbox[^{]*\{[^}]*min-width:\s*20px[^}]*\}/,
      'без явного min-width хост может задать width:0 или 100%',
    ],
    [
      'флаг-бокс: max-width 20px — host-CSS не растянет шире',
      /\.wdg-pm-flagbox[^{]*\{[^}]*max-width:\s*20px[^}]*\}/,
      'без max-width хост-правило img или родителя может растянуть бокс',
    ],
    [
      'флаг-img: position:relative — host-CSS не вытащит в absolute',
      /\.wdg-pm-flagimg[^{]*\{[^}]*position:\s*relative[^}]*\}/,
      'если хост-CSS делает img{position:absolute}, флаг прыгнет в верх-лево вьюпорта или родителя — это и был баг',
    ],
    [
      'флаг-img: display:block + явные min/max размеры',
      /\.wdg-pm-flagimg[^{]*\{[^}]*max-width:\s*20px[^}]*\}/,
      'без max-width глобальное img{width:100%} растянет флаг',
    ],
    [
      'флаг-img: float:none (host-CSS типа img{float:left} не должен сработать)',
      /\.wdg-pm-flagimg[^{]*\{[^}]*float:\s*none[^}]*\}/,
      'если хост-CSS даёт img{float:left}, флаги выстроятся в один ряд',
    ],
    [
      'флаг-img: явный margin:0',
      /\.wdg-pm-flagimg[^{]*\{[^}]*margin:\s*0[^}]*\}/,
      'без margin:0 хост может вставить отступы между флагом и текстом',
    ],
    [
      'флаг-img: явные top/left/right/bottom: auto — на случай host-CSS с координатами',
      /\.wdg-pm-flagimg[^{]*\{[^}]*left:\s*auto[^}]*\}/,
      'если хост-CSS ставит img{left:0;top:0}, флаг улетит в угол позиционированного предка',
    ],
    [
      '.wdg-pm-wrap *,.wdg-pm-dd * — общий box-sizing:border-box',
      /\.wdg-pm-wrap\s+\*,\.wdg-pm-dd\s+\*\s*\{[^}]*box-sizing:\s*border-box[^}]*\}/,
      'единый box-sizing внутри виджета — иначе расчёты ширин сыпятся',
    ],
  ];

  for (const [name, regex, why] of rules) {
    it(`CSS: ${name}`, () => {
      if (!regex.test(css)) {
        throw new Error(`CSS regression: ${name}\nReason: ${why}\nExpected pattern: ${regex}`);
      }
    });
  }

  it('CSS не содержит остатков старого префикса .syl- из исходного бандла', () => {
    expect(css).not.toMatch(/\.syl-/);
  });

  it('весь CSS префиксован .wdg-pm- (нет утечки в чужие селекторы)', () => {
    // выкусываем только селекторы (до `{`)
    const selectorBlocks = css.match(/[^{}]+(?=\{)/g) ?? [];
    for (const sel of selectorBlocks) {
      const trimmed = sel.trim();
      if (!trimmed) continue;
      // допускаем составные `.wdg-pm-X .wdg-pm-Y input`, `.wdg-pm-X[attr]`, `.wdg-pm-X.wdg-pm-Y`
      if (!trimmed.includes('.wdg-pm-')) {
        throw new Error(`Селектор без префикса .wdg-pm-: "${trimmed}"`);
      }
    }
  });
});

// ─── Дропдаун: структура и нерегрессия по «торчащему флагу» ────────────────
//
// Реальная регрессия из апреля 2026: в открытом дропдауне поверх sticky-шапки
// «торчал» один флаг (наверху-слева), а первая строка списка пряталась под
// шапкой. Корень — host-CSS магазина, ставивший `img { position: absolute }`
// на все картинки. Тесты ниже фиксируют структурные инварианты, которые при
// корректных стилях не позволят такой регрессии повториться.

describe('layout: dropdown structure', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    localStorage.clear();
  });

  function openDropdown(): { wrap: HTMLDivElement; row: HTMLDivElement; dd: HTMLDivElement } {
    document.body.innerHTML = '<form><input type="tel" name="phone"></form>';
    phoneMask(getDefaultConfig(), getDefaultI18n());
    const wrap = document.querySelector<HTMLDivElement>('.wdg-pm-wrap')!;
    const row = document.querySelector<HTMLDivElement>('.wdg-pm-row')!;
    const picker = document.querySelector<HTMLButtonElement>('.wdg-pm-picker')!;
    picker.click();
    const dd = document.querySelector<HTMLDivElement>('.wdg-pm-dd')!;
    return { wrap, row, dd };
  }

  it('дропдаун — прямой потомок .wdg-pm-row (его абсолют отсчитывается от высоты picker)', () => {
    const { row, dd } = openDropdown();
    expect(dd.parentElement).toBe(row);
  });

  it('у дропдауна ровно ДВА прямых ребёнка: search + list (никаких посторонних элементов между ними)', () => {
    const { dd } = openDropdown();
    const children = Array.from(dd.children);
    expect(children.length).toBe(2);
    expect(children[0]?.classList.contains('wdg-pm-search')).toBe(true);
    expect(children[0]?.tagName).toBe('DIV');
  });

  it('search содержит только <input type=text> — НИКАКИХ <img>/флагов внутри', () => {
    const { dd } = openDropdown();
    const search = dd.querySelector('.wdg-pm-search')!;
    expect(search.querySelector('img')).toBeNull();
    expect(search.querySelector('.wdg-pm-flagbox')).toBeNull();
    const inputs = search.querySelectorAll('input');
    expect(inputs.length).toBe(1);
    expect(inputs[0]!.type).toBe('text');
  });

  it('все <img> в дропдауне расположены ТОЛЬКО внутри .wdg-pm-flagbox у каждого item', () => {
    const { dd } = openDropdown();
    const imgs = dd.querySelectorAll('img');
    for (const img of imgs) {
      const box = img.closest('.wdg-pm-flagbox');
      expect(box).not.toBeNull();
      const item = img.closest('.wdg-pm-item');
      expect(item).not.toBeNull();
    }
  });

  it('каждый .wdg-pm-item содержит ровно один флаг и один title — без дубликатов', () => {
    const { dd } = openDropdown();
    const items = dd.querySelectorAll('.wdg-pm-item');
    expect(items.length).toBeGreaterThan(50); // есть вообще страны
    for (const item of Array.from(items).slice(0, 10)) {
      expect(item.querySelectorAll('.wdg-pm-dd-flag').length).toBe(1);
      expect(item.querySelectorAll('.wdg-pm-dd-title').length).toBe(1);
      expect(item.querySelectorAll('img').length).toBe(1);
    }
  });

  it('класс .wdg-pm-dd-flag всегда соседствует с .wdg-pm-flagbox (это один и тот же элемент)', () => {
    const { dd } = openDropdown();
    const flags = dd.querySelectorAll('.wdg-pm-dd-flag');
    expect(flags.length).toBeGreaterThan(0);
    for (const flag of flags) {
      expect(flag.classList.contains('wdg-pm-flagbox')).toBe(true);
    }
  });

  it('первая строка списка не находится под sticky-шапкой DOM-логически (item приходит ПОСЛЕ search)', () => {
    const { dd } = openDropdown();
    const search = dd.querySelector('.wdg-pm-search')!;
    const firstItem = dd.querySelector('.wdg-pm-item')!;
    // search идёт перед первым item в обходе документа
    const cmp = search.compareDocumentPosition(firstItem);
    expect(cmp & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('search — прямой ребёнок .wdg-pm-dd, не вложен в список', () => {
    const { dd } = openDropdown();
    const search = dd.querySelector('.wdg-pm-search')!;
    expect(search.parentElement).toBe(dd);
  });

  it('закрытие дропдауна не удаляет search-input (дропдаун только скрывается, инварианты сохраняются)', () => {
    const { dd } = openDropdown();
    document.body.click();
    expect(dd.classList.contains('open')).toBe(false);
    expect(dd.querySelector('.wdg-pm-search input')).not.toBeNull();
  });

  it('повторное открытие сбрасывает поисковый запрос', () => {
    const { dd } = openDropdown();
    const searchInput = dd.querySelector<HTMLInputElement>('.wdg-pm-search input')!;
    searchInput.value = 'україна';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    document.body.click();
    expect(dd.classList.contains('open')).toBe(false);

    document.querySelector<HTMLButtonElement>('.wdg-pm-picker')!.click();
    expect(dd.classList.contains('open')).toBe(true);
    expect(searchInput.value).toBe('');
  });
});

// ─── Защита от host-CSS магазина (Horoshop и пр.) ──────────────────────────
//
// Магазины часто грузят темы с глобальными правилами вроде
//   `img { position: absolute; max-width: 100% !important; }`
//   `input { box-shadow: ...; padding: 0; }`
// Виджет НЕ ДОЛЖЕН рассыпаться от такого. Тесты проверяют специфичность
// наших селекторов и наличие защитных явных свойств.

describe('layout: host-CSS защита', () => {
  const css = buildCSS();

  it('каждый top-level селектор содержит .wdg-pm-wrap или .wdg-pm-dd (специфичность ≥ 0,2,0)', () => {
    // Берём все селекторы (до `{`), затем разделяем по запятой.
    const selectorBlocks = css.match(/[^{}]+(?=\{)/g) ?? [];
    for (const block of selectorBlocks) {
      const parts = block.split(',').map((s) => s.trim()).filter(Boolean);
      for (const sel of parts) {
        if (sel.includes('.wdg-pm-wrap') || sel.includes('.wdg-pm-dd')) continue;
        throw new Error(`Селектор без квалификатора корня: "${sel}" (нужен .wdg-pm-wrap или .wdg-pm-dd для специфичности над host-CSS)`);
      }
    }
  });

  it('правило флаг-img защищено от хост-CSS img{position:absolute}', () => {
    // Проверяем сразу пакет защитных свойств на одном правиле
    const flagImgRule = css.match(/\.wdg-pm-flagimg[^{]*\{([^}]*)\}/g);
    expect(flagImgRule).not.toBeNull();
    const body = (flagImgRule || []).join(' ');
    for (const prop of ['position:relative', 'left:auto', 'top:auto', 'max-width:20px', 'max-height:14px', 'margin:0', 'float:none']) {
      if (!body.includes(prop)) {
        throw new Error(`flag-img CSS missing defensive prop: ${prop}`);
      }
    }
  });

  it('правило флаг-бокса защищено: явные min/max размеры + overflow:hidden', () => {
    const boxRule = css.match(/\.wdg-pm-flagbox[^{]*\{([^}]*)\}/g);
    expect(boxRule).not.toBeNull();
    const body = (boxRule || []).join(' ');
    for (const prop of ['min-width:20px', 'max-width:20px', 'min-height:14px', 'max-height:14px', 'overflow:hidden', 'position:relative']) {
      if (!body.includes(prop)) {
        throw new Error(`flagbox CSS missing defensive prop: ${prop}`);
      }
    }
  });

  it('search-шапка дропдауна с непрозрачным фоном, sticky и z-index — host item-ы не торчат под ней', () => {
    const rule = css.match(/\.wdg-pm-dd\s+\.wdg-pm-search\s*\{([^}]*)\}/)?.[1] ?? '';
    for (const prop of ['position:sticky', 'top:0', 'background:#fff', 'z-index:', 'box-sizing:border-box']) {
      if (!rule.includes(prop)) {
        throw new Error(`sticky search CSS missing defensive prop: ${prop}`);
      }
    }
  });

  it('input в search-шапке нормализован: width:100%, box-sizing:border-box, font:inherit, margin:0', () => {
    const rule = css.match(/\.wdg-pm-dd\s+\.wdg-pm-search\s+input\s*\{([^}]*)\}/)?.[1] ?? '';
    for (const prop of ['width:100%', 'box-sizing:border-box', 'font:inherit', 'margin:0', 'display:block']) {
      if (!rule.includes(prop)) {
        throw new Error(`search-input CSS missing defensive prop: ${prop}`);
      }
    }
  });

  it('input в .wdg-pm-input защищён от host-стилей (margin:0, font-size фиксирован, background:#fff)', () => {
    const rule = css.match(/\.wdg-pm-wrap\s+\.wdg-pm-input\s+input\s*\{([^}]*)\}/)?.[1] ?? '';
    for (const prop of ['margin:0', 'background:#fff', 'box-sizing:border-box', 'font-size:14px']) {
      if (!rule.includes(prop)) {
        throw new Error(`phone-input CSS missing defensive prop: ${prop}`);
      }
    }
  });

  it('picker нормализует font, color и убирает margin (host-button-стиль не должен мешать)', () => {
    const rule = css.match(/\.wdg-pm-wrap\s+\.wdg-pm-picker\s*\{([^}]*)\}/)?.[1] ?? '';
    for (const prop of ['font:inherit', 'margin:0', 'background:#fff', 'box-sizing:border-box']) {
      if (!rule.includes(prop)) {
        throw new Error(`picker CSS missing defensive prop: ${prop}`);
      }
    }
  });
});

// ─── Поведение при изменении состояния ─────────────────────────────────────
describe('layout: state transitions', () => {
  it('error появляется full-width под строкой [picker][input] (sibling row, не дитя input)', () => {
    mountWithInput();
    const input = document.querySelector<HTMLInputElement>('.wdg-pm-wrap input[type="tel"]')!;
    input.value = '12';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));

    const error = document.querySelector('.wdg-pm-error')!;
    const wrap = document.querySelector('.wdg-pm-wrap')!;
    expect(error.classList.contains('wdg-pm-hidden')).toBe(false);
    // error — прямой ребёнок wrap (а не inputBox), чтобы быть full-width
    expect(error.parentElement).toBe(wrap);
    // и идёт ПОСЛЕ row в DOM
    const row = document.querySelector('.wdg-pm-row')!;
    expect(row.compareDocumentPosition(error) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('aria-invalid="true" ставится на input при невалидном blur, снимается при правке', () => {
    mountWithInput();
    const input = document.querySelector<HTMLInputElement>('.wdg-pm-wrap input[type="tel"]')!;
    input.value = '12';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    expect(input.getAttribute('aria-invalid')).toBe('true');

    input.value = '671234567';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('dropdown по умолчанию закрыт; клик по picker — открывает; клик за пределами — закрывает', () => {
    mountWithInput();
    const picker = document.querySelector<HTMLButtonElement>('.wdg-pm-picker')!;
    const dd = document.querySelector<HTMLDivElement>('.wdg-pm-dd')!;
    expect(dd.classList.contains('open')).toBe(false);
    expect(picker.getAttribute('aria-expanded')).toBe('false');

    picker.click();
    expect(dd.classList.contains('open')).toBe(true);
    expect(picker.getAttribute('aria-expanded')).toBe('true');

    document.body.click();
    expect(dd.classList.contains('open')).toBe(false);
    expect(picker.getAttribute('aria-expanded')).toBe('false');
  });

  it('при hidePicker=true picker имеет атрибут hidden — браузер скроет через CSS', () => {
    document.body.innerHTML = '<form><input type="tel" name="phone"></form>';
    phoneMask({ ...getDefaultConfig(), hidePicker: true }, getDefaultI18n());
    const picker = document.querySelector<HTMLButtonElement>('.wdg-pm-picker')!;
    expect(picker.hidden).toBe(true);
    expect(picker.hasAttribute('hidden')).toBe(true);
  });

  it('after cleanup — input возвращается на своё место в форме без обёртки', () => {
    document.body.innerHTML = '<form><label>Phone</label><input type="tel" name="phone"><span class="after">x</span></form>';
    const cleanup = phoneMask(getDefaultConfig(), getDefaultI18n())!;
    cleanup();

    const form = document.querySelector('form')!;
    const kids = Array.from(form.children).map((c) => c.tagName + (c.className ? '.' + c.className : ''));
    expect(kids).toEqual(['LABEL', 'INPUT', 'SPAN.after']);
    expect(document.getElementById(STYLE_TAG_ID)).toBeNull();
  });
});

// ─── Привязка к input.style: ничего не должно течь из CSS виджета ─────────
describe('layout: no inline-style pollution on input', () => {
  it('виджет не ставит на input inline-style (всё через классы и атрибуты)', () => {
    const input = mountWithInput();
    // допускаем aria-invalid и data-wdg-phone-mask, но не style
    expect(input.getAttribute('style')).toBeNull();
  });

  it('виджет не меняет name/type input-а', () => {
    const input = mountWithInput('<input type="tel" name="Recipient[phone]">');
    expect(input.getAttribute('type')).toBe('tel');
    expect(input.getAttribute('name')).toBe('Recipient[phone]');
  });
});
