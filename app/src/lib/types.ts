export type ExamCode = 'ESSALUD' | 'ENAM' | 'SERUMS'

export interface Question {
  id: string
  examen: ExamCode
  area: string
  subarea: string
  tema: string
  dificultad: 1 | 2 | 3
  tipo: 'caso_clinico' | 'directa'
  enunciado: string
  opciones: Record<string, string>
  correcta: string
  explicacion: string
  por_que_no: Record<string, string>
  fuente: { documento: string; anio: number; url: string }
  estado: string
}

export interface ExamInfo {
  code: ExamCode
  name: string
  building: string
  who: string
  blurb: string
}

export const EXAMS: ExamInfo[] = [
  {
    code: 'ESSALUD',
    name: 'Internado EsSalud',
    building: 'Hospital Docente',
    who: 'Último año',
    blurb: 'El examen para entrar al internado en un hospital de EsSalud.',
  },
  {
    code: 'ENAM',
    name: 'ENAM',
    building: 'Aula Magna',
    who: 'Internos y egresados',
    blurb: 'El Examen Nacional de Medicina de ASPEFAM: 180 casos clínicos.',
  },
  {
    code: 'SERUMS',
    name: 'SERUMS',
    building: 'Posta Rural',
    who: 'Titulados',
    blurb: 'La evaluación del MINSA para adjudicar tu plaza SERUMS.',
  },
]

export const examInfo = (code: ExamCode) => EXAMS.find((e) => e.code === code)!

/** "el Aula Magna", "del Hospital Docente", "a la Posta Rural"… */
export function edificio(code: ExamCode, forma: 'el' | 'del' | 'al' | 'en' = 'el') {
  const b = examInfo(code).building
  const fem = code === 'SERUMS'
  const pre = { el: fem ? 'la' : 'el', del: fem ? 'de la' : 'del', al: fem ? 'a la' : 'al', en: fem ? 'en la' : 'en el' }[forma]
  return `${pre} ${b}`
}

export interface Lesson {
  id: string
  exam: ExamCode
  area: string
  index: number
  questions: Question[]
}

export type Screen =
  | { name: 'onboarding' }
  | { name: 'campus' }
  | { name: 'building'; exam: ExamCode }
  | { name: 'lesson'; lessonId: string }
  | { name: 'plaza' }
  | { name: 'banco' }
  | { name: 'flashcards' }
  | { name: 'simulacro'; exam?: ExamCode }
  | { name: 'perfil' }
  | { name: 'pro' }
  | { name: 'encuentro'; exam: ExamCode; modo: Modo }
  | { name: 'tienda' }
  | { name: 'avatar' }

/** Eventos que aparecen al entrar a un edificio */
export type Modo = 'ataque' | 'desafio' | 'reparar' | 'pasillo'
