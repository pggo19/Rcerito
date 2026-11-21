import { useState } from 'react'
import { Px, Sheet } from '../components/ui'
import { LOCK, MEDAL } from '../game/sprites'
import { examProgress, useApp } from '../lib/app'
import { precioDe } from '../lib/catalogo'
import { LECCIONES_GRATIS_POR_SALA, medallaGanada, puedeEntrar } from '../lib/economia'
import { examInfo, type ExamCode, type Lesson } from '../lib/types'

interface Sala {
  area: string
  lecciones: Lesson[]
  bloqueadas: number // lecciones que existen en la nube pero no se descargan sin Pro
}

export function Building({ exam }: { exam: ExamCode }) {
  const { state, lessons, go, resumen } = useApp()
  const [pro, setPro] = useState<string | null>(null)
  const info = examInfo(exam)
  const list = lessons[exam]
  const prog = examProgress(state, list)
  const medal = state.medals.includes(exam) || medallaGanada(state, list)

  const salas: Sala[] = []
  for (const l of list) {
    let s = salas.find((x) => x.area === l.area)
    if (!s) {
      s = { area: l.area, lecciones: [], bloqueadas: 0 }
      salas.push(s)
    }
    s.lecciones.push(l)
  }
  for (const s of salas) {
    const nube = resumen[`${exam}:${s.area}`]
    s.bloqueadas = nube && !state.pro ? Math.max(0, nube.lecciones - s.lecciones.length) : 0
  }

  return (
    <main className="screen building">
      <button type="button" className="back" onClick={() => go({ name: 'campus' })}>
        ← Campus
      </button>
      <header className={`building-head bh-${exam.toLowerCase()} px`}>
        <h1 className="title">{info.building}</h1>
        <p className="building-exam">{info.name}</p>
        <p className="building-blurb">{info.blurb}</p>
        <div className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={prog.total} aria-valuenow={prog.done} aria-label="Lecciones completas">
          {list.map((l) => (
            <span key={l.id} className={state.done[l.id] ? 'on' : ''} />
          ))}
        </div>
        <p className="small">
          {prog.done} de {prog.total} lecciones completas. {medal ? 'Medalla ganada.' : 'La medalla pide 80 % en cada lección.'}
        </p>
      </header>

      {!state.pro && <p className="practice-note">Las primeras {LECCIONES_GRATIS_POR_SALA} lecciones de cada sala son gratis.</p>}

      {salas.map((s) => (
        <section key={s.area} className="sala">
          <h2 className="sala-name">{s.area}</h2>
          <ol className="corridor">
            {s.lecciones.map((l) => {
              const open = puedeEntrar(state, l)
              const d = state.done[l.id]
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    className={`room px ${d ? 'is-done' : ''}`}
                    onClick={() => (open ? go({ name: 'lesson', lessonId: l.id }) : setPro(s.area))}
                  >
                    <span className="room-door" aria-hidden="true">
                      {open ? l.index + 1 : <Px sprite={LOCK} scale={2} />}
                    </span>
                    <span className="room-body">
                      <span className="room-name">Lección {l.index + 1}</span>
                      <span className="room-meta">
                        {d ? `Mejor puntaje: ${d.best} de ${d.total}` : `${l.questions.length} ${l.questions.length === 1 ? 'pregunta' : 'preguntas'}`}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
            {Array.from({ length: s.bloqueadas }, (_, k) => s.lecciones.length + k).map((n) => (
              <li key={`b${n}`}>
                <button type="button" className="room px is-locked" onClick={() => setPro(s.area)}>
                  <span className="room-door" aria-hidden="true">
                    <Px sprite={LOCK} scale={2} />
                  </span>
                  <span className="room-body">
                    <span className="room-name">Lección {n + 1}</span>
                    <span className="room-meta">Con Pro</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      ))}

      <section className="boss px">
        <div className="boss-medal">
          <Px sprite={MEDAL} scale={4} />
        </div>
        <div>
          <p className="next-title">Simulacro de {info.name}</p>
          <p className="muted small">Con tiempo y sin pistas, como el día del examen.</p>
        </div>
        <button type="button" className="btn btn-gold" onClick={() => go({ name: 'simulacro', exam })}>
          Rendir
        </button>
      </section>

      {pro && (
        <Sheet label="Lección Pro" onClose={() => setPro(null)}>
          <h2 className="sheet-title">Sigue con {pro}</h2>
          <p className="muted">Las primeras {LECCIONES_GRATIS_POR_SALA} lecciones de cada sala son gratis. Con Pro tienes todas, además de vidas ilimitadas y simulacros oficiales.</p>
          <div className="stack">
            <button type="button" className="btn btn-gold btn-block" onClick={() => go({ name: 'pro' })}>
              Ver Rcerito Pro
            </button>
            <button type="button" className="btn btn-secondary btn-block" disabled>
              Abrir la sala 24 h por {precioDe('desbloqueo_sala')} gemas (pronto, con tu cuenta)
            </button>
            <button type="button" className="btn btn-ghost btn-block" onClick={() => setPro(null)}>
              Ahora no
            </button>
          </div>
        </Sheet>
      )}
    </main>
  )
}
