import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, ArrowRight, Loader } from 'lucide-react'
import { toast } from 'sonner'
import { post } from '../api/client'
import './DemoSection.css'

const EXAMPLES = [
  'store.horoshop.ua',
  'store.myshopify.com',
  'store.com.ua',
]

const TypewriterInput = forwardRef<HTMLInputElement, {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
}>(function TypewriterInput({ value, onChange, disabled }, externalRef) {
  const [placeholder, setPlaceholder] = useState('')
  const [exampleIdx, setExampleIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  useImperativeHandle(externalRef, () => inputRef.current as HTMLInputElement)

  useEffect(() => {
    if (value) return
    const example = EXAMPLES[exampleIdx]

    if (!deleting) {
      if (charIdx <= example.length) {
        const timer = setTimeout(() => {
          setPlaceholder(example.slice(0, charIdx))
          setCharIdx((c) => c + 1)
        }, 80 + Math.random() * 40)
        return () => clearTimeout(timer)
      }
      const timer = setTimeout(() => setDeleting(true), 1500)
      return () => clearTimeout(timer)
    }

    if (charIdx > 0) {
      const timer = setTimeout(() => {
        setCharIdx((c) => c - 1)
        setPlaceholder(example.slice(0, charIdx - 1))
      }, 40)
      return () => clearTimeout(timer)
    }

    setDeleting(false)
    setExampleIdx((i) => (i + 1) % EXAMPLES.length)
  }, [value, charIdx, deleting, exampleIdx])

  return (
    <div className="demo__typewriter">
      <input
        ref={inputRef}
        type="text"
        className="demo__input"
        value={value}
        onChange={onChange}
        placeholder=""
        disabled={disabled}
      />
      {!value && (
        <span className="demo__placeholder" onClick={() => inputRef.current?.focus()}>
          {placeholder}
          <span className="demo__cursor" />
        </span>
      )}
    </div>
  )
})

export function DemoSection() {
  const [url, setUrl] = useState('')
  const [creating, setCreating] = useState(false)
  const inputEl = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const domain = url.trim()
    if (!domain) {
      toast.error('Введіть адресу сайту')
      inputEl.current?.focus()
      return
    }

    setCreating(true)
    try {
      const res = await post<{ data: { code: string; link: string } }>('/demo-sessions', { domain })
      navigate(`/live-demo?code=${res.data.code}`)
    } catch (err) {
      toast.error((err as Error).message || 'Не вдалося створити демо')
    } finally {
      setCreating(false)
    }
  }

  return (
    <section className="demo">
      <div className="demo__container">
        <div className="demo__card">
          <div className="demo__card-glow" aria-hidden="true" />

          <div className="demo__badge">
            <Eye size={14} strokeWidth={2} />
            <span>Безкоштовне демо</span>
          </div>

          <h2 className="demo__title">
            Віджети на <span className="demo__accent">вашому</span> сайті
          </h2>

          <p className="demo__instruction">
            Введіть адресу магазину — побачите віджети в дії за 10 секунд
          </p>

          <form className="demo__input-wrap" onSubmit={handleSubmit}>
            <TypewriterInput ref={inputEl} value={url} onChange={(e) => setUrl(e.target.value)} disabled={creating} />
            <button type="submit" className="demo__submit" disabled={creating}>
              {creating ? (
                <Loader size={16} strokeWidth={2} className="demo__spinner" />
              ) : (
                <>
                  <span>Спробувати</span>
                  <ArrowRight size={16} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          <p className="demo__hint">Без реєстрації · Результат за 10 секунд</p>
        </div>
      </div>
    </section>
  )
}
