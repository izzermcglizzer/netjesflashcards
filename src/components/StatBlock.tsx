import type { ReactNode } from 'react'

export function StatBlock({
  icon,
  value,
  label,
  valueClassName = 'text-ink',
}: {
  icon?: ReactNode
  value: ReactNode
  label: string
  valueClassName?: string
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 text-center">
      <p className={`app-stat-value flex items-center gap-1 ${valueClassName}`}>
        {icon}
        {value}
      </p>
      <p className="app-stat-label">{label}</p>
    </div>
  )
}
