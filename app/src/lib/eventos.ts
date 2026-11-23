// Eventos del campus: lo que encuentras al entrar a un edificio.
// - Desafío del día: 3 preguntas, iguales para todos ese día.
// - Ataque: cada día un edificio abierto está "bajo ataque"; la amenaza es una pregunta.
//   Defender = responder. Huir = -1 gema e insignia de retirada (el ataque sigue).
//   Fallar = un incidente propio de ese escenario (-3 gemas): se perdió una historia clínica,
//   la enfermera se enojó, te sacaron del pase de visita, se cayó el techo, el paciente se fue
//   enojado de la posta… Mientras siga, las lecciones de ese edificio dan la mitad de gemas.
//   Se remedia con una misión de 3 preguntas (Pro gratis; plan gratis paga gemas o espera 24 h).
// - Paciente en el pasillo: sorpresa de 1 pregunta, no aparece todos los días.
//
// Hoy todo vive en el teléfono. Cuando haya inicio de sesión, premios y castigos deben pasar
// por una función de Supabase (como completar_leccion) para que un APK modificado no se los dé.

import type { Sprite } from '../game/sprites'
import {
  AMENAZA_BACTERIA,
  AMENAZA_TOXINA,
  AMENAZA_VIRUS,
  BANDERA,
  BOTIQUIN,
  CARA_ENOJADA,
  CRONO,
  ENFERMERA,
  ESCUDO,
  ESTRELLA,
  GOTA,
  GRIETA,
  HOJA,
  HOJA_X,
  MARTILLO,
  NUBE,
  OJO,
  PACIENTE,
  PUERTA,
} from '../game/sprites'
import { ganarGemas, sumarXp } from './economia'
import { today, type GameState } from './store'
import { EXAMS, edificio, type ExamCode, type Modo, type Question } from './types'

export type { Modo }

// Escala de la economía (una lección da 10 gemas; tope diario de 400, ver economia.ts)
export const PREMIO = {
  defensa: { gems: 25, xp: 30 },
  perderTecho: -10,
  huir: -3,
  desafioPorAcierto: 5,
  desafioPerfecto: 15,
  pasillo: 10,
  reparar: 15,
}
export const COSTO_REPARAR_GRATIS = 30
export const COSTO_DESCARTE = 15
export const DESAFIO_N = 3
export const REPARAR_N = 3
export const REPARAR_MIN = 2

/* ---------- azar con semilla: lo mismo para todos el mismo día ---------- */

