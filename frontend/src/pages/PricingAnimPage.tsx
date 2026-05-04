import { useState, useEffect } from 'react'
import { Sprout, Zap, Crown } from 'lucide-react'
import applePayLogo from '../assets/logo-apple-pay-dark.svg'
import googlePayLogo from '../assets/logo-google-pay-dark.svg'
import { SeoHead } from '../components/SeoHead'
import './PricingAnimPage.css'

const PLANS = [
  { id: 'basic', name: 'Basic', Icon: Sprout, price: '799 ₴' },
  { id: 'pro',   name: 'Pro',   Icon: Zap,    price: '1 599 ₴' },
  { id: 'max',   name: 'Max',   Icon: Crown,  price: '2 899 ₴' },
] as const

type Phase = 'pricing' | 'payment' | 'success' | 'install' | 'horoshop'

const PHASE_DURATION: Record<Phase, number> = {
  pricing:  4500,
  payment:  3000,
  success:  2000,
  install:  3500,
  horoshop: 4000,
}

const NEXT_PHASE: Record<Phase, Phase> = {
  pricing:  'payment',
  payment:  'success',
  success:  'install',
  install:  'horoshop',
  horoshop: 'pricing',
}

const BAR_LABEL: Record<Phase, string> = {
  pricing:  'Вибір тарифу',
  payment:  'Оплата',
  success:  'Оплачено',
  install:  'Ваш код',
  horoshop: 'Встановлення',
}

function CursorSvg() {
  return (
    <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M0.5 0.5L0.5 16L4.3 12.2L6.8 18.5L8.8 17.7L6.3 11.4L12 11.4L0.5 0.5Z"
        fill="white"
        stroke="#0a0a0a"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PricingCards() {
  return (
    <>
      <div className="pan__cards">
        {PLANS.map((p) => (
          <div key={p.id} className={`pan__card pan__card--${p.id}`}>
            <span className="pan__icon"><p.Icon size={14} strokeWidth={2} /></span>
            <span className="pan__name">{p.name}</span>
            <span className="pan__price">{p.price}</span>
            <span className={`pan__cta pan__cta--${p.id}`}>Спробувати</span>
          </div>
        ))}
      </div>
      <div className="pan__cursor">
        <CursorSvg />
      </div>
    </>
  )
}

function PaymentPanel() {
  return (
    <div className="pan__payment">
      <div className="pan__pay-header">
        <span className="pan__pay-back">‹</span>
        <span className="pan__pay-title">Оплата</span>
        <span className="pan__pay-price">Pro · 1 599 ₴/міс</span>
      </div>
      <div className="pan__pay-body">
        <button className="pan__pay-btn pan__pay-btn--apple" type="button">
          <img src={applePayLogo} alt="Apple Pay" className="pan__pay-logo" />
        </button>
        <div className="pan__pay-sep"><span>або</span></div>
        <button className="pan__pay-btn pan__pay-btn--google" type="button">
          <img src={googlePayLogo} alt="Google Pay" className="pan__pay-logo" />
        </button>
      </div>
      {/* cursor starts exactly where pricing cursor ended — no visual jump */}
      <div className="pan__cursor pan__cursor--payment">
        <CursorSvg />
      </div>
    </div>
  )
}

function SuccessPanel() {
  return (
    <div className="pan__success">
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none" className="pan__success-svg">
        <circle
          cx="26" cy="26" r="23"
          stroke="#10b981" strokeWidth="2"
          strokeDasharray="144.5"
          strokeDashoffset="144.5"
          className="pan__success-circle"
        />
        <path
          d="M16 26 L23 33 L36 19"
          stroke="#10b981" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="32"
          strokeDashoffset="32"
          className="pan__success-check"
        />
      </svg>
      <p className="pan__success-title">Підписку Pro активовано!</p>
      <p className="pan__success-sub">1 599 ₴ · місяць</p>
    </div>
  )
}

function InstallPanel() {
  return (
    <div className="pan__install">
      <p className="pan__install-title">Вставте код у Horoshop</p>
      <p className="pan__install-sub">один раз — і всі віджети працюють</p>
      <div className="pan__install-code">
        <span className="pan__code-tag">&lt;script</span>
        {' '}<span className="pan__code-attr">src</span><span className="pan__code-eq">=</span><span className="pan__code-val">"wgts.ua/w.js"</span>
        <br />
        {'  '}<span className="pan__code-attr">data-id</span><span className="pan__code-eq">=</span><span className="pan__code-val">"sh_abc123"</span>
        <br />
        <span className="pan__code-tag">&gt;&lt;/script&gt;</span>
      </div>
      <button className="pan__install-copy" type="button">
        <span className="pan__copy-text">Скопіювати</span>
        <span className="pan__copy-done">Скопійовано ✓</span>
      </button>
      <div className="pan__cursor pan__cursor--install">
        <CursorSvg />
      </div>
    </div>
  )
}

function HoroshopPanel() {
  return (
    <div className="pan__horoshop">
      <div className="pan__hs-header">
        <span className="pan__hs-logo">B</span>
        <span className="pan__hs-breadcrumb">Налаштування · <strong>Скрипти</strong></span>
      </div>
      <div className="pan__hs-body">
        <div className="pan__hs-sidebar">
          <span className="pan__hs-item">Загальні</span>
          <span className="pan__hs-item">Адміни</span>
          <span className="pan__hs-item pan__hs-item--active">Скрипти</span>
          <span className="pan__hs-item">Кошик</span>
        </div>
        <div className="pan__hs-content">
          <p className="pan__hs-label">Скрипти перед тегом &lt;/body&gt;</p>
          <div className="pan__hs-textarea">
            <span className="pan__hs-code">{`<script\n  src="wgts.ua/w.js"\n  data-id="sh_abc123"\n></script>`}</span>
          </div>
          <button className="pan__hs-save" type="button">Зберегти</button>
        </div>
      </div>
      <div className="pan__cursor pan__cursor--horoshop">
        <CursorSvg />
      </div>
    </div>
  )
}

export function PricingAnimPage({ embedded = false }: { embedded?: boolean } = {}) {
  const [phase, setPhase] = useState<Phase>('pricing')

  useEffect(() => {
    const t = setTimeout(() => setPhase(NEXT_PHASE[phase]), PHASE_DURATION[phase])
    return () => clearTimeout(t)
  }, [phase])

  return (
    <div className="pan-page">
      {!embedded && (
        <SeoHead
          title="Демо потоку оплати — Widgetis"
          description="Внутрішня технічна сторінка з анімацією потоку оплати. Не призначена для індексації."
          path="/pricing-anim"
          noindex
        />
      )}
      <div className="pan-frame">
        <div className="pan-frame__bar">
          <span className="pan-frame__dot pan-frame__dot--r" />
          <span className="pan-frame__dot pan-frame__dot--y" />
          <span className="pan-frame__dot pan-frame__dot--g" />
          <span className={`pan-frame__label pan-frame__label--${phase}`}>
            {BAR_LABEL[phase]}
          </span>
        </div>
        <div className="pan-frame__stage">
          <div className="pan" aria-hidden="true">
            {phase === 'pricing'  && <PricingCards />}
            {phase === 'payment'  && <PaymentPanel />}
            {phase === 'success'  && <SuccessPanel />}
            {phase === 'install'  && <InstallPanel />}
            {phase === 'horoshop' && <HoroshopPanel />}
          </div>
        </div>
      </div>
    </div>
  )
}
