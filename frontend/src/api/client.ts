const BASE = '/api/v1'

let accessToken: string | null = localStorage.getItem('wty_token')

export function setToken(token: string | null) {
  accessToken = token
  if (token) {
    localStorage.setItem('wty_token', token)
  } else {
    localStorage.removeItem('wty_token')
  }
}

export function getToken(): string | null {
  return accessToken
}

interface RequestOptions {
  method?: string
  body?: unknown
  params?: Record<string, string | number | undefined>
}

export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params } = opts

  let url = `${BASE}${path}`
  if (params) {
    const sp = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) sp.set(k, String(v))
    }
    const qs = sp.toString()
    if (qs) url += `?${qs}`
  }

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Accept-Language': localStorage.getItem('wty_locale') || 'uk',
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  // Handle 401 — token expired
  if (res.status === 401) {
    setToken(null)
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as T
  }

  const json = await res.json()

  if (!res.ok) {
    const msg = json?.error?.message || `HTTP ${res.status}`
    const err = new Error(msg) as Error & { code?: string; status?: number }
    err.code = json?.error?.code
    err.status = res.status
    throw err
  }

  return json as T
}

/* Convenience wrappers */
export const get = <T>(path: string, params?: Record<string, string | number | undefined>) =>
  api<T>(path, { params })

export const post = <T>(path: string, body?: unknown) =>
  api<T>(path, { method: 'POST', body })

export const put = <T>(path: string, body?: unknown) =>
  api<T>(path, { method: 'PUT', body })

export const del = <T>(path: string) =>
  api<T>(path, { method: 'DELETE' })
