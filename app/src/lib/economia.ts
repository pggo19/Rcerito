// Reglas de gemas, XP, racha, tienda y evolución de Uku.
// Son las mismas que aplican las funciones de Supabase (completar_leccion, comprar,
// finalizar_simulacro). Mientras no haya inicio de sesión corren en el teléfono.
import { ITEMS, item, sirvePara, type Item } from './catalogo'
import type { Etapa } from '../game/pixel'
import { MAX_LIVES, today, type GameState } from './store'
import type { ExamCode, Lesson } from './types'

export const LECCIONES_GRATIS_POR_SALA = 2
export const TOPE_GEMAS_DIARIO = 400
export const MAX_PROTECTORES = 2
export const MAX_PASES = 3
export const EXPRESS_GRATIS_POR_SEMANA = 1
export const NOTA_APROBATORIA: Record<ExamCode, number> = { ESSALUD: 13, ENAM: 11, SERUMS: 13 }
export const SIMULACRO_OFICIAL: Record<ExamCode, { preguntas: number; minutos: number }> = {
  ESSALUD: { preguntas: 100, minutos: 100 },
  ENAM: { preguntas: 180, minutos: 180 },
  SERUMS: { preguntas: 100, minutos: 120 },
}
export const PREMIO = {
  leccion: 10,
  leccion_perfecta: 15,
  racha_3: 20,
  racha_7: 50,
  racha_14: 100,
  racha_30: 250,
  subir_nivel: 25,
  medalla: 100,
}

export const nivelDe = (xp: number) => Math.floor(Math.sqrt(xp / 100)) + 1
export const xpParaNivel = (n: number) => (n - 1) * (n - 1) * 100

const ayer = (d: string, n = 1) => {
  const f = new Date(`${d}T12:00:00`)
  f.setDate(f.getDate() - n)
  return f.toLocaleDateString('en-CA')
}

/** Suma gemas ganadas respetando el tope diario y sin repetir un premio ya cobrado hoy. */
export function ganarGemas(s: GameState, cantidad: number, ref?: string): { s: GameState; ganado: number } {
  const dia = today()
  const hoy = s.gemasHoy.dia === dia ? s.gemasHoy : { dia, total: 0 }
  const premios = s.premiosHoy.dia === dia ? s.premiosHoy : { dia, refs: [] }
  if (ref && (premios.refs.includes(ref) || s.logros.includes(`premio:${ref}`))) return { s, ganado: 0 }
  const ganado = Math.max(0, Math.min(cantidad, TOPE_GEMAS_DIARIO - hoy.total))
  return {
    s: {
      ...s,
      gems: s.gems + ganado,
      gemasHoy: { dia, total: hoy.total + ganado },
      premiosHoy: ref ? { dia, refs: [...premios.refs, ref] } : premios,
    },
    ganado,
  }
}

/** Premio que se cobra una sola vez en la vida (rachas, niveles, medallas). */
function premioUnico(s: GameState, cantidad: number, ref: string) {
  if (s.logros.includes(`premio:${ref}`)) return { s, ganado: 0 }
  const r = ganarGemas(s, cantidad)
  return { s: { ...r.s, logros: [...r.s.logros, `premio:${ref}`] }, ganado: r.ganado }
}

export function otorgarLogro(s: GameState, logro: string): GameState {
  if (s.logros.includes(logro)) return s
  const nuevos = ITEMS.filter((i) => i.logro === logro).map((i) => i.id)
  return { ...s, logros: [...s.logros, logro], inventario: Array.from(new Set([...s.inventario, ...nuevos])) }
}

export function evolucionar(s: GameState, etapa: Etapa): GameState {
  if (etapa <= s.ukuEtapa) return s
  return otorgarLogro({ ...s, ukuEtapa: etapa }, `etapa:${etapa}`)
}

export const etapaInicial = (exam: ExamCode): Etapa => (exam === 'ESSALUD' ? 1 : exam === 'ENAM' ? 2 : 3)
export const etapaAlAprobar = (exam: ExamCode): Etapa => (exam === 'ESSALUD' ? 2 : exam === 'ENAM' ? 3 : 4)

