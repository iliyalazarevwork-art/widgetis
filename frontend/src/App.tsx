import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect, useState, type ReactElement } from 'react'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { Hero } from './components/Hero'
import { DemoSection } from './components/DemoSection'
import { WidgetsShowcase } from './components/WidgetsShowcase'
import { WidgetsList } from './components/WidgetsList'
import { HowItWorks } from './components/HowItWorks'
import { PricingAnimPage as PricingAnimSection } from './pages/PricingAnimPage'
import { Faq } from './components/Faq'
import { CTABanner } from './components/CTABanner'
import { FloatingActions } from './components/FloatingActions'

const ConsultationModal = lazy(() =>
  import('./components/ConsultationModal').then((m) => ({ default: m.ConsultationModal })),
)
import { Testimonials } from './components/Testimonials'

const WidgetsPage = lazy(() => import('./pages/WidgetsPage').then((m) => ({ default: m.WidgetsPage })))
const PricingPage = lazy(() => import('./pages/PricingPage').then((m) => ({ default: m.PricingPage })))
const ContactsPage = lazy(() => import('./pages/ContactsPage').then((m) => ({ default: m.ContactsPage })))
const LicensePage = lazy(() => import('./pages/LicensePage').then((m) => ({ default: m.LicensePage })))
const OfferPage = lazy(() => import('./pages/OfferPage').then((m) => ({ default: m.OfferPage })))
const TermsPage = lazy(() => import('./pages/TermsPage').then((m) => ({ default: m.TermsPage })))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })))
const RefundPage = lazy(() => import('./pages/RefundPage').then((m) => ({ default: m.RefundPage })))
const SecurityPage = lazy(() => import('./pages/SecurityPage').then((m) => ({ default: m.SecurityPage })))
const CasesPage = lazy(() => import('./pages/CasesPage').then((m) => ({ default: m.CasesPage })))
const WidgetDetailPage = lazy(() =>
  import('./pages/WidgetDetailPage').then((m) => ({ default: m.WidgetDetailPage })),
)
const DemoPage = lazy(() => import('./pages/DemoPage').then((m) => ({ default: m.DemoPage })))
const PricingAnimPage = lazy(() => import('./pages/PricingAnimPage').then((m) => ({ default: m.PricingAnimPage })))
const LiveDemoPage = lazy(() => import('./pages/LiveDemoPage').then((m) => ({ default: m.LiveDemoPage })))
const SignupPage = lazy(() => import('./pages/SignupPage').then((m) => ({ default: m.SignupPage })))
const TrialSuccessPage = lazy(() =>
  import('./pages/TrialSuccessPage').then((m) => ({ default: m.TrialSuccessPage })),
)

const AdminLayout = lazy(() => import('./pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })))
const AdminDashboardPage = lazy(() =>
  import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })),
)
const AdminConfiguratorPage = lazy(() =>
  import('./pages/admin/AdminConfiguratorPage').then((m) => ({ default: m.AdminConfiguratorPage })),
)
const AdminManagerRequestsPage = lazy(() =>
  import('./pages/admin/AdminPages').then((m) => ({ default: m.AdminManagerRequestsPage })),
)
const AdminOrdersPage = lazy(() =>
  import('./pages/admin/AdminPages').then((m) => ({ default: m.AdminOrdersPage })),
)
const AdminSettingsPage = lazy(() =>
  import('./pages/admin/AdminPages').then((m) => ({ default: m.AdminSettingsPage })),
)
const AdminSitesPage = lazy(() =>
  import('./pages/admin/AdminPages').then((m) => ({ default: m.AdminSitesPage })),
)
const AdminSiteDetailPage = lazy(() =>
  import('./pages/admin/AdminPages').then((m) => ({ default: m.AdminSiteDetailPage })),
)
const AdminSiteConfiguratorPage = lazy(() =>
  import('./pages/admin/AdminPages').then((m) => ({ default: m.AdminSiteConfiguratorPage })),
)
const AdminSubscriptionsPage = lazy(() =>
  import('./pages/admin/AdminPages').then((m) => ({ default: m.AdminSubscriptionsPage })),
)
const AdminUsersPage = lazy(() =>
  import('./pages/admin/AdminPages').then((m) => ({ default: m.AdminUsersPage })),
)
const AdminSmsOtpPage = lazy(() =>
  import('./pages/admin/AdminSmsOtpPage').then((m) => ({ default: m.AdminSmsOtpPage })),
)

const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const LoginOtpPage = lazy(() => import('./pages/auth/LoginOtpPage'))
const GoogleCallbackPage = lazy(() => import('./pages/auth/GoogleCallbackPage'))

