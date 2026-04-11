import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { server } from '../../test/msw/server'
import { AuthProvider } from '../../context/AuthContext'
import GoogleCallbackPage from './GoogleCallbackPage'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const MOCK_USER = {
  id: 1,
  name: 'Test',
  email: 'test@example.com',
  role: 'customer' as const,
  locale: 'uk' as const,
  phone: null,
  telegram: null,
  company: null,
  avatar_url: null,
  two_factor_enabled: false,
  two_factor_method: null,
  notification_enabled: true,
  onboarding_completed: false,
  subscription_status: null,
  created_at: '2024-01-01T00:00:00Z',
}

let savedLocation: Location

function setWindowSearch(search: string) {
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { ...savedLocation, search, href: `http://localhost${search}` },
  })
}

function renderCallbackPage() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <AuthProvider>
          <GoogleCallbackPage />
        </AuthProvider>
      </MemoryRouter>
    </HelmetProvider>,
  )
}

describe('GoogleCallbackPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    vi.clearAllMocks()
    savedLocation = window.location
    sessionStorage.clear()
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: savedLocation,
    })
  })

  it('redirects to /login?error=google_failed when no token in url', async () => {
    setWindowSearch('?error=access_denied')

    renderCallbackPage()

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login?error=google_failed', { replace: true })
    })
  })

  it('with valid token stores it and redirects to /cabinet after user fetch', async () => {
    setWindowSearch('?token=abc')

    server.use(
      http.get('*/api/v1/auth/user', () =>
        HttpResponse.json({ data: MOCK_USER }),
      ),
    )

    renderCallbackPage()

    await waitFor(() => {
      expect(localStorage.getItem('wty_token')).toBe('abc')
      expect(mockNavigate).toHaveBeenCalledWith('/cabinet', { replace: true })
    })
  })

  it('with valid token for admin redirects to /admin', async () => {
    setWindowSearch('?token=admin-token')

    server.use(
      http.get('*/api/v1/auth/user', () =>
        HttpResponse.json({ data: { ...MOCK_USER, role: 'admin' } }),
      ),
    )

    renderCallbackPage()

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin', { replace: true })
    })
  })

  it('with valid token but /auth/user fails redirects to /login?error=google_failed', async () => {
    setWindowSearch('?token=bad-token')

    server.use(
      http.get('*/api/v1/auth/user', () =>
        HttpResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 }),
      ),
    )

    renderCallbackPage()

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login?error=google_failed', { replace: true })
    })

    expect(localStorage.getItem('wty_token')).toBeNull()
  })

  it('with sessionStorage return_to redirects there and consumes it', async () => {
    setWindowSearch('?token=abc')
    sessionStorage.setItem('google_return_to', '/profile/widgets')

    server.use(
      http.get('*/api/v1/auth/user', () =>
        HttpResponse.json({ data: MOCK_USER }),
      ),
    )

    renderCallbackPage()

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/profile/widgets', { replace: true })
    })

    expect(sessionStorage.getItem('google_return_to')).toBeNull()
  })
})
