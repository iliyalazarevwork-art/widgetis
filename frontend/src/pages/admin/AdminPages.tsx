import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowRight,
  CircleAlert,
  ExternalLink,
  Globe,
  LayoutDashboard,
  Mail,
  Menu,
  Phone,
  Plus,
  Receipt,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  UserPlus,
  Users,
  Wand2,
  X,
} from 'lucide-react'
import './pages.css'

const ORDER_FILTERS = ['Всі', 'Оплачено', 'Очікує']

const ORDERS = [
  { id: 'W-MF3K9A', customer: 'oleksii@store.ua', amount: 999, status: 'Оплачено', meta: 'Basic · 1 сайт · щойно' },
  { id: 'W-MF3J2B', customer: 'kate@beauty.com.ua', amount: 699, status: 'Оплачено', meta: 'Pro · 3 сайти · 2 год тому' },
  { id: 'W-MF3I8C', customer: 'shop@ballistic.ua', amount: 1599, status: 'Оплачено', meta: 'Pro · 3 сайти · 2 дні тому' },
  { id: 'W-MF3H0D', customer: 'support@benihome.ua', amount: 1200, status: 'Очікує', meta: 'Max · 5 сайтів · 1 тиж тому' },
  { id: 'W-MF3G4E', customer: 'info@homedetail.ua', amount: 3000, status: 'Оплачено', meta: 'Max · 5 сайтів · 1 міс тому' },
]

const USERS_DATA = [
  { id: 'u-1001', initials: 'ОЛ', name: 'Олексій Левченко', domain: 'balistic.com.ua', sites: 3, plan: 'Pro', when: 'щойно', state: 'Активні' },
  { id: 'u-1002', initials: 'МС', name: 'Марина Свириденко', domain: 'zoo-vet.com.ua', sites: 1, plan: 'Basic', when: '2 год', state: 'Активні' },
  { id: 'u-1003', initials: 'ДК', name: 'Дмитро Коваль', domain: 'aquamyrgorod.com.ua', sites: 1, plan: 'Очікує', when: '3 дні', state: 'Ризик' },
  { id: 'u-1004', initials: 'ІВ', name: 'Ірина Василенко', domain: 'Без сайтів', sites: 0, plan: 'Free', when: '1 тиж', state: 'Нові' },
]

const SITES = [
  { id: 'site-1', domain: 'ballistic.ua', email: 'shop@ballistic.ua', plan: 'Pro', state: 'Активний' },
  { id: 'site-2', domain: 'zoo-vet.com.ua', email: 'info@zoo-vet.com.ua', plan: 'Basic', state: 'Активний' },
  { id: 'site-3', domain: 'homedetail.ua', email: 'info@homedetail.ua', plan: 'Max', state: 'Активний' },
  { id: 'site-4', domain: 'aquamyrgorod.com.ua', email: 'support@aqua.ua', plan: 'Basic', state: 'Очікує' },
  { id: 'site-5', domain: 'kate-beauty.com.ua', email: 'kate@beauty.com.ua', plan: 'Pro', state: 'Активний' },
]

const REQUESTS = [
  { id: 'R-0018', name: 'shop@northwear.ua', type: 'Інтеграція', risk: 'Високий', note: 'Сайт не відповідає > 12 годин' },
  { id: 'R-0019', name: 'support@novahub.ua', type: 'Оплата', risk: 'Середній', note: 'Потрібно перевірити реквізити' },
  { id: 'R-0020', name: 'hello@greenline.store', type: 'Віджет', risk: 'Низький', note: 'Запит на новий шаблон' },
]

const CONTENT_BLOCKS = [
  { id: 'hero-main', title: 'Головний Hero', status: 'Опубліковано', updated: 'сьогодні 11:42' },
  { id: 'faq-home', title: 'FAQ на головній', status: 'Чернетка', updated: 'вчора 19:10' },
  { id: 'cta-pricing', title: 'CTA на тарифах', status: 'Опубліковано', updated: 'сьогодні 09:03' },
  { id: 'promo-banner', title: 'Промо-банер квітень', status: 'Потребує ревʼю', updated: 'сьогодні 08:18' },
]

