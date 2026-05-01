import { ShieldCheck } from 'lucide-react'
import plataLogo from '../assets/logo-plata-dark.svg'
import visaLogo from '../assets/logo-visa-dark.svg'
import mastercardLogo from '../assets/logo-mastercard-dark.svg'
import applePayLogo from '../assets/logo-apple-pay-dark.svg'
import googlePayLogo from '../assets/logo-google-pay-dark.svg'
import './PayStrip.css'

const LOGOS = [
  { src: plataLogo, alt: 'plata by mono' },
  { src: visaLogo, alt: 'Visa' },
  { src: mastercardLogo, alt: 'Mastercard' },
  { src: applePayLogo, alt: 'Apple Pay' },
  { src: googlePayLogo, alt: 'Google Pay' },
]

export function PayStrip() {
  return (
    <div className="pay-strip" role="region" aria-label="Способи оплати">
      <p className="pay-strip__label">
        <ShieldCheck size={13} strokeWidth={2} />
        Безпечна оплата
      </p>
      <div className="pay-strip__track-wrap">
        <div className="pay-strip__track">
          {[...LOGOS, ...LOGOS, ...LOGOS].map((logo, i) => (
            <img key={i} src={logo.src} alt={logo.alt} className="pay-strip__logo" />
          ))}
        </div>
      </div>
    </div>
  )
}
