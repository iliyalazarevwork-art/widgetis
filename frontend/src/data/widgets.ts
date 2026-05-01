// ===== Widget catalog — static data =====

export type PriceTier = 'simple' | 'advanced' | 'complex'
export type Platform = 'horoshop'
export type Tag =
  | 'conversion'
  | 'trust'
  | 'social-proof'
  | 'visual'
  | 'avg-order'
  | 'urgency'
  | 'loyalty'
  | 'engagement'

export const tagLabels: Record<Tag, string> = {
  conversion: 'Конверсія',
  trust: 'Довіра',
  'social-proof': 'Соц. доказ',
  visual: 'Візуал',
  'avg-order': 'Середній чек',
  urgency: 'Терміновість',
  loyalty: 'Лояльність',
  engagement: 'Залучення',
}

const tagOrder: Tag[] = ['conversion', 'trust', 'social-proof', 'avg-order', 'urgency', 'loyalty', 'engagement', 'visual']

export const tierLabels: Record<PriceTier, string> = {
  simple: 'Прості',
  advanced: 'Розширені',
  complex: 'Складні',
}

export interface Widget {
  id: string
  icon: string
  title: string
  description: string
  tag: Tag
  tagColor: 'green' | 'blue' | 'orange' | 'purple' | 'pink'
  isNew?: boolean
  isPopular?: boolean
  price: number
  priceTier: PriceTier
  platform: Platform
}

export const platformConfig: { id: Platform; label: string; available: boolean }[] = [
  { id: 'horoshop', label: 'Horoshop', available: true },
]

