import { useState } from 'react'
import { Escena, UkuDe } from '../components/Personaje'
import { COLORES_PELO, ETAPAS, PEINADOS, PIELES, tieneSprite, type Apariencia, type Equipo, type Etapa } from '../game/pixel'
import { useApp } from '../lib/app'
import { NOMBRE_SLOT, SLOTS_AVATAR, SLOTS_UKU, type Slot } from '../lib/catalogo'
import { armario, loTiene } from '../lib/economia'

/** Selector de piel, peinado y color de pelo (también lo usa el onboarding). */
export function EditorApariencia({ valor, onChange }: { valor: Apariencia; onChange: (a: Apariencia) => void }) {
  return (
    <div className="stack">
      <fieldset className="pick-group">
        <legend>Piel</legend>
        <div className="swatches">
          {PIELES.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`swatch ${valor.piel === p.id ? 'is-on' : ''}`}
              style={{ background: p.color }}
              aria-pressed={valor.piel === p.id}
              aria-label={`Piel ${p.nombre}`}
              onClick={() => onChange({ ...valor, piel: p.id })}
            />
          ))}
        </div>
      </fieldset>
      <fieldset className="pick-group">
        <legend>Peinado</legend>
        <div className="chips">
          {PEINADOS.map((p) => (
            <button key={p.id} type="button" className={`filter ${valor.peinado === p.id ? 'is-on' : ''}`} aria-pressed={valor.peinado === p.id} onClick={() => onChange({ ...valor, peinado: p.id })}>
              {p.nombre}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="pick-group">
        <legend>Color de pelo</legend>
        <div className="swatches">
          {COLORES_PELO.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`swatch ${valor.colorPelo === c.id ? 'is-on' : ''}`}
              style={{ background: c.color }}
              aria-pressed={valor.colorPelo === c.id}
              aria-label={`Pelo ${c.nombre}`}
              onClick={() => onChange({ ...valor, colorPelo: c.id })}
            />
          ))}
        </div>
      </fieldset>
    </div>
  )
}

function Armario({ quien, slots, equipo, onChange }: { quien: 'avatar' | 'uku'; slots: Slot[]; equipo: Equipo; onChange: (e: Equipo) => void }) {
  const { state, go } = useApp()
  const todos = armario(state, quien).filter((i) => tieneSprite(i.id, quien) && i.id !== 'anteojos_uku')
  const faltan = todos.filter((i) => i.slot && slots.includes(i.slot) && !loTiene(state, i)).length
  return (
    <div className="stack">
      {slots.map((slot) => {
        const deSlot = todos.filter((i) => i.slot === slot)
        const mios = deSlot.filter((i) => loTiene(state, i))
        const obligatorio = quien === 'avatar' && (slot === 'cuerpo' || slot === 'fondo')
        if (!mios.length && obligatorio) return null
        return (
          <fieldset key={slot} className="pick-group">
            <legend>{NOMBRE_SLOT[slot]}</legend>
            <div className="chips">
              {!obligatorio && (
                <button type="button" className={`filter ${!equipo[slot] ? 'is-on' : ''}`} aria-pressed={!equipo[slot]} onClick={() => onChange({ ...equipo, [slot]: undefined })}>
                  Nada
                </button>
              )}
              {mios.map((i) => (
                <button key={i.id} type="button" className={`filter ${equipo[slot] === i.id ? 'is-on' : ''}`} aria-pressed={equipo[slot] === i.id} onClick={() => onChange({ ...equipo, [slot]: i.id })}>
                  {i.nombre}
                </button>
              ))}
              {!mios.length && <span className="muted small">Aún no tienes. Míralos en la tienda.</span>}
            </div>
          </fieldset>
        )
      })}
      {faltan > 0 && (
        <button type="button" className="btn btn-secondary btn-block" onClick={() => go({ name: 'tienda' })}>
          Ver {faltan} accesorios en la tienda
        </button>
      )}
    </div>
  )
}

export function MiAvatar() {
  const { state, update, go, toast } = useApp()
  const [tab, setTab] = useState<'tu' | 'uku'>('tu')
  const [apariencia, setApariencia] = useState(state.apariencia)
  const [equipoAvatar, setEquipoAvatar] = useState(state.equipoAvatar)
  const [equipoUku, setEquipoUku] = useState(state.equipoUku)
  const [nombreUku, setNombreUku] = useState(state.ukuNombre)

  const guardar = () => {
    const nombre = nombreUku.trim().slice(0, 20) || 'Uku'
    update((s) => ({ ...s, apariencia, equipoAvatar, equipoUku, ukuNombre: nombre, avatarListo: true }))
    toast('Guardado')
    go({ name: 'perfil' })
  }

  return (
    <main className="screen mi-avatar">
      <button type="button" className="back" onClick={() => go({ name: 'perfil' })}>
        ← Perfil
      </button>
      <h1 className="title">Tu avatar</h1>
      <Escena apariencia={apariencia} equipoAvatar={equipoAvatar} etapa={state.ukuEtapa} equipoUku={equipoUku} alto={220} />

      <div className="filters">
        <button type="button" className={`filter ${tab === 'tu' ? 'is-on' : ''}`} aria-pressed={tab === 'tu'} onClick={() => setTab('tu')}>
          Tú
        </button>
        <button type="button" className={`filter ${tab === 'uku' ? 'is-on' : ''}`} aria-pressed={tab === 'uku'} onClick={() => setTab('uku')}>
          {nombreUku.trim() || 'Uku'}
        </button>
      </div>

      {tab === 'tu' ? (
        <>
          <EditorApariencia valor={apariencia} onChange={setApariencia} />
          <h2 className="subtitle">Tu ropa y accesorios</h2>
          <Armario quien="avatar" slots={SLOTS_AVATAR} equipo={equipoAvatar} onChange={setEquipoAvatar} />
        </>
      ) : (
        <>
          <label className="field">
            <span>Nombre de tu compañero</span>
            <input className="input px" value={nombreUku} maxLength={20} onChange={(e) => setNombreUku(e.target.value)} />
          </label>
          <section className="etapas px" aria-label="Evoluciones de Uku">
            {([1, 2, 3, 4] as Etapa[]).map((e) => {
              const tiene = e <= state.ukuEtapa
              return (
                <div key={e} className={`etapa ${tiene ? 'is-on' : ''} ${e === state.ukuEtapa ? 'is-now' : ''}`}>
                  <UkuDe etapa={e} equipo={{}} size={64} alt={tiene ? ETAPAS[e].nombre : `${ETAPAS[e].nombre} (aún no)`} />
                  <span className="small">{ETAPAS[e].nombre.replace('Uku ', '')}</span>
                </div>
              )
            })}
          </section>
          <p className="muted small">
            {state.ukuEtapa < 4 ? ETAPAS[(state.ukuEtapa + 1) as Etapa].como : 'Uku llegó a su última evolución.'} También evoluciona al ganar la medalla del edificio.
          </p>
          <h2 className="subtitle">Accesorios de {nombreUku.trim() || 'Uku'}</h2>
          <Armario quien="uku" slots={SLOTS_UKU} equipo={equipoUku} onChange={setEquipoUku} />
        </>
      )}

      <button type="button" className="btn btn-block" onClick={guardar}>
        Guardar
      </button>
    </main>
  )
}
