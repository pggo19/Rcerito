import { useState } from 'react'
import { AvatarDe, UkuDe } from '../components/Personaje'
import { Px, Sheet } from '../components/ui'
import { fondoUrl, tieneSprite } from '../game/pixel'
import { GEM } from '../game/sprites'
import { useApp } from '../lib/app'
import { ITEMS, RAREZA, type Item } from '../lib/catalogo'
import { comprar, loTiene, MAX_PASES, MAX_PROTECTORES, MENSAJE_ERROR, PREMIO, TOPE_GEMAS_DIARIO } from '../lib/economia'
import { MAX_LIVES } from '../lib/store'
import { examInfo, type ExamCode } from '../lib/types'

type Tab = 'ayudas' | 'avatar' | 'uku' | 'fondos'

function textoLogro(logro: string) {
  const [tipo, valor] = logro.split(':')
  if (tipo === 'aprobado') return `Se gana al aprobar un simulacro oficial de ${examInfo(valor as ExamCode).name}.`
  if (tipo === 'medalla') return `Se gana con la medalla de ${examInfo(valor as ExamCode).building}.`
  if (tipo === 'racha') return `Se gana con una racha de ${valor} días.`
  return 'Se gana con un logro.'
}

function Precio({ n }: { n: number }) {
  return (
    <span className="precio">
      <Px sprite={GEM} scale={2} />
      {n}
    </span>
  )
}

