import { useMemo, type ReactNode } from 'react'
import { BOLT, FLAME, GEM, HEART, spriteToDataURL, type Sprite } from '../game/sprites'
import { MAX_LIVES, nextLifeIn, type GameState } from '../lib/store'

export function Px({ sprite, scale = 3, flip = false, alt = '', className }: { sprite: Sprite; scale?: number; flip?: boolean; alt?: string; className?: string }) {
  const src = useMemo(() => spriteToDataURL(sprite, scale, flip), [sprite, scale, flip])
  return (
    <img
      src={src}
      width={sprite[0].length * scale}
      height={sprite.length * scale}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      className={`px-img ${className ?? ''}`}
    />
  )
}

export function Hud({ state, onLives }: { state: GameState; onLives?: () => void }) {
  const unlimited = state.pro
  const mins = Math.ceil(nextLifeIn(state) / 60000)
  return (
    <header className="hud">
      <span className="brand">Rcerito</span>
      <div className="hud-stats">
        <button
          type="button"
          className="hud-chip"
          onClick={onLives}
          aria-label={unlimited ? 'Vidas ilimitadas' : `${state.lives} de ${MAX_LIVES} vidas${state.lives < MAX_LIVES ? `, la próxima en ${mins} minutos` : ''}`}
        >
          <Px sprite={HEART} scale={3} />
          <span>{unlimited ? '∞' : state.lives}</span>
        </button>
        <span className="hud-chip" aria-label={`${state.gems} gemas`}>
          <Px sprite={GEM} scale={3} />
          <span>{state.gems}</span>
        </span>
        <span className="hud-chip" aria-label={`Racha de ${state.streak} días`}>
          <Px sprite={FLAME} scale={3} />
          <span>{state.streak}</span>
        </span>
        <span className="hud-chip" aria-label={`${state.xp} puntos de experiencia`}>
          <Px sprite={BOLT} scale={3} />
          <span>{state.xp}</span>
        </span>
      </div>
    </header>
  )
}

export type Tab = 'campus' | 'plaza' | 'simulacro' | 'perfil'

const TAB_ICONS: Record<Tab, Sprite> = {
  campus: ['....kk....', '...kyyk...', '..kyyyyk..', '.kkkkkkkk.', '.kwwwwwwk.', '.kwkkwwwk.', '.kwkkwkkk.', '.kwwwwkkk.', '.kkkkkkkk.'],
  plaza: ['...kkkk...', '..kaaaak..', '..kawaak..', '...kaak...', '....kk....', '.kkkkkkkk.', 'kaaaaaaaak', 'kaawaaaaak', '.kkkkkkkk.'],
  simulacro: ['...kkkk...', '.kkkyykkk.', '.kwwwwwwk.', '.kwkkwwwk.', '.kwwwwwwk.', '.kwkkkkwk.', '.kwwwwwwk.', '.kwkkkwwk.', '.kkkkkkkk.'],
  perfil: ['...kkkk...', '..kbbbbk..', '..kcbbck..', '..kbbbbk..', '...kkkk...', '.kkwwwwkk.', 'kwwwttwwwk', 'kwwwwwwwwk', 'kkkkkkkkkk'],
}

export function NavBar({ active, onGo }: { active: Tab; onGo: (t: Tab) => void }) {
  const items: [Tab, string][] = [
    ['campus', 'Campus'],
    ['plaza', 'Plaza'],
    ['simulacro', 'Simulacro'],
    ['perfil', 'Perfil'],
  ]
  return (
    <nav className="navbar" aria-label="Secciones">
      {items.map(([id, label]) => (
        <button key={id} type="button" className={`nav-item ${active === id ? 'is-active' : ''}`} onClick={() => onGo(id)} aria-current={active === id ? 'page' : undefined}>
          <Px sprite={TAB_ICONS[id]} scale={3} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}

export function UkuSays({ sprite, children, tone = 'neutral' }: { sprite: Sprite; children: ReactNode; tone?: 'neutral' | 'ok' | 'bad' }) {
  return (
    <div className={`uku-says tone-${tone}`}>
      <div className="uku-portrait px">
        <Px sprite={sprite} scale={4} alt="Uku" />
      </div>
      <div className="uku-text">{children}</div>
    </div>
  )
}

export function Sheet({ children, onClose, label }: { children: ReactNode; onClose: () => void; label: string }) {
  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <div className="sheet px" role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
