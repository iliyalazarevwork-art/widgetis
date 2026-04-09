import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { setToken } from '../../api/client'

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
    navigate('/cabinet', { replace: true })
  }, [navigate])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <p>Вхід через Google…</p>
    </div>
  )
}