/** Racha con hora local; el protector salva un día perdido. */
export function registrarEstudio(s: GameState): { s: GameState; racha: number; protector: boolean; gemas: number } {
  const hoy = today()
  if (s.lastDay === hoy) return { s, racha: s.streak, protector: false, gemas: 0 }
  let racha = 1
  let protector = false
  if (s.lastDay === ayer(hoy)) racha = s.streak + 1
  else if (s.lastDay === ayer(hoy, 2) && s.protectores > 0) {
    racha = s.streak + 1
    protector = true
  }
  let next: GameState = {
    ...s,
    streak: racha,
    lastDay: hoy,
    rachaMax: Math.max(s.rachaMax, racha),
    protectores: s.protectores - (protector ? 1 : 0),
  }
  let gemas = 0
  const inicio = ayer(hoy, racha - 1)
  for (const hito of [3, 7, 14, 30] as const) {
    if (racha >= hito) {
      const r = premioUnico(next, PREMIO[`racha_${hito}`], `racha_${hito}:${inicio}`)
      next = r.s
      gemas += r.ganado
    }
  }
  if (racha >= 30) next = otorgarLogro(next, 'racha:30')
  return { s: next, racha, protector, gemas }
}

export function sumarXp(s: GameState, xp: number): { s: GameState; subio: boolean; gemas: number } {
  const total = s.xp + Math.max(0, xp)
  const nivel = nivelDe(total)
  let next: GameState = { ...s, xp: total, nivel: Math.max(s.nivel, nivel) }
  let gemas = 0
  for (let n = s.nivel + 1; n <= nivel; n++) {
    const r = premioUnico(next, PREMIO.subir_nivel, `nivel:${n}`)
    next = r.s
    gemas += r.ganado
  }
  return { s: next, subio: nivel > s.nivel, gemas }
}

export function medallaGanada(s: GameState, lessons: Lesson[]) {
  return (
    lessons.length > 0 &&
    lessons.every((l) => {
      const d = s.done[l.id]
      return d && d.best / d.total >= 0.8
    })
  )
}

export interface ResumenLeccion {
  gemas: number
  xp: number
  subioNivel: boolean
  racha: number
  protector: boolean
  medalla: boolean
  evoluciono: boolean
}

/** Cierra una lección: mejor puntaje, gemas (una vez por lección y día), XP, racha y medalla. */
export function completarLeccion(s: GameState, lesson: Lesson, ok: number, total: number, delExamen: Lesson[]): { s: GameState; r: ResumenLeccion } {
  const prev = s.done[lesson.id]
  let next: GameState = { ...s, done: { ...s.done, [lesson.id]: { best: Math.max(prev?.best ?? 0, ok), total } } }
  const ref = `leccion:${lesson.id}:${today()}`
  const nueva = !(next.premiosHoy.dia === today() && next.premiosHoy.refs.includes(ref))
  let gemas = 0
  let g = ganarGemas(next, PREMIO.leccion, ref)
  next = g.s
  gemas += g.ganado
  if (ok === total) {
    g = ganarGemas(next, PREMIO.leccion_perfecta, `perfecta:${lesson.id}:${today()}`)
    next = g.s
    gemas += g.ganado
  }
  const x = sumarXp(next, nueva ? ok * 10 + 20 : ok * 2)
  next = x.s
  gemas += x.gemas
  const e = registrarEstudio(next)
  next = e.s
  gemas += e.gemas
  let medalla = false
  const etapaAntes = next.ukuEtapa
  if (!next.medals.includes(lesson.exam) && medallaGanada(next, delExamen)) {
    medalla = true
    next = { ...next, medals: [...next.medals, lesson.exam] }
    next = otorgarLogro(next, `medalla:${lesson.exam}`)
    const m = premioUnico(next, PREMIO.medalla, `medalla:${lesson.exam}`)
    next = m.s
    gemas += m.ganado
    next = evolucionar(next, etapaAlAprobar(lesson.exam))
  }
  return {
    s: next,
    r: { gemas, xp: nueva ? ok * 10 + 20 : ok * 2, subioNivel: x.subio, racha: e.racha, protector: e.protector, medalla, evoluciono: next.ukuEtapa > etapaAntes },
  }
}

// ---------------------------------------------------------------- acceso gratis / Pro
const claveSala = (exam: ExamCode, area: string) => `${exam}:${area}`

export function salaAbiertaHasta(s: GameState, exam: ExamCode, area: string) {
  const t = s.desbloqueos[claveSala(exam, area)] ?? 0
  return t > Date.now() ? t : 0
}

export const leccionGratis = (l: Lesson) => l.index < LECCIONES_GRATIS_POR_SALA

export function puedeEntrar(s: GameState, l: Lesson) {
  return s.pro || leccionGratis(l) || salaAbiertaHasta(s, l.exam, l.area) > 0
}

