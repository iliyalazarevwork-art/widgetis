import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { get } from '../api/client'

export interface SiteSettings {
  phone: string
  email: string
  business_hours: string
  socials: Record<string, string>
  messengers: Record<string, string>
  stats: Record<string, number>
}

const CACHE_KEY = 'wty_settings'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface CachedSettings {
  data: SiteSettings
  ts: number
}

const DEFAULT_SETTINGS: SiteSettings = {
  phone: '',
  email: '',
  business_hours: '',
  socials: {},
  messengers: {},
  stats: {},
}

function readCache(): SiteSettings | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cached: CachedSettings = JSON.parse(raw)
    if (Date.now() - cached.ts > CACHE_TTL) return null
    return cached.data
  } catch {
    return null
  }
}

function writeCache(data: SiteSettings) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
}

const SettingsContext = createContext<SiteSettings>(DEFAULT_SETTINGS)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(() => readCache() ?? DEFAULT_SETTINGS)

  useEffect(() => {
    const cached = readCache()
    if (cached) {
      setSettings(cached)
      return
    }

    get<{ data: SiteSettings }>('/settings')
      .then(res => {
        setSettings(res.data)
        writeCache(res.data)
      })
      .catch(() => {})
  }, [])

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings(): SiteSettings {
  return useContext(SettingsContext)
}
