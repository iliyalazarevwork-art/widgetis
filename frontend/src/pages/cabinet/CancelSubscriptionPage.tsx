import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react'
import { post } from '../../api/client'
import { toast } from 'sonner'
import './styles/cancel.css'

const REASONS = [
  'Занадто дорого',
  'Не використовую віджети',
  'Переходжу на інший сервіс',
  'Тимчасово не потрібно',
  'Інша причина',
]

export default function CancelSubscriptionPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'confirm' | 'reason' | 'done'>('confirm')
  const [reason, setReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await post('/profile/subscription/cancel', { reason })
      setStep('done')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка скасування')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="cancel-page">
      <div className="cancel-page__header">
        <button className="cancel-page__back" onClick={() => {
          if (step === 'reason') setStep('confirm')
          else navigate('/cabinet/plan')
        }}>
          <ArrowLeft size={18} />
        </button>
        <span className="cancel-page__title">Скасування підписки</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="cancel-page__body">
        {step === 'confirm' && (
          <>
            <div className="cancel-page__warning">
              <AlertTriangle size={32} className="cancel-page__warning-icon" />
              <h2>Ви впевнені?</h2>
              <p>Після скасування ви втратите доступ до всіх віджетів і функцій плану після закінчення поточного періоду.</p>
            </div>
            <button className="cancel-page__btn-danger" onClick={() => setStep('reason')}>
              Так, скасувати підписку
            </button>
            <button className="cancel-page__btn-secondary" onClick={() => navigate('/cabinet/plan')}>
              Ні, залишити план
            </button>
          </>
        )}

        {step === 'reason' && (
          <>
            <h2 className="cancel-page__reason-title">Чому Ви хочете скасувати?</h2>
            <p className="cancel-page__reason-subtitle">Ваш відгук допоможе нам покращити сервіс</p>
            <div className="cancel-page__reasons">
              {REASONS.map((r) => (
                <button
                  key={r}
                  className={`cancel-page__reason ${reason === r ? 'cancel-page__reason--active' : ''}`}
                  onClick={() => setReason(r)}
                >
                  {r}
                </button>
              ))}
            </div>
            <button
              className="cancel-page__btn-danger"
              disabled={!reason || cancelling}
              onClick={handleCancel}
            >
              {cancelling ? 'Скасовуємо…' : 'Підтвердити скасування'}
            </button>
          </>
        )}

        {step === 'done' && (
          <div className="cancel-page__done">
            <CheckCircle size={48} className="cancel-page__done-icon" />
            <h2>Підписку скасовано</h2>
            <p>Ви можете користуватися сервісом до кінця оплаченого періоду. Ми будемо раді бачити Вас знову!</p>
            <button className="cancel-page__btn-primary" onClick={() => navigate('/cabinet')}>
              На головну
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
