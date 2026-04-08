import { Outlet } from 'react-router-dom'
import Topbar from '../components/Topbar'
import BottomNav from '../components/BottomNav'
import Sidebar from '../components/Sidebar'
import { useState } from 'react'
import './cabinet-layout.css'

export default function CabinetLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="cabinet">
      <Topbar onMenuClick={() => setSidebarOpen(true)} />
      <main className="cabinet__content">
        <Outlet />
      </main>
      <BottomNav />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </div>
  )
}
