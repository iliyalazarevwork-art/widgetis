import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

// ===== Types =====

export type CartItemKind = 'widget' | 'package'

export interface CartItem {
  kind: CartItemKind
  id: string // 'marquee' for widgets, 'start'/'pro'/'max' for packages
  title: string
  icon: string // WidgetIcon name for widgets, empty for packages
  price: number // what user pays
  originalPrice?: number // for discount display on packages
  widgetsCount?: number // for packages
}

interface CartState {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  originalTotal: number
  savings: number
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  addItem: (item: CartItem) => void
  removeItem: (kind: CartItemKind, id: string) => void
  isInCart: (kind: CartItemKind, id: string) => boolean
  clear: () => void
}

const CartContext = createContext<CartState>(null!)

const STORAGE_KEY = 'wty_cart_v1'

function loadFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveToStorage(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    /* ignore quota errors */
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => loadFromStorage())
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    saveToStorage(items)
  }, [items])

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const exists = prev.some((x) => x.kind === item.kind && x.id === item.id)
      if (exists) return prev
      return [...prev, item]
    })
  }, [])

  const removeItem = useCallback((kind: CartItemKind, id: string) => {
    setItems((prev) => prev.filter((x) => !(x.kind === kind && x.id === id)))
  }, [])

  const isInCart = useCallback(
    (kind: CartItemKind, id: string) => items.some((x) => x.kind === kind && x.id === id),
    [items],
  )

  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])
  const toggleCart = useCallback(() => setIsOpen((v) => !v), [])
  const clear = useCallback(() => setItems([]), [])

  const { totalItems, totalPrice, originalTotal, savings } = useMemo(() => {
    const totalPrice = items.reduce((sum, x) => sum + x.price, 0)
    const originalTotal = items.reduce((sum, x) => sum + (x.originalPrice ?? x.price), 0)
    return {
      totalItems: items.length,
      totalPrice,
      originalTotal,
      savings: Math.max(0, originalTotal - totalPrice),
    }
  }, [items])

  const value: CartState = {
    items,
    totalItems,
    totalPrice,
    originalTotal,
    savings,
    isOpen,
    openCart,
    closeCart,
    toggleCart,
    addItem,
    removeItem,
    isInCart,
    clear,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
