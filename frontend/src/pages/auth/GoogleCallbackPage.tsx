import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { setToken, get } from '../../api/client'
import type { User } from '../../types'

export default function GoogleCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const error = params.get('error')

    if (error || !token) {
      navigate('/login?error=google_failed', { replace: true })
      return
    }

    setToken(token)
    const returnTo = sessionStorage.getItem('google_return_to')
    sessionStorage.removeItem('google_return_to')
    get<{ data: User }>('/auth/user')
      .then((res) => {
        if (returnTo) {
          navigate(returnTo, { replace: true })
        } else {
          navigate(res.data.role === 'admin' ? '/admin' : '/cabinet', { replace: true })
        }
      })
      .catch(() => {
        navigate(returnTo ?? '/cabinet', { replace: true })
      })
  }, [navigate])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <p>Вхід через Google…</p>
    </div>
  )
}
