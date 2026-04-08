import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import CabinetLayout from './layouts/CabinetLayout'
import LoginPage from './pages/auth/LoginPage'
import LoginOtpPage from './pages/auth/LoginOtpPage'
import DashboardPage from './pages/cabinet/DashboardPage'
import SitesPage from './pages/cabinet/SitesPage'
import AddSitePage from './pages/cabinet/AddSitePage'
import ConfigureWidgetPage from './pages/cabinet/ConfigureWidgetPage'
import MyPlanPage from './pages/cabinet/MyPlanPage'
import MyWidgetsPage from './pages/cabinet/MyWidgetsPage'
import PaymentsPage from './pages/cabinet/PaymentsPage'
import NotificationsPage from './pages/cabinet/NotificationsPage'
import SettingsPage from './pages/cabinet/SettingsPage'
import SupportPage from './pages/cabinet/SupportPage'
import ProfilePage from './pages/cabinet/ProfilePage'
import DemoPage from './pages/cabinet/DemoPage'
import CancelSubscriptionPage from './pages/cabinet/CancelSubscriptionPage'
import ChoosePlanPage from './pages/cabinet/ChoosePlanPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100dvh',
        color: 'var(--text-muted)',
        fontSize: 14,
      }}>
        Завантаження…
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/otp" element={<LoginOtpPage />} />

      {/* Choose plan (no subscription yet) */}
      <Route
        path="/choose-plan"
        element={
          <ProtectedRoute>
            <ChoosePlanPage />
          </ProtectedRoute>
        }
      />

      {/* Cabinet */}
      <Route
        path="/cabinet"
        element={
          <ProtectedRoute>
            <CabinetLayout />
          </ProtectedRoute>
        }
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
        <Route path="settings" element={<SettingsPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="demo" element={<DemoPage />} />
        <Route path="demo/:id" element={<DemoPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/cabinet" replace />} />
    </Routes>
  )
}
