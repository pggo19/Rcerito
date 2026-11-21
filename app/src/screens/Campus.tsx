import { useCallback, useState } from 'react'
import { CampusCanvas, MAP_H, MAP_W, PLACES, type Place } from '../game/CampusCanvas'
import { Px } from '../components/ui'
import { LOCK, MEDAL } from '../game/sprites'
import { examProgress, useApp, verPromo } from '../lib/app'
import { PromoR0Banner } from '../components/PromoR0'
import { FREE_PRACTICE_LESSONS } from '../lib/store'
import { examInfo, type ExamCode } from '../lib/types'

let lastPlace: Place = 'PLAZA'

export function Campus() {
  const { state, lessons, go, promo } = useApp()
  const [request, setRequest] = useState<{ place: Place; n: number } | null>(null)
  // los tres edificios están abiertos; lo Pro se decide por lección
  const locked: Place[] = []

  const onArrive = useCallback(
    (place: Place) => {
      if (place === 'PLAZA') {
        lastPlace = 'PLAZA'
        go({ name: 'plaza' })
        return
      }
      lastPlace = place
      go({ name: 'building', exam: place })
    },
    [go],
  )

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
        <CampusCanvas locked={locked} onArrive={onArrive} start={lastPlace} request={request} />
        {(Object.keys(PLACES) as Place[]).map((p) => {
          const [x, y, w] = PLACES[p].box
          const isExam = p !== 'PLAZA'
          const lockedHere = isExam && locked.includes(p)
          const medal = isExam && state.medals.includes(p as ExamCode)
          return (
            <button
              key={p}
              type="button"
              className="map-label"
              style={{ left: `${((x + w / 2) / MAP_W) * 100}%`, top: `${((p === 'PLAZA' ? y + 2 : y - 2) / MAP_H) * 100}%` }}
              onClick={() => setRequest({ place: p, n: Date.now() })}
            >
              {lockedHere && <Px sprite={LOCK} scale={2} />}
              {medal && <Px sprite={MEDAL} scale={2} />}
              <span>{PLACES[p].label}</span>
            </button>
          )
        })}
      </div>

      {next ? (
        <section className="next-card px">
          <div>
            <p className="next-kicker">{examInfo(target).building}</p>
            <p className="next-title">{next.area}</p>
            <p className="muted small">
              {examProgress(state, list).done} de {list.length} lecciones completas
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

      {verPromo(state, promo) && <PromoR0Banner />}

      {state.practiceLeft > 0 && !state.pro && (
        <p className="practice-note">
          Tus primeras {FREE_PRACTICE_LESSONS} lecciones no gastan vidas. Te {state.practiceLeft === 1 ? 'queda' : 'quedan'} {state.practiceLeft}.
        </p>
      )}
    </main>
  )
}
