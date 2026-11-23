import { supabase } from './supabase'
import type { ExamCode } from './types'

/** Cuántas lecciones tiene cada sala en la nube (las bloqueadas no se descargan). */
export type ResumenSalas = Record<string, { lecciones: number; gratis: number }>

export async function cargarResumen(): Promise<ResumenSalas> {
  try {
    const { data, error } = await supabase.rpc('resumen_salas', { p_exam: null })
    if (error || !data) return {}
    const out: ResumenSalas = {}
    for (const r of data as { exam: ExamCode; area: string; lecciones: number; lecciones_gratis: number }[]) {
      out[`${r.exam}:${r.area}`] = { lecciones: r.lecciones ?? 0, gratis: r.lecciones_gratis ?? 0 }
    }
    return out
  } catch {
    return {}
  }
}

/** Banner comercial de R0 Plus (se edita en app_config sin publicar otra versión). */
export interface PromoR0 {
  activo: boolean
  url: string | null
  titulo: string
  texto: string
  boton: string
  etapa_minima: number
  objetivos: ExamCode[]
}

const CACHE = 'rcerito-promo-r0'

export function promoGuardada(): PromoR0 | null {
  try {
    const raw = localStorage.getItem(CACHE)
    return raw ? (JSON.parse(raw) as PromoR0) : null
  } catch {
    return null
  }
}

export async function cargarPromo(): Promise<PromoR0 | null> {
  try {
    const { data, error } = await supabase.from('app_config').select('value').eq('key', 'r0plus').maybeSingle()
    if (error || !data) return promoGuardada()
    const promo = data.value as PromoR0
    try {
      localStorage.setItem(CACHE, JSON.stringify(promo))
    } catch {
      /* sin almacenamiento */
    }
    return promo
  } catch {
    return promoGuardada()
  }
}
