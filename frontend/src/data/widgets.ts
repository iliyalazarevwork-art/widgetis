// ===== Widget catalog — static data =====

export type PriceTier = 'simple' | 'advanced' | 'complex'
export type Platform = 'horoshop' | 'shopify' | 'woocommerce' | 'opencart'
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
  { id: 'shopify', label: 'Shopify', available: false },
  { id: 'woocommerce', label: 'WooCommerce', available: false },
  { id: 'opencart', label: 'OpenCart', available: false },
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
    id: 'purchase-counter',
    icon: 'cart',
    title: 'Лічильник покупок',
    description:
      'Відображає скільки людей вже купили цей товар. Соціальний доказ, що стимулює до покупки.',
    tag: 'social-proof',
    tagColor: 'orange',
    isPopular: true,
    price: 3000,
    priceTier: 'advanced',
    platform: 'horoshop',
  },
  {
    id: 'snow',
    icon: 'snowflake',
    title: 'Віджет снігу',
    description:
      'Красивий ефект падаючого снігу на сайті. Створює святкову атмосферу під час зимових свят та розпродажів.',
    tag: 'visual',
    tagColor: 'purple',
    price: 1200,
    priceTier: 'simple',
    platform: 'horoshop',
  },
  {
    id: 'free-delivery',
    icon: 'truck',
    title: 'Безкоштовна доставка',
    description:
      'Показує скільки залишилось до безкоштовної доставки. Мотивує клієнтів додати ще товарів у кошик.',
    tag: 'avg-order',
    tagColor: 'green',
    isPopular: true,
    price: 1200,
    priceTier: 'simple',
    platform: 'horoshop',
  },
  {
    id: 'live-viewers',
    icon: 'eye',
    title: 'Хто зараз дивиться',
    description:
      'Показує кількість людей, які переглядають цей товар прямо зараз. Створює ефект терміновості.',
    tag: 'urgency',
    tagColor: 'pink',
    price: 3000,
    priceTier: 'advanced',
    platform: 'horoshop',
  },
  {
    id: 'cashback',
    icon: 'coins',
    title: 'Кешбек',
    description:
      'Відображає розмір кешбеку за покупку товару. Додатковий стимул для прийняття рішення про покупку.',
    tag: 'loyalty',
    tagColor: 'blue',
    price: 6000,
    priceTier: 'complex',
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
    id: 'bonus',
    icon: 'star',
    title: 'Бонусна система',
    description:
      'Нараховує бонуси за покупки, які можна використати для знижок. Підвищує лояльність та повторні продажі.',
    tag: 'loyalty',
    tagColor: 'blue',
    price: 6000,
    priceTier: 'complex',
    platform: 'horoshop',
  },
  {
    id: 'countdown',
    icon: 'hourglass',
    title: 'Зворотний відлік',
    description:
      'Таймер зворотного відліку до кінця акції. Створює відчуття терміновості та прискорює прийняття рішення про покупку.',
    tag: 'urgency',
    tagColor: 'pink',
    price: 3000,
    priceTier: 'advanced',
    platform: 'horoshop',
  },
  {
    id: 'photo-reviews',
    icon: 'camera',
    title: 'Фотовідгуки',
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
    id: 'recent-purchase',
    icon: 'bell',
    title: 'Хтось щойно купив',
    description:
      'Pop-up сповіщення в кутку екрану: "Олена з Києва щойно купила цей товар". Створює ефект живого магазину та FOMO.',
    tag: 'social-proof',
    tagColor: 'orange',
    isNew: true,
    price: 3000,
    priceTier: 'advanced',
    platform: 'horoshop',
  },
  {
    id: 'spin-wheel',
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
    id: 'quiz',
    icon: 'puzzle',
    title: 'Квіз-рекомендатор',
    description:
      'Інтерактивний квіз з 3-5 питань, що підводить клієнта до ідеального товару. Конверсія до 25-40% серед тих, хто пройшов квіз.',
    tag: 'conversion',
    tagColor: 'green',
    isNew: true,
    price: 6000,
    priceTier: 'complex',
    platform: 'horoshop',
  },
  {
    id: 'progressive-discount',
    icon: 'bar-chart',
    title: 'Прогресивна шкала знижок',
    description:
      'Візуальна шкала: 1000 грн — 5%, 2000 грн — 10%, 3000 грн — 15% знижки. Кілька рівнів мотивації для збільшення чеку.',
    tag: 'avg-order',
    tagColor: 'green',
    isNew: true,
    price: 3000,
    priceTier: 'advanced',
    platform: 'horoshop',
  },
]

// ===== Packages (re-exported from plans.ts for backward compat) =====
// Single source of truth: src/data/plans.ts
export { PLANS as packages } from './plans'
