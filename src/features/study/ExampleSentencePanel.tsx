import { useState } from 'react'
import { getExampleForWord, getComponentExamples } from '../../data/sentenceExamples'
import { splitLines } from '../../utils/html'
import type { Word } from '../../data/words.types'

/**
 * Shared "show me a sentence" toggle rendered in the answered state of every
 * practice mode. Prefers a hand-curated example (with per-component
 * breakdown for multi-word phrases); falls back to the raw Anki notes when no
 * curated entry exists yet, and renders nothing at all if there's neither.
 */
export function ExampleSentencePanel({ word }: { word: Word }) {
  const [expanded, setExpanded] = useState(false)
  const example = getExampleForWord(word.id)
  const noteLines = [...splitLines(word.notesNl), ...splitLines(word.notesEn)]

  if (!example && noteLines.length === 0) return null

  return (
    <div className="w-full border-t-2 border-cloud-dark pt-3 text-left">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="text-sm font-bold text-brand-blue underline"
      >
        {expanded ? 'Hide example' : 'Show example ✏️'}
      </button>

      {expanded && (
        <div className="mt-2 flex flex-col gap-2">
          {example ? (
            <>
              {example.sentences.map((s, i) => (
                <div key={i}>
                  <p className="font-bold text-ink">{s.nl}</p>
                  <p className="text-sm text-ink-light">{s.en}</p>
                </div>
              ))}
              {example.components?.map((token) => {
                const comp = getComponentExamples(token)?.[0]
                if (!comp) return null
                return (
                  <div key={token} className="rounded-lg bg-cloud px-3 py-2">
                    <p className="text-xs font-bold uppercase text-ink-light">{token}</p>
                    <p className="text-sm text-ink">{comp.nl}</p>
                    <p className="text-xs text-ink-light">{comp.en}</p>
                  </div>
                )
              })}
            </>
          ) : (
            noteLines.map((line, i) => (
              <p key={i} className="text-sm text-ink-light">
                {line}
              </p>
            ))
          )}
        </div>
      )}
    </div>
  )
}
