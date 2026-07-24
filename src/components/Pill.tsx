import type { ReactNode } from 'react'

type PillTone = 'green' | 'gold' | 'blue' | 'purple' | 'neutral'

const TONE_CLASSES: Record<PillTone, string> = {
  green: 'bg-brand-green/15 text-brand-green-dark',
  gold: 'bg-brand-gold/20 text-[#8a6d00]',
  blue: 'bg-brand-blue/15 text-brand-blue-dark',
  purple: 'bg-brand-purple/20 text-[#7a2fc9]',
  neutral: 'bg-cloud-dark text-ink-light',
}

export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: PillTone }) {
  return <span className={`app-pill ${TONE_CLASSES[tone]}`}>{children}</span>
}
