import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom'
import { useState, type ReactElement } from 'react'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { Hero } from './components/Hero'
import { Partners } from './components/Partners'
import { DemoSection } from './components/DemoSection'
import { WidgetsShowcase } from './components/WidgetsShowcase'
import { WidgetsList } from './components/WidgetsList'
import { HowItWorks } from './components/HowItWorks'
import { Faq } from './components/Faq'
import { CTABanner } from './components/CTABanner'
import { ConsultationModal } from './components/ConsultationModal'
import { FloatingActions } from './components/FloatingActions'
import { Testimonials } from './components/Testimonials'
import { WidgetsPage } from './pages/WidgetsPage'
import { PricingPage } from './pages/PricingPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { CheckoutSuccessPage } from './pages/CheckoutSuccessPage'
import { ContactsPage } from './pages/ContactsPage'
import { CasesPage } from './pages/CasesPage'
import { WidgetDetailPage } from './pages/WidgetDetailPage'
import { DemoPage } from './pages/DemoPage'
import { SignupPage } from './pages/SignupPage'
import { TrialSuccessPage } from './pages/TrialSuccessPage'
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminConfiguratorPage } from './pages/admin/AdminConfiguratorPage'
import {
  AdminLandingContentPage,
  AdminManagerRequestsPage,
  AdminOrdersPage,
  AdminSettingsPage,
  AdminSitesPage,
  AdminSiteDetailPage,
  AdminUsersPage,
} from './pages/admin/AdminPages'
import LoginPage from './pages/auth/LoginPage'
import LoginOtpPage from './pages/auth/LoginOtpPage'
import CabinetLayout from './layouts/CabinetLayout'
import DashboardPage from './pages/cabinet/DashboardPage'
import SitesPage from './pages/cabinet/SitesPage'
import AddSitePage from './pages/cabinet/AddSitePage'
import ConfigureWidgetPage from './pages/cabinet/ConfigureWidgetPage'
import MyPlanPage from './pages/cabinet/MyPlanPage'
import CancelSubscriptionPage from './pages/cabinet/CancelSubscriptionPage'
import MyWidgetsPage from './pages/cabinet/MyWidgetsPage'
import PaymentsPage from './pages/cabinet/PaymentsPage'
import NotificationsPage from './pages/cabinet/NotificationsPage'
import SupportPage from './pages/cabinet/SupportPage'
import ProfilePage from './pages/cabinet/ProfilePage'
import SettingsPage from './pages/cabinet/SettingsPage'
import ChoosePlanPage from './pages/cabinet/ChoosePlanPage'
import CabinetDemoPage from './pages/cabinet/DemoPage'
import { useAuth } from './context/AuthContext'
import { Toaster } from 'sonner'
import { Helmet } from 'react-helmet-async'
import { ScrollManager } from './components/ScrollManager'
import './App.css'

function HomePage() {
  const [showConsultation, setShowConsultation] = useState(false)

  return (
    <>
      <Helmet>
        <title>Widgetality — готові віджети для e-commerce | +15% конверсії</title>
        <meta
          name="description"
          content="Готові віджети для інтернет-магазинів. Встановлення за 2 хвилини, +15% конверсії. Без коду і програміста."
        />
      </Helmet>
      <Hero />
      <WidgetsShowcase />
      <DemoSection />
      <WidgetsList />
      <HowItWorks />
      <Testimonials />
      <Partners />
      <CTABanner onConsultation={() => setShowConsultation(true)} />
      <Faq />
      <ConsultationModal
        isOpen={showConsultation}
        onClose={() => setShowConsultation(false)}
      />
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
    return <div className="page-loader">Завантаження…</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <ScrollManager />
      <div className="app">
        <Routes>
          <Route element={<MarketingLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/widgets" element={<WidgetsPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/cases" element={<CasesPage />} />
            <Route path="/widgets/:slug" element={<WidgetDetailPage />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>

          <Route path="/signup/success" element={<TrialSuccessPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/otp" element={<LoginOtpPage />} />

          <Route
            path="/cabinet"
            element={(
              <RequireAuth>
                <CabinetLayout />
              </RequireAuth>
            )}
          >
            <Route index element={<DashboardPage />} />
            <Route path="sites" element={<SitesPage />} />
            <Route path="sites/add" element={<AddSitePage />} />
            <Route path="sites/configure" element={<ConfigureWidgetPage />} />
            <Route path="sites/:id/widgets" element={<ConfigureWidgetPage />} />
            <Route path="plan" element={<MyPlanPage />} />
            <Route path="plan/cancel" element={<CancelSubscriptionPage />} />
            <Route path="widgets" element={<MyWidgetsPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="support" element={<SupportPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="choose-plan" element={<ChoosePlanPage />} />
            <Route path="demo" element={<CabinetDemoPage />} />
          </Route>

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="configurator" element={<AdminConfiguratorPage />} />
            <Route path="widgets" element={<AdminConfiguratorPage />} />
            <Route path="widgets/:slug" element={<AdminConfiguratorPage />} />
            <Route path="sites" element={<AdminSitesPage />} />
            <Route path="sites/:siteId" element={<AdminSiteDetailPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="manager-requests" element={<AdminManagerRequestsPage />} />
            <Route path="landing-content" element={<AdminLandingContentPage />} />
          </Route>
        </Routes>

        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
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
