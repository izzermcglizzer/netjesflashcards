import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

export function ScreenHeader({
  backTo,
  backLabel = 'Back',
  trailing,
}: {
  backTo?: string
  backLabel?: string
  trailing?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between">
      {backTo ? (
        <Link to={backTo} className="font-bold text-brand-blue">
          &larr; {backLabel}
        </Link>
      ) : (
        <span />
      )}
      {trailing}
    </div>
  )
}
