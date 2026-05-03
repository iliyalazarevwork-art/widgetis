import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { Eye, ArrowRight, Loader } from 'lucide-react'
import { toast } from 'sonner'
import { post } from '../api/client'
import { LiveDemoModal } from './LiveDemoModal'
import './DemoSection.css'

const EXAMPLES = [
  'store.horoshop.ua',
  'myshop.com.ua',
  'example.com.ua',
]

const DOMAIN_TAGS = ['.com.ua', '.com', '.ua', '.net']

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

    // eslint-disable-next-line react-hooks/set-state-in-effect
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

export function DemoSection({ initialUrl, autoStart }: { initialUrl?: string; autoStart?: boolean } = {}) {
  const [url, setUrl] = useState(() => {
    if (initialUrl) return initialUrl
    try { return localStorage.getItem('wty_demo_url') || '' } catch { return '' }
  })
  const [creating, setCreating] = useState(false)
  const [demoCode, setDemoCode] = useState<string | null>(null)
  const [showDemo, setShowDemo] = useState(false)
  const inputEl = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!autoStart || !initialUrl) return
    const domain = initialUrl.trim()
    if (!domain) return
    setCreating(true)
    post<{ data: { code: string } }>('/demo-sessions', { domain })
      .then((res) => { setDemoCode(res.data.code); setShowDemo(true) })
      .catch((err) => toast.error((err as Error).message || 'Не вдалося створити демо'))
      .finally(() => setCreating(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleTagClick(tag: string) {
    let base = url.trim()
    for (const s of DOMAIN_TAGS) {
      if (base.endsWith(s)) { base = base.slice(0, -s.length); break }
    }
    const newUrl = base + tag
    setUrl(newUrl)
    try { localStorage.setItem('wty_demo_url', newUrl) } catch { /* quota */ }
    inputEl.current?.focus()
  }

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
      const res = await post<{ data: { code: string } }>('/demo-sessions', { domain })
      setDemoCode(res.data.code)
      setShowDemo(true)
    } catch (err) {
      toast.error((err as Error).message || 'Не вдалося створити демо')
    } finally {
      setCreating(false)
    }
  }

  return (
    <section className="demo" id="demo">
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
            <TypewriterInput
              ref={inputEl}
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                try { localStorage.setItem('wty_demo_url', e.target.value) } catch { /* quota */ }
              }}
              disabled={creating}
            />
            {url.trim() && <div className="demo__tags">
              {(() => {
                const activeTag = DOMAIN_TAGS.find(t => url.trim().endsWith(t)) ?? null
                return DOMAIN_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`demo__tag${activeTag === tag ? ' demo__tag--active' : ''}`}
                    onClick={() => handleTagClick(tag)}
                    disabled={creating}
                  >
                    {tag}
                  </button>
                ))
              })()}
            </div>}
            <button type="submit" className="demo__submit" disabled={creating}>
              {creating ? (
                <Loader size={16} strokeWidth={2} className="demo__spinner" />
              ) : (
                <>
                  <span>Запустити демо</span>
                  <ArrowRight size={16} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          <p className="demo__hint">Без реєстрації · Результат за 10 секунд</p>
        </div>
      </div>

      {demoCode && (
        <LiveDemoModal
          isOpen={showDemo}
          onClose={() => setShowDemo(false)}
          code={demoCode}
        />
      )}
    </section>
  )
}
