import { useCallback, useEffect, useState } from 'react'
import type { ExamCode } from './types'

export const MAX_LIVES = 5
export const REGEN_MS = 30 * 60 * 1000
export const FREE_PRACTICE_LESSONS = 3
export const FREE_SIMS_PER_EXAM = 1

export interface GameState {
  v: 1
  name: string
  target: ExamCode | null
  lives: number
  livesAt: number
  xp: number
  gems: number
  streak: number
  lastDay: string | null
  practiceLeft: number
  pro: boolean
  done: Record<string, { best: number; total: number }>
  stats: Record<ExamCode, { ok: number; total: number }>
  wrong: string[]
  sims: Record<ExamCode, number>
  medals: ExamCode[]
  reports: { qid: string; motivo: string; at: number }[]
}

const KEY = 'rcerito-state-v1'

export const initialState = (): GameState => ({
  v: 1,
  name: '',
  target: null,
  lives: MAX_LIVES,
  livesAt: Date.now(),
  xp: 0,
  gems: 10,
  streak: 0,
  lastDay: null,
  practiceLeft: FREE_PRACTICE_LESSONS,
  pro: false,
  done: {},
  stats: { ESSALUD: { ok: 0, total: 0 }, ENAM: { ok: 0, total: 0 }, SERUMS: { ok: 0, total: 0 } },
  wrong: [],
  sims: { ESSALUD: 0, ENAM: 0, SERUMS: 0 },
  medals: [],
  reports: [],
})

function load(): GameState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initialState()
    return { ...initialState(), ...JSON.parse(raw) }
  } catch {
    return initialState()
  }
}

/** Recupera vidas con el tiempo: una cada 30 minutos hasta 5. */
export function regenLives(s: GameState, now = Date.now()): GameState {
  if (s.lives >= MAX_LIVES) return { ...s, livesAt: now }
  const gained = Math.floor((now - s.livesAt) / REGEN_MS)
  if (gained <= 0) return s
  const lives = Math.min(MAX_LIVES, s.lives + gained)
  return { ...s, lives, livesAt: lives >= MAX_LIVES ? now : s.livesAt + gained * REGEN_MS }
}

export const today = () => new Date().toLocaleDateString('en-CA')

/** Suma un día de racha si estudió hoy por primera vez. */
export function touchStreak(s: GameState): GameState {
  const d = today()
  if (s.lastDay === d) return s
  const y = new Date(Date.now() - 86400000).toLocaleDateString('en-CA')
  return { ...s, streak: s.lastDay === y ? s.streak + 1 : 1, lastDay: d }
}

export function useGame() {
  const [state, setState] = useState<GameState>(() => regenLives(load()))

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* almacenamiento no disponible: el progreso vive solo en esta sesión */
    }
  }, [state])

  useEffect(() => {
    const t = setInterval(() => setState((s) => regenLives(s)), 30000)
    return () => clearInterval(t)
  }, [])

  const update = useCallback((fn: (s: GameState) => GameState) => setState((s) => fn(s)), [])
  const reset = useCallback(() => setState(initialState()), [])
  return { state, update, reset }
}

export function nextLifeIn(s: GameState, now = Date.now()) {
  if (s.lives >= MAX_LIVES) return 0
  return Math.max(0, REGEN_MS - (now - s.livesAt))
}
