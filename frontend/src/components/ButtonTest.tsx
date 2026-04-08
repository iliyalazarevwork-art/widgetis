import './ButtonTest.css'

const BUTTONS = [
  { color: '#f3ff32', label: 'Complement — #f3ff32' },
  { color: '#ffb832', label: 'Split warm — #ffb832' },
  { color: '#73d25f', label: 'Split cool — #73d25f' },
  { color: '#32ffb6', label: 'Triad mint — #32ffb6' },
  { color: '#e17450', label: 'Triad coral — #e17450' },
  { color: '#ec4568', label: 'Square pink — #ec4568' },
  { color: '#df52a7', label: 'Tetradic magenta — #df52a7' },
  { color: '#3fc4bf', label: 'Tritanopia — #3fc4bf' },
  { color: '#f0f0f0', label: 'Soft white — #f0f0f0' },
  { color: '#f97316', label: 'Orange — #f97316' },
]

export function ButtonTest() {
  return (
    <div className="btn-test">
      <p className="btn-test__hint">Який колір кнопки найкраще контрастує?</p>
      <div className="btn-test__grid">
        {BUTTONS.map((b, i) => (
          <button
            key={i}
            className="btn-test__btn"
            style={{
              background: b.color,
              color: '#0a0a0a',
              boxShadow: `0 4px 24px ${b.color}44, 0 0 0 2px ${b.color}33`,
            }}
          >
            Встановити безкоштовно
            <span className="btn-test__label">{b.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
