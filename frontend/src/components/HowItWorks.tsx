import { useEffect, useRef, useState } from 'react'
import { MousePointerClick, Gift, Code2, Rocket } from 'lucide-react'
import './HowItWorks.css'

const STEPS = [
  {
    icon: MousePointerClick,
    title: 'Обери план',
    text: 'Basic, Pro або Max — той, що підходить твоєму магазину.',
  },
  {
    icon: Gift,
    title: 'Почни 7-денний trial',
    text: 'Додаєш картку, але ми не знімемо гроші протягом 7 днів.',
  },
  {
    icon: Code2,
    title: 'Встанови код',
    text: 'Копіюєш один скрипт і вставляєш в адмінку свого магазину. Займає 5 хвилин.',
  },
  {
    icon: Rocket,
    title: 'Продавай більше',
    text: 'Віджети викликають довіру, підіймають чек, повертають клієнтів.',
  },
]

export function HowItWorks() {
  const [active, setActive] = useState(0)
  const panelRefs = useRef<(HTMLLIElement | null)[]>([])

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = Number((e.target as HTMLElement).dataset.idx)
            setActive(idx)
          }
        })
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 },
    )

    panelRefs.current.forEach((el) => el && obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const progressPct = (active / (STEPS.length - 1)) * 100

  return (
    <section className="how" aria-labelledby="how-title">
      <div className="how__container">
        <header className="how__header">
          <p className="how__eyebrow">Як це працює</p>
          <h2 id="how-title" className="how__title">
            4 кроки до <span className="how__title-accent">запуску</span>
          </h2>
        </header>

        <div className="how__stepper-wrap">
          <div className="how__stepper">
            <div className="how__progress" aria-hidden="true">
              <div className="how__progress-track" />
              <div
                className="how__progress-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <ol className="how__bubbles">
              {STEPS.map((s, i) => (
                <li
                  key={i}
                  className={`how__bubble ${i <= active ? 'how__bubble--done' : ''} ${i === active ? 'how__bubble--active' : ''}`}
                  aria-current={i === active ? 'step' : undefined}
                >
                  <span className="how__bubble-num">{i + 1}</span>
                  <span className="how__bubble-label">{s.title}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <ol className="how__panels">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            return (
              <li
                key={i}
                ref={(el) => {
                  panelRefs.current[i] = el
                }}
                data-idx={i}
                className={`how__panel ${i === active ? 'how__panel--active' : ''}`}
              >
                <div className="how__panel-inner">
                  <div className="how__panel-num" aria-hidden="true">
                    0{i + 1}
                  </div>
                  <div className="how__panel-icon" aria-hidden="true">
                    <Icon size={28} strokeWidth={2} />
                  </div>
                  <h3 className="how__panel-title">{s.title}</h3>
                  <p className="how__panel-text">{s.text}</p>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
