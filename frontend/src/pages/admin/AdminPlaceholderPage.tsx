import { Globe, Receipt, Settings, type LucideIcon } from 'lucide-react'

interface Props {
  title: string
  subtitle: string
  icon: LucideIcon
  note?: string
}

export function AdminPlaceholderPage({ title, subtitle, icon: Icon, note }: Props) {
  return (
    <>
      <header className="admin-page__head">
        <h1 className="admin-page__title">{title}</h1>
        <p className="admin-page__sub">{subtitle}</p>
      </header>
      <div className="admin-placeholder">
        <div className="admin-placeholder__icon" aria-hidden="true">
          <Icon size={24} strokeWidth={2} />
        </div>
        <h2 className="admin-placeholder__title">Скоро тут зʼявиться контент</h2>
        <p className="admin-placeholder__sub">{note ?? 'Ця сторінка у розробці.'}</p>
      </div>
    </>
  )
}

// Preset pages:

export function AdminSitesPage() {
  return (
    <AdminPlaceholderPage
      title="Сайти"
      subtitle="Магазини з встановленими віджетами"
      icon={Globe}
      note="Тут буде список твоїх магазинів: назва, домен, встановлені віджети, статус підключення."
    />
  )
}

export function AdminOrdersPage() {
  return (
    <AdminPlaceholderPage
      title="Замовлення"
      subtitle="Історія покупок та оплат"
      icon={Receipt}
      note="Тут буде повна історія замовлень: номер, сума, дата, склад замовлення, статус оплати."
    />
  )
}

export function AdminSettingsPage() {
  return (
    <AdminPlaceholderPage
      title="Налаштування"
      subtitle="Профіль і параметри акаунту"
      icon={Settings}
      note="Тут будуть особисті дані, зміна пароля, двофакторна автентифікація, реквізити для фактури."
    />
  )
}
