export const STYLE_ID = 'wdg-phone-mask-styles';
export const ROOT_CLASS = 'wdg-pm-wrap';

/**
 * CSS виджета phone-mask.
 *
 * Структура виджета:
 *   .wdg-pm-wrap (column)              — корень, full-width
 *     .wdg-pm-row (row, position:relative)  — [picker][input], якорь дропдауна
 *       .wdg-pm-picker
 *       .wdg-pm-input > input
 *       .wdg-pm-dd                     — абсолютный поверх формы
 *     .wdg-pm-hint                     — full-width ПОД строкой
 *     .wdg-pm-error                    — full-width ПОД строкой
 *
 * Принципы CSS:
 *   1. Каждое правило начинается с `.wdg-pm-wrap` или `.wdg-pm-dd` — чтобы
 *      специфичность была выше одиночных селекторов host-темы магазина.
 *   2. Все элементы, на которых тема может ставить позиционирование/маржи,
 *      явно фиксируются: `position`, `inset`, `margin`, `padding`, `width`,
 *      `height`, `box-sizing`.
 *   3. Картинки флагов: явные `min/max` размеры + `position: relative` —
 *      перебивают глобальные `img`-правила хоста (типа Horoshop-тем
 *      с `img { position: absolute; max-width: 100% }`).
 *   4. Sticky-шапка дропдауна имеет непрозрачный фон + явный z-index —
 *      первая строка списка не торчит из-под неё.
 */
export function buildCSS(): string {
  return `
.wdg-pm-wrap{position:relative;display:flex;flex-direction:column;align-items:stretch;width:100%;box-sizing:border-box;margin:0;padding:0}
.wdg-pm-wrap *,.wdg-pm-dd *{box-sizing:border-box}
.wdg-pm-wrap .wdg-pm-row{position:relative;display:flex;align-items:flex-start;gap:8px;width:100%;box-sizing:border-box;margin:0}
.wdg-pm-wrap .wdg-pm-picker{display:flex;align-items:center;gap:6px;padding:10px;margin:0;border:1px solid #d5d7da;border-radius:8px;background:#fff;cursor:pointer;user-select:none;min-height:44px;height:44px;box-sizing:border-box;flex:0 0 auto;font:inherit;color:#111}
.wdg-pm-wrap .wdg-pm-picker:focus{outline:2px solid #805ad5;outline-offset:2px}
.wdg-pm-wrap .wdg-pm-picker[hidden]{display:none}
.wdg-pm-wrap .wdg-pm-flagbox,.wdg-pm-dd .wdg-pm-flagbox{position:relative;display:inline-flex;flex:0 0 20px;width:20px;height:14px;min-width:20px;max-width:20px;min-height:14px;max-height:14px;overflow:hidden;border-radius:3px;background:#f2f2f2;align-items:center;justify-content:center;vertical-align:middle;margin:0;padding:0}
.wdg-pm-wrap .wdg-pm-flagimg,.wdg-pm-dd .wdg-pm-flagimg{position:relative;display:block;width:20px;height:14px;min-width:20px;max-width:20px;min-height:14px;max-height:14px;margin:0;padding:0;border:0;object-fit:cover;left:auto;top:auto;right:auto;bottom:auto;float:none}
.wdg-pm-wrap .wdg-pm-flag-emoji,.wdg-pm-dd .wdg-pm-flag-emoji{font-size:16px;line-height:1}
.wdg-pm-wrap .wdg-pm-name{font-size:12px;color:#555;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px}
.wdg-pm-wrap .wdg-pm-input{flex:1 1 auto;min-width:0;display:block;margin:0;padding:0}
.wdg-pm-wrap .wdg-pm-input input{display:block;width:100%;padding:10px 12px;margin:0;border:1px solid #d5d7da;border-radius:8px;min-height:44px;box-sizing:border-box;font-size:14px;line-height:1.4;background:#fff;color:#111}
.wdg-pm-wrap .wdg-pm-input input[aria-invalid="true"]{border-color:#e03131;box-shadow:0 0 0 3px rgba(224,49,49,.08)}
.wdg-pm-wrap .wdg-pm-hint{display:block;width:100%;font-size:12px;color:#667085;margin:6px 0 0 0;padding:0;line-height:1.4;box-sizing:border-box}
.wdg-pm-wrap .wdg-pm-error{display:block;width:100%;font-size:12px;color:#e03131;margin:4px 0 0 0;padding:0;line-height:1.4;box-sizing:border-box}
.wdg-pm-wrap .wdg-pm-hidden,.wdg-pm-dd .wdg-pm-hidden{display:none}
.wdg-pm-dd{position:absolute;left:0;top:calc(44px + 6px);z-index:9999;width:420px;max-width:95vw;max-height:360px;overflow:auto;background:#fff;border:1px solid #e6e8eb;border-radius:10px;box-shadow:0 8px 24px rgba(16,24,40,.16);display:none;padding:0;margin:0;box-sizing:border-box}
.wdg-pm-dd.open{display:block}
.wdg-pm-dd .wdg-pm-search{position:sticky;top:0;left:0;right:0;z-index:1;background:#fff;padding:8px;margin:0;border-bottom:1px solid #eee;box-sizing:border-box;display:block}
.wdg-pm-dd .wdg-pm-search input{display:block;width:100%;padding:8px 10px;margin:0;border:1px solid #d5d7da;border-radius:8px;box-sizing:border-box;font:inherit;font-size:14px;line-height:1.4;color:#111;background:#fff;min-height:36px}
.wdg-pm-dd .wdg-pm-search input:focus{outline:2px solid #805ad5;outline-offset:2px}
.wdg-pm-dd .wdg-pm-item{display:flex;align-items:center;gap:10px;padding:10px 12px;cursor:pointer;background:#fff;color:#111}
.wdg-pm-dd .wdg-pm-item[aria-selected="true"],.wdg-pm-dd .wdg-pm-item:hover{background:#f6f7f8}
.wdg-pm-dd .wdg-pm-dd-flag{flex:0 0 20px;width:20px;height:14px;min-width:20px;max-width:20px;border-radius:3px;overflow:hidden}
.wdg-pm-dd .wdg-pm-dd-title{display:flex;flex-direction:column;min-width:0;flex:1 1 auto}
.wdg-pm-dd .wdg-pm-dd-line1{font-size:13px;color:#111;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
`;
}

export function injectStyles(doc: Document = document): void {
  if (doc.getElementById(STYLE_ID)) return;
  const el = doc.createElement('style');
  el.id = STYLE_ID;
  el.textContent = buildCSS();
  doc.head.appendChild(el);
}
