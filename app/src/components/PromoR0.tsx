import { useApp } from '../lib/app'

/** Banner comercial de R0 Plus: lo configura app_config 'r0plus' en Supabase. */
export function PromoR0Banner() {
  const { promo } = useApp()
  if (!promo?.url) return null
  return (
    <a className="promo-r0 px" href={promo.url} target="_blank" rel="noopener noreferrer">
      <span className="next-title">{promo.titulo}</span>
      <span className="small">{promo.texto}</span>
      <span className="promo-r0-cta">{promo.boton} →</span>
    </a>
  )
}
