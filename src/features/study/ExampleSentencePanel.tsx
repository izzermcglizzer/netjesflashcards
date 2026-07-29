import { useState, type ReactNode } from 'react'
import { getExampleForWord, getComponentExamples, type SentenceExample } from '../../data/sentenceExamples'
import { speakDutch } from '../../utils/speech'
import { splitLines } from '../../utils/html'
import type { Word } from '../../data/words.types'

function Highlighted({ text, term }: { text: string; term?: string }) {
  if (!term) return <>{text}</>
  const index = text.indexOf(term)
  if (index === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, index)}
      <span className="font-extrabold text-brand-blue">{text.slice(index, index + term.length)}</span>
      {text.slice(index + term.length)}
    </>
  )
}

function ExampleCard({ example }: { example: SentenceExample }) {
  return (
    <div className="app-card flex items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cloud text-xl">🇳🇱</span>
      <div className="min-w-0 flex-1">
        {example.formLabel && (
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-brand-blue">{example.formLabel}</p>
        )}
        <p className="font-extrabold text-ink">
          <Highlighted text={example.nl} term={example.highlightNl} />
        </p>
        <p className="mt-0.5 text-sm text-ink-light">
          <Highlighted text={example.en} term={example.highlightEn} />
        </p>
      </div>
      <button
        type="button"
        onClick={() => speakDutch(example.nl)}
        aria-label="Play pronunciation"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cloud text-ink-light hover:bg-cloud-dark"
      >
        🔊
      </button>
    </div>
  )
}

function CollapsibleSection({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: string
  title: string
  subtitle?: string
  children: ReactNode
}) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-3 rounded-2xl bg-brand-blue/8 p-4 text-left"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-blue/15 text-base text-brand-blue">
          {icon}
        </span>
        <div className="flex-1">
          <p className="text-xs font-extrabold uppercase tracking-wide text-ink-light">{title}</p>
          {subtitle && !expanded && <p className="text-sm text-ink-light">{subtitle}</p>}
        </div>
        <span className={`text-brand-blue transition-transform ${expanded ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {expanded && children}
    </div>
  )
}

/**
 * Per-word "example usage" block rendered in the answered state of every
 * practice mode. Prefers a hand-curated example (with per-component
 * breakdown for multi-word phrases, and a grammar note for conjugated
 * verbs); falls back to the raw Anki notes when no curated entry exists
 * yet, and renders nothing at all if there's neither.
 */
export function ExampleSentencePanel({ word }: { word: Word }) {
  const example = getExampleForWord(word.id)
  const noteLines = [...splitLines(word.notesNl), ...splitLines(word.notesEn)]

  if (!example && noteLines.length === 0) return null

  const componentCards = example?.components
    ?.map((token) => ({ token, comp: getComponentExamples(token)?.[0] }))
    .filter((c): c is { token: string; comp: SentenceExample } => !!c.comp)

  return (
    <div className="flex w-full flex-col gap-3 text-left">
      <CollapsibleSection
        icon="💬"
        title={example ? `Examples (${example.sentences.length})` : 'Notes'}
        subtitle={example ? 'Tap to see example sentences' : 'Tap to see notes'}
      >
        <div className="flex flex-col gap-3">
          {example ? (
            <>
              {example.sentences.map((s, i) => (
                <ExampleCard key={i} example={s} />
              ))}
              {componentCards?.map(({ token, comp }) => (
                <div key={token} className="app-card">
                  <p className="text-xs font-bold uppercase text-ink-light">{token}</p>
                  <p className="text-sm text-ink">{comp.nl}</p>
                  <p className="text-xs text-ink-light">{comp.en}</p>
                </div>
              ))}
            </>
          ) : (
            <div className="app-card">
              {noteLines.map((line, i) => (
                <p key={i} className="text-sm text-ink-light">
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>
      </CollapsibleSection>

      {example?.grammarNote && (
        <CollapsibleSection icon="💡" title="How this verb works">
          <div className="app-card">
            <p className="text-sm text-ink">{example.grammarNote.nl}</p>
            <p className="mt-2 text-xs text-ink-light">{example.grammarNote.en}</p>
          </div>
        </CollapsibleSection>
      )}
    </div>
  )
}
