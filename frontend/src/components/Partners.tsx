import './Partners.css'

function HoroshopLogo() {
  return (
    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" className="partners__logo" aria-label="Хорошоп">
      <rect width="40" height="40" rx="10" fill="#FF6C00" />
      <text x="20" y="27" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="18" fill="#fff">Х</text>
    </svg>
  )
}

export function Partners() {
  return (
    <section className="partners">
      <p className="partners__label">Працює з Хорошоп</p>
      <div className="partners__grid partners__grid--single">
        <div
          className="partners__item"
          title="Хорошоп"
          style={{
            ['--brand' as string]: '#FF6C00',
            ['--brand-glow' as string]: 'rgba(255,108,0,0.35)',
          }}
        >
          <span className="partners__badge">Офіційна підтримка</span>
          <HoroshopLogo />
          <span className="partners__name">Хорошоп</span>
        </div>
      </div>
    </section>
  )
}
