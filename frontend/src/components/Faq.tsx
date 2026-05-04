import { useState } from 'react'
import { Plus } from 'lucide-react'
import './Faq.css'

const ITEMS = [
  {
    q: 'Чи підходить для мого магазину?',
    a: 'Так, якщо ваш магазин на Хорошоп — все працює з коробки. Встановлення займає 3 хвилини без програміста. Якщо не впевнений — напиши, перевіримо за 5 хвилин.',
  },
  {
    q: 'Як встановлюються віджети?',
    a: 'Після реєстрації підключаєш домен у кабінеті, ми генеруємо готовий скрипт. Вставляєш його в адмінку свого магазину — і за 3 хвилини віджети вже працюють. Без програміста.',
  },
  {
    q: 'Що таке trial і як він працює?',
    a: '7 днів безкоштовного доступу на обраному плані. Після закінчення trial автоматично списується оплата. Можна скасувати в будь-який момент до закінчення пробного періоду.',
  },
  {
    q: 'Що буде, якщо я відмовлюсь від підписки?',
    a: 'Доступ до віджетів зберігається до кінця оплаченого циклу. Всі налаштування зберігаються — повернутися можна в будь-який момент.',
  },
]

export function Faq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
    <section className="faq" id="faq" aria-labelledby="faq-title">
      <div className="faq__container">
        <header className="faq__header">
          <p className="faq__eyebrow">FAQ</p>
          <h2 id="faq-title" className="faq__title">Що зазвичай питають</h2>
        </header>

        <ul className="faq__list">
          {ITEMS.map((item, idx) => {
            const open = openIdx === idx
            return (
              <li key={idx} className={`faq__item ${open ? 'faq__item--open' : ''}`}>
                <button
                  type="button"
                  className="faq__question"
                  aria-expanded={open}
                  aria-controls={`faq-panel-${idx}`}
                  onClick={() => setOpenIdx(open ? null : idx)}
                >
                  <span className="faq__question-text">{item.q}</span>
                  <span className="faq__question-icon" aria-hidden="true">
                    <Plus size={18} strokeWidth={2.25} />
                  </span>
                </button>
                <div
                  id={`faq-panel-${idx}`}
                  className="faq__answer"
                  role="region"
                  hidden={!open}
                >
                  <p>{item.a}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
