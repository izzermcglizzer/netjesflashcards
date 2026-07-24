import { NavLink, useLocation } from 'react-router-dom'
import { getLastDeckId } from '../utils/lastDeck'

function DecksIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="16" height="6" rx="1.5" />
      <rect x="4" y="14" width="16" height="6" rx="1.5" />
    </svg>
  )
}

function LearnIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 8l10-4 10 4-10 4-10-4Z" strokeLinejoin="round" />
      <path d="M6 10.5V16c0 1.5 2.5 3 6 3s6-1.5 6-3v-5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ReviewIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M18 3v4h-4M6 21v-4h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ProfileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.5-4 4-6 7.5-6s6 2 7.5 6" strokeLinecap="round" />
    </svg>
  )
}

export function BottomNav() {
  // This is a persistent layout component — it doesn't naturally re-render when
  // a child route changes. Reading the current path directly (rather than only
  // the localStorage fallback) keeps the "Learn" tab pointed at whichever deck
  // is actually open right now, with localStorage only as a fallback for when
  // the user is on a non-deck tab (Stats/Settings/DeckSelect).
  const location = useLocation()
  const currentDeckMatch = location.pathname.match(/^\/deck\/([^/]+)/)
  const learnDeckId = currentDeckMatch?.[1] ?? getLastDeckId()

  const tabs = [
    { to: '/', label: 'Decks', Icon: DecksIcon, end: true },
    { to: `/deck/${learnDeckId}`, label: 'Learn', Icon: LearnIcon, end: false },
    { to: '/stats', label: 'Review', Icon: ReviewIcon, end: false },
    { to: '/settings', label: 'Profile', Icon: ProfileIcon, end: false },
  ]

  return (
    <nav className="sticky bottom-0 z-30 border-t-2 border-cloud-dark bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {tabs.map(({ to, label, Icon, end }) => (
          <NavLink
            key={label}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-xs font-bold ${
                isActive ? 'text-brand-green' : 'text-ink-light'
              }`
            }
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
