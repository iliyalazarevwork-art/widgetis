import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { toast } from 'sonner'
import { del, setToken } from '../api/client'
import './DeleteAccountModal.css'

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onDeleted?: () => void
}

export function DeleteAccountModal({ isOpen, onClose, onDeleted }: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConfirmText('')
       
      setDeleting(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const canDelete = confirmText.trim().toUpperCase() === 'ВИДАЛИТИ'

  const handleDelete = async () => {
    if (!canDelete || deleting) return
    setDeleting(true)
    try {
      await del('/profile')
      setToken(null)
      toast.success('Акаунт видалено')
      onDeleted?.()
      window.location.href = '/login'
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося видалити акаунт')
      setDeleting(false)
    }
  }

  return (
    <div className="del-modal__overlay" onClick={onClose}>
      <div className="del-modal" onClick={(e) => e.stopPropagation()}>
        <button className="del-modal__close" onClick={onClose} aria-label="Закрити">
          <X size={18} />
        </button>

        <div className="del-modal__icon">
          <AlertTriangle size={28} />
        </div>

        <h2 className="del-modal__title">Видалити акаунт?</h2>
        <p className="del-modal__text">
          Ця дія <strong>незворотна</strong>. Будуть остаточно видалені:
        </p>
        <ul className="del-modal__list">
          <li>профіль та особисті дані</li>
          <li>усі сайти й скрипти віджетів</li>
          <li>підписка та історія платежів</li>
        </ul>
        <p className="del-modal__text del-modal__text--muted">
          Для підтвердження введіть слово <strong>ВИДАЛИТИ</strong>.
        </p>

        <input
          className="del-modal__input"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="ВИДАЛИТИ"
          autoFocus
          disabled={deleting}
        />

        <div className="del-modal__actions">
          <button className="del-modal__btn del-modal__btn--cancel" onClick={onClose} disabled={deleting}>
            Скасувати
          </button>
          <button
            className="del-modal__btn del-modal__btn--danger"
            onClick={handleDelete}
            disabled={!canDelete || deleting}
          >
            {deleting ? 'Видалення…' : 'Видалити назавжди'}
          </button>
        </div>
      </div>
    </div>
  )
}
