import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from '../context/AuthContext'
import { SignupPage } from './SignupPage'

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderSignup(initialRoute = '/signup?plan=pro&billing=yearly') {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[initialRoute]}>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </MemoryRouter>
    </HelmetProvider>,
  )
}

describe('SignupPage — Google OAuth button', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    vi.clearAllMocks()
    sessionStorage.clear()
    localStorage.clear()
  })

  it('redirects to absolute backend URL when VITE_API_BASE_URL is set', async () => {
    // Regression: previously the handler used the relative URL `/auth/google`,
    // which navigates to the SPA origin (widgetis.com) instead of the backend
    // (api.widgetis.com). Users landed on a black screen because no SPA route
    // matched. The redirect MUST be an absolute URL on the backend host.
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.test.example/api/v1')

    const user = userEvent.setup()

    const originalLocation = window.location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '', origin: 'http://localhost', pathname: '/signup', search: '?plan=pro' },
    })

    renderSignup()

    await user.click(screen.getByRole('button', { name: /увійти через google/i }))

    expect(window.location.href).toBe('https://api.test.example/auth/google')

    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    })
    vi.unstubAllEnvs()
  })

  it('persists the return path in sessionStorage before redirecting', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.test.example/api/v1')

    const user = userEvent.setup()

    const originalLocation = window.location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '', origin: 'http://localhost', pathname: '/signup', search: '?plan=pro&billing=yearly' },
    })

    renderSignup()

    await user.click(screen.getByRole('button', { name: /увійти через google/i }))

    expect(sessionStorage.getItem('google_return_to')).toBe('/signup?plan=pro&billing=yearly')

    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    })
    vi.unstubAllEnvs()
  })

  it('never sends the user to the SPA origin (relative path bug)', async () => {
    // Strong assertion: the URL must contain a host. A relative path like
    // "/auth/google" would resolve to the test origin (http://localhost) and
    // is forbidden — even if backend env is unset, the call must clearly
    // target the backend.
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.test.example/api/v1')

    const user = userEvent.setup()

    const originalLocation = window.location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '', origin: 'http://localhost', pathname: '/signup', search: '' },
    })

    renderSignup('/signup')

    await user.click(screen.getByRole('button', { name: /увійти через google/i }))

    expect(window.location.href).toMatch(/^https?:\/\/[^/]+\/auth\/google$/)
    expect(window.location.href).not.toBe('/auth/google')
    expect(window.location.href.startsWith('http://localhost')).toBe(false)

    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    })
    vi.unstubAllEnvs()
  })
})
