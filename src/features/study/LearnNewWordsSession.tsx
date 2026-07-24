import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { getWordsForDeck } from '../../data'
import { getCardStatesForDeck, upsertCardState } from '../../api/cardState'
import { appendReviewLog } from '../../api/reviewLog'
import { ensureProfile, type Profile } from '../../api/profile'
import { newCardState } from '../../srs/scheduler'
import { getChapterLockInfo, getUnlearnedWords } from '../../srs/queue'
import { finalizeSession } from '../../gamification/finalizeSession'
import { checkAndUnlockAchievements } from '../../gamification/achievementRunner'
import { LearnCard } from './modes/LearnCard'
import { Mascot, type MascotPose } from '../../components/Mascot'
import { ProgressBar } from '../../components/ProgressBar'
import { Pill } from '../../components/Pill'
import type { DeckId, Word } from '../../data/words.types'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function LearnNewWordsSession() {
  const { deckId } = useParams<{ deckId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { userId } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [chapter, setChapter] = useState<string | null>(null)
  const [words, setWords] = useState<Word[] | null>(null) // null = loading
  const [index, setIndex] = useState(0)
  const [pose, setPose] = useState<MascotPose>('idle')

  const deckWords = useMemo(() => getWordsForDeck(deckId as DeckId), [deckId])
  const hasExplicitChapter = searchParams.has('chapter')
  const explicitChapterParam = searchParams.get('chapter')

  useEffect(() => {
    ensureProfile(userId).then(setProfile)
  }, [userId])

  useEffect(() => {
    if (!profile) return
    let cancelled = false
    getCardStatesForDeck(userId, deckId as DeckId).then((cardStates) => {
      if (cancelled) return

      if (hasExplicitChapter) {
        const targetChapter = explicitChapterParam === '__unsorted__' ? null : explicitChapterParam
        const chapterWords =
          targetChapter === null ? deckWords.filter((w) => !w.chapter) : deckWords.filter((w) => w.chapter === targetChapter)
        setChapter(targetChapter)
        setWords(getUnlearnedWords(chapterWords, cardStates, profile.new_cards_per_day))
        return
      }

      const lockInfo = getChapterLockInfo(deckWords, cardStates)
      const target = lockInfo.find((row) => !row.locked && !row.learned)
      if (!target) {
        setChapter(null)
        setWords([])
      } else {
        setChapter(target.chapter)
        setWords(getUnlearnedWords(target.words, cardStates, profile.new_cards_per_day))
      }
    })
    return () => {
      cancelled = true
    }
  }, [userId, deckId, deckWords, profile, hasExplicitChapter, explicitChapterParam])

  if (!profile || words === null) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-ink-light">Loading...</p>
      </div>
    )
  }

  if (words.length === 0) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
        <Mascot pose="happy" />
        <p className="text-xl font-bold">You've learned every word here! Time to practice what you know.</p>
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

  const wordsList = words
  const currentWord = wordsList[index]

  async function handleNext() {
    await Promise.all([
      upsertCardState(userId, currentWord.id, deckId as DeckId, newCardState(todayIso())),
      appendReviewLog(userId, {
        wordId: currentWord.id,
        deckId: deckId as DeckId,
        mode: 'classic',
        grade: 2,
        correct: true,
      }),
    ])
    setPose('happy')

    if (index + 1 >= wordsList.length) {
      const freshProfile = await ensureProfile(userId)
      const result = await finalizeSession(userId, freshProfile, wordsList.length, 0)
      const newAchievements = await checkAndUnlockAchievements(userId, result.profile, {
        correct: wordsList.length,
        incorrect: 0,
        isCheckpoint: false,
      })
      navigate(`/deck/${deckId}/summary`, {
        state: {
          correct: wordsList.length,
          incorrect: 0,
          xpEarned: result.xpEarned,
          leveledUp: result.leveledUp,
          newAchievements,
        },
      })
    } else {
      setIndex((i) => i + 1)
      setTimeout(() => setPose('idle'), 700)
    }
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 p-6">
      <div className="mx-auto flex w-full max-w-md items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(`/deck/${deckId}`)}
          aria-label="Close session"
          className="text-2xl leading-none text-ink-light"
        >
          ×
        </button>
        <ProgressBar pct={(index / words.length) * 100} colorClassName="bg-brand-blue" />
      </div>

      <div className="mx-auto flex w-full max-w-md items-center gap-3">
        <Mascot pose={pose} size={64} />
        <div>
          <Pill tone="blue">📚 LEARN NEW WORDS{chapter ? ` • CH. ${chapter}` : ''}</Pill>
          <p className="mt-1 font-extrabold text-ink">
            Word {index + 1} of {words.length}
          </p>
        </div>
      </div>

      <LearnCard word={currentWord} onNext={handleNext} />
    </div>
  )
}
