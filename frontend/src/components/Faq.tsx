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
    a: 'Після оплати ми надсилаємо готовий скрипт і коротку інструкцію. Копіюєш його в адмінку свого магазину — і за 3 хвилини віджети вже працюють. Без програміста.',
  },
  {
    q: 'Що з підтримкою після покупки?',
    a: 'У пакет Start входить 3 місяці оновлень і допомоги, у Pro — 6, у Max — 12. Пишеш у Telegram або на пошту, відповідаємо українською, без ботів.',
  },
  {
    q: 'А якщо віджет не зайде моїй аудиторії?',
    a: 'У тебе є 14 днів після встановлення. Якщо бачиш, що не працює під твою нішу — пишеш нам, і ми повертаємо всю суму. Без пояснень.',
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