export const widgets: Widget[] = [
  {
    id: 'marquee',
    icon: 'megaphone',
    title: 'Біжучий рядок',
    description:
      'Анімований рядок з текстом акцій, знижок та спеціальних пропозицій. Привертає увагу та не дає пропустити важливе.',
    tag: 'conversion',
    tagColor: 'green',
    isPopular: true,
    price: 1200,
    priceTier: 'simple',
    platform: 'horoshop',
  },
  {
    id: 'delivery-date',
    icon: 'package',
    title: 'Дата доставки',
    description:
      'Показує орієнтовну дату отримання замовлення прямо на сторінці товару. Знімає невизначеність у клієнта.',
    tag: 'trust',
    tagColor: 'blue',
    isPopular: true,
    price: 1200,
    priceTier: 'simple',
    platform: 'horoshop',
  },
  {
    id: 'sticky-buy-button',
    icon: 'layers',
    title: 'Липка кнопка «Купити»',
    description:
      'Фіксована кнопка «Купити» знизу екрану на мобільних. Клієнт може оформити замовлення в будь-який момент, не шукаючи кнопку.',
    tag: 'conversion',
    tagColor: 'green',
    isPopular: true,
    price: 1200,
    priceTier: 'simple',
    platform: 'horoshop',
  },
  {
    id: 'trust-badges',
    icon: 'shield',
    title: 'Значки довіри',
    description:
      'Іконки гарантій поруч з кнопкою «Купити»: безпечна оплата, повернення, підтримка. Знімають сумніви перед покупкою.',
    tag: 'trust',
    tagColor: 'blue',
    price: 1200,
    priceTier: 'simple',
    platform: 'horoshop',
  },
  {
    id: 'phone-mask',
    icon: 'phone',
    title: 'Маска телефону',
    description:
      'Форматує поле вводу телефону на касі з вибором країни та прапорця. Зменшує помилки при введенні та спрощує оформлення замовлення.',
    tag: 'trust',
    tagColor: 'blue',
    price: 1200,
    priceTier: 'simple',
    platform: 'horoshop',
  },
  {
    id: 'min-order',
    icon: 'bar-chart',
    title: 'Мінімальне замовлення',
    description:
      'Спливаюча плашка з нагадуванням про мінімальну суму замовлення. Попереджає клієнтів заздалегідь і зменшує відмови на касі.',
    tag: 'avg-order',
    tagColor: 'green',
    price: 1200,
    priceTier: 'simple',
    platform: 'horoshop',
  },
  {
    id: 'cart-goal',
    icon: 'target',
    title: 'Ціль кошика',
    description:
      'Прогрес-бар: покаже скільки залишилось до безкоштовної доставки або знижки. Мотивує додавати товари і збільшує середній чек.',
    tag: 'avg-order',
    tagColor: 'green',
    isPopular: true,
    price: 3000,
    priceTier: 'advanced',
    platform: 'horoshop',
  },
  {
    id: 'social-proof',
    icon: 'cart',
    title: 'Лічильник покупок',
    description:
      'Відображає скільки людей вже купили цей товар. Соціальний доказ, що стимулює до покупки та підвищує довіру до товару.',
    tag: 'social-proof',
    tagColor: 'orange',
    isPopular: true,
    price: 3000,
    priceTier: 'advanced',
    platform: 'horoshop',
  },
  {
    id: 'stock-left',
    icon: 'hourglass',
    title: 'Залишок на складі',
    description:
      'Показує динамічний залишок товару на складі: «Залишилось 5 шт». Створює відчуття терміновості та підштовхує до швидкого рішення.',
    tag: 'urgency',
    tagColor: 'pink',
    price: 3000,
    priceTier: 'advanced',
    platform: 'horoshop',
  },
  {
    id: 'photo-reviews',
    icon: 'camera',
    title: 'Фото-відео відгуки',
    description:
      'Блок з реальними фото від покупців під товаром. Візуальний соціальний доказ, що підвищує довіру краще за текстові відгуки.',
    tag: 'social-proof',
    tagColor: 'orange',
    isNew: true,
    price: 3000,
    priceTier: 'advanced',
    platform: 'horoshop',
  },
  {
    id: 'recently-viewed',
    icon: 'eye',
    title: 'Нещодавно переглянуті',
    description:
      'Горизонтальна стрічка з останніми товарами, які переглядав клієнт. Повертає увагу до забутих товарів і збільшує глибину перегляду.',
    tag: 'engagement',
    tagColor: 'purple',
    price: 3000,
    priceTier: 'advanced',
    platform: 'horoshop',
  },
  {
    id: 'product-video-preview',
    icon: 'video',
    title: 'Відео-превью товару',
    description:
      'Відео-мініатюра в галереї товару при наведенні. Демонструє продукт у дії без переходу на YouTube.',
    tag: 'visual',
    tagColor: 'purple',
    isNew: true,
    price: 3000,
    priceTier: 'advanced',
    platform: 'horoshop',
  },
  {
    id: 'floating-messengers',
    icon: 'message-circle',
    title: 'Плаваючі месенджери',
    description:
      'Кнопки WhatsApp, Telegram, Viber та телефону, що плавають у куті екрану. Клієнт звертається до підтримки в один клік.',
    tag: 'engagement',
    tagColor: 'purple',
    price: 3000,
    priceTier: 'advanced',
    platform: 'horoshop',
  },
  {
    id: 'cart-recommender',
    icon: 'puzzle',
    title: 'AI Рекомендації у кошику',
    description:
      'Карусель супутніх товарів прямо в кошику. Допомагає клієнту знайти те, що він забув додати, та збільшує суму замовлення.',
    tag: 'avg-order',
    tagColor: 'green',
    isNew: true,
    price: 3000,
    priceTier: 'advanced',
    platform: 'horoshop',
  },
  {
    id: 'prize-banner',
    icon: 'star',
    title: 'Банер з призом',
    description:
      'Плашка з виграним промокодом після гри (Колесо фортуни / exit-intent). Нагадує клієнту скористатись знижкою і завершити покупку.',
    tag: 'conversion',
    tagColor: 'green',
    price: 3000,
    priceTier: 'advanced',
    platform: 'horoshop',
  },
  {
    id: 'promo-auto-apply',
    icon: 'coins',
    title: 'Авто-застосування промокоду',
    description:
      'Автоматично вставляє промокод у поле на касі та показує toast-сповіщення. Усуває тертя між виграним призом і оформленням замовлення.',
    tag: 'conversion',
    tagColor: 'green',
    price: 3000,
    priceTier: 'advanced',
    platform: 'horoshop',
  },
  {
    id: 'progressive-discount',
    icon: 'bar-chart',
    title: 'Прогресивна шкала знижок',
    description:
      'Візуальна шкала: «2 товари — 5%, 3 — 10%, 5 — 20%». Кілька рівнів мотивації для збільшення кількості товарів у замовленні.',
    tag: 'avg-order',
    tagColor: 'green',
    isNew: true,
    price: 3000,
    priceTier: 'advanced',
    platform: 'horoshop',
  },
  {
    id: 'one-plus-one',
    icon: 'gift',
    title: 'Акція 1+1=3',
    description:
      'Купи два товари — найдешевший у кошику за 1 гривню. Мотивує додавати більше товарів та збільшує середній чек.',
    tag: 'avg-order',
    tagColor: 'green',
    price: 6000,
    priceTier: 'complex',
    platform: 'horoshop',
  },
  {
    id: 'exit-intent-popup',
    icon: 'bell',
    title: 'Exit-intent попап',
    description:
      'Попап зі знижкою спрацьовує, коли клієнт рухає мишу до закриття вкладки. Повертає до 15% відвідувачів, що вже «йшли».',
    tag: 'conversion',
    tagColor: 'green',
    isNew: true,
    price: 6000,
    priceTier: 'complex',
    platform: 'horoshop',
  },
  {
    id: 'spin-the-wheel',
    icon: 'wheel',
    title: 'Колесо фортуни',
    description:
      'Гейміфікований попап — крути колесо, отримай знижку в обмін на email. Конверсія 5-20% проти 1-3% у звичайних попапів.',
    tag: 'engagement',
    tagColor: 'purple',
    isNew: true,
    price: 6000,
    priceTier: 'complex',
    platform: 'horoshop',
  },
  {
    id: 'sms-otp-checkout',
    icon: 'smartphone',
    title: 'SMS-верифікація в чекауті',
    description:
      'OTP-перевірка телефону в чекауті під час оформлення замовлення для трафіку з Google/Facebook. Відсіює фейкові замовлення та підвищує якість бази клієнтів.',
    tag: 'trust',
    tagColor: 'blue',
    isNew: true,
    price: 6000,
    priceTier: 'complex',
    platform: 'horoshop',
  },
]

