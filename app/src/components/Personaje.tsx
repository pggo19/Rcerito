import { capasAvatar, capasUku, fondoUrl, type Animo, type Apariencia, type Equipo, type Etapa } from '../game/pixel'
import { useApp } from '../lib/app'

/** Apila capas de pixel art (32×32) a cualquier tamaño, sin suavizar. */
export function Capas({ capas, size, alt, className }: { capas: string[]; size: number; alt?: string; className?: string }) {
  return (
    <span className={`capas ${className ?? ''}`} style={{ width: size, height: size }} role={alt ? 'img' : undefined} aria-label={alt} aria-hidden={alt ? undefined : true}>
      {capas.map((src, i) => (
        <img key={`${i}-${src}`} src={src} alt="" draggable={false} />
      ))}
    </span>
  )
}

export function AvatarDe({ apariencia, equipo, size = 128, alt }: { apariencia: Apariencia; equipo: Equipo; size?: number; alt?: string }) {
  return <Capas capas={capasAvatar(apariencia, equipo)} size={size} alt={alt} />
}

export function UkuDe({ etapa, equipo, animo = 'normal', size = 128, alt }: { etapa: Etapa; equipo: Equipo; animo?: Animo; size?: number; alt?: string }) {
  return <Capas capas={capasUku(etapa, equipo, animo)} size={size} alt={alt} />
}

/** El Uku del jugador, con su etapa y lo que tiene puesto. */
export function MiUku({ animo = 'normal', size = 128, alt }: { animo?: Animo; size?: number; alt?: string }) {
  const { state } = useApp()
  return <UkuDe etapa={state.ukuEtapa} equipo={state.equipoUku} animo={animo} size={size} alt={alt ?? state.ukuNombre} />
}

/** Avatar y Uku juntos sobre el fondo elegido. */
export function Escena({
  apariencia,
  equipoAvatar,
  etapa,
  equipoUku,
  animo = 'normal',
  alto = 200,
  className,
}: {
  apariencia: Apariencia
  equipoAvatar: Equipo
  etapa: Etapa
  equipoUku: Equipo
  animo?: Animo
  alto?: number
  className?: string
}) {
  const fondo = fondoUrl(equipoAvatar.fondo)
  return (
    <div className={`escena px ${className ?? ''}`} style={{ height: alto, backgroundImage: `url(${fondo})` }}>
      <AvatarDe apariencia={apariencia} equipo={equipoAvatar} size={Math.round(alto * 0.8)} alt="Tu avatar" />
      <UkuDe etapa={etapa} equipo={equipoUku} animo={animo} size={Math.round(alto * 0.56)} alt="Uku, tu compañero" />
    </div>
  )
}

export function MiEscena({ alto, animo }: { alto?: number; animo?: Animo }) {
  const { state } = useApp()
  return <Escena apariencia={state.apariencia} equipoAvatar={state.equipoAvatar} etapa={state.ukuEtapa} equipoUku={state.equipoUku} animo={animo} alto={alto} />
}
