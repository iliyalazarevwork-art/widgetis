import { Star } from 'lucide-react'
import './Cases.css'

interface Case {
  store: string
  storeUrl: string
  owner: string
  niche: string
  widgets: string[]
  rating: number
  quote: string
  avatar?: string
}

const CASES: Case[] = [
  {
    store: 'ballistic.com.ua',
    storeUrl: 'https://ballistic.com.ua/',
    owner: 'Денис',
    niche: 'Тактичне спорядження',
    widgets: ['Комплект віджетів'],
    rating: 5,
    quote: 'Працює! Дякую! Протестивши — все круто.',
    avatar: '/reviews/denis-ballistic.webp',
  },
  {
    store: 'ptashkinsad.com',
    storeUrl: 'https://ptashkinsad.com/',
    owner: 'Ігор',
    niche: 'Рослини та саджанці',
    widgets: ['Комплект віджетів'],
    rating: 5,
    quote: 'Задоволений на 100% результатом.',
    avatar: '/reviews/igor-ptashkinsad.webp',
  },
  {
    store: 'shop.aquamyrgorod.com.ua',
    storeUrl: 'https://shop.aquamyrgorod.com.ua/',
    owner: 'Олександр',
    niche: 'Мінеральна вода',
    widgets: ['Комплект віджетів'],
    rating: 5,
    quote: 'Супер. Як на мене, то чудова пропозиція.',
    avatar: '/reviews/Alex.webp',
  },
  {
    store: 'maroda.com.ua',
    storeUrl: 'https://maroda.com.ua/',
    owner: 'Роман',
    niche: 'Одяг та аксесуари',
    widgets: ['Банер'],
    rating: 4,
    quote: 'Все подобається.',
  },
  {
    store: 'zoo-vet.com.ua',
    storeUrl: 'https://zoo-vet.com.ua/',
    owner: 'Катерина',
    niche: 'Зоотовари',
    widgets: ['Дата доставки'],
    rating: 4,
    quote: 'Виглядає гуд, дуже дякую!',
    avatar: '/reviews/kate.webp',
  },
  {
    store: 'kr.kyiv.ua',
    storeUrl: 'https://kr.kyiv.ua/',
    owner: 'Аліна',
    niche: 'Товари для дому',
    widgets: ['Комплект віджетів'],
    rating: 5,
    quote: 'Всій нашій команді віджети сподобалися.',
  },
]

export function Cases() {
  return (
    <section className="cases">
      <div className="cases__intro">
        <h2 className="cases__title">
          Наші <span className="cases__title-accent">кейси</span>
        </h2>
        <p className="cases__sub">
          Реальні магазини. Реальні клієнти.
        </p>
      </div>

      <div className="cases__grid">
        {CASES.map((c) => (
          <a
            key={c.store}
            href={c.storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="case"
          >
            <div className="case__header">
              <div className="case__store">{c.store}</div>
              <div className="case__niche">{c.niche}</div>
            </div>

            <div className="case__widgets">
              {c.widgets.map((w) => (
                <span key={w} className="case__widget">{w}</span>
              ))}
            </div>

            <p className="case__quote">«{c.quote}»</p>

            <div className="case__footer">
              <div className="case__owner-wrap">
                {c.avatar ? (
                  <img src={c.avatar} alt={c.owner} className="case__avatar" loading="lazy" decoding="async" width="48" height="48" />
                ) : (
                  <div className="case__avatar-placeholder">{c.owner.charAt(0)}</div>
                )}
                <span className="case__owner">{c.owner}</span>
              </div>
              <span className="case__stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    strokeWidth={0}
                    fill={i < c.rating ? '#fbbf24' : '#333'}
                  />
                ))}
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