const CabinetLayout = lazy(() => import('./layouts/CabinetLayout'))
const DashboardPage = lazy(() => import('./pages/cabinet/DashboardPage'))
const SitesPage = lazy(() => import('./pages/cabinet/SitesPage'))
const AddSitePage = lazy(() => import('./pages/cabinet/AddSitePage'))
const ConfigureWidgetPage = lazy(() => import('./pages/cabinet/ConfigureWidgetPage'))
const MyPlanPage = lazy(() => import('./pages/cabinet/MyPlanPage'))
const CancelSubscriptionPage = lazy(() => import('./pages/cabinet/CancelSubscriptionPage'))
const MyWidgetsPage = lazy(() => import('./pages/cabinet/MyWidgetsPage'))
const PaymentsPage = lazy(() => import('./pages/cabinet/PaymentsPage'))
const NotificationsPage = lazy(() => import('./pages/cabinet/NotificationsPage'))
const SupportPage = lazy(() => import('./pages/cabinet/SupportPage'))
const ProfilePage = lazy(() => import('./pages/cabinet/ProfilePage'))
const SettingsPage = lazy(() => import('./pages/cabinet/SettingsPage'))
const ChoosePlanPage = lazy(() => import('./pages/cabinet/ChoosePlanPage'))
const CabinetDemoPage = lazy(() => import('./pages/cabinet/DemoPage'))
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'))

import { useAuth } from './context/AuthContext'
import { Toaster } from 'sonner'
import { SeoHead } from './components/SeoHead'
import { ScrollManager } from './components/ScrollManager'
import { PageLoader } from './components/PageLoader'
import { AnalyticsPageView } from './components/AnalyticsPageView'
import './App.css'

function HomePage() {
  const [showConsultation, setShowConsultation] = useState(false)

  return (
    <>
      <SeoHead
        title="Widgetis — маркетингові віджети для Хорошоп | Вища конверсія та середній чек"
        description="Готові маркетингові віджети для магазину на Хорошоп: бігуча стрічка, таймер, дата доставки, фотовідгуки, колесо фортуни, прогресивна знижка. Встановлення 3 хвилини без програміста — збільшують конверсію та середній чек. 7 днів безкоштовно."
        keywords="віджети для Хорошоп, плагіни Хорошоп, віджети Horoshop, плагіни Horoshop, маркетингові інструменти Хорошоп, підвищення конверсії Хорошоп, збільшити середній чек Хорошоп, widgetis Хорошоп"
        path="/"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Скільки часу займає встановлення віджета?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Встановлення займає 2 хвилини: вставляєте один скрипт у налаштування Хорошоп і вмикаєте потрібні віджети у кабінеті.',
              },
            },
            {
              '@type': 'Question',
              name: 'Чи потрібен програміст?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Ні. Усі віджети налаштовуються через візуальний кабінет без коду — кольори, тексти, тригери.',
              },
            },
            {
              '@type': 'Question',
              name: 'Чи є безкоштовний тест?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Так, 7 днів безкоштовного тріалу на будь-якому платному плані. Скасувати можна в один клік.',
              },
            },
            {
              '@type': 'Question',
              name: 'Для яких магазинів підходять віджети?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Widgetis спеціалізується на магазинах на платформі Хорошоп. Якщо ваш магазин на Хорошоп — встановлення займає 3 хвилини без програміста.',
              },
            },
          ],
        }}
      />
      <Hero />
      <WidgetsShowcase />
      <DemoSection />
      <WidgetsList />
      <PricingAnimSection />
      <HowItWorks />
      <Testimonials />
      <CTABanner onConsultation={() => setShowConsultation(true)} />
      <Faq />
      {showConsultation && (
        <Suspense fallback={null}>
          <ConsultationModal
            isOpen={showConsultation}
            onClose={() => setShowConsultation(false)}
          />
        </Suspense>
      )}
    </>
  )
}

function MarketingLayout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
      <FloatingActions />
    </>
  )
}

