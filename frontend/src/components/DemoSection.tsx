import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { Link } from 'react-router-dom'
import { Eye, ArrowRight } from 'lucide-react'
import './DemoSection.css'

const EXAMPLES = [
  'store.horoshop.ua',
  'store.myshopify.com',
  'store.com.ua',
]

const TypewriterInput = forwardRef<HTMLInputElement, {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}>(function TypewriterInput({ value, onChange }, externalRef) {
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
  const inputEl = useRef<HTMLInputElement>(null)

  return (
    <section className="demo">
      <div className="demo__container">
        <div className="demo__card">
          <div className="demo__card-glow" aria-hidden="true" />

          <div className="demo__badge">
            <Eye size={14} strokeWidth={2} />
            <span>Готові спробувати?</span>
          </div>

          <h2 className="demo__title">
            Віджети для <span className="demo__accent">вашого</span> магазину
          </h2>

          <p className="demo__instruction">
            Оберіть пакет — і встановіть на сайт за 5 хвилин
          </p>

          <div className="demo__input-wrap">
            <TypewriterInput ref={inputEl} value={url} onChange={(e) => setUrl(e.target.value)} />
            <Link to="/pricing" className="demo__submit">
              <span>Купити</span>
              <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
          </div>

          <p className="demo__hint">7 днів безкоштовно · Без реєстрації</p>
        </div>
      </div>
    </section>
  )
}
