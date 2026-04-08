import { Link } from 'react-router-dom'
import {
  TrendingUp,
  Package,
  Globe,
  Receipt,
  ArrowUpRight,
  Wand2,
  ArrowRight,
} from 'lucide-react'
import './dashboard.css'

const STATS = [
  {
    label: 'Всього замовлень',
    value: '248',
    delta: '+12%',
    period: 'за місяць',
    icon: Receipt,
    color: 'blue',
  },
  {
    label: 'Активні сайти',
    value: '186',
    delta: '+8',
    period: 'новi за тиждень',
    icon: Globe,
    color: 'green',
  },
  {
    label: 'Встановлено віджетів',
    value: '612',
    delta: '+42',
    period: 'за тиждень',
    icon: Package,
    color: 'purple',
  },
  {
    label: 'Виручка',
    value: '248 400₴',
    delta: '+18%',
    period: 'за місяць',
    icon: TrendingUp,
    color: 'orange',
  },
]

const RECENT_ORDERS = [
  { id: 'W-MF3K9A', email: 'oleksii@store.ua', amount: 999, status: 'paid', date: '5 хв тому' },
  { id: 'W-MF3J2B', email: 'kate@beauty.com.ua', amount: 699, status: 'paid', date: '28 хв тому' },
  { id: 'W-MF3I8C', email: 'shop@ballistic.ua', amount: 1599, status: 'paid', date: '1 год тому' },
  { id: 'W-MF3H0D', email: 'support@benihome.ua', amount: 1200, status: 'paid', date: '2 год тому' },
  { id: 'W-MF3G4E', email: 'info@homedetail.ua', amount: 3000, status: 'paid', date: '4 год тому' },
]

export function AdminDashboardPage() {
  return (
    <>
      <header className="admin-page__head">
        <h1 className="admin-page__title">Дашборд</h1>
        <p className="admin-page__sub">Огляд активності твого акаунту</p>
      </header>

      <div className="dash__stats">
        {STATS.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className={`dash-stat dash-stat--${s.color}`}>
              <div className="dash-stat__head">
                <span className="dash-stat__icon" aria-hidden="true">
                  <Icon size={17} strokeWidth={2} />
                </span>
                <span className="dash-stat__delta">
                  <ArrowUpRight size={12} strokeWidth={2.5} />
                  {s.delta}
                </span>
              </div>
              <strong className="dash-stat__value">{s.value}</strong>
              <span className="dash-stat__label">{s.label}</span>
              <span className="dash-stat__period">{s.period}</span>
            </div>
          )
        })}
      </div>

      <div className="dash__grid">
        <section className="admin-card dash__orders">
          <header className="dash__orders-head">
            <h2 className="admin-card__title">Останні замовлення</h2>
            <Link to="/admin/orders" className="dash__link">
              Усі <ArrowRight size={12} strokeWidth={2.5} />
            </Link>
          </header>
          <table className="dash__table">
            <thead>
              <tr>
                <th>Номер</th>
                <th>Клієнт</th>
                <th>Сума</th>
                <th>Коли</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_ORDERS.map((o) => (
                <tr key={o.id}>
                  <td>
                    <code className="dash__code">{o.id}</code>
                  </td>
                  <td className="dash__table-email">{o.email}</td>
                  <td>
                    <strong>{o.amount.toLocaleString('uk-UA')} грн</strong>
                  </td>
                  <td className="dash__table-date">{o.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="admin-card dash__quick">
          <h2 className="admin-card__title">Швидкі дії</h2>
          <Link to="/admin/widgets" className="dash__action">
            <span className="dash__action-icon" aria-hidden="true">
              <Wand2 size={17} strokeWidth={2} />
            </span>
            <div className="dash__action-body">
              <strong>Налаштувати віджет</strong>
              <span>Змінити кольори, тексти, швидкість</span>
            </div>
            <ArrowRight size={14} strokeWidth={2.5} className="dash__action-arrow" />
          </Link>
          <Link to="/admin/sites" className="dash__action">
            <span className="dash__action-icon" aria-hidden="true">
              <Globe size={17} strokeWidth={2} />
            </span>
            <div className="dash__action-body">
              <strong>Додати сайт</strong>
              <span>Встановити віджети на новий магазин</span>
            </div>
            <ArrowRight size={14} strokeWidth={2.5} className="dash__action-arrow" />
          </Link>
          <Link to="/catalog" className="dash__action">
            <span className="dash__action-icon" aria-hidden="true">
              <Package size={17} strokeWidth={2} />
            </span>
            <div className="dash__action-body">
              <strong>Купити більше віджетів</strong>
              <span>15+ готових рішень у каталозі</span>
            </div>
            <ArrowRight size={14} strokeWidth={2.5} className="dash__action-arrow" />
          </Link>
        </section>
      </div>
    </>
  )
}