function RequireAuth({ children }: { children: ReactElement }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <PageLoader fullscreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

function RequireCustomer({ children }: { children: ReactElement }) {
  const { user } = useAuth()

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  return children
}

function RequireSubscription({ children }: { children: ReactElement }) {
  const { user } = useAuth()

  // 'cancelled' = отменена, но ещё действует до конца оплаченного периода
  const hasAccess = user?.subscription_status === 'active'
    || user?.subscription_status === 'trial'
    || user?.subscription_status === 'past_due'
    || user?.subscription_status === 'cancelled'

  if (!hasAccess) {
    return <Navigate to="/cabinet/choose-plan" replace />
  }

  return children
}

function RequireOnboarding({ children }: { children: ReactElement }) {
  const { user } = useAuth()

  if (user && user.role !== 'admin' && !user.onboarding_completed) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}

function RequireAdmin({ children }: { children: ReactElement }) {
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth()
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)

  useEffect(() => {
    let cancelled = false

    const verifyAccess = async () => {
      if (!isAuthenticated) {
        if (!cancelled) setIsCheckingAccess(false)
        return
      }

      await refreshUser()
      if (!cancelled) setIsCheckingAccess(false)
    }

    verifyAccess()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, refreshUser])

  if (isLoading || isCheckingAccess) {
    return <PageLoader fullscreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/cabinet" replace />
  }

  return children
}

function LegacyProfileRedirect() {
  const location = useLocation()
  const suffix = location.pathname.replace(/^\/profile/, '')

  let targetPath = '/cabinet/profile'
  if (suffix && suffix !== '/') {
    if (suffix === '/billing') {
      targetPath = '/cabinet/plan'
    } else {
      targetPath = `/cabinet${suffix}`
    }
  }

  return <Navigate to={`${targetPath}${location.search}${location.hash}`} replace />
}

function App() {
  return (
    <BrowserRouter>
      <ScrollManager />
      <AnalyticsPageView />
      <div className="app">
        <Suspense fallback={<PageLoader fullscreen />}>
        <Routes>
          <Route element={<MarketingLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/widgets" element={<WidgetsPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/license" element={<LicensePage />} />
            <Route path="/offer" element={<OfferPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/refund" element={<RefundPage />} />
            <Route path="/security" element={<SecurityPage />} />
            <Route path="/cases" element={<CasesPage />} />
            <Route path="/widgets/:slug" element={<WidgetDetailPage />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/pricing-anim" element={<PricingAnimPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/login/otp" element={<LoginOtpPage />} />
            <Route path="/login/google-callback" element={<GoogleCallbackPage />} />
            <Route
              path="/onboarding"
              element={(
                <RequireAuth>
                  <RequireSubscription>
                    <OnboardingPage />
                  </RequireSubscription>
                </RequireAuth>
              )}
            />
          </Route>

          <Route path="/signup/success" element={<TrialSuccessPage />} />
          <Route path="/live-demo" element={<LiveDemoPage />} />
          <Route path="/profile/*" element={<LegacyProfileRedirect />} />

          <Route
            path="/cabinet/choose-plan"
            element={(
              <RequireAuth>
                <RequireCustomer>
                  <ChoosePlanPage />
                </RequireCustomer>
              </RequireAuth>
            )}
          />

          <Route
            path="/cabinet"
            element={(
              <RequireAuth>
                <RequireCustomer>
                  <RequireSubscription>
                    <RequireOnboarding>
                      <CabinetLayout />
                    </RequireOnboarding>
                  </RequireSubscription>
                </RequireCustomer>
              </RequireAuth>
            )}
          >
            <Route index element={<DashboardPage />} />
            <Route path="sites" element={<SitesPage />} />
            <Route path="sites/add" element={<AddSitePage />} />
            <Route path="sites/configure" element={<ConfigureWidgetPage />} />
            <Route path="sites/:domain/widgets" element={<ConfigureWidgetPage />} />
            <Route path="plan" element={<MyPlanPage />} />
            <Route path="plan/cancel" element={<CancelSubscriptionPage />} />
            <Route path="widgets" element={<MyWidgetsPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="support" element={<SupportPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="demo" element={<CabinetDemoPage />} />
          </Route>

          <Route
            path="/admin"
            element={(
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            )}
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="configurator" element={<AdminConfiguratorPage />} />
            <Route path="widgets" element={<AdminConfiguratorPage />} />
            <Route path="widgets/:slug" element={<AdminConfiguratorPage />} />
            <Route path="sites" element={<AdminSitesPage />} />
            <Route path="sites/:domain" element={<AdminSiteDetailPage />} />
            <Route path="sites/:domain/configure" element={<AdminSiteConfiguratorPage />} />
            <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="manager-requests" element={<AdminManagerRequestsPage />} />
            <Route path="widgets/sms-otp" element={<AdminSmsOtpPage />} />
          </Route>
        </Routes>
        </Suspense>

        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            duration: 1500,
            style: {
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-primary)',
            },
          }}
        />
      </div>
    </BrowserRouter>
  )
}

export default App
