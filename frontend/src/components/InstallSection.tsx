import { Copy, Settings2, ToggleRight, Plug } from 'lucide-react'
import './InstallSection.css'

const STEPS = [
  {
    num: '1',
    Icon: Copy,
    title: 'Скопіюй скрипт',
    desc: 'Отримаєш один рядок коду після реєстрації.',
  },
  {
    num: '2',
    Icon: Settings2,
    title: 'Встав в адмінку Хорошоп',
    desc: 'Налаштування → HTML-код сайту → вставляєш перед </body>',
  },
  {
    num: '3',
    Icon: ToggleRight,
    title: 'Вмикай віджети',
    desc: 'У своєму кабінеті Widgetis активуєш потрібні модулі.',
  },
]

export function InstallSection() {
  return (
    <section className="install">
      <div className="install__inner">
        <header className="install__header">
          <span className="install__eyebrow">
            <Plug size={13} strokeWidth={2.25} />
            Підключення
          </span>
          <h2 className="install__title">Спосіб підключення</h2>
          <p className="install__sub">Без програміста. Займає 3 хвилини.</p>
        </header>

        <div className="install__steps">
          {STEPS.map((s, i) => {
            const Icon = s.Icon
            return (
              <div key={i} className="install__step">
                {i < STEPS.length - 1 && (
                  <div className="install__connector" aria-hidden="true" />
                )}
                <div className="install__step-num" aria-hidden="true">
                  {s.num}
                </div>
                <div className="install__step-icon" aria-hidden="true">
                  <Icon size={22} strokeWidth={2} />
                </div>
                <h3 className="install__step-title">{s.title}</h3>
                <p className="install__step-desc">{s.desc}</p>
              </div>
            )
          })}
        </div>

        <div className="install__code-wrap">
          <div className="install__code-bar">
            <span className="install__code-dot" />
            <span className="install__code-dot" />
            <span className="install__code-dot" />
            <span className="install__code-label">HTML</span>
          </div>
          <div className="install__code-body">
            <code className="install__code-text">
              <span className="install__code-tag">&lt;script</span>
              {' '}
              <span className="install__code-attr">src</span>
              <span className="install__code-eq">=</span>
              <span className="install__code-val">"https://cdn.widgetis.com/w.js"</span>
              {' '}
              <span className="install__code-attr">data-key</span>
              <span className="install__code-eq">=</span>
              <span className="install__code-val">"ВАШ_КЛЮЧ"</span>
              <span className="install__code-tag">&gt;&lt;/script&gt;</span>
            </code>
            <span className="install__code-copy" aria-hidden="true">
              <Copy size={15} strokeWidth={2} />
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
