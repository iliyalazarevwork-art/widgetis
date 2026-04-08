import { useEffect, useState } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import { Link } from 'react-router-dom'
import { get, put } from '../../api/client'
import { toast } from 'sonner'
import type { User } from '../../types'
import './styles/profile.css'

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', telegram: '', company: '' })

  useEffect(() => {
    get<{ data: User }>('/profile')
      .then((res) => {
        setUser(res.data)
        setForm({
          name: res.data.name || '',
          phone: res.data.phone || '',
          telegram: res.data.telegram || '',
          company: res.data.company || '',
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await put<{ data: User }>('/profile', form)
      setUser(res.data)
      toast.success('Профіль оновлено')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="page-loader">Завантаження…</div>

  return (
    <div className="prof-page">
      <div className="prof-page__header">
        <Link to="/cabinet/settings" className="prof-page__back"><ArrowLeft size={18} /></Link>
        <span className="prof-page__header-title">Профіль</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="prof-page__body">
        <div className="prof-page__avatar">
          <span>{form.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}</span>
        </div>
        <span className="prof-page__email">{user?.email}</span>

        <div className="prof-page__fields">
          {([
            ['name', "Ім'я", 'Ваше ім\'я'],
            ['phone', 'Телефон', '+380...'],
            ['telegram', 'Telegram', '@username'],
            ['company', 'Компанія', 'Назва компанії'],
          ] as const).map(([key, label, placeholder]) => (
            <div key={key} className="prof-page__field">
              <label className="prof-page__label">{label}</label>
              <input
                className="prof-page__input"
                placeholder={placeholder}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        <button className="prof-page__save" onClick={handleSave} disabled={saving}>
          <Save size={18} />
          {saving ? 'Зберігаємо…' : 'Зберегти зміни'}
        </button>
      </div>
    </div>
  )
}