// ---------------------------------------------------------------- tienda
export type ErrorCompra =
  | 'gemas_insuficientes'
  | 'ya_lo_tienes'
  | 'solo_pro'
  | 'no_se_vende'
  | 'maximo_protectores'
  | 'maximo_pases'
  | 'pro_no_lo_necesita'
  | 'vidas_llenas'

export const MENSAJE_ERROR: Record<ErrorCompra, string> = {
  gemas_insuficientes: 'Te faltan gemas. Completa lecciones para ganar más.',
  ya_lo_tienes: 'Ya lo tienes en tu armario.',
  solo_pro: 'Este ítem es exclusivo de Pro.',
  no_se_vende: 'Este ítem se gana con un logro.',
  maximo_protectores: `Ya tienes ${MAX_PROTECTORES} protectores de racha.`,
  maximo_pases: `Ya tienes ${MAX_PASES} pases guardados.`,
  pro_no_lo_necesita: 'Con Pro ya lo tienes incluido.',
  vidas_llenas: 'Ya tienes las 5 vidas.',
}

export const loTiene = (s: GameState, i: Item) => i.precio === 0 || s.inventario.includes(i.id)

export function comprar(s: GameState, id: string, sala?: { exam: ExamCode; area: string }): GameState | ErrorCompra {
  const it = item(id)
  if (!it || it.precio === null) return 'no_se_vende'
  if (it.soloPro && !s.pro) return 'solo_pro'
  if (s.gems < it.precio) return 'gemas_insuficientes'
  const pagar = (x: GameState): GameState => ({ ...x, gems: x.gems - (it.precio ?? 0) })

  if (it.categoria === 'cosmetico') {
    if (loTiene(s, it)) return 'ya_lo_tienes'
    return pagar({ ...s, inventario: [...s.inventario, it.id] })
  }
  switch (it.tipo) {
    case 'recarga_vidas':
      if (s.pro) return 'pro_no_lo_necesita'
      if (s.lives >= MAX_LIVES) return 'vidas_llenas'
      return pagar({ ...s, lives: MAX_LIVES, livesAt: Date.now() })
    case 'protector_racha':
      if (s.protectores >= MAX_PROTECTORES) return 'maximo_protectores'
      return pagar({ ...s, protectores: s.protectores + 1 })
    case 'pase_simulacro':
      if (s.pro) return 'pro_no_lo_necesita'
      if (s.pases >= MAX_PASES) return 'maximo_pases'
      return pagar({ ...s, pases: s.pases + 1 })
    case 'desbloqueo_sala': {
      if (s.pro) return 'pro_no_lo_necesita'
      if (!sala) return 'no_se_vende'
      const k = claveSala(sala.exam, sala.area)
      const desde = Math.max(s.desbloqueos[k] ?? 0, Date.now())
      return pagar({ ...s, desbloqueos: { ...s.desbloqueos, [k]: desde + 24 * 3600 * 1000 } })
    }
    default:
      return 'no_se_vende'
  }
}

/** Ítems que se pueden poner en el avatar o en Uku, con su estado. */
export function armario(_s: GameState, quien: 'avatar' | 'uku') {
  return ITEMS.filter((i) => i.categoria === 'cosmetico' && i.slot && sirvePara(i, quien) && i.slot !== 'insignia' && !(quien === 'uku' && i.slot === 'fondo'))
}

// ---------------------------------------------------------------- simulacros
export function expressGratisDisponibles(s: GameState) {
  const semana = Date.now() - 7 * 24 * 3600 * 1000
  return Math.max(0, EXPRESS_GRATIS_POR_SEMANA - s.simsGratis.filter((t) => t > semana).length)
}

/** Resultado de un simulacro: nota vigesimal, aprobado y evolución de Uku. */
export function cerrarSimulacro(
  s: GameState,
  exam: ExamCode,
  modo: 'express' | 'oficial',
  ok: number,
  total: number,
  completo: boolean,
): { s: GameState; nota: number; aprobado: boolean; evoluciono: boolean; gemas: number } {
  const nota = Math.round((200 * ok) / Math.max(total, 1)) / 10
  const aprobado = modo === 'oficial' && completo && nota >= NOTA_APROBATORIA[exam]
  let next = sumarXp(s, ok * 10).s
  const e = registrarEstudio(next)
  next = e.s
  const antes = next.ukuEtapa
  if (aprobado) {
    next = otorgarLogro(next, `aprobado:${exam}`)
    next = evolucionar(next, etapaAlAprobar(exam))
  }
  return { s: next, nota, aprobado, evoluciono: next.ukuEtapa > antes, gemas: e.gemas }
}
