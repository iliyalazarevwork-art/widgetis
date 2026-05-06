export const WidgetSlug = {
  PromoLine: 'promo-line',
  DeliveryDate: 'delivery-date',
  StickyBuyButton: 'sticky-buy-button',
  TrustBadges: 'trust-badges',
  PhoneMask: 'phone-mask',
  MinorderGoal: 'minorder-goal',
  CartGoal: 'cart-goal',
  BuyerCount: 'buyer-count',
  StockLeft: 'stock-left',
  PhotoVideoReviews: 'photo-video-reviews',
  VideoPreview: 'video-preview',
  CartRecommender: 'cart-recommender',
  PrizeBanner: 'prize-banner',
  PromoAutoApply: 'promo-auto-apply',
  ProgressiveDiscount: 'progressive-discount',
  OnePlusOne: 'one-plus-one',
  LastChancePopup: 'last-chance-popup',
  SpinTheWheel: 'spin-the-wheel',
  SmsOtpCheckout: 'sms-otp-checkout',
  SmartSearch: 'smart-search',
} as const

export type WidgetSlugValue = (typeof WidgetSlug)[keyof typeof WidgetSlug]
