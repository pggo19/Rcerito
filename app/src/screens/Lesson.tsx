import { useMemo, useRef, useState } from 'react'
import { QuestionView } from '../components/QuestionView'
import { Px, Sheet, UkuSays } from '../components/ui'
import { HEART, UKU, UKU_HAPPY, UKU_SAD } from '../game/sprites'
import { MiUku } from '../components/Personaje'
import { ETAPAS } from '../game/pixel'
import { useApp } from '../lib/app'
import { precioDe } from '../lib/catalogo'
import { comprar, completarLeccion, MENSAJE_ERROR, type ResumenLeccion } from '../lib/economia'
import { MAX_LIVES, nextLifeIn } from '../lib/store'
import { recordAnswer, sendReport } from '../lib/sync'
import { examInfo } from '../lib/types'

export function LessonScreen({ lessonId }: { lessonId: string }) {
  const app = useApp()
  const { state, update, lessons, go } = app
  const lesson = useMemo(() => Object.values(lessons).flat().find((l) => l.id === lessonId), [lessons, lessonId])
  // la práctica gratis se decide al entrar, no a mitad de la lección
  const practice = useRef(!state.pro && state.practiceLeft > 0).current
  const [i, setI] = useState(0)
  const [ok, setOk] = useState(0)
  const [finished, setFinished] = useState(false)
  const [noLives, setNoLives] = useState(false)
  const [confirmExit, setConfirmExit] = useState(false)
  const [premio, setPremio] = useState<ResumenLeccion | null>(null)
  const refillCost = precioDe('recarga_vidas')

  if (!lesson) return <main className="screen"><p>No encontramos esta sala.</p></main>
  const total = lesson.questions.length
  const q = lesson.questions[i]
  const unlimited = state.pro || practice

  const onAnswer = (correct: boolean, chosen: string) => {
    if (correct) setOk((n) => n + 1)
    recordAnswer(q.id, chosen, correct, 'leccion')
    update((s) => {
      const st = s.stats[q.examen]
      const wrong = correct ? s.wrong.filter((id) => id !== q.id) : Array.from(new Set([...s.wrong, q.id]))
      const lives = !correct && !unlimited ? Math.max(0, s.lives - 1) : s.lives
      return {
        ...s,
        lives,
        livesAt: s.lives === MAX_LIVES && lives < MAX_LIVES ? Date.now() : s.livesAt,
        wrong,
        stats: { ...s.stats, [q.examen]: { ok: st.ok + (correct ? 1 : 0), total: st.total + 1 } },
      }
    })
  }

  const onNext = () => {
    if (i + 1 < total) {
      if (!unlimited && state.lives <= 0) {
        setNoLives(true)
        return
      }
      setI(i + 1)
      return
    }
    finish()
  }

  const finish = () => {
    // el resumen se calcula con el estado actual; el mismo cálculo se aplica al guardar
    const { r } = completarLeccion(state, lesson, ok, total, lessons[lesson.exam])
    // con un incidente pendiente en el edificio, la mitad de gemas hasta remediarlo
    const recorte = (st: typeof state, gemas: number) => (st.incidentes[lesson.exam] ? Math.ceil(gemas / 2) : 0)
    setPremio({ ...r, gemas: r.gemas - recorte(state, r.gemas) })
    update((s) => {
      const { s: next, r: rr } = completarLeccion(s, lesson, ok, total, lessons[lesson.exam])
      return { ...next, gems: next.gems - recorte(s, rr.gemas), practiceLeft: practice ? Math.max(0, next.practiceLeft - 1) : next.practiceLeft }
    })
    setFinished(true)
  }

  if (finished) {
    const pct = Math.round((ok / total) * 100)
    const good = pct >= 80
    return (
      <main className="screen lesson-end">
        <p className="end-score">
          <span className="end-big">{ok}</span>/{total}
        </p>
        <UkuSays sprite={good ? UKU_HAPPY : UKU} tone={good ? 'ok' : 'neutral'}>
          <p>{good ? 'Sala superada. Así se prepara un examen: poco cada día.' : 'Repite la sala cuando quieras: las que fallaste ya están en tu repaso de la Plaza.'}</p>
        </UkuSays>
        <dl className="end-stats">
          <div className="px">
            <dt>Precisión</dt>
            <dd>{pct} %</dd>
          </div>
          <div className="px">
            <dt>Experiencia</dt>
            <dd>+{premio?.xp ?? 0}</dd>
          </div>
          <div className="px">
            <dt>Gemas</dt>
            <dd>+{premio?.gemas ?? 0}</dd>
          </div>
        </dl>
        {state.incidentes[lesson.exam] && <p className="muted small">Mitad de gemas: tienes un incidente sin remediar en este edificio.</p>}
        {premio && premio.gemas === 0 && <p className="muted small">Las gemas de esta lección ya las cobraste hoy (o llegaste al tope diario). Vuelve mañana.</p>}
        {premio?.subioNivel && <p className="medal-note">¡Subiste al nivel {state.nivel}!</p>}
        {premio?.protector && <p className="medal-note">Tu protector salvó la racha: {premio.racha} días.</p>}
        {premio?.medalla && <p className="medal-note">Ganaste la medalla de {examInfo(lesson.exam).building}.</p>}
        {premio?.evoluciono && (
          <section className="evolucion px">
            <MiUku animo="feliz" size={128} />
            <p className="next-title">¡{state.ukuNombre} evolucionó a {ETAPAS[state.ukuEtapa].nombre}!</p>
          </section>
        )}
        <div className="stack">
          <button type="button" className="btn btn-block" onClick={() => go({ name: 'building', exam: lesson.exam })}>
            Volver a {examInfo(lesson.exam).building}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={() => {
              setI(0)
              setOk(0)
              setFinished(false)
              setPremio(null)
            }}
          >
            Repetir la sala
          </button>
        </div>
      </main>
    )
  }

  const mins = Math.ceil(nextLifeIn(state) / 60000)

  return (
    <main className="screen lesson">
      <div className="lesson-bar">
        <button type="button" className="icon-btn" aria-label="Salir de la lección" onClick={() => setConfirmExit(true)}>
          ✕
        </button>
        <div className="seg" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={i} aria-label="Avance de la lección">
          {lesson.questions.map((qq, n) => (
            <span key={qq.id} className={n < i ? 'on' : n === i ? 'now' : ''} />
          ))}
        </div>
        <span className="lives" aria-label={unlimited ? 'Vidas ilimitadas' : `${state.lives} vidas`}>
          <Px sprite={HEART} scale={3} />
          {unlimited ? '∞' : state.lives}
        </span>
      </div>
      {practice && <p className="practice-tag">Lección de práctica: no gastas vidas</p>}
      <QuestionView
        key={q.id}
        question={q}
        onAnswer={onAnswer}
        onNext={onNext}
        onReport={(m) => {
          update((s) => ({ ...s, reports: [...s.reports, { qid: q.id, motivo: m, at: Date.now() }] }))
          sendReport(q.id, m)
          app.toast('Gracias, revisaremos esta pregunta')
        }}
        nextLabel={i + 1 < total ? 'Continuar' : 'Terminar sala'}
      />

      {noLives && (
        <Sheet label="Te quedaste sin vidas" onClose={() => go({ name: 'building', exam: lesson.exam })}>
          <UkuSays sprite={UKU_SAD} tone="bad">
            <p>Te quedaste sin vidas. La próxima llega en {mins} min.</p>
          </UkuSays>
          <div className="stack">
            <button
              type="button"
              className="btn btn-block"
              disabled={state.gems < refillCost}
              onClick={() => {
                const r = comprar(state, 'recarga_vidas')
                if (typeof r === 'string') {
                  app.toast(MENSAJE_ERROR[r])
                  return
                }
                update((s) => {
                  const r2 = comprar(s, 'recarga_vidas')
                  return typeof r2 === 'string' ? s : r2
                })
                setNoLives(false)
                setI(i + 1)
              }}
            >
              Recargar 5 vidas por {refillCost} gemas
            </button>
            <button type="button" className="btn btn-secondary btn-block" onClick={() => go({ name: 'banco' })}>
              Practicar en la Plaza sin vidas
            </button>
            <button type="button" className="btn btn-gold btn-block" onClick={() => go({ name: 'pro' })}>
              Vidas ilimitadas con Pro
            </button>
          </div>
        </Sheet>
      )}

      {confirmExit && (
        <Sheet label="Salir de la lección" onClose={() => setConfirmExit(false)}>
          <h2 className="sheet-title">¿Salir de la sala?</h2>
          <p className="muted">Perderás el avance de esta lección.</p>
          <div className="stack">
            <button type="button" className="btn btn-block" onClick={() => setConfirmExit(false)}>
              Seguir estudiando
            </button>
            <button type="button" className="btn btn-secondary btn-block" onClick={() => go({ name: 'building', exam: lesson.exam })}>
              Salir
            </button>
          </div>
        </Sheet>
      )}
    </main>
  )
}
