import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw/server'
import { renderWithProviders } from '../../test/render'
import LoginPage from './LoginPage'

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

describe('LoginPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    // restore window.location if overridden
  })

  it('renders email field and both action buttons', () => {
    renderWithProviders(<LoginPage />)

    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /отримати код/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /увійти через google/i })).toBeInTheDocument()
  })

  it('otp submit is disabled for invalid email and enabled for valid email', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    const input = screen.getByRole('textbox', { name: /email/i })
    const submitBtn = screen.getByRole('button', { name: /отримати код/i })

    expect(submitBtn).toBeDisabled()

    await user.type(input, 'not-an-email')
    expect(submitBtn).toBeDisabled()

    await user.clear(input)
    await user.type(input, 'a@b.co')
    expect(submitBtn).toBeEnabled()
  })

  it('submitting valid email calls POST /auth/otp and navigates to /login/otp with email in state', async () => {
    const user = userEvent.setup()

    server.use(
      http.post('*/api/v1/auth/otp', async ({ request }) => {
        const body = await request.json()
        expect(body).toEqual({ email: 'user@test.co' })
        return HttpResponse.json({ data: { message: 'ok' } })
      }),
    )

    renderWithProviders(<LoginPage />)

    const input = screen.getByRole('textbox', { name: /email/i })
    await user.type(input, 'user@test.co')
    await user.click(screen.getByRole('button', { name: /отримати код/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login/otp', { state: { email: 'user@test.co' } })
    })
  })

  it('shows error toast when backend returns 422', async () => {
    const user = userEvent.setup()
    const { toast } = await import('sonner')

    server.use(
      http.post('*/api/v1/auth/otp', () =>
        HttpResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid email' } }, { status: 422 }),
      ),
    )

    renderWithProviders(<LoginPage />)

    await user.type(screen.getByRole('textbox', { name: /email/i }), 'user@test.co')
    await user.click(screen.getByRole('button', { name: /отримати код/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid email')
    })
  })

  it('google button navigates window.location.href to /auth/google', async () => {
    const user = userEvent.setup()

    const originalLocation = window.location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '', origin: 'http://localhost' },
    })

    renderWithProviders(<LoginPage />)

    await user.click(screen.getByRole('button', { name: /увійти через google/i }))

    expect(window.location.href).toMatch(/\/auth\/google$/)

    // restore
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    })
  })
})