function hash(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function rng(seed: string) {
  let a = hash(seed)
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(list: T[], n: number, seed: string): T[] {
  const r = rng(seed)
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, n)
}

/* ---------- qué pasa hoy ---------- */

/** El edificio atacado hoy (uno solo, entre los abiertos). */
export function edificioAtacado(state: GameState, day = today()): ExamCode | null {
  void state // hoy los tres edificios están abiertos; lo Pro se decide por lección
  const open = EXAMS.map((e) => e.code)
  return open[hash(`ataque:${day}`) % open.length]
}

export function ataquePendiente(state: GameState, exam: ExamCode) {
  return edificioAtacado(state) === exam && !state.ev.ataque[exam]
}

/** El paciente del pasillo aparece más o menos 1 de cada 2 días por edificio. */
export function hayPasillo(state: GameState, exam: ExamCode, day = today()) {
  return hash(`pasillo:${day}:${exam}`) % 100 < 55 && state.ev.pasillo[exam] === undefined
}

export function desafioHecho(state: GameState, exam: ExamCode) {
  const d = state.ev.desafio[exam]
  return Boolean(d && d.n >= DESAFIO_N)
}

/* ---------- incidentes: lo que sale mal si pierdes un ataque ---------- */

export interface Incidente {
  id: string
  exam: ExamCode
  /** lo que pasó, en una frase */
  titulo: string
  /** nombre corto (insignia roja) */
  corto: string
  /** misión para remediarlo */
  remedio: string
  /** cómo arranca la misión */
  intro: string
  /** etiqueta de la barra de progreso de la misión */
  barra: string
  sprite: Sprite
  /** dibuja ruinas en el mapa */
  ruinas?: boolean
}

export const INCIDENTES: Incidente[] = [
  // Hospital Docente (internado EsSalud)
  { id: 'historia', exam: 'ESSALUD', titulo: 'Se perdió una historia clínica', corto: 'Historia perdida', remedio: 'Rehacer la historia clínica', intro: 'El residente te mira serio: hay que rehacer la historia antes de la visita. Cada acierto recupera una hoja.', barra: 'Historia', sprite: HOJA },
  { id: 'enfermera', exam: 'ESSALUD', titulo: 'La enfermera jefa se enojó contigo', corto: 'Enfermera enojada', remedio: 'Disculparte con la enfermera', intro: 'La enfermera jefa cruza los brazos. Demuéstrale que sabes lo que haces.', barra: 'Paciencia', sprite: ENFERMERA },
  { id: 'pase', exam: 'ESSALUD', titulo: 'Te sacaron del pase de visita', corto: 'Fuera del pase de visita', remedio: 'Volver al pase de visita', intro: 'El jefe de servicio te dejó fuera. Responde bien para que te deje volver a la visita.', barra: 'Confianza', sprite: PUERTA },
  { id: 'grito', exam: 'ESSALUD', titulo: 'El paciente te gritó en plena visita', corto: 'Paciente furioso', remedio: 'Calmar al paciente', intro: 'El paciente sigue molesto. Explícale bien y recupera su confianza.', barra: 'Calma', sprite: CARA_ENOJADA },
  // Aula Magna (ENAM)
  { id: 'techo', exam: 'ENAM', titulo: 'Se cayó el techo del Aula Magna', corto: 'Techo caído', remedio: 'Reparar el techo', intro: 'El techo está en el suelo. Cada respuesta correcta pone una viga.', barra: 'Techo', sprite: GRIETA, ruinas: true },
  { id: 'falta', exam: 'ENAM', titulo: 'El jefe de práctica te puso falta', corto: 'Falta en el registro', remedio: 'Justificar la falta', intro: 'El jefe de práctica te toma una prueba oral para borrarte la falta.', barra: 'Registro', sprite: HOJA_X },
  { id: 'apuntes', exam: 'ENAM', titulo: 'Se mojaron tus apuntes', corto: 'Apuntes mojados', remedio: 'Rehacer tus apuntes', intro: 'Tus resúmenes quedaron ilegibles. Cada acierto rehace una página.', barra: 'Apuntes', sprite: GOTA },
  // Posta Rural (SERUMS)
  { id: 'se_fue', exam: 'SERUMS', titulo: 'El paciente se fue enojado de la posta', corto: 'Paciente perdido', remedio: 'Visita domiciliaria', intro: 'Caminas hasta su casa para recuperarlo. Responde bien para que vuelva a la posta.', barra: 'Confianza', sprite: CARA_ENOJADA },
  { id: 'jefe', exam: 'SERUMS', titulo: 'El jefe de la microred te llamó la atención', corto: 'Llamada de atención', remedio: 'Presentar el informe', intro: 'Hay que entregar el informe sin errores. Cada acierto llena una sección.', barra: 'Informe', sprite: HOJA_X },
  { id: 'botiquin', exam: 'SERUMS', titulo: 'Se vencieron medicamentos del botiquín', corto: 'Botiquín vencido', remedio: 'Reordenar la farmacia', intro: 'Revisa el stock y repón lo que falta. Cada acierto ordena un estante.', barra: 'Farmacia', sprite: BOTIQUIN },
  { id: 'asamblea', exam: 'SERUMS', titulo: 'La comunidad se quejó en la asamblea', corto: 'Queja de la comunidad', remedio: 'Explicar en la asamblea', intro: 'Te toca hablar frente a la comunidad. Responde bien para recuperar su confianza.', barra: 'Confianza', sprite: CARA_ENOJADA },
]

export const incidente = (id: string) => INCIDENTES.find((i) => i.id === id) ?? INCIDENTES[4]

/** El incidente pendiente en un edificio, si hay. */
export function incidenteDe(state: GameState, exam: ExamCode): Incidente | null {
  const i = state.incidentes[exam]
  return i ? incidente(i.id) : null
}

/** Qué sale mal hoy si pierdes el ataque en este edificio. */
export function incidenteDelDia(exam: ExamCode, day = today()): Incidente {
  const list = INCIDENTES.filter((i) => i.exam === exam)
  return list[hash(`incidente:${day}:${exam}`) % list.length]
}

/** Cómo suena la alarma de cada escenario. */
export function alarma(exam: ExamCode) {
  if (exam === 'ESSALUD') return { titulo: '¡Código azul en el Hospital Docente!', detalle: 'El residente te busca. Resuelve el caso o algo saldrá mal.' }
  if (exam === 'SERUMS') return { titulo: '¡Emergencia en la Posta Rural!', detalle: 'Llegó un caso y no hay a quién llamar. Resuélvelo tú.' }
  return { titulo: '¡Están atacando el Aula Magna!', detalle: 'Sálvala respondiendo una pregunta.' }
}

/** ¿Queda algo por hacer hoy en este edificio? */
export function hayEventos(state: GameState, exam: ExamCode) {
  return ataquePendiente(state, exam) || hayPasillo(state, exam) || !desafioHecho(state, exam) || Boolean(incidenteDe(state, exam))
}

/* ---------- preguntas de cada evento ---------- */

const pool = (qs: Question[], exam: ExamCode) => qs.filter((q) => q.examen === exam)

export function preguntasDe(modo: Modo, qs: Question[], exam: ExamCode, day = today(), intento = 0): Question[] {
  const all = pool(qs, exam)
  if (!all.length) return []
  if (modo === 'ataque') {
    const duras = all.filter((q) => q.dificultad >= 2)
    return pick(duras.length ? duras : all, 1, `ataque:${day}:${exam}`)
  }
  const ataque = new Set(preguntasDe('ataque', qs, exam, day).map((q) => q.id))
  const resto = all.filter((q) => !ataque.has(q.id))
  if (modo === 'desafio') return pick(resto, DESAFIO_N, `desafio:${day}:${exam}`)
  if (modo === 'pasillo') return pick(resto, 1, `pasillo:${day}:${exam}`)
  return pick(resto, REPARAR_N, `reparar:${day}:${exam}:${intento}:${Date.now()}`)
}

/* ---------- presentación ---------- */

const AMENAZAS: Sprite[] = [AMENAZA_VIRUS, AMENAZA_TOXINA, AMENAZA_BACTERIA]

export function rival(modo: Modo, q: Question | undefined, exam: ExamCode, inc?: Incidente | null) {
  if (modo === 'ataque') {
    const tema = q?.tema ?? 'origen desconocido'
    const intro =
      exam === 'ESSALUD'
        ? `¡Código azul ${edificio(exam, 'en')}! Llega un caso de «${tema}» y el residente te mira a ti. ¡Resuélvelo!`
        : exam === 'SERUMS'
          ? `¡Emergencia ${edificio(exam, 'en')}! Llega un caso de «${tema}» y estás solo. ¡Resuélvelo!`
          : `¡Están atacando ${edificio(exam, 'el')}! Una emergencia de «${tema}» irrumpe en la clase. ¡Sálvala!`
    return { sprite: AMENAZAS[hash(q?.subarea ?? q?.tema ?? exam) % AMENAZAS.length], nombre: q ? q.tema : 'Amenaza', intro }
  }
  if (modo === 'reparar') {
    const i = inc ?? incidenteDelDia(exam)
    return { sprite: i.sprite, nombre: i.remedio, intro: `${i.intro} Necesitas ${REPARAR_MIN} de ${REPARAR_N}.`, barra: i.barra }
  }
  if (modo === 'pasillo') return { sprite: PACIENTE, nombre: 'Paciente en el pasillo', intro: `Un paciente te detiene en el pasillo ${edificio(exam, 'del')}: «Doctor, ¿me puede ayudar?»` }
  return { sprite: CRONO, nombre: 'Desafío del día', intro: `${DESAFIO_N} preguntas ${edificio(exam, 'del')}, las mismas para todos hoy. Cada acierto vale ${PREMIO.desafioPorAcierto} gemas.` }
}

/* ---------- insignias ---------- */

export interface Insignia {
  id: string
  nombre: string
  detalle: string
  sprite: Sprite
  mala?: boolean
}

export function insignia(id: string): Insignia {
  const [base, exam = 'ENAM'] = id.split(':') as [string, ExamCode | undefined]
  switch (base) {
    case 'defensor':
      return { id, nombre: `Defensor ${edificio(exam, 'del')}`, detalle: 'Detuviste un ataque respondiendo bien.', sprite: ESCUDO }
    case 'reparador':
      return { id, nombre: 'Lo arreglaste', detalle: 'Remediaste un incidente con tus respuestas.', sprite: MARTILLO }
    case 'desafio_perfecto':
      return { id, nombre: 'Desafío perfecto', detalle: `${DESAFIO_N} de ${DESAFIO_N} en el desafío del día.`, sprite: ESTRELLA }
    case 'ojo_clinico':
      return { id, nombre: 'Ojo clínico', detalle: 'Atendiste bien al paciente del pasillo.', sprite: OJO }
    case 'inc': {
      // inc:<id del incidente>
      const i = incidente(exam as string)
      return { id, nombre: i.corto, detalle: `${i.titulo}. Se borra la próxima vez que defiendas ${edificio(i.exam, 'el')}.`, sprite: i.sprite, mala: true }
    }
    case 'huida':
      return { id, nombre: 'Retirada', detalle: 'Huiste de un ataque.', sprite: BANDERA, mala: true }
    case 'mal_dia':
      return { id, nombre: 'Mal día', detalle: `0 de ${DESAFIO_N} en el desafío del día.`, sprite: NUBE, mala: true }
    default:
      return { id, nombre: id, detalle: '', sprite: ESTRELLA }
  }
}

export const CATALOGO = [
  ...EXAMS.map((e) => `defensor:${e.code}`),
  'reparador',
  'desafio_perfecto',
  'ojo_clinico',
  ...INCIDENTES.map((i) => `inc:${i.id}`),
  'huida',
  'mal_dia',
]

/* ---------- cambios de estado ---------- */

export function darInsignia(s: GameState, id: string): GameState {
  const prev = s.badges[id]
  return { ...s, badges: { ...s.badges, [id]: { n: (prev?.n ?? 0) + 1, at: Date.now() } } }
}

export function quitarInsignia(s: GameState, id: string): GameState {
  if (!s.badges[id]) return s
  const badges = { ...s.badges }
  delete badges[id]
  return { ...s, badges }
}

/** Premios respetan el tope diario de gemas; los castigos nunca dejan el saldo en negativo. */
export const gemas = (s: GameState, delta: number): GameState => (delta > 0 ? ganarGemas(s, delta).s : { ...s, gems: Math.max(0, s.gems + delta) })

export const xp = (s: GameState, n: number): GameState => sumarXp(s, n).s

/** Estadísticas y repaso: los eventos cuentan como práctica (sin gastar vidas). */
export function contarRespuesta(s: GameState, q: Question, correct: boolean): GameState {
  const st = s.stats[q.examen]
  const wrong = correct ? s.wrong.filter((id) => id !== q.id) : Array.from(new Set([...s.wrong, q.id]))
  return xp({ ...s, wrong, stats: { ...s.stats, [q.examen]: { ok: st.ok + (correct ? 1 : 0), total: st.total + 1 } } }, correct ? 10 : 0)
}

export function marcarVisto(s: GameState, exam: ExamCode): GameState {
  if (s.ev.seen.includes(exam)) return s
  return { ...s, ev: { ...s.ev, seen: [...s.ev.seen, exam] } }
}