const widgetTags = new Set(widgets.map((widget) => widget.tag))

export const availableWidgetTags: Tag[] = tagOrder.filter((tag) => widgetTags.has(tag))

// ===== Curated "related widgets" — exactly 3 per widget =====
export const RELATED_WIDGETS_MAP: Record<string, [string, string, string]> = {
  'marquee':               ['sticky-buy-button', 'exit-intent-popup', 'promo-auto-apply'],
  'delivery-date':         ['trust-badges', 'phone-mask', 'sms-otp-checkout'],
  'sticky-buy-button':     ['marquee', 'cart-goal', 'exit-intent-popup'],
  'trust-badges':          ['delivery-date', 'phone-mask', 'social-proof'],
  'phone-mask':            ['trust-badges', 'delivery-date', 'sms-otp-checkout'],
  'min-order':             ['cart-goal', 'progressive-discount', 'one-plus-one'],
  'cart-goal':             ['min-order', 'progressive-discount', 'cart-recommender'],
  'social-proof':          ['photo-reviews', 'stock-left', 'recently-viewed'],
  'stock-left':            ['social-proof', 'exit-intent-popup', 'spin-the-wheel'],
  'photo-reviews':         ['social-proof', 'recently-viewed', 'product-video-preview'],
  'recently-viewed':       ['photo-reviews', 'floating-messengers', 'product-video-preview'],
  'product-video-preview': ['photo-reviews', 'recently-viewed', 'marquee'],
  'floating-messengers':   ['recently-viewed', 'spin-the-wheel', 'social-proof'],
  'cart-recommender':      ['cart-goal', 'progressive-discount', 'one-plus-one'],
  'prize-banner':          ['spin-the-wheel', 'promo-auto-apply', 'exit-intent-popup'],
  'promo-auto-apply':      ['prize-banner', 'spin-the-wheel', 'marquee'],
  'progressive-discount':  ['cart-goal', 'min-order', 'one-plus-one'],
  'one-plus-one':          ['cart-goal', 'progressive-discount', 'cart-recommender'],
  'exit-intent-popup':     ['spin-the-wheel', 'prize-banner', 'promo-auto-apply'],
  'spin-the-wheel':        ['exit-intent-popup', 'prize-banner', 'promo-auto-apply'],
  'sms-otp-checkout':      ['delivery-date', 'trust-badges', 'phone-mask'],
}

// ===== Packages (re-exported from plans.ts for backward compat) =====
// Single source of truth: src/data/plans.ts
export { PLANS as packages } from './plans'
