import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SeoHead } from '../../components/SeoHead'
import { setToken, get } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import type { User } from '../../types'

export default function GoogleCallbackPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

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
        login(token, res.data)
        if (returnTo) {
          navigate(returnTo, { replace: true })
        } else {
          navigate(res.data.role === 'admin' ? '/admin' : '/cabinet', { replace: true })
        }
      })
      .catch(() => {
        setToken(null)
        navigate('/login?error=google_failed', { replace: true })
      })
  }, [navigate, login])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <SeoHead title="Google авторизація — Widgetis" description="Авторизація через Google." path="/login/google-callback" noindex />
      <p>Вхід через Google…</p>
    </div>
  )
}
