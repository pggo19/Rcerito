import { useMemo, useRef, useState } from 'react'
import { QuestionView } from '../components/QuestionView'
import { Px, Sheet, UkuSays } from '../components/ui'
import { HEART, UKU, UKU_HAPPY, UKU_SAD } from '../game/sprites'
import { earnedMedal, useApp } from '../lib/app'
import { MAX_LIVES, nextLifeIn, touchStreak } from '../lib/store'
import { recordAnswer, sendReport } from '../lib/sync'
import { examInfo } from '../lib/types'

const REFILL_COST = 20

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
        xp: s.xp + (correct ? 10 : 0),
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
    const perfect = ok === total
    update((s) => {
      const prev = s.done[lesson.id]
      const done = { ...s.done, [lesson.id]: { best: Math.max(prev?.best ?? 0, ok), total } }
      let next = touchStreak({
        ...s,
        done,
        xp: s.xp + (perfect ? 5 : 0),
        gems: s.gems + 2 + (perfect ? 3 : 0),
        practiceLeft: practice ? Math.max(0, s.practiceLeft - 1) : s.practiceLeft,
      })
      const list = lessons[lesson.exam]
      if (!next.medals.includes(lesson.exam) && earnedMedal(next, list)) next = { ...next, medals: [...next.medals, lesson.exam], gems: next.gems + 10 }
      return next
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
            <dd>+{ok * 10 + (ok === total ? 5 : 0)}</dd>
          </div>
          <div className="px">
            <dt>Gemas</dt>
            <dd>+{2 + (ok === total ? 3 : 0)}</dd>
          </div>
        </dl>
        {state.medals.includes(lesson.exam) && <p className="medal-note">Tienes la medalla de {examInfo(lesson.exam).building}.</p>}
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
              disabled={state.gems < REFILL_COST}
              onClick={() => {
                update((s) => ({ ...s, gems: s.gems - REFILL_COST, lives: MAX_LIVES, livesAt: Date.now() }))
                setNoLives(false)
                setI(i + 1)
              }}
            >
              Recargar 5 vidas por {REFILL_COST} gemas
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
