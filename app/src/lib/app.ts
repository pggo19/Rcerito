import { createContext, useContext } from 'react'
import type { GameState } from './store'
import type { ExamCode, Lesson, Question, Screen } from './types'
import { EXAMS } from './types'

export interface AppCtx {
  state: GameState
  update: (fn: (s: GameState) => GameState) => void
  reset: () => void
  questions: Question[]
  source: 'nube' | 'local'
  lessons: Record<ExamCode, Lesson[]>
  go: (s: Screen) => void
  toast: (msg: string) => void
}

export const Ctx = createContext<AppCtx>(null as unknown as AppCtx)
export const useApp = () => useContext(Ctx)

/** Un edificio está abierto si es el examen objetivo o uno anterior, si ya tiene la medalla del objetivo, o con Pro. */
export function isUnlocked(state: GameState, exam: ExamCode) {
  if (state.pro || !state.target) return true
  const order = EXAMS.map((e) => e.code)
  const t = order.indexOf(state.target)
  const i = order.indexOf(exam)
  return i <= t || state.medals.includes(state.target)
}

export function lessonUnlocked(state: GameState, lessons: Lesson[], idx: number) {
  return idx === 0 || Boolean(state.done[lessons[idx - 1].id])
}

export function examProgress(state: GameState, lessons: Lesson[]) {
  const done = lessons.filter((l) => state.done[l.id]).length
  return { done, total: lessons.length }
}

export function earnedMedal(state: GameState, lessons: Lesson[]) {
  return lessons.length > 0 && lessons.every((l) => {
    const d = state.done[l.id]
    return d && d.best / d.total >= 0.8
  })
}
