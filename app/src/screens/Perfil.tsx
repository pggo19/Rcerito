import { useState } from 'react'
import { Px, Sheet } from '../components/ui'
import { MEDAL, UKU } from '../game/sprites'
import { useApp } from '../lib/app'
import { CATALOGO, insignia } from '../lib/eventos'
import { EXAMS, examInfo } from '../lib/types'

export function Perfil() {
  const { state, reset, go, source, questions } = useApp()
  const [confirm, setConfirm] = useState(false)
  const totalOk = Object.values(state.stats).reduce((a, s) => a + s.ok, 0)
  const total = Object.values(state.stats).reduce((a, s) => a + s.total, 0)

  return (
    <main className="screen perfil">
      <h1 className="title">Perfil</h1>
      <section className="carnet px" aria-label="Carnet de estudiante">
        <div className="carnet-band">
          <span>Campus Rcerito</span>
          <span>Carnet de estudio</span>
        </div>
        <div className="carnet-body">
          <div className="carnet-photo px">
            <Px sprite={UKU} scale={4} alt="Foto de Uku" />
          </div>
          <div className="carnet-data">
            <p className="carnet-name">{state.name || 'Sin nombre'}</p>
            <p className="carnet-line">Rumbo a {state.target ? examInfo(state.target).name : '—'}</p>
            <p className="carnet-line">{state.pro ? 'Plan Pro' : 'Plan gratis'}</p>
          </div>
        </div>
        <dl className="carnet-stats">
          <div>
            <dt>Racha</dt>
            <dd>{state.streak} d</dd>
          </div>
          <div>
            <dt>Experiencia</dt>
            <dd>{state.xp}</dd>
          </div>
          <div>
            <dt>Precisión</dt>
            <dd>{total ? Math.round((totalOk / total) * 100) : 0} %</dd>
          </div>
        </dl>
      </section>

      <h2 className="subtitle">Medallas</h2>
      <ul className="medals">
        {EXAMS.map((e) => {
          const has = state.medals.includes(e.code)
          return (
            <li key={e.code} className={`medal px ${has ? 'is-on' : ''}`}>
              <Px sprite={MEDAL} scale={4} />
              <span>{e.building}</span>
            </li>
          )
        })}
      </ul>

      <h2 className="subtitle">Insignias</h2>
      <p className="muted small">Las rojas se ganan perdiendo o huyendo. La de techo caído se borra al defender ese edificio.</p>
      <ul className="badges">
        {CATALOGO.map((id) => {
          const b = insignia(id)
          const got = state.badges[id]
          return (
            <li key={id} className={`badge px ${got ? 'is-on' : ''} ${b.mala ? 'is-bad' : ''}`} title={b.detalle}>
              <Px sprite={b.sprite} scale={4} />
              <span className="badge-name">{b.nombre}</span>
              {got ? got.n > 1 && <span className="badge-n">×{got.n}</span> : <span className="badge-n">—</span>}
            </li>
          )
        })}
      </ul>

      <h2 className="subtitle">Precisión por examen</h2>
      <table className="area-table">
        <tbody>
          {EXAMS.map((e) => {
            const s = state.stats[e.code]
            const pct = s.total ? Math.round((s.ok / s.total) * 100) : 0
            return (
              <tr key={e.code}>
                <td>{e.name}</td>
                <td>
                  <span className="bar" style={{ ['--w' as string]: `${pct}%` }} />
                  {s.total ? `${pct} % de ${s.total}` : 'sin datos'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {!state.pro && (
        <button type="button" className="pro-banner px" onClick={() => go({ name: 'pro' })}>
          <span className="next-title">Rcerito Pro</span>
          <span className="small">Vidas ilimitadas, simulacros sin tope y diagnóstico por área.</span>
        </button>
      )}

      <p className="muted small">
        Banco: {questions.length} preguntas ({source === 'nube' ? 'sincronizado con la nube' : 'copia incluida en la app'}). Reportes enviados: {state.reports.length}.
      </p>
      <button type="button" className="btn btn-ghost" onClick={() => setConfirm(true)}>
        Borrar mi progreso
      </button>

      {confirm && (
        <Sheet label="Borrar progreso" onClose={() => setConfirm(false)}>
          <h2 className="sheet-title">¿Borrar todo tu progreso?</h2>
          <p className="muted">Se borran salas, medallas, racha y estadísticas de este teléfono.</p>
          <div className="stack">
            <button type="button" className="btn btn-secondary btn-block" onClick={() => setConfirm(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-danger btn-block"
              onClick={() => {
                reset()
                go({ name: 'onboarding' })
              }}
            >
              Borrar progreso
            </button>
          </div>
        </Sheet>
      )}
    </main>
  )
}

const PLANS = [
  { id: 'mensual', label: '1 mes', price: 'S/ 19.90', per: 'S/ 19.90 al mes' },
  { id: 'semestral', label: '6 meses', price: 'S/ 79.90', per: 'S/ 13.32 al mes' },
  { id: 'anual', label: '12 meses', price: 'S/ 119.90', per: 'S/ 9.99 al mes' },
]

export function Pro() {
  const { state, update, go, toast } = useApp()
  const [plan, setPlan] = useState('anual')
  return (
    <main className="screen pro">
      <button type="button" className="back" onClick={() => go({ name: 'perfil' })}>
        ← Perfil
      </button>
      <h1 className="title">Rcerito Pro</h1>
      <ul className="pro-list">
        <li>Vidas ilimitadas en todas las salas</li>
        <li>Simulacros sin tope para los tres exámenes</li>
        <li>Todos los edificios abiertos desde el primer día</li>
        <li>Diagnóstico por área y repaso de errores sin límite</li>
        <li>Reparaciones de edificios y Descarte en batalla gratis</li>
      </ul>
      <div className="stack" role="radiogroup" aria-label="Plan">
        {PLANS.map((p) => (
          <button key={p.id} type="button" role="radio" aria-checked={plan === p.id} className={`plan px ${plan === p.id ? 'is-on' : ''}`} onClick={() => setPlan(p.id)}>
            <span className="plan-label">{p.label}</span>
            <span className="plan-per">{p.per}</span>
            <span className="plan-price">{p.price}</span>
          </button>
        ))}
      </div>
      <button type="button" className="btn btn-gold btn-block" onClick={() => toast('Los pagos se activan cuando la app esté publicada en Play Store')}>
        Suscribirme
      </button>
      <p className="muted small">Se cobrará a tu cuenta de Google Play y podrás cancelar cuando quieras desde Play Store.</p>
      <label className="dev-toggle">
        <input type="checkbox" checked={state.pro} onChange={(e) => update((s) => ({ ...s, pro: e.target.checked }))} />
        Modo prueba: activar Pro en este teléfono (solo para desarrollo)
      </label>
    </main>
  )
}