const SITE_ACTIONS = [
  { title: 'Відкрити конфігуратор', to: '/admin/widgets', icon: Wand2 },
  { title: 'Оновити скрипт', to: '/admin/widgets/marquee', icon: Sparkles },
  { title: 'Перейти до замовлень', to: '/admin/orders', icon: ArrowRight },
]

const ADMIN_MENU_LINKS = [
  { to: '/admin', label: 'Дашборд' },
  { to: '/admin/orders', label: 'Замовлення' },
  { to: '/admin/users', label: 'Юзери' },
  { to: '/admin/sites', label: 'Сайти' },
  { to: '/admin/settings', label: 'Налаштування' },
  { to: '/admin/manager-requests', label: 'Manager Requests' },
  { to: '/admin/landing-content', label: 'Landing Content' },
]

type TabKey = 'dashboard' | 'orders' | 'users' | 'sites' | 'settings'

function formatMoney(value: number) {
  return `${value.toLocaleString('uk-UA')} грн`
}

function badgeClass(value: string) {
  if (value === 'Підключено' || value === 'Оплачено' || value === 'Активний' || value === 'Опубліковано') {
    return 'adminx-badge adminx-badge--ok'
  }
  if (value === 'Проблема' || value === 'Високий' || value === 'Ризик') {
    return 'adminx-badge adminx-badge--danger'
  }
  if (value === 'Очікує' || value === 'Середній' || value === 'Чернетка' || value === 'Потребує ревʼю') {
    return 'adminx-badge adminx-badge--warn'
  }
  return 'adminx-badge adminx-badge--info'
}

function MobileMenuDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null

  return (
    <>
      <button className="mobile-menu__overlay" type="button" aria-label="Закрити меню" onClick={onClose} />
      <aside className="mobile-menu">
        <div className="mobile-menu__head">
          <strong>Навігація</strong>
          <button type="button" onClick={onClose} aria-label="Закрити">
            <X size={16} strokeWidth={2.25} />
          </button>
        </div>
        <nav className="mobile-menu__nav">
          {ADMIN_MENU_LINKS.map((item) => (
            <Link key={item.to} to={item.to} onClick={onClose}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  )
}

function MobileHeader({
  title,
  subtitle,
  onMenu,
  right,
}: {
  title: string
  subtitle?: string
  onMenu: () => void
  right?: React.ReactNode
}) {
  return (
    <header className="orders-mobile__top">
      <button type="button" aria-label="Меню" onClick={onMenu}>
        <Menu size={18} strokeWidth={2.25} />
      </button>
      <div>
        <h1>{title}</h1>
        {subtitle ? <span>{subtitle}</span> : null}
      </div>
      {right ?? (
        <button type="button" className="orders-mobile__avatar" aria-label="Профіль">
          ІЛ
        </button>
      )}
    </header>
  )
}

function MobileFooterNav({ active }: { active: TabKey }) {
  return (
    <nav className="users-mobile__bottom">
      <Link to="/admin" className={`users-mobile__tab ${active === 'dashboard' ? 'users-mobile__tab--active' : ''}`}>
        <LayoutDashboard size={17} strokeWidth={2} />
        <span>Дашборд</span>
      </Link>
      <Link to="/admin/orders" className={`users-mobile__tab ${active === 'orders' ? 'users-mobile__tab--active' : ''}`}>
        <Receipt size={17} strokeWidth={2} />
        <span>Замовлення</span>
      </Link>
      <Link to="/admin/users" className={`users-mobile__tab ${active === 'users' ? 'users-mobile__tab--active' : ''}`}>
        <Users size={17} strokeWidth={2} />
        <span>Юзери</span>
      </Link>
      <Link to="/admin/sites" className={`users-mobile__tab ${active === 'sites' ? 'users-mobile__tab--active' : ''}`}>
        <Globe size={17} strokeWidth={2} />
        <span>Сайти</span>
      </Link>
    </nav>
  )
}

export function AdminOrdersPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<(typeof ORDER_FILTERS)[number]>('Всі')
  const [page, setPage] = useState(1)

  const filteredOrders = useMemo(() => {
    return ORDERS.filter((order) => {
      const byStatus = statusFilter === 'Всі' ? true : order.status === statusFilter
      const q = query.trim().toLowerCase()
      const byQuery =
        q.length === 0 ||
        order.id.toLowerCase().includes(q) ||
        order.customer.toLowerCase().includes(q) ||
        String(order.amount).includes(q)
      return byStatus && byQuery
    })
  }, [query, statusFilter])

  const pageSize = 4
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="orders-mobile">
      <MobileMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      <MobileHeader title="Замовлення" subtitle="248 всього" onMenu={() => setMenuOpen(true)} />

      <section className="orders-mobile__search-wrap">
        <div className="orders-mobile__search">
          <Search size={16} strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => {
              setPage(1)
              setQuery(e.target.value)
            }}
            placeholder="Пошук за ID, email або сумою..."
          />
        </div>
        <button type="button" className="orders-mobile__filter" aria-label="Фільтри">
          <SlidersHorizontal size={16} strokeWidth={2} />
        </button>
      </section>

      <section className="orders-mobile__segments">
        {ORDER_FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            className={statusFilter === item ? 'orders-mobile__seg orders-mobile__seg--active' : 'orders-mobile__seg'}
            onClick={() => {
              setPage(1)
              setStatusFilter(item)
            }}
          >
            {item}
          </button>
        ))}
      </section>

      <section className="orders-mobile__list">
        {pagedOrders.map((order) => (
          <article key={order.id} className="orders-mobile__row">
            <div className="orders-mobile__row-left">
              <strong>{order.id}</strong>
              <span>{order.customer}</span>
              <small>{order.meta}</small>
            </div>
            <div className="orders-mobile__row-right">
              <span className={badgeClass(order.status)}>{order.status}</span>
              <b>{formatMoney(order.amount)}</b>
            </div>
          </article>
        ))}
        {pagedOrders.length === 0 ? <p className="orders-mobile__empty">Нічого не знайдено.</p> : null}
      </section>

      <section className="orders-mobile__pagination">
        <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
        {Array.from({ length: totalPages }).map((_, idx) => {
          const value = idx + 1
          return (
            <button
              key={value}
              type="button"
              className={currentPage === value ? 'orders-mobile__page-active' : ''}
              onClick={() => setPage(value)}
            >
              {value}
            </button>
          )
        })}
        <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>›</button>
      </section>

      <MobileFooterNav active="orders" />
    </div>
  )
}

