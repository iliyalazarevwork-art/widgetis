import { useEffect, useState } from 'react'
import { ArrowLeft, User, Mail, Phone, Send, Building2, LogOut, Trash2, ChevronRight, Crown } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { del, get, post, put, setToken } from '../../api/client'
import { toast } from 'sonner'
import type { User as UserType, Subscription } from '../../types'
import './styles/profile.css'

const PHONE_PREFIX = '+38'
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^\+380\d{9}$/

function getInitials(name: string | null | undefined, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return parts[0].slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

function getPlanColor(slug: string | undefined): 'blue' | 'green' | 'purple' {
  if (slug === 'pro') return 'blue'
  if (slug === 'max') return 'purple'
  return 'green'
}

function extractLocalPhoneDigits(value: string): string {
  const digits = value.replace(/\D/g, '')
  let localDigits = digits

  if (localDigits.startsWith('380')) localDigits = localDigits.slice(3)
  else if (localDigits.startsWith('38')) localDigits = localDigits.slice(2)
  else if (localDigits.startsWith('0')) localDigits = localDigits.slice(1)

  return localDigits.slice(0, 9)
}

function formatMaskedPhone(value: string): string {
  const localDigits = extractLocalPhoneDigits(value)
  const groups = [2, 3, 2, 2]
  let i = 0
  let result = `${PHONE_PREFIX}0`

  for (const groupSize of groups) {
    if (localDigits.length <= i) break
    const part = localDigits.slice(i, i + groupSize)
    result += `-${part}`
    i += groupSize
  }

  return result
}

function toApiPhone(value: string): string {
  return `+380${extractLocalPhoneDigits(value)}`
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserType | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: formatMaskedPhone(''), telegram: '', company: '' })
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      get<{ data: UserType }>('/profile'),
      get<{ data: Subscription }>('/profile/subscription').catch(() => ({ data: null })),
    ]).then(([userRes, subRes]) => {
      setUser(userRes.data)
      setForm({
        name: userRes.data.name || '',
        email: userRes.data.email || '',
        phone: formatMaskedPhone(userRes.data.phone || ''),
        telegram: userRes.data.telegram || '',
        company: userRes.data.company || '',
      })
      setSubscription(subRes.data)
    }).finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    const trimmedEmail = form.email.trim()
    const normalizedPhone = toApiPhone(form.phone)

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      toast.error('Введіть коректний email')
      return
    }

    if (!PHONE_REGEX.test(normalizedPhone)) {
      toast.error('Введіть коректний телефон у форматі +380XXXXXXXXX')
      return
    }

    setSaving(true)
    try {
      const res = await put<{ data: UserType }>('/profile', {
        ...form,
        email: trimmedEmail,
        phone: normalizedPhone,
      })
      setUser(res.data)
      setForm((f) => ({
        ...f,
        email: res.data.email || '',
        phone: formatMaskedPhone(res.data.phone || ''),
      }))
      toast.success('Профіль оновлено')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await post('/auth/logout')
    } catch {
      // ignore logout errors
    }
    setToken(null)
    navigate('/login')
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Видалити акаунт назавжди? Усі сайти, скрипти та дані будуть безповоротно видалені.',
    )
    if (!confirmed) return

    try {
      await del('/profile')
      setToken(null)
      toast.success('Акаунт видалено')
      navigate('/login')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося видалити акаунт')
    }
  }

  if (loading) return <div className="page-loader">Завантаження…</div>

  const initials = getInitials(form.name || user?.name, user?.email || '')
  const planSlug = subscription?.plan?.slug
  const planName = subscription?.plan?.name || 'Free'
  const planColor = getPlanColor(planSlug)

  return (
    <div className="prof-page">
      <div className="prof-hdr">
        <Link to="/cabinet/settings" className="prof-hdr__back">
          <ArrowLeft size={18} />
        </Link>
        <span className="prof-hdr__title">Профіль</span>
        <button className="prof-hdr__save" onClick={handleSave} disabled={saving}>
          {saving ? 'Збереження…' : 'Зберегти'}
        </button>
      </div>

      <div className="prof-body">
        <div className="prof-avatar-row">
          <div className="prof-avatar">
            <span>{initials}</span>
          </div>
          <div className="prof-avatar-name">{form.name || user?.email}</div>
          <div className={`prof-plan-badge prof-plan-badge--${planColor}`}>
            <Crown size={12} />
            {planName} план
          </div>
        </div>

        <div className="prof-section-label">Основна інформація</div>

        <div className="prof-field">
          <span className="prof-field__label">Ім'я</span>
          <div className="prof-field__row">
            <User size={16} className="prof-field__icon" />
            <input
              className="prof-field__input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ваше ім'я"
            />
          </div>
        </div>

        <div className="prof-field">
          <span className="prof-field__label">Email</span>
          <div className="prof-field__row">
            <Mail size={16} className="prof-field__icon" />
            <input
              className="prof-field__input"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
            />
          </div>
        </div>

        <div className="prof-field">
          <span className="prof-field__label">Телефон</span>
          <div className="prof-field__row">
            <Phone size={16} className="prof-field__icon" />
            <input
              className="prof-field__input"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: formatMaskedPhone(e.target.value) }))}
              onFocus={() => setForm((f) => ({ ...f, phone: formatMaskedPhone(f.phone) }))}
              placeholder="+380-XX-XXX-XX-XX"
              inputMode="tel"
              autoComplete="tel"
            />
          </div>
        </div>

        <div className="prof-field">
          <span className="prof-field__label">Telegram</span>
          <div className="prof-field__row">
            <Send size={16} className="prof-field__icon prof-field__icon--telegram" />
            <input
              className="prof-field__input"
              value={form.telegram}
              onChange={(e) => setForm((f) => ({ ...f, telegram: e.target.value }))}
              placeholder="@username"
            />
          </div>
        </div>

        <div className="prof-field">
          <span className="prof-field__label">Компанія</span>
          <div className="prof-field__row">
            <Building2 size={16} className="prof-field__icon" />
            <input
              className="prof-field__input"
              value={form.company}
              onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
              placeholder="Назва компанії"
            />
          </div>
        </div>

        <div className="prof-divider" />

        <div className="prof-section-label">Безпека</div>

        <button className="prof-sec-row" onClick={handleLogout}>
          <div className="prof-sec-row__left">
            <LogOut size={18} className="prof-sec-row__icon--purple" />
            <span className="prof-sec-row__title prof-sec-row__title--purple">Вийти з акаунту</span>
          </div>
          <ChevronRight size={16} className="prof-sec-row__chevron" />
        </button>

        <button className="prof-del-row" onClick={handleDeleteAccount}>
          <div className="prof-sec-row__left">
            <Trash2 size={18} className="prof-sec-row__icon--delete" />
            <span className="prof-sec-row__title prof-sec-row__title--delete">Видалити акаунт</span>
          </div>
          <ChevronRight size={16} className="prof-sec-row__chevron" />
        </button>
      </div>
    </div>
  )
}
