import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import './BackButton.css'

interface BackButtonProps {
  to: string
  label?: string
}

export function BackButton({ to, label }: BackButtonProps) {
  return (
    <Link to={to} className="back-button" aria-label={label ?? 'Назад'}>
      <ArrowLeft size={18} strokeWidth={2.25} />
      {label && <span className="back-button__label">{label}</span>}
    </Link>
  )
}
