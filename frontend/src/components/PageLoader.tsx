import './PageLoader.css'

type PageLoaderProps = {
  label?: string
  fullscreen?: boolean
}

export function PageLoader({ label = 'Завантаження…', fullscreen = false }: PageLoaderProps) {
  return (
    <div
      className={`page-loader${fullscreen ? ' page-loader--fullscreen' : ''}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="page-loader__spinner" aria-hidden="true" />
      {label ? <div className="page-loader__label">{label}</div> : null}
    </div>
  )
}

export default PageLoader