export function AdminUsersPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [segment, setSegment] = useState<'Активні' | 'Ризик' | 'Нові'>('Активні')
  const [page, setPage] = useState(1)

  const filteredUsers = useMemo(() => {
    return USERS_DATA.filter((user) => {
      const bySegment = user.state === segment
      const q = query.trim().toLowerCase()
      const byQuery =
        q.length === 0 ||
        user.name.toLowerCase().includes(q) ||
        user.domain.toLowerCase().includes(q) ||
        user.plan.toLowerCase().includes(q)
      return bySegment && byQuery
    })
  }, [query, segment])

  const pageSize = 4
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="users-mobile">
      <MobileMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      <header className="users-mobile__top">
        <button type="button" aria-label="Меню" onClick={() => setMenuOpen(true)} className="users-mobile__menu-btn">
          <Menu size={18} strokeWidth={2.25} />
        </button>
        <h1>Користувачі</h1>
        <div className="users-mobile__top-actions">
          <button type="button" aria-label="Додати користувача">
            <UserPlus size={18} strokeWidth={2.25} />
          </button>
        </div>
      </header>

      <section className="users-mobile__stats">
        <article className="users-mobile__stat">
          <strong>247</strong>
          <span>Всього</span>
        </article>
        <article className="users-mobile__stat users-mobile__stat--green">
          <strong>31</strong>
          <span>Цього місяця</span>
        </article>
        <article className="users-mobile__stat users-mobile__stat--blue">
          <strong>189</strong>
          <span>Pro</span>
        </article>
      </section>

      <section className="users-mobile__search-wrap">
        <div className="users-mobile__search">
          <Search size={16} strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => {
              setPage(1)
              setQuery(e.target.value)
            }}
            placeholder="Пошук користувача..."
          />
        </div>
        <button type="button" className="users-mobile__filter" aria-label="Фільтри">
          <SlidersHorizontal size={16} strokeWidth={2} />
        </button>
      </section>

      <section className="users-mobile__segments">
        <button
          type="button"
          className={segment === 'Активні' ? 'users-mobile__seg users-mobile__seg--green users-mobile__seg--active' : 'users-mobile__seg users-mobile__seg--green'}
          onClick={() => {
            setPage(1)
            setSegment('Активні')
          }}
        >
          Активні
        </button>
        <button
          type="button"
          className={segment === 'Ризик' ? 'users-mobile__seg users-mobile__seg--yellow users-mobile__seg--active' : 'users-mobile__seg users-mobile__seg--yellow'}
          onClick={() => {
            setPage(1)
            setSegment('Ризик')
          }}
        >
          Ризик
        </button>
        <button
          type="button"
          className={segment === 'Нові' ? 'users-mobile__seg users-mobile__seg--blue users-mobile__seg--active' : 'users-mobile__seg users-mobile__seg--blue'}
          onClick={() => {
            setPage(1)
            setSegment('Нові')
          }}
        >
          Нові
        </button>
      </section>

      <section className="users-mobile__list">
        {pagedUsers.map((user, idx) => (
          <article key={user.id} className="users-mobile__row">
            <div className={`users-mobile__avatar users-mobile__avatar--${idx + 1}`}>{user.initials}</div>
            <div className="users-mobile__body">
              <strong>{user.name}</strong>
              <span>{user.domain}{user.sites > 0 ? ` · ${user.sites} сайт` : ''}</span>
            </div>
            <div className="users-mobile__meta">
              <span className={badgeClass(user.plan)}>{user.plan}</span>
              <small>{user.when}</small>
            </div>
          </article>
        ))}
        {pagedUsers.length === 0 ? <p className="orders-mobile__empty">Нічого не знайдено.</p> : null}
      </section>

      <section className="orders-mobile__pagination">
        <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
        {Array.from({ length: totalPages }).map((_, idx) => {
          const value = idx + 1
          return (
            <button
              key={value}
              type="button"
              className={currentPage === value ? 'orders-mobile__page-active' : ''}
              onClick={() => setPage(value)}
            >
              {value}
            </button>
          )
        })}
        <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>›</button>
      </section>

      <MobileFooterNav active="users" />
    </div>
  )
}

