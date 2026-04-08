# Horoshop AjaxCart — документація

> Канонічний файл: [docs/horoshop-ajax-cart.md](../../../../../docs/horoshop-ajax-cart.md)

## Ініціалізація

```js
// Singleton — створюється один раз
const cart = AjaxCart.getInstance();

// Подія готовності
document.addEventListener("AjaxCartInstanced", () => { ... });

// Або через INIT
window.INIT.add(() => { ... }, window.AjaxCart);
```

## Додавання товару

```js
AjaxCart.openCartOnAdd = true;
AjaxCart.getInstance().appendProduct(
  { type: "product", quantity: 1, id: 11718 },
  []  // related (gifts, sets)
);

// Масове додавання
AjaxCart.getInstance().appendProducts([
  { type: "product", quantity: 1, id: 11718 },
  { type: "product", quantity: 2, id: 11719 },
]);
```

AJAX: `POST /_widget/ajax_cart/appendProduct/`

## Видалення товару

```js
AjaxCart.getInstance().Cart.removeProductByHash(hash);
```

AJAX: `POST /_widget/ajax_cart/removeProductByHash/`

## Зміна кількості

```js
AjaxCart.getInstance().Cart.setProductQuantityByHash(hash, newQuantity);
```

AJAX: `POST /_widget/ajax_cart/setProductQuantityByHash/` (debounce 300ms)

## Перезавантаження кошика

```js
AjaxCart.getInstance().Cart.reload();      // перезавантажити дані
AjaxCart.getInstance().reloadHtml();        // перемалювати HTML
```

## Всі події

| Подія | Коли | Аргументи |
|-------|------|-----------|
| **`onProductAdd`** | Товар додано | `(productId, productObj, eventId)` |
| **`onProductRemove`** | Товар видалено | `(productId, hash, productObj)` |
| **`onQuantityChange`** | Кількість змінено | `(productObj, responseData)` |
| **`onChange`** | Будь-яка зміна кошика | `(responseData)` |
| `onInit` | Кошик завантажено | — |
| `onReload` | Кошик перезавантажено | — |
| `onReloadHtml` | HTML перемальовано | — |
| `onCouponChange` | Купон змінено | — |
| `onLimitReached` | Досягнуто max_quantity | — |
| `onBeforeProductAdd` | Перед додаванням (можна скасувати return false) | — |
| `onBeforeProductRemove` | Перед видаленням (можна скасувати return false) | — |
| `onAppendProductException` | Помилка при додаванні | `(errors)` |

## Структура товару в кошику

```js
cart.Cart.products["ea763469..."] = {
  id: 11718,
  hash: "ea763469...",
  quantity: 3,
  max_quantity: 57,
  min_quantity: 1,
  price: 1540,
  title: "Худі на блискавці...",
  article: "4824005686931",
  article_for_display: "211201",
  type: "product",       // "product" | "set_main" | "set_item" | "gift" | "gift_parent"
  related_to: null,      // hash батьківського товару (для sets/gifts)
  cprice: {              // знижки
    marker: "DISCOUNT_CARD",
    discount_percent: 0,
    discount_value: 0,
    discounted_price: 1540,
    initial_price: 1540
  }
}
```

## Структура total

```js
cart.Cart.total = {
  default: 0,
  sum: 4620,
  quantity: 3,
  complete_price: 4620
}
```

## AJAX endpoints

Базовий URL: `{URI_PREFIX}_widget/ajax_cart/{action}/`

| Action | Опис | Параметри |
|--------|------|-----------|
| `init` | Ініціалізація | `{marker, id, analytics}` |
| `appendProduct` | Додати товар | `{product: {type, quantity, id}, related: [...]}` |
| `appendProducts` | Додати кілька | `{products: [...]}` |
| `setProductQuantityByHash` | Змінити кількість | `{hash, quantity}` |
| `removeProductByHash` | Видалити | `{hash}` |
| `setCouponCode` | Застосувати купон | `{code, skin}` |
| `render/{skin}` | Перемалювати HTML | `{}` |

## Підключення до подій

```js
AjaxCart.getInstance().attachEventHandlers({
  onProductAdd(productId, productObj, eventId) { ... },
  onProductRemove(productId, hash, productObj) { ... },
  onQuantityChange(productObj, responseData) { ... },
  onChange(responseData) { ... },
});

// Або окремо
AjaxCart.getInstance().Cart.attachEventHandler('onProductAdd', (id, obj) => { ... });
```