export function Tienda() {
  const { state, update, go, toast } = useApp()
  const [tab, setTab] = useState<Tab>('ayudas')
  const [abierto, setAbierto] = useState<Item | null>(null)

  const intentar = (it: Item) => {
    const r = comprar(state, it.id)
    if (typeof r === 'string') {
      toast(MENSAJE_ERROR[r])
      return false
    }
    update((s) => {
      const r2 = comprar(s, it.id)
      return typeof r2 === 'string' ? s : r2
    })
    return true
  }

  const ponerse = (it: Item, quien: 'avatar' | 'uku') => {
    if (!it.slot) return
    update((s) =>
      quien === 'avatar'
        ? { ...s, equipoAvatar: { ...s.equipoAvatar, [it.slot as string]: it.id } }
        : { ...s, equipoUku: { ...s.equipoUku, [it.slot as string]: it.id } },
    )
    toast(quien === 'avatar' ? '¡Te queda bien!' : `A ${state.ukuNombre} le encanta`)
  }

  const quien = tab === 'uku' ? 'uku' : 'avatar'
  const cosmeticos = ITEMS.filter((i) => {
    if (i.categoria !== 'cosmetico' || i.precio === 0) return false
    if (tab === 'fondos') return i.slot === 'fondo'
    if (tab === 'avatar') return i.slot !== 'fondo' && i.slot !== 'insignia' && tieneSprite(i.id, 'avatar')
    if (tab === 'uku') return i.slot !== 'fondo' && i.slot !== 'insignia' && tieneSprite(i.id, 'uku')
    return false
  })

  const vistaPrevia = (it: Item, size: number) => {
    if (it.slot === 'fondo') return <img className="fondo-mini" src={fondoUrl(it.id)} alt="" style={{ width: size * 1.6, height: size }} />
    return quien === 'uku' ? (
      <UkuDe etapa={state.ukuEtapa} equipo={{ ...state.equipoUku, [it.slot as string]: it.id }} size={size} />
    ) : (
      <AvatarDe apariencia={state.apariencia} equipo={{ ...state.equipoAvatar, [it.slot as string]: it.id }} size={size} />
    )
  }

  return (
    <main className="screen tienda">
      <button type="button" className="back" onClick={() => go({ name: 'plaza' })}>
        ← Plaza
      </button>
      <div className="row-between">
        <h1 className="title">Tienda del Campus</h1>
        <span className="saldo px" aria-label={`Tienes ${state.gems} gemas`}>
          <Px sprite={GEM} scale={3} />
          {state.gems}
        </span>
      </div>

      <div className="filters">
        {(
          [
            ['ayudas', 'Ayudas'],
            ['avatar', 'Para ti'],
            ['uku', `Para ${state.ukuNombre}`],
            ['fondos', 'Fondos'],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button key={id} type="button" className={`filter ${tab === id ? 'is-on' : ''}`} aria-pressed={tab === id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'ayudas' ? (
        <div className="stack">
          {ITEMS.filter((i) => i.categoria === 'consumible').map((it) => {
            const extra =
              it.tipo === 'protector_racha'
                ? `Tienes ${state.protectores} de ${MAX_PROTECTORES}.`
                : it.tipo === 'pase_simulacro'
                  ? `Tienes ${state.pases} de ${MAX_PASES}.`
                  : it.tipo === 'recarga_vidas'
                    ? state.pro
                      ? 'Con Pro tus vidas son ilimitadas.'
                      : `Tienes ${state.lives} de ${MAX_LIVES} vidas.`
                    : 'Disponible cuando inicies sesión con tu cuenta.'
            const bloqueado = it.tipo === 'desbloqueo_sala'
            return (
              <div key={it.id} className="ayuda px">
                <div className="ayuda-text">
                  <p className="next-title">{it.nombre}</p>
                  <p className="muted small">{it.descripcion}</p>
                  <p className="small">{extra}</p>
                </div>
                <button type="button" className="btn btn-small" disabled={bloqueado} onClick={() => intentar(it) && toast(`Compraste: ${it.nombre}`)}>
                  <Precio n={it.precio ?? 0} />
                </button>
              </div>
            )
          })}
          <section className="ganar px">
            <p className="next-title">Cómo ganar gemas</p>
            <p className="small">
              Lección +{PREMIO.leccion} · perfecta +{PREMIO.leccion_perfecta} extra · racha de 3, 7, 14 y 30 días +{PREMIO.racha_3} a +{PREMIO.racha_30} · subir de nivel +{PREMIO.subir_nivel} · medalla de
              edificio +{PREMIO.medalla}. Hasta {TOPE_GEMAS_DIARIO} gemas por día.
            </p>
          </section>
        </div>
      ) : (
        <ul className="vitrina">
          {cosmeticos.map((it) => {
            const tiene = loTiene(state, it)
            return (
              <li key={it.id}>
                <button type="button" className={`producto px rareza-${it.rareza}`} onClick={() => setAbierto(it)}>
                  {vistaPrevia(it, 72)}
                  <span className="producto-nombre">{it.nombre}</span>
                  <span className="producto-meta">
                    {tiene ? 'Lo tienes' : it.precio === null ? 'Logro' : <Precio n={it.precio} />}
                    {it.soloPro && <span className="tag-pro">Pro</span>}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {abierto && (
        <Sheet label={abierto.nombre} onClose={() => setAbierto(null)}>
          <div className="producto-detalle">
            {vistaPrevia(abierto, 144)}
            <h2 className="sheet-title">{abierto.nombre}</h2>
            <p className="small">
              <span className={`tag-rareza rareza-${abierto.rareza}`}>{RAREZA[abierto.rareza]}</span>
              {abierto.soloPro && <span className="tag-pro">Solo Pro</span>}
            </p>
            <p className="muted">{abierto.descripcion}</p>
            {abierto.logro && !loTiene(state, abierto) && <p className="small">{textoLogro(abierto.logro)}</p>}
          </div>
          <div className="stack">
            {loTiene(state, abierto) ? (
              <button
                type="button"
                className="btn btn-block"
                onClick={() => {
                  ponerse(abierto, quien)
                  setAbierto(null)
                }}
              >
                {quien === 'uku' ? `Ponérselo a ${state.ukuNombre}` : 'Ponérmelo'}
              </button>
            ) : abierto.precio !== null ? (
              abierto.soloPro && !state.pro ? (
                <button type="button" className="btn btn-gold btn-block" onClick={() => go({ name: 'pro' })}>
                  Exclusivo de Pro
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-block"
                  disabled={state.gems < abierto.precio}
                  onClick={() => {
                    if (intentar(abierto)) {
                      ponerse(abierto, quien)
                      setAbierto(null)
                    }
                  }}
                >
                  {state.gems < abierto.precio ? `Te faltan ${abierto.precio - state.gems} gemas` : `Comprar por ${abierto.precio} gemas`}
                </button>
              )
            ) : null}
            <button type="button" className="btn btn-secondary btn-block" onClick={() => setAbierto(null)}>
              Seguir mirando
            </button>
          </div>
        </Sheet>
      )}
    </main>
  )
}
