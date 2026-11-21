import tienda from '../data/tienda.json'

// Mismo catálogo que la tabla shop_items de Supabase (ids y precios iguales).
export type Slot = 'cabeza' | 'cara' | 'cuello' | 'cuerpo' | 'mano' | 'espalda' | 'fondo' | 'insignia'
export type Para = 'avatar' | 'uku' | 'ambos'
export type Rareza = 'comun' | 'raro' | 'epico' | 'legendario'
export type TipoConsumible = 'recarga_vidas' | 'protector_racha' | 'pase_simulacro' | 'desbloqueo_sala'

export interface Item {
  id: string
  nombre: string
  descripcion: string
  categoria: 'consumible' | 'cosmetico'
  tipo: TipoConsumible | null
  slot: Slot | null
  para: Para | null
  precio: number | null // 0 = básico de todos · null = solo se gana con un logro
  soloPro: boolean
  logro: string | null
  rareza: Rareza
  orden: number
}

export const ITEMS = (tienda as Item[]).slice().sort((a, b) => a.orden - b.orden)
const POR_ID = new Map(ITEMS.map((i) => [i.id, i]))
export const item = (id: string) => POR_ID.get(id)

export const RAREZA: Record<Rareza, string> = { comun: 'Común', raro: 'Raro', epico: 'Épico', legendario: 'Legendario' }

export const SLOTS_AVATAR: Slot[] = ['cuerpo', 'cabeza', 'cara', 'cuello', 'mano', 'espalda', 'fondo']
export const SLOTS_UKU: Slot[] = ['cuerpo', 'cabeza', 'cara', 'cuello', 'mano', 'espalda']
export const NOMBRE_SLOT: Record<Slot, string> = {
  cabeza: 'Cabeza',
  cara: 'Cara',
  cuello: 'Cuello',
  cuerpo: 'Ropa',
  mano: 'Mano',
  espalda: 'Espalda',
  fondo: 'Fondo',
  insignia: 'Insignia',
}

export const sirvePara = (i: Item, quien: 'avatar' | 'uku') => i.para === 'ambos' || i.para === quien
export const esBasico = (i: Item) => i.precio === 0

/** Precio de un consumible por tipo (por si cambia en el catálogo). */
export const precioDe = (tipo: TipoConsumible) => ITEMS.find((i) => i.tipo === tipo)?.precio ?? 0
