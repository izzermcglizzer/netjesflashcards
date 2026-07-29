import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useStudyQueue } from './useStudyQueue'
import { useGradedSession, toSessionItems } from './useGradedSession'
import { ensureProfile, type Profile } from '../../api/profile'
import { StudyModeRenderer, type PracticeMode } from './StudyModeRenderer'
import { LearnCard } from './modes/LearnCard'
import { Mascot } from '../../components/Mascot'
import { FlashOverlay } from '../../components/FlashOverlay'
import { ComboBanner } from '../../components/ComboBanner'
import { ProgressBar } from '../../components/ProgressBar'
import { Pill } from '../../components/Pill'
import { getWordsForDeck, decks } from '../../data'
import type { DeckId } from '../../data/words.types'

export function StudySessionShell() {
  const { deckId, mode } = useParams<{ deckId: string; mode: string }>()
  const [searchParams] = useSearchParams()
  const chapterFilter = searchParams.has('chapter')
    ? searchParams.get('chapter') === '__unsorted__'
      ? null
      : searchParams.get('chapter')
    : undefined
  const navigate = useNavigate()
  const { userId } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    ensureProfile(userId).then(setProfile)
  }, [userId])

  const { items, loading, error } = useStudyQueue(userId, deckId as DeckId, { chapterFilter })
  const sessionItems = useMemo(
    () => (items ? toSessionItems(items, () => (mode as PracticeMode) ?? 'classic') : null),
    [items, mode],
  )
  const {
    current,
    index,
    queue,
    flash,
    celebration,
    pose,
    giveImmediateFeedback,
    handleGraded,
    handleSkip,
    handleAcknowledgeReveal,
  } = useGradedSession(sessionItems, { userId, deckId: deckId as DeckId, soundEnabled: profile?.sound_enabled ?? true })

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [index])

  if (loading || profile === null || queue === null) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-ink-light">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-brand-red">{error}</p>
      </div>
    )
  }

  if (queue.length === 0 || !current) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
        <Mascot pose="happy" />
        <p className="text-xl font-bold">All caught up! No cards due right now.</p>
        <button
          type="button"
          onClick={() => navigate(`/deck/${deckId}`)}
          className="font-bold text-brand-blue underline"
        >
          Back to dashboard
        </button>
      </div>
    )
  }

  const deck = decks.find((d) => d.id === deckId)

  return (
    <div className="flex min-h-svh flex-col">
      <FlashOverlay flash={flash} />
      <ComboBanner count={celebration} />

      <div className="mx-auto flex w-full max-w-md shrink-0 items-center gap-3 px-6 pt-6">
        <button
          type="button"
          onClick={() => navigate(`/deck/${deckId}`)}
          aria-label="Close session"
          className="text-2xl leading-none text-ink-light"
        >
          ×
        </button>
        <ProgressBar pct={(index / queue.length) * 100} />
      </div>

      <div className="mx-auto flex w-full max-w-md shrink-0 items-center justify-between gap-3 px-6 pt-4">
        <div className="flex items-center gap-3">
          <Mascot pose={pose} size={56} />
          <div>
            {deck && (
              <Pill tone="green">
                LEVEL {deck.order} • {(deck.label.split(': ')[1] ?? deck.label).toUpperCase()}
              </Pill>
            )}
            <p className="mt-1 font-extrabold text-ink">
              Question {index + 1} of {queue.length}
            </p>
          </div>
        </div>
        {!current.forceReveal && (
          <button type="button" onClick={handleSkip} className="text-sm font-bold text-ink-light underline">
            Skip
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
        {current.forceReveal ? (
          <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3">
            <p className="text-center text-sm font-bold text-ink-light">
              You've missed this one a couple times — here's a refresher, no pressure.
            </p>
            <LearnCard word={current.word} onNext={handleAcknowledgeReveal} />
          </div>
        ) : (
          <StudyModeRenderer
            mode={current.mode}
            word={current.word}
            deckWords={getWordsForDeck(deckId as DeckId)}
            onGraded={handleGraded}
            onAnswerFeedback={giveImmediateFeedback}
          />
        )}
      </div>
    </div>
  )
}
