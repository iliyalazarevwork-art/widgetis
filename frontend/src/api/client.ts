const BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '')

let accessToken: string | null = localStorage.getItem('wty_token')
const inflightGetRequests = new Map<string, Promise<unknown>>()

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
  const isPublicAuthPath = /^\/auth\/(otp(?:\/|$)|register(?:\/|$)|google(?:\/|$))/i.test(path)

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

  if (accessToken && !isPublicAuthPath) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const request = async (): Promise<T> => {
    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    // Handle 401 on protected requests — token expired/invalid
    if (res.status === 401 && accessToken && !isPublicAuthPath) {
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
      const errorDetails = json?.error?.details
      const detailsMessage = (errorDetails && typeof errorDetails === 'object')
        ? (() => {
            const first = Object.values(errorDetails)[0]
            return Array.isArray(first) ? first[0] : first
          })()
        : null

      const validationMessage = Array.isArray(json?.errors)
        ? json.errors[0]
        : (json?.errors && typeof json.errors === 'object'
          ? Object.values(json.errors)[0]
          : null)

      const firstValidationMessage = Array.isArray(validationMessage)
        ? validationMessage[0]
        : validationMessage

      const msg = detailsMessage || json?.error?.message || json?.message || firstValidationMessage || `HTTP ${res.status}`
      const err = new Error(msg) as Error & { code?: string; status?: number }
      err.code = json?.error?.code
      err.status = res.status
      throw err
    }

    return json as T
  }

  if (method.toUpperCase() === 'GET' && body === undefined) {
    const dedupeKey = `${url}|${headers['Accept-Language'] ?? ''}|${headers['Authorization'] ?? ''}`
    const existing = inflightGetRequests.get(dedupeKey)
    if (existing) {
      return existing as Promise<T>
    }

    const promise = request().finally(() => {
      inflightGetRequests.delete(dedupeKey)
    })

    inflightGetRequests.set(dedupeKey, promise as Promise<unknown>)
    return promise
  }

  return request()
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
