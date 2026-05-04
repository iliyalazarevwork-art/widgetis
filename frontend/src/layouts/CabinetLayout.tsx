import { Outlet, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Topbar from '../components/Topbar'
import BottomNav from '../components/BottomNav'
import Sidebar from '../components/Sidebar'
import DesktopCabinetNav from '../components/DesktopCabinetNav'
import { Footer } from '../components/Footer'
import { useState } from 'react'
import './cabinet-layout.css'

export default function CabinetLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()
  const hasEmbeddedHeader = pathname === '/cabinet/payments' || pathname === '/cabinet/profile'

  return (
    <div className="cabinet">
      <Helmet>
        <title>Кабінет — Widgetis</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <DesktopCabinetNav />
      {!hasEmbeddedHeader && <Topbar onMenuClick={() => setSidebarOpen(true)} />}
      <main className={`cabinet__content ${hasEmbeddedHeader ? 'cabinet__content--embedded-header' : ''}`}>
        <Outlet />
      </main>
      <Footer variant="compact" />
      <BottomNav />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </div>
  )
}
