// Sprites por capas generados con content/arte/exportar.py (32×32, se escalan sin suavizar).
import type { Slot } from '../lib/catalogo'

const archivos = import.meta.glob('../assets/pixel/**/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const URL_DE = new Map<string, string>()
for (const [ruta, url] of Object.entries(archivos)) URL_DE.set(ruta.replace('../assets/pixel/', '').replace('.png', ''), url)
const sprite = (k: string) => URL_DE.get(k)

export type Etapa = 1 | 2 | 3 | 4
export type Animo = 'normal' | 'feliz' | 'triste'

export const PIELES = [
  { id: 'clara', nombre: 'Clara', color: '#f8d5b8' },
  { id: 'triguena', nombre: 'Trigueña', color: '#d9a47a' },
  { id: 'morena', nombre: 'Morena', color: '#a8714a' },
  { id: 'oscura', nombre: 'Oscura', color: '#6e4630' },
] as const
export const PEINADOS = [
  { id: 'corto', nombre: 'Corto' },
  { id: 'largo', nombre: 'Largo' },
  { id: 'mono', nombre: 'Moño' },
  { id: 'rizado', nombre: 'Rizado' },
  { id: 'rapado', nombre: 'Rapado' },
] as const
export const COLORES_PELO = [
  { id: 'negro', nombre: 'Negro', color: '#231a1f' },
  { id: 'castano', nombre: 'Castaño', color: '#5a3a26' },
  { id: 'rojizo', nombre: 'Rojizo', color: '#9c4a2a' },
  { id: 'rubio', nombre: 'Rubio', color: '#e0b55a' },
] as const

export type Equipo = Partial<Record<Slot, string>>

export interface Apariencia {
  piel: string
  peinado: string
  colorPelo: string
}

const ORDEN_ACCESORIOS: Slot[] = ['espalda', 'cuello', 'cara', 'cabeza', 'mano']

/** Capas del avatar, de atrás hacia adelante. */
export function capasAvatar(a: Apariencia, equipo: Equipo): string[] {
  const capas = [
    sprite(`avatar/pelo_atras_${a.peinado}_${a.colorPelo}`),
    sprite('avatar/piernas'),
    sprite(`avatar/${equipo.cuerpo ?? 'polo_campus'}`),
    sprite(`avatar/piel_${a.piel}`),
    sprite(`avatar/pelo_frente_${a.peinado}_${a.colorPelo}`),
    ...ORDEN_ACCESORIOS.map((s) => (equipo[s] ? sprite(`avatar/${equipo[s]}`) : undefined)),
  ]
  return capas.filter(Boolean) as string[]
}

/** Capas de Uku según su etapa y lo que lleva puesto. */
export function capasUku(etapa: Etapa, equipo: Equipo, animo: Animo = 'normal'): string[] {
  const base = sprite(animo === 'normal' ? `uku/etapa${etapa}` : `uku/etapa${etapa}_${animo}`)
  const capas = [
    base,
    equipo.cuerpo ? sprite(`uku/${equipo.cuerpo}_${etapa}`) : undefined,
    ...ORDEN_ACCESORIOS.map((s) => (equipo[s] && equipo[s] !== 'anteojos_uku' ? sprite(`uku/${equipo[s]}_${etapa}`) : undefined)),
  ]
  return capas.filter(Boolean) as string[]
}

export const fondoUrl = (id?: string) => sprite(`fondos/${id ?? 'fondo_campus'}`) ?? sprite('fondos/fondo_campus')
export const insigniaUrl = (id: string) => sprite(`insignias/${id}`)

/** ¿Hay dibujo de este ítem para el avatar o para Uku? */
export function tieneSprite(id: string, quien: 'avatar' | 'uku') {
  if (id === 'anteojos_uku') return quien === 'uku'
  if (id.startsWith('fondo_')) return Boolean(sprite(`fondos/${id}`))
  if (id.startsWith('insignia_')) return Boolean(sprite(`insignias/${id}`))
  return Boolean(quien === 'avatar' ? sprite(`avatar/${id}`) : sprite(`uku/${id}_2`))
}

export const ETAPAS: Record<Etapa, { nombre: string; como: string }> = {
  1: { nombre: 'Uku Estudiante', como: 'Empieza aquí si tu meta es el internado de EsSalud.' },
  2: { nombre: 'Uku Interno', como: 'Evoluciona al aprobar EsSalud. Si tu meta es el ENAM, empiezas aquí.' },
  3: { nombre: 'Uku Médico', como: 'Evoluciona al aprobar el ENAM. Si tu meta es el SERUMS, empiezas aquí.' },
  4: { nombre: 'Uku Serumista', como: 'Evoluciona al aprobar el SERUMS.' },
}
