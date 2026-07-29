import { Fragment } from 'react'
import { getExampleForWord, getComponentExamples, type SentenceExample } from '../../data/sentenceExamples'
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

function ExampleRow({ example }: { example: SentenceExample }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cloud text-lg">🇳🇱</span>
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

  return (
    <div className="w-full rounded-2xl bg-brand-blue/8 p-4 text-left">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-blue/15 text-sm text-brand-blue">
          💬
        </span>
        <p className="text-xs font-extrabold uppercase tracking-wide text-ink-light">Examples</p>
      </div>

      <div className="rounded-xl bg-white p-3">
        {example ? (
          <>
            {example.sentences.map((s, i) => (
              <Fragment key={i}>
                {i > 0 && <div className="my-3 border-t border-dashed border-cloud-dark" />}
                <ExampleRow example={s} />
              </Fragment>
            ))}

            {example.components?.map((token) => {
              const comp = getComponentExamples(token)?.[0]
              if (!comp) return null
              return (
                <div key={token} className="mt-3 rounded-lg bg-cloud px-3 py-2">
                  <p className="text-xs font-bold uppercase text-ink-light">{token}</p>
                  <p className="text-sm text-ink">{comp.nl}</p>
                  <p className="text-xs text-ink-light">{comp.en}</p>
                </div>
              )
            })}

            {example.grammarNote && (
              <div className="mt-3 rounded-lg border-2 border-brand-blue/20 bg-brand-blue/5 px-3 py-2">
                <p className="text-xs font-extrabold uppercase text-brand-blue">How this verb works</p>
                <p className="mt-1 text-sm text-ink">{example.grammarNote.nl}</p>
                <p className="mt-1 text-xs text-ink-light">{example.grammarNote.en}</p>
              </div>
            )}
          </>
        ) : (
          noteLines.map((line, i) => (
            <p key={i} className="text-sm text-ink-light">
              {line}
            </p>
          ))
        )}
      </div>
    </div>
  )
}
