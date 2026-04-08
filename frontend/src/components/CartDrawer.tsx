import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { ShoppingCart, X, Package as PackageIcon, ArrowRight } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useSwipeDismiss } from '../hooks/useSwipeDismiss'
import { WidgetIcon } from './WidgetIcon'
import './CartDrawer.css'

export function CartDrawer() {
  const navigate = useNavigate()
  const { items, isOpen, closeCart, removeItem, totalPrice, originalTotal, savings } = useCart()

  const drawerRef = useSwipeDismiss<HTMLDivElement>({
    direction: 'right',
    onDismiss: closeCart,
    enabled: isOpen,
    threshold: 70,
  })

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  function handleCheckout() {
    closeCart()
    navigate('/checkout')
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="cart-drawer__overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            onClick={closeCart}
            role="presentation"
          />
          <motion.aside
            ref={drawerRef}
            className="cart-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38, mass: 0.9 }}
            role="dialog"
            aria-label="Кошик"
          >
            <header className="cart-drawer__head">
              <h3 className="cart-drawer__title">
                <ShoppingCart size={18} strokeWidth={2} />
                <span>Кошик</span>
                {items.length > 0 && <span className="cart-drawer__badge">{items.length}</span>}
              </h3>
              <button
                className="cart-drawer__close"
                onClick={closeCart}
                aria-label="Закрити кошик"
                type="button"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </header>

            {items.length === 0 ? (
              <div className="cart-drawer__empty">
                <div className="cart-drawer__empty-icon" aria-hidden="true">
                  <ShoppingCart size={36} strokeWidth={1.5} />
                </div>
                <p className="cart-drawer__empty-title">Кошик порожній</p>
                <p className="cart-drawer__empty-sub">Додай віджет або пакет з каталогу</p>
                <button
                  className="cart-drawer__empty-btn"
                  onClick={() => {
                    closeCart()
                    navigate('/catalog')
                  }}
                  type="button"
                >
                  До каталогу
                  <ArrowRight size={14} strokeWidth={2.25} />
                </button>
              </div>
            ) : (
              <>
                <ul className="cart-drawer__items">
                  {items.map((item) => {
                    const hasDiscount =
                      item.originalPrice !== undefined && item.originalPrice > item.price
                    return (
                      <li key={`${item.kind}-${item.id}`} className="cart-drawer__item">
                        <div className="cart-drawer__item-icon">
                          {item.kind === 'package' ? (
                            <span className="cart-drawer__pkg-icon" aria-hidden="true">
                              <PackageIcon size={18} strokeWidth={2} />
                            </span>
                          ) : (
                            <WidgetIcon name={item.icon} size={18} />
                          )}
                        </div>
                        <div className="cart-drawer__item-body">
                          <p className="cart-drawer__item-title">{item.title}</p>
                          <p className="cart-drawer__item-meta">
                            {item.kind === 'package'
                              ? `Пакет · ${item.widgetsCount ?? 0} віджетів`
                              : 'Одиночний віджет'}
                          </p>
                        </div>
                        <div className="cart-drawer__item-price">
                          {hasDiscount && (
                            <span className="cart-drawer__item-price--old">
                              {item.originalPrice!.toLocaleString('uk-UA')} грн
                            </span>
                          )}
                          <span className="cart-drawer__item-price--value">
                            {item.price.toLocaleString('uk-UA')} грн
                          </span>
                        </div>
                        <button
                          className="cart-drawer__item-remove"
                          onClick={() => removeItem(item.kind, item.id)}
                          aria-label={`Видалити ${item.title}`}
                          type="button"
                        >
                          <X size={14} strokeWidth={2.25} />
                        </button>
                      </li>
                    )
                  })}
                </ul>

                <footer className="cart-drawer__footer">
                  {savings > 0 && (
                    <div className="cart-drawer__totals-row cart-drawer__totals-row--savings">
                      <span>Економія:</span>
                      <span>{savings.toLocaleString('uk-UA')} грн</span>
                    </div>
                  )}
                  {originalTotal > totalPrice && (
                    <div className="cart-drawer__totals-row cart-drawer__totals-row--old">
                      <span>Без знижки:</span>
                      <span>{originalTotal.toLocaleString('uk-UA')} грн</span>
                    </div>
                  )}
                  <div className="cart-drawer__totals-row cart-drawer__totals-row--final">
                    <span>До сплати:</span>
                    <strong>{totalPrice.toLocaleString('uk-UA')} грн</strong>
                  </div>

                  <button
                    className="cart-drawer__checkout"
                    onClick={handleCheckout}
                    type="button"
                  >
                    <span>Оформити замовлення</span>
                    <ArrowRight size={16} strokeWidth={2.5} />
                  </button>
                </footer>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
