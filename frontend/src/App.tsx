import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { useState } from 'react'
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

/** Marketing site layout: header + footer + toasts */
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
              <Route path="/signup/success" element={<TrialSuccessPage />} />
            </Route>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
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
