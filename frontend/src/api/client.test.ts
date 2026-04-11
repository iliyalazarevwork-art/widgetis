import { describe, it, expect, beforeEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../test/msw/server'
import { get, post, del, setToken, getToken } from './client'

describe('api/client', () => {
  beforeEach(() => {
    setToken(null)
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('get request hits the right url with Accept-Language header', async () => {
    let capturedLang: string | null = null

    server.use(
      http.get('*/api/v1/plans', ({ request }) => {
        capturedLang = request.headers.get('accept-language')
        return HttpResponse.json({ data: [] })
      }),
    )

    const result = await get('/plans')
    expect(result).toEqual({ data: [] })
    expect(capturedLang).toBe('uk')
  })

  it('get request sends Authorization header when token is set and path is protected', async () => {
    let capturedAuth: string | null = null

    server.use(
      http.get('*/api/v1/plans', ({ request }) => {
        capturedAuth = request.headers.get('authorization')
        return HttpResponse.json({ data: [] })
      }),
    )

    setToken('jwt-xyz')
    await get('/plans')

    expect(capturedAuth).toBe('Bearer jwt-xyz')
  })

  it('get request OMITS Authorization header for /auth/otp paths even when token is set', async () => {
    let capturedAuth: string | null = 'not-set'

    server.use(
      http.get('*/api/v1/auth/otp/something', ({ request }) => {
        capturedAuth = request.headers.get('authorization')
        return HttpResponse.json({ ok: true })
      }),
    )

    setToken('jwt-xyz')
    await get('/auth/otp/something')

    expect(capturedAuth).toBeNull()
  })

  it('post request sends JSON body and Content-Type', async () => {
    let capturedBody: unknown
    let capturedContentType: string | null = null

    server.use(
      http.post('*/api/v1/auth/otp', async ({ request }) => {
        capturedContentType = request.headers.get('content-type')
        capturedBody = await request.json()
        return HttpResponse.json({ data: { message: 'ok' } })
      }),
    )

    await post('/auth/otp', { email: 'x@y.com' })

    expect(capturedContentType).toContain('application/json')
    expect(capturedBody).toEqual({ email: 'x@y.com' })
  })

  it('throws Error with code and status when backend returns 4xx with { error: {} }', async () => {
    server.use(
      http.post('*/api/v1/auth/otp', () =>
        HttpResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: 'x', details: {} } },
          { status: 422 },
        ),
      ),
    )

    let thrown: (Error & { code?: string; status?: number }) | null = null
    try {
      await post('/auth/otp', { email: 'bad' })
    } catch (e) {
      thrown = e as Error & { code?: string; status?: number }
    }

    expect(thrown).not.toBeNull()
    expect(thrown!.message).toBe('x')
    expect(thrown!.code).toBe('VALIDATION_ERROR')
    expect(thrown!.status).toBe(422)
  })

  it('prefers error.details first value over error.message', async () => {
    server.use(
      http.post('*/api/v1/auth/otp', () =>
        HttpResponse.json(
          { error: { code: 'X', message: 'fallback', details: { email: ['Bad'] } } },
          { status: 422 },
        ),
      ),
    )

    let thrown: (Error & { code?: string }) | null = null
    try {
      await post('/auth/otp', { email: 'bad' })
    } catch (e) {
      thrown = e as Error & { code?: string }
    }

    expect(thrown!.message).toBe('Bad')
  })

  it('treats 204 No Content as undefined', async () => {
    server.use(
      http.delete('*/api/v1/something', () => new HttpResponse(null, { status: 204 })),
    )

    const result = await del('/something')
    expect(result).toBeUndefined()
  })

  it('on 401 for protected call clears token and sets window.location.href', async () => {
    // Keep a real-looking location so relative fetch URLs resolve against http://localhost
    let capturedHref = ''
    const mockLocation = {
      href: 'http://localhost/',
      origin: 'http://localhost',
      pathname: '/',
      search: '',
      hash: '',
    }
    // defineProperty so the href setter is intercepted
    Object.defineProperty(mockLocation, 'href', {
      get: () => capturedHref || 'http://localhost/',
      set: (v: string) => { capturedHref = v },
      configurable: true,
    })
    vi.stubGlobal('location', mockLocation)

    server.use(
      http.get('*/api/v1/plans', () =>
        HttpResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 }),
      ),
    )

    setToken('x')

    let thrown: Error | null = null
    try {
      await get('/plans')
    } catch (e) {
      thrown = e as Error
    }

    expect(thrown).not.toBeNull()
    expect(getToken()).toBeNull()
    expect(capturedHref).toBe('/login')

    vi.unstubAllGlobals()
  })
})
