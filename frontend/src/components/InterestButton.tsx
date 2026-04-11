import { useState, useEffect } from 'react'
import { Lock, Check } from 'lucide-react'
import { toast } from 'sonner'
import './InterestButton.css'

export type InterestTarget = 'plan' | 'widget'

interface InterestButtonProps {
  type: InterestTarget
  id: string | number
  label?: string
  submittedLabel?: string
  toastMessage?: string
  className?: string
}

const STORAGE_PREFIX = 'interest:'

function storageKey(type: InterestTarget, id: string | number): string {
  return `${STORAGE_PREFIX}${type}:${id}`
}

export function isInterestSubmitted(type: InterestTarget, id: string | number): boolean {
  try {
    return localStorage.getItem(storageKey(type, id)) !== null
  } catch {
    return false
  }
}

export function InterestButton({
  type,
  id,
  label = 'Залишити заявку',
  submittedLabel = 'Заявку надіслано',
  toastMessage = 'Дякуємо за Вашу думку!',
  className = '',
}: InterestButtonProps) {
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    setSubmitted(isInterestSubmitted(type, id))
  }, [type, id])

  const handleClick = () => {
    if (submitted) return
    try {
      localStorage.setItem(storageKey(type, id), new Date().toISOString())
    } catch {
      // localStorage may be unavailable (incognito, quota) — still show feedback
    }
    setSubmitted(true)
    toast.success(toastMessage)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={submitted}
      className={`interest-btn ${submitted ? 'interest-btn--submitted' : ''} ${className}`.trim()}
      aria-label={submitted ? submittedLabel : label}
    >
      {submitted ? (
        <>
          <Check size={16} strokeWidth={2.5} />
          <span>{submittedLabel}</span>
        </>
      ) : (
        <>
          <Lock size={15} strokeWidth={2.5} />
          <span>{label}</span>
        </>
      )}
    </button>
  )
}
