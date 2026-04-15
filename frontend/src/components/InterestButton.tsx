import { useState, useEffect } from 'react'
import { Lock, Check } from 'lucide-react'
import { toast } from 'sonner'
import { InterestModal, type InterestTarget } from './InterestModal'
import './InterestButton.css'

export type { InterestTarget }

interface InterestButtonProps {
  type: InterestTarget
  id: string | number
  label?: string
  submittedLabel?: string
  className?: string
}

const STORAGE_PREFIX = 'interest:'

function storageKey(type: InterestTarget, id: string | number): string {
  return `${STORAGE_PREFIX}${type}:${id}`
}

// eslint-disable-next-line react-refresh/only-export-components
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
  className = '',
}: InterestButtonProps) {
  const [submitted, setSubmitted] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    setSubmitted(isInterestSubmitted(type, id))
  }, [type, id])

  const handleClick = () => {
    if (submitted) return
    setModalOpen(true)
  }

  const handleSuccess = () => {
    try {
      localStorage.setItem(storageKey(type, id), new Date().toISOString())
    } catch {
      // localStorage may be unavailable (incognito, quota) — still flip state
    }
    setSubmitted(true)
    toast.success("Дякуємо! Ми зв'яжемося з Вами протягом дня.")
  }

  return (
    <>
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
      <InterestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
        type={type}
        targetId={id}
      />
    </>
  )
}
