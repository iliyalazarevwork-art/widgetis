// source: https://veloband.com.ua/
// extracted: 2026-05-07T21:19:35.991Z
// scripts: 1

// === script #1 (length=1284) ===
ADMITAD = window.ADMITAD || {};
ADMITAD.Invoice = ADMITAD.Invoice || {};

// define a channel for Admitad
    if (!getSourceCookie(cookie_name)) {
        ADMITAD.Invoice.broker = 'na';
    } else if (getSourceCookie(cookie_name) != deduplication_cookie_value) {
        ADMITAD.Invoice.broker = getSourceCookie(cookie_name);
    } else {
        ADMITAD.Invoice.broker = 'adm';
    };

ADMITAD.Invoice.category = '1';
var orderedItem = [];  // temporary array for product items

// repeat for each item in the cart
orderedItem.push({
  Product: {
    category: '1',
    price: '0',
    priceCurrency: '',  // currency code per ISO-4217 alpha-3
  },
  orderQuantity: '1',  // quantity
  additionalType: 'sale'  // always sale
});

ADMITAD.Invoice.referencesOrder = ADMITAD.Invoice.referencesOrder || [];
// adding more items
ADMITAD.Invoice.referencesOrder.push({
  orderNumber: '{{order number}}',  // order ID from your CMS (up to 100 characters)
  discountCode: '{{promocode}}',  // promo code; this parameter is required if you provide Take&Go promo codes to publishers
  orderedItem: orderedItem
});

// Important! If you send data via AJAX or through the one-click order form, uncomment the last string:
// ADMITAD.Tracking.processPositions();
