import { createContext, useContext } from 'react'
import type { GameState } from './store'
import type { ResumenSalas, PromoR0 } from './nube'
import type { ExamCode, Lesson, Question, Screen } from './types'

export interface AppCtx {
  state: GameState
  update: (fn: (s: GameState) => GameState) => void
  reset: () => void
  questions: Question[]
  source: 'nube' | 'local'
  lessons: Record<ExamCode, Lesson[]>
  go: (s: Screen) => void
  toast: (msg: string) => void
  resumen: ResumenSalas
  promo: PromoR0 | null
}

export const Ctx = createContext<AppCtx>(null as unknown as AppCtx)
export const useApp = () => useContext(Ctx)

export function examProgress(state: GameState, lessons: Lesson[]) {
  const done = lessons.filter((l) => state.done[l.id]).length
  return { done, total: lessons.length }
}

/** ¿Mostrar el banner de R0 Plus? Solo a serumistas o a quien llegó a Uku Serumista. */
export function verPromo(state: GameState, promo: PromoR0 | null) {
  if (!promo?.activo || !promo.url) return false
  return state.ukuEtapa >= promo.etapa_minima || (state.target !== null && promo.objetivos.includes(state.target))
}
