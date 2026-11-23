import bundled from '../data/questions.json'
import taxo from '../data/taxonomia.json'
import { supabase } from './supabase'
import type { ExamCode, Lesson, Question } from './types'

export const LESSON_SIZE = 10

/** Carga las preguntas publicadas desde Supabase; si no hay red, usa el banco incluido en la app. */
export async function loadQuestions(): Promise<{ questions: Question[]; source: 'nube' | 'local' }> {
  try {
    const res = await Promise.race([
      supabase
        .from('questions')
        .select('id, examen:exam, area, subarea, tema, dificultad, tipo, enunciado, opciones, correcta, explicacion, por_que_no, fuente, estado')
        .limit(5000),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000)),
    ])
    if (res.error || !res.data?.length) throw res.error ?? new Error('vacío')
    // la nube manda; la copia local completa lo que aún no se ha subido
    const cloud = res.data as unknown as Question[]
    const ids = new Set(cloud.map((q) => q.id))
    return { questions: [...cloud, ...(bundled as unknown as Question[]).filter((q) => !ids.has(q.id))], source: 'nube' }
  } catch {
    return { questions: bundled as unknown as Question[], source: 'local' }
  }
}

/** Agrupa las preguntas de un examen en lecciones ("salas") por área. */
export function buildLessons(questions: Question[], exam: ExamCode): Lesson[] {
  const byArea = new Map<string, Question[]>()
  for (const q of questions.filter((q) => q.examen === exam)) {
    const list = byArea.get(q.area) ?? []
    list.push(q)
    byArea.set(q.area, list)
  }
  // las salas siguen el orden de la tabla de especificaciones / bloques temáticos
  const order = Object.keys((taxo.taxonomia as Record<string, Record<string, string[]>>)[exam] ?? {})
  const rank = (a: string) => (order.includes(a) ? order.indexOf(a) : order.length)
  const lessons: Lesson[] = []
  for (const [area, list] of [...byArea].sort((a, b) => rank(a[0]) - rank(b[0]))) {
    list.sort((a, b) => a.dificultad - b.dificultad || a.id.localeCompare(b.id))
    for (let i = 0; i < list.length; i += LESSON_SIZE) {
      const index = i / LESSON_SIZE
      lessons.push({ id: `${exam}:${area}:${index}`, exam, area, index, questions: list.slice(i, i + LESSON_SIZE) })
    }
  }
  return lessons
}

export function shuffle<T>(list: T[]): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
