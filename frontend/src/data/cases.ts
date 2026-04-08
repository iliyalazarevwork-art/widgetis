// ===== Cases — static showcase data =====

export interface Case {
  id: string
  store: string // domain for display
  storeUrl: string // href
  owner: string // owner/brand name
  description: string // what they sell
  widgets: string[] // widget names used
  result: {
    metric: string // "+15% конверсія"
    period: string // "за 3 місяці"
  }
  review: {
    text: string
    rating: number // 1-5
  }
  color: string // accent color for avatar/accents
}

export const cases: Case[] = [
  {
    id: 'ptashkin',
    store: 'ptashkinsad.com',
    storeUrl: 'https://ptashkinsad.com',
    owner: 'Ptashkin Sad',
    description: 'Органічна косметика та догляд',
    widgets: ['Бігуча стрічка', 'Дата доставки', 'Ціль кошика'],
    result: {
      metric: '+18% середній чек',
      period: 'за 2 місяці',
    },
    review: {
      text: 'Покупці перестали кидати кошики на півдорозі — бачать прогрес до безкоштовної доставки і докидають ще один товар.',
      rating: 5,
    },
    color: '#10b981',
  },
  {
    id: 'beni-home',
    store: 'benihome.com.ua',
    storeUrl: 'https://benihome.com.ua',
    owner: 'Beni Home',
    description: 'Преміум постільна білизна та текстиль',
    widgets: ['Бігуча стрічка', 'Відео-прев\'ю', 'Хто зараз дивиться'],
    result: {
      metric: '+24% конверсія',
      period: 'за 3 місяці',
    },
    review: {
      text: 'Відео-прев\'ю товару на картці працює як магніт — люди дивляться довше, довіряють більше. Конверсія виросла одразу.',
      rating: 5,
    },
    color: '#f59e0b',
  },
  {
    id: 'ballistic',
    store: 'ballistic.com.ua',
    storeUrl: 'https://ballistic.com.ua',
    owner: 'Ballistic',
    description: 'Тактичний одяг та спорядження',
    widgets: ['Бігуча стрічка', 'Таймер', 'Дефіцит товару'],
    result: {
      metric: '−31% відмов',
      period: 'за місяць',
    },
    review: {
      text: 'Таймер і "залишилось 2 шт" реально створюють терміновість. Імпульсні покупки виросли, показник відмов впав.',
      rating: 5,
    },
    color: '#ef4444',
  },
  {
    id: 'kyivfit',
    store: 'kyivfit.store',
    storeUrl: 'https://kyivfit.store',
    owner: 'KyivFit',
    description: 'Спортивний одяг і аксесуари',
    widgets: ['Лічильник покупок', 'Фотовідгуки', 'Колесо фортуни'],
    result: {
      metric: '+42% email-база',
      period: 'за 6 тижнів',
    },
    review: {
      text: 'Колесо фортуни на виході з сайту збирає email-и в 3 рази краще, ніж попап зі знижкою. І покупці повертаються.',
      rating: 4,
    },
    color: '#3b82f6',
  },
  {
    id: 'homedetail',
    store: 'homedetail.ua',
    storeUrl: 'https://homedetail.ua',
    owner: 'HomeDetail',
    description: 'Декор та меблі для дому',
    widgets: ['Безкоштовна доставка', 'Хтось щойно купив', 'Прогресивна знижка'],
    result: {
      metric: '+15% середній чек',
      period: 'за 2 місяці',
    },
    review: {
      text: 'Прогресивна шкала знижок мотивує додати ще товар. Замовлення на 2500 грн перетворилися на 3500 — без агресивних акцій.',
      rating: 5,
    },
    color: '#8b5cf6',
  },
  {
    id: 'brewco',
    store: 'brewco.kyiv.ua',
    storeUrl: 'https://brewco.kyiv.ua',
    owner: 'Brew & Co',
    description: 'Спеціальна кава та аксесуари',
    widgets: ['Дата доставки', 'Квіз-рекомендатор', 'Кешбек'],
    result: {
      metric: '+28% повторних покупок',
      period: 'за 4 місяці',
    },
    review: {
      text: 'Квіз допомагає новачкам обрати каву — більше не губляться у 40 сортах. Кешбек повертає їх знову.',
      rating: 5,
    },
    color: '#ec4899',
  },
]
