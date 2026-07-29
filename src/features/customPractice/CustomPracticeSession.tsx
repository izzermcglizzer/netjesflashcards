import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { getWordsForDeck } from '../../data'
import { getCardStatesForDeck } from '../../api/cardState'
import { ensureProfile, type Profile } from '../../api/profile'
import { buildDueQueue, buildRecentlyLearnedQueue, type QueueItem } from '../../srs/queue'
import { StudyModeRenderer, type PracticeMode } from '../study/StudyModeRenderer'
import { LearnCard } from '../study/modes/LearnCard'
import { useGradedSession, toSessionItems, type SessionItem } from '../study/useGradedSession'
import { Mascot } from '../../components/Mascot'
import { FlashOverlay } from '../../components/FlashOverlay'
import { ComboBanner } from '../../components/ComboBanner'
import { ProgressBar } from '../../components/ProgressBar'
import { Pill } from '../../components/Pill'
import { shuffle } from '../../utils/array'
import type { PracticeSource } from './customPractice.types'
import type { DeckId } from '../../data/words.types'

const VALID_MODES = new Set<PracticeMode>(['classic', 'multipleChoice', 'typing', 'listening'])

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function parseModes(raw: string | null): PracticeMode[] {
  const modes = (raw ?? '').split(',').filter((m): m is PracticeMode => VALID_MODES.has(m as PracticeMode))
  return modes.length > 0 ? modes : ['classic']
}

export function CustomPracticeSession() {
  const { deckId } = useParams<{ deckId: string }>()
  const [searchParams] = useSearchParams()
  const modes = useMemo(() => parseModes(searchParams.get('modes')), [searchParams])
  const source: PracticeSource = searchParams.get('source') === 'recent' ? 'recent' : 'due'
  const count = Number.parseInt(searchParams.get('count') ?? '', 10) || 10

  const navigate = useNavigate()
  const { userId } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [initialItems, setInitialItems] = useState<SessionItem[] | null>(null)

  const deckWords = useMemo(() => getWordsForDeck(deckId as DeckId), [deckId])

  useEffect(() => {
    ensureProfile(userId).then(setProfile)
  }, [userId])

  useEffect(() => {
    let cancelled = false
    getCardStatesForDeck(userId, deckId as DeckId).then((cardStates) => {
      if (cancelled) return
      const due: QueueItem[] =
        source === 'recent'
          ? buildRecentlyLearnedQueue(deckWords, cardStates, count)
          : buildDueQueue(deckWords, cardStates, { today: todayIso(), count })
      setInitialItems(toSessionItems(shuffle(due), () => shuffle(modes)[0]))
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, deckId, deckWords, source, count])

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
  } = useGradedSession(initialItems, { userId, deckId: deckId as DeckId, soundEnabled: profile?.sound_enabled ?? true })

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [index])

  if (!profile || queue === null) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-ink-light">Loading...</p>
      </div>
    )
  }

  if (queue.length === 0 || !current) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
        <Mascot pose="happy" />
        {source === 'recent' ? (
          <>
            <p className="text-xl font-bold">No recently-learned words yet.</p>
            <p className="text-ink-light">
              This tracks words learned from today onward. Go learn some new words, then come back to drill them!
            </p>
          </>
        ) : (
          <p className="text-xl font-bold">All caught up! Nothing due to practice right now.</p>
        )}
        <button
          type="button"
          onClick={() => navigate(`/deck/${deckId}/learn`)}
          className="font-bold text-brand-blue underline"
        >
          Learn some new words instead →
        </button>
        <button
          type="button"
          onClick={() => navigate(`/deck/${deckId}`)}
          className="text-sm text-ink-light underline"
        >
          Back to dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 p-6">
      <FlashOverlay flash={flash} />
      <ComboBanner count={celebration} />

      <div className="mx-auto flex w-full max-w-md items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(`/deck/${deckId}`)}
          aria-label="Close session"
          className="text-2xl leading-none text-ink-light"
        >
          ×
        </button>
        <ProgressBar pct={(index / queue.length) * 100} colorClassName="bg-brand-purple" />
      </div>

      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Mascot pose={pose} size={64} />
          <div>
            <Pill tone="purple">🎯 CUSTOM PRACTICE</Pill>
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
          deckWords={deckWords}
          onGraded={handleGraded}
          onAnswerFeedback={giveImmediateFeedback}
        />
      )}
    </div>
  )
}
