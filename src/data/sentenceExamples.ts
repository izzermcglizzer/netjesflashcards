import sentenceRaw from './sentenceExamples.json'
import componentRaw from './componentExamples.json'

export interface SentenceExample {
  nl: string
  en: string
}

export interface WordExample {
  sentences: SentenceExample[]
  components?: string[]
}

const sentenceExamples = sentenceRaw as Record<string, WordExample>
const componentExamples = componentRaw as Record<string, SentenceExample[]>

export function getExampleForWord(wordId: string): WordExample | undefined {
  return sentenceExamples[wordId]
}

export function getComponentExamples(token: string): SentenceExample[] | undefined {
  return componentExamples[token.toLowerCase().trim()]
}