export function AdminSitesPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'Всі' | 'Активний' | 'Очікує'>('Всі')
  const [page, setPage] = useState(1)

  const filteredSites = useMemo(() => {
    return SITES.filter((site) => {
      const byStatus = statusFilter === 'Всі' ? true : site.state === statusFilter
      const q = query.trim().toLowerCase()
      const byQuery =
        q.length === 0 ||
        site.domain.toLowerCase().includes(q) ||
        site.email.toLowerCase().includes(q) ||
        site.plan.toLowerCase().includes(q)
      return byStatus && byQuery
    })
  }, [query, statusFilter])

  const pageSize = 4
  const totalPages = Math.max(1, Math.ceil(filteredSites.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedSites = filteredSites.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="sites-mobile">
      <MobileMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      <MobileHeader title="Сайти" subtitle="186 клієнтів · 172 активних" onMenu={() => setMenuOpen(true)} />

      <section className="sites-mobile__stats">
        <article className="users-mobile__stat">
          <strong>186</strong>
          <span>Всього</span>
        </article>
        <article className="users-mobile__stat users-mobile__stat--green">
          <strong>172</strong>
          <span>Активних</span>
        </article>
        <article className="users-mobile__stat">
          <strong style={{ color: '#f59e0b' }}>14</strong>
          <span>Очікують</span>
        </article>
      </section>

      <section className="orders-mobile__search-wrap">
        <div className="orders-mobile__search">
          <Search size={16} strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => {
              setPage(1)
              setQuery(e.target.value)
            }}
            placeholder="Пошук за сайтом або клієнтом..."
          />
        </div>
      </section>

      <section className="orders-mobile__segments">
        {(['Всі', 'Активний', 'Очікує'] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={statusFilter === value ? 'orders-mobile__seg orders-mobile__seg--active' : 'orders-mobile__seg'}
            onClick={() => {
              setPage(1)
              setStatusFilter(value)
            }}
          >
            {value}
          </button>
        ))}
      </section>

      <section className="sites-mobile__head-row">
        <span>Статус</span>
        <span>Інтеграції</span>
        <span>Дії</span>
      </section>

      <section className="sites-mobile__list">
        {pagedSites.map((site, idx) => (
          <article key={site.id} className="sites-mobile__row">
            <div className={`sites-mobile__logo sites-mobile__logo--${(idx % 3) + 1}`}>
              <Globe size={16} strokeWidth={2} />
            </div>
            <div className="sites-mobile__body">
              <strong>{site.domain}</strong>
              <span>{site.email}</span>
            </div>
            <div className="sites-mobile__meta">
              <span className={badgeClass(site.plan)}>{site.plan}</span>
              <span className={site.state === 'Активний' ? 'adminx-badge adminx-badge--ok' : 'adminx-badge adminx-badge--warn'}>
                {site.state}
              </span>
              <Link to={`/admin/sites/${site.id}`} className="adminx-badge adminx-badge--info">
                Дії
              </Link>
            </div>
          </article>
        ))}
        {pagedSites.length === 0 ? <p className="orders-mobile__empty">Нічого не знайдено.</p> : null}
      </section>

      <section className="orders-mobile__pagination">
        <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
        {Array.from({ length: totalPages }).map((_, idx) => {
          const value = idx + 1
          return (
            <button
              key={value}
              type="button"
              className={currentPage === value ? 'orders-mobile__page-active' : ''}
              onClick={() => setPage(value)}
            >
              {value}
            </button>
          )
        })}
        <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>›</button>
      </section>

      <MobileFooterNav active="sites" />
    </div>
  )
}

export function AdminSiteDetailPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { siteId } = useParams<{ siteId: string }>()
  const site = SITES.find((item) => item.id === siteId) ?? SITES[0]

  return (
    <div className="mobile-plain">
      <MobileMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      <MobileHeader title={site.domain} subtitle="Деталі підключення" onMenu={() => setMenuOpen(true)} />

      <div className="adminx-grid2 mobile-plain__content">
        <section className="admin-card adminx-section">
          <h2 className="admin-card__title">Статус сайту</h2>
          <div className="adminx-status-grid">
            <div>
              <span className="adminx-muted">Підключення</span>
              <p><span className="adminx-badge adminx-badge--ok">Підключено</span></p>
            </div>
            <div>
              <span className="adminx-muted">Синхронізація</span>
              <p>5 хв тому</p>
            </div>
            <div>
              <span className="adminx-muted">Віджетів</span>
              <p>7</p>
            </div>
            <div>
              <span className="adminx-muted">Домен</span>
              <p>{site.domain}</p>
            </div>
          </div>
        </section>

        <section className="admin-card adminx-section">
          <h2 className="admin-card__title">Контакти</h2>
          <div className="adminx-icon-lines">
            <div><Mail size={14} strokeWidth={2} /> support@{site.domain}</div>
            <div><Phone size={14} strokeWidth={2} /> +380 67 000 00 00</div>
            <div><Globe size={14} strokeWidth={2} /> https://{site.domain}</div>
          </div>
        </section>
      </div>

      <section className="admin-card adminx-section mobile-plain__content">
        <h2 className="admin-card__title">Швидкі дії</h2>
        <div className="adminx-action-grid">
          {SITE_ACTIONS.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.title} to={action.to} className="adminx-action">
                <span className="adminx-action-icon"><Icon size={15} strokeWidth={2.25} /></span>
                <span>{action.title}</span>
                <ArrowRight size={13} strokeWidth={2.5} />
              </Link>
            )
          })}
        </div>
      </section>

      <MobileFooterNav active="sites" />
    </div>
  )
}

