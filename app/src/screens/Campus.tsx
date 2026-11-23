import { useCallback, useState } from 'react'
import { CampusCanvas, MAP_H, MAP_W, PLACES, type Place } from '../game/CampusCanvas'
import { Px } from '../components/ui'
import { AMENAZA_VIRUS, LOCK, MEDAL } from '../game/sprites'
import { alarma, ataquePendiente, edificioAtacado, incidenteDe } from '../lib/eventos'
import { examProgress, isUnlocked, useApp } from '../lib/app'
import { FREE_PRACTICE_LESSONS } from '../lib/store'
import { EXAMS, edificio, examInfo, type ExamCode } from '../lib/types'

let lastPlace: Place = 'PLAZA'

export function Campus() {
  const { state, lessons, go, toast } = useApp()
  const [request, setRequest] = useState<{ place: Place; n: number } | null>(null)
  const locked = EXAMS.filter((e) => !isUnlocked(state, e.code)).map((e) => e.code as Place)

  const onArrive = useCallback(
    (place: Place) => {
      if (place === 'PLAZA') {
        lastPlace = 'PLAZA'
        go({ name: 'plaza' })
        return
      }
      if (!isUnlocked(state, place)) {
        toast(`Gana la medalla de ${examInfo(state.target!).building} para abrir este edificio`)
        return
      }
      lastPlace = place
      go({ name: 'building', exam: place })
    },
    [go, state, toast],
  )

  const atacado = edificioAtacado(state)
  const bajoAtaque = atacado && ataquePendiente(state, atacado) ? atacado : null
  const conIncidente = EXAMS.map((e) => ({ exam: e.code, inc: incidenteDe(state, e.code) })).filter((x) => x.inc)

  const target = state.target ?? 'ENAM'
  const list = lessons[target]
  const next = list.find((l) => !state.done[l.id])

  return (
    <main className="screen campus">
      <div className="campus-greet">
        <h1 className="title">Hola, {state.name || 'doc'}</h1>
        <p className="muted">Toca un edificio y Uku camina hasta allá.</p>
      </div>

      <div className="campus-map px">
        <CampusCanvas locked={locked} damaged={conIncidente.filter((x) => x.inc!.ruinas).map((x) => x.exam as Place)} onArrive={onArrive} start={lastPlace} request={request} />
        {(Object.keys(PLACES) as Place[]).map((p) => {
          const [x, y, w] = PLACES[p].box
          const isExam = p !== 'PLAZA'
          const lockedHere = isExam && locked.includes(p)
          const medal = isExam && state.medals.includes(p as ExamCode)
          const alerta = isExam && bajoAtaque === p
          const incAqui = isExam ? incidenteDe(state, p as ExamCode) : null
          const roto = Boolean(incAqui)
          return (
            <button
              key={p}
              type="button"
              className={`map-label ${alerta ? 'is-alert' : ''} ${roto ? 'is-broken' : ''}`}
              style={{ left: `${((x + w / 2) / MAP_W) * 100}%`, top: `${((p === 'PLAZA' ? y + 2 : y - 2) / MAP_H) * 100}%` }}
              onClick={() => setRequest({ place: p, n: Date.now() })}
            >
              {lockedHere && <Px sprite={LOCK} scale={2} />}
              {medal && <Px sprite={MEDAL} scale={2} />}
              {alerta && <span className="map-alert" aria-label="bajo ataque">!</span>}
              {incAqui && !alerta && <Px sprite={incAqui.sprite} scale={2} alt={incAqui.corto} />}
              <span>{PLACES[p].label}</span>
            </button>
          )
        })}
      </div>

      {bajoAtaque && (
        <button type="button" className="alarma px" onClick={() => go({ name: 'encuentro', exam: bajoAtaque, modo: 'ataque' })}>
          <span className="alarma-icon">
            <Px sprite={AMENAZA_VIRUS} scale={3} />
          </span>
          <span>
            <span className="next-title">{alarma(bajoAtaque).titulo}</span>
            <span className="small">{alarma(bajoAtaque).detalle} Si huyes pierdes 1 gema.</span>
          </span>
        </button>
      )}
      {conIncidente.map(({ exam, inc }) => (
        <button key={exam} type="button" className="alarma is-damage px" onClick={() => go({ name: 'encuentro', exam, modo: 'reparar' })}>
          <span className="alarma-icon">
            <Px sprite={inc!.sprite} scale={4} />
          </span>
          <span>
            <span className="next-title">{inc!.titulo}</span>
            <span className="small">«{inc!.remedio}» para volver a ganar gemas completas {edificio(exam, 'en')}.</span>
          </span>
        </button>
      ))}

      {next ? (
        <section className="next-card px">
          <div>
            <p className="next-kicker">{examInfo(target).building}</p>
            <p className="next-title">{next.area}</p>
            <p className="muted small">
              {examProgress(state, list).done} de {list.length} salas completas
            </p>
          </div>
          <button type="button" className="btn" onClick={() => go({ name: 'lesson', lessonId: next.id })}>
            Seguir
          </button>
        </section>
      ) : (
        <section className="next-card px">
          <p className="next-title">Terminaste todas las salas de {examInfo(target).building}</p>
          <button type="button" className="btn btn-gold" onClick={() => go({ name: 'simulacro', exam: target })}>
            Simulacro
          </button>
        </section>
      )}

      {state.practiceLeft > 0 && !state.pro && (
        <p className="practice-note">
          Tus primeras {FREE_PRACTICE_LESSONS} lecciones no gastan vidas. Te {state.practiceLeft === 1 ? 'queda' : 'quedan'} {state.practiceLeft}.
        </p>
      )}
    </main>
  )
}
