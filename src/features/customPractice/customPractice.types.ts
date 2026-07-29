import type { PracticeMode } from '../study/StudyModeRenderer'

export type PracticeSource = 'due' | 'recent'

export interface CustomPracticeConfig {
  modes: PracticeMode[]
  source: PracticeSource
  count: number
}