export function AdminSettingsPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="mobile-plain">
      <MobileMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      <MobileHeader title="Налаштування" subtitle="Профіль та безпека" onMenu={() => setMenuOpen(true)} />

      <div className="adminx-settings-grid mobile-plain__content">
        <section className="admin-card adminx-section">
          <h2 className="admin-card__title">Профіль</h2>
          <div className="adminx-form-list">
            <div><span>Імʼя</span><strong>Ілля Л.</strong></div>
            <div><span>Email</span><strong>hello@widgetality.com</strong></div>
            <div><span>Компанія</span><strong>Widgetality</strong></div>
          </div>
          <button type="button" className="adminx-ghost-btn">Редагувати</button>
        </section>

        <section className="admin-card adminx-section">
          <h2 className="admin-card__title">Безпека</h2>
          <div className="adminx-icon-lines">
            <div><ShieldCheck size={14} strokeWidth={2} /> Двофакторна автентифікація: увімкнено</div>
            <div><CircleAlert size={14} strokeWidth={2} /> Останній вхід: сьогодні о 12:20</div>
          </div>
          <button type="button" className="adminx-ghost-btn">Змінити пароль</button>
        </section>

        <section className="admin-card adminx-section">
          <h2 className="admin-card__title">Білінг</h2>
          <div className="adminx-icon-lines">
            <div><Star size={14} strokeWidth={2} /> Тариф: Pro (2 499 грн / міс)</div>
            <div><ExternalLink size={14} strokeWidth={2} /> Наступне списання: 16 квітня</div>
          </div>
          <button type="button" className="adminx-primary-btn adminx-primary-btn--small">Керувати підпискою</button>
        </section>
      </div>

      <MobileFooterNav active="settings" />
    </div>
  )
}

export function AdminManagerRequestsPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="mobile-plain">
      <MobileMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      <MobileHeader title="Manager Requests" subtitle="Черга заявок" onMenu={() => setMenuOpen(true)} />

      <section className="adminx-list mobile-plain__content">
        {REQUESTS.map((request) => (
          <article key={request.id} className="admin-card adminx-request-row">
            <div className="adminx-user-main">
              <strong>{request.id}</strong>
              <span>{request.name}</span>
            </div>
            <div className="adminx-user-meta">
              <span className="adminx-badge adminx-badge--info">{request.type}</span>
              <span className={badgeClass(request.risk)}>{request.risk}</span>
            </div>
            <p>{request.note}</p>
            <div className="adminx-row-actions">
              <button type="button" className="adminx-ghost-btn">Взяти в роботу</button>
              <button type="button" className="adminx-ghost-btn">Деталі</button>
            </div>
          </article>
        ))}
      </section>

      <MobileFooterNav active="settings" />
    </div>
  )
}

export function AdminLandingContentPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="mobile-plain">
      <MobileMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      <MobileHeader
        title="Landing Content"
        subtitle="Керування блоками"
        onMenu={() => setMenuOpen(true)}
        right={
          <button type="button" className="orders-mobile__avatar" aria-label="Додати блок">
            <Plus size={16} strokeWidth={2.5} />
          </button>
        }
      />

      <section className="adminx-list mobile-plain__content">
        {CONTENT_BLOCKS.map((block) => (
          <article key={block.id} className="admin-card adminx-content-row">
            <div className="adminx-user-main">
              <strong>{block.title}</strong>
              <span>ID: {block.id}</span>
            </div>
            <div className="adminx-user-meta">
              <span className={badgeClass(block.status)}>{block.status}</span>
              <span className="adminx-muted">{block.updated}</span>
            </div>
            <div className="adminx-row-actions">
              <button type="button" className="adminx-ghost-btn">Редагувати</button>
              <button type="button" className="adminx-ghost-btn">Превʼю</button>
            </div>
          </article>
        ))}
      </section>

      <MobileFooterNav active="settings" />
    </div>
  )
}
