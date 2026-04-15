import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { get, post, setToken, getToken } from '../api/client'
import type { User } from '../types'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(!!getToken())

  const login = useCallback((token: string, userData: User) => {
    setToken(token)
    setUser(userData)
  }, [])

  const logout = useCallback(async () => {
    try {
      await post('/auth/logout')
    } catch {
      // ignore — token may already be expired
    }
    setToken(null)
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const res = await get<{ data: User }>('/auth/user')
      setUser(res.data)
    } catch {
      setToken(null)
      setUser(null)
    }
  }, [])

  // On mount: if token exists, fetch user
  useEffect(() => {
    if (!getToken()) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true)
    get<{ data: User }>('/auth/user')
      .then((res) => setUser(res.data))
      .catch(() => {
        setToken(null)
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const value = useMemo<AuthState>(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  }), [user, isLoading, login, logout, refreshUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
