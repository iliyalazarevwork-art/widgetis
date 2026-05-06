import { WidgetSlug, type WidgetSlugValue } from './widget-slugs'

export const WIDGET_UA_NAME: Record<WidgetSlugValue, string> = {
  [WidgetSlug.PromoLine]: 'Біжучий рядок',
  [WidgetSlug.DeliveryDate]: 'Дата доставки',
  [WidgetSlug.StickyBuyButton]: 'Липка кнопка «Купити»',
  [WidgetSlug.TrustBadges]: 'Значки довіри',
  [WidgetSlug.PhoneMask]: 'Маска телефону',
  [WidgetSlug.MinorderGoal]: 'Мінімальне замовлення',
  [WidgetSlug.CartGoal]: 'Безкоштовна доставка',
  [WidgetSlug.BuyerCount]: 'Лічильник покупок',
  [WidgetSlug.StockLeft]: 'Залишок на складі',
  [WidgetSlug.PhotoVideoReviews]: 'Фото-відео відгуки',
  [WidgetSlug.VideoPreview]: "Відео-прев'ю",
  [WidgetSlug.CartRecommender]: 'AI Рекомендації у кошику',
  [WidgetSlug.PrizeBanner]: 'Банер з призом',
  [WidgetSlug.PromoAutoApply]: 'Авто-застосування промокоду',
  [WidgetSlug.ProgressiveDiscount]: 'Прогресивна шкала знижок',
  [WidgetSlug.OnePlusOne]: 'Акція 1+1=3',
  [WidgetSlug.LastChancePopup]: 'Попап останнього шансу',
  [WidgetSlug.SpinTheWheel]: 'Колесо фортуни',
  [WidgetSlug.SmsOtpCheckout]: 'SMS-верифікація в чекауті',
  [WidgetSlug.SmartSearch]: 'Розумний пошук',
}
