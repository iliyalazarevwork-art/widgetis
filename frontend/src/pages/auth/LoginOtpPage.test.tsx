import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { server } from '../../test/msw/server'
import { AuthProvider } from '../../context/AuthContext'
import LoginOtpPage from './LoginOtpPage'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderOtpPage(
  initialEntries: (string | { pathname: string; state?: unknown })[] = [{ pathname: '/login/otp', state: { email: 'a@b.co' } }],
) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <AuthProvider>
          <LoginOtpPage />
        </AuthProvider>
      </MemoryRouter>
    </HelmetProvider>,
  )
}

// Minimal /auth/user stub so AuthProvider doesn't crash when there's no token
// (AuthProvider only calls /auth/user when a token exists — so no stub needed by default)

describe('LoginOtpPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    vi.clearAllMocks()
  })

  it('redirects back to /login when email is missing in location state', async () => {
    renderOtpPage(['/login/otp'])

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
    })
  })

  it('typing 6 digits auto-submits and calls POST /auth/otp/verify with email and code', async () => {
    const user = userEvent.setup()

    let capturedBody: unknown
    server.use(
      http.post('*/api/v1/auth/otp/verify', async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({
          token: 'jwt-abc',
          user: { id: 1, name: 'T', email: 'a@b.co', role: 'customer', locale: 'uk',
            phone: null, telegram: null, company: null, avatar_url: null,
            two_factor_enabled: false, two_factor_method: null,
            notification_enabled: true, onboarding_completed: false,
            subscription_status: null, created_at: '2024-01-01T00:00:00Z' },
        })
      }),
    )

    renderOtpPage()

    // Type digits one by one into the first input — handleChange auto-advances focus
    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(6)

    for (let i = 0; i < 6; i++) {
      await user.type(inputs[i]!, String(i + 1))
    }

    await waitFor(() => {
      expect(capturedBody).toEqual({ email: 'a@b.co', code: '123456' })
    })
  })

  it('successful verification stores token in localStorage and navigates to /cabinet', async () => {
    const user = userEvent.setup()

    server.use(
      http.post('*/api/v1/auth/otp/verify', () =>
        HttpResponse.json({
          token: 'jwt-abc',
          user: { id: 1, name: 'T', email: 'a@b.co', role: 'customer', locale: 'uk',
            phone: null, telegram: null, company: null, avatar_url: null,
            two_factor_enabled: false, two_factor_method: null,
            notification_enabled: true, onboarding_completed: false,
            subscription_status: null, created_at: '2024-01-01T00:00:00Z' },
        }),
      ),
    )

    renderOtpPage()

    const inputs = screen.getAllByRole('textbox')
    for (let i = 0; i < 6; i++) {
      await user.type(inputs[i]!, String(i + 1))
    }

    await waitFor(() => {
      expect(localStorage.getItem('wty_token')).toBe('jwt-abc')
      expect(mockNavigate).toHaveBeenCalledWith('/cabinet', { replace: true })
    })
  })

  it('successful verification for admin navigates to /admin', async () => {
    const user = userEvent.setup()

    server.use(
      http.post('*/api/v1/auth/otp/verify', () =>
        HttpResponse.json({
          token: 'jwt-admin',
          user: { id: 2, name: 'Admin', email: 'a@b.co', role: 'admin', locale: 'uk',
            phone: null, telegram: null, company: null, avatar_url: null,
            two_factor_enabled: false, two_factor_method: null,
            notification_enabled: true, onboarding_completed: false,
            subscription_status: null, created_at: '2024-01-01T00:00:00Z' },
        }),
      ),
    )

    renderOtpPage()

    const inputs = screen.getAllByRole('textbox')
    for (let i = 0; i < 6; i++) {
      await user.type(inputs[i]!, String(i + 1))
    }

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin', { replace: true })
    })
  })

  it('shows error toast and clears inputs on invalid code', async () => {
    const user = userEvent.setup()
    const { toast } = await import('sonner')

    server.use(
      http.post('*/api/v1/auth/otp/verify', () =>
        HttpResponse.json({ error: { code: 'INVALID_OTP', message: 'Invalid' } }, { status: 401 }),
      ),
    )

    renderOtpPage()

    const inputs = screen.getAllByRole('textbox')
    for (let i = 0; i < 6; i++) {
      await user.type(inputs[i]!, String(i + 1))
    }

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
    })

    // First input should be cleared
    await waitFor(() => {
      expect((inputs[0] as HTMLInputElement).value).toBe('')
    })
  })
})
