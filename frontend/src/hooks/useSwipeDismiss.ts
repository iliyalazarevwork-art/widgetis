import { useRef, useEffect, useCallback } from 'react'

type Direction = 'left' | 'right' | 'down'

interface UseSwipeDismissOptions {
  direction: Direction
  onDismiss: () => void
  enabled?: boolean
  threshold?: number // px to trigger dismiss (default 80)
}

/**
 * Attaches swipe-to-dismiss gesture to an element.
 * Returns a ref to attach + a CSS transform style to apply for live tracking.
 */
export function useSwipeDismiss<T extends HTMLElement>({
  direction,
  onDismiss,
  enabled = true,
  threshold = 80,
}: UseSwipeDismissOptions) {
  const ref = useRef<T>(null)
  const state = useRef({
    startX: 0,
    startY: 0,
    currentOffset: 0,
    swiping: false,
    dismissed: false,
  })

  const getTranslate = useCallback(
    (offset: number) => {
      if (direction === 'down') return `translateY(${offset}px)`
      return `translateX(${offset}px)`
    },
    [direction],
  )

  const isValidMove = useCallback(
    (dx: number, dy: number) => {
      if (direction === 'right') return dx > 0 && Math.abs(dx) > Math.abs(dy)
      if (direction === 'left') return dx < 0 && Math.abs(dx) > Math.abs(dy)
      if (direction === 'down') return dy > 0 && Math.abs(dy) > Math.abs(dx)
      return false
    },
    [direction],
  )

  const getOffset = useCallback(
    (dx: number, dy: number) => {
      if (direction === 'right') return Math.max(0, dx)
      if (direction === 'left') return Math.min(0, dx)
      if (direction === 'down') return Math.max(0, dy)
      return 0
    },
    [direction],
  )

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!enabled) {
      // Clear any residual inline styles so CSS transitions work
      el.style.transition = ''
      el.style.transform = ''
      el.style.opacity = ''
      return
    }

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      state.current.startX = touch.clientX
      state.current.startY = touch.clientY
      state.current.currentOffset = 0
      state.current.swiping = false
      state.current.dismissed = false
      el.style.transition = 'none'
    }

    const onTouchMove = (e: TouchEvent) => {
      if (state.current.dismissed) return
      const touch = e.touches[0]
      const dx = touch.clientX - state.current.startX
      const dy = touch.clientY - state.current.startY

      if (!state.current.swiping) {
        // Need at least 10px movement to decide direction
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return

        if (isValidMove(dx, dy)) {
          state.current.swiping = true
        } else {
          // Wrong direction — ignore this gesture entirely
          state.current.dismissed = true
          return
        }
      }

      if (state.current.swiping) {
        e.preventDefault()
        const offset = getOffset(dx, dy)
        state.current.currentOffset = offset
        el.style.transform = getTranslate(offset)
        // Slight opacity fade
        const progress = Math.min(Math.abs(offset) / (threshold * 2), 0.5)
        el.style.opacity = String(1 - progress)
      }
    }

    const onTouchEnd = () => {
      if (state.current.dismissed || !state.current.swiping) {
        el.style.transition = ''
        el.style.transform = ''
        el.style.opacity = ''
        return
      }

      const offset = Math.abs(state.current.currentOffset)
      el.style.transition = 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease'

      if (offset >= threshold) {
        // Dismiss — animate off-screen
        const fullOffset = direction === 'left' ? -window.innerWidth : direction === 'down' ? window.innerHeight : window.innerWidth
        el.style.transform = getTranslate(fullOffset)
        el.style.opacity = '0'
        setTimeout(() => {
          onDismiss()
          el.style.transition = ''
          el.style.transform = ''
          el.style.opacity = ''
        }, 250)
      } else {
        // Snap back — animate to 0, then clear inline styles so CSS can take over
        el.style.transform = getTranslate(0)
        el.style.opacity = '1'
        setTimeout(() => {
          el.style.transition = ''
          el.style.transform = ''
          el.style.opacity = ''
        }, 260)
      }

      state.current.swiping = false
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [enabled, direction, threshold, onDismiss, isValidMove, getOffset, getTranslate])

  return ref
}
