import { ShieldCheck, Lock, Undo2, HeartHandshake } from 'lucide-react'
import './Guarantee.css'

const POINTS = [
  {
    icon: Lock,
    title: 'Код повністю захищений',
    text: 'Віджети працюють ізольовано і не ламають твій магазин.',
  },
  {
    icon: Undo2,
    title: '14 днів на роздуми',
    text: 'Не сподобалось — пишеш нам, і ми повертаємо гроші.',
  },
  {
    icon: HeartHandshake,
    title: 'Без зайвих питань',
    text: 'Не треба пояснювати, чому. Просто повертаємо суму на карту.',
  },
]

export function Guarantee() {
  return (
    <section className="guarantee" aria-labelledby="guarantee-title">
      <div className="guarantee__container">
        <div className="guarantee__badge" aria-hidden="true">
          <ShieldCheck size={32} strokeWidth={2} />
        </div>

        <h2 id="guarantee-title" className="guarantee__title">
          Не сподобається — <span className="guarantee__title-accent">повернемо гроші</span>
        </h2>

        <p className="guarantee__lede">
          Код повністю захищений. Якщо щось не так — у тебе є 14 днів, щоб передумати.
          Без бюрократії і зайвих питань.
        </p>

        <ul className="guarantee__points">
          {POINTS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="guarantee__point">
              <span className="guarantee__point-icon" aria-hidden="true">
                <Icon size={18} strokeWidth={2.25} />
              </span>
              <div className="guarantee__point-body">
                <h3 className="guarantee__point-title">{title}</h3>
                <p className="guarantee__point-text">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
