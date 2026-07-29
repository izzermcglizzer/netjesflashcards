import sentenceRaw from './sentenceExamples.json'
import componentRaw from './componentExamples.json'

export interface SentenceExample {
  nl: string
  en: string
  /** Substring of `nl` to visually highlight — the conjugated/inflected form this example demonstrates. */
  highlightNl?: string
  /** Substring of `en` to visually highlight, matching highlightNl. */
  highlightEn?: string
  /** Shown above the sentence for multi-form words (e.g. "infinitive", "past tense"). */
  formLabel?: string
}

export interface WordExample {
  sentences: SentenceExample[]
  components?: string[]
  /** Grammar explanation for irregular/conjugated words, contrasting the Dutch pattern with English. */
  grammarNote?: { nl: string; en: string }
}

const sentenceExamples = sentenceRaw as Record<string, WordExample>
const componentExamples = componentRaw as Record<string, SentenceExample[]>

export function getExampleForWord(wordId: string): WordExample | undefined {
  return sentenceExamples[wordId]
}

export function getComponentExamples(token: string): SentenceExample[] | undefined {
  return componentExamples[token.toLowerCase().trim()]
}
