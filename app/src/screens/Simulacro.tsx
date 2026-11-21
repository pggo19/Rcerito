import { useEffect, useMemo, useState } from 'react'
import { UkuSays } from '../components/ui'
import { UKU, UKU_HAPPY } from '../game/sprites'
import { useApp } from '../lib/app'
import { shuffle } from '../lib/questions'
import { FREE_SIMS_PER_EXAM } from '../lib/store'
import { recordAnswer } from '../lib/sync'
import { EXAMS, examInfo, type ExamCode, type Question } from '../lib/types'

const SECONDS_PER_Q = 60

export function Simulacro({ exam: initial }: { exam?: ExamCode }) {
  const { state, update, questions, go } = useApp()
  const [exam, setExam] = useState<ExamCode>(initial ?? state.target ?? 'ENAM')
  const [phase, setPhase] = useState<'intro' | 'run' | 'done'>('intro')
  const [set, setSet] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [i, setI] = useState(0)
  const [left, setLeft] = useState(0)

  const pool = useMemo(() => questions.filter((q) => q.examen === exam), [questions, exam])
  const used = state.sims[exam] ?? 0
  const canStart = state.pro || used < FREE_SIMS_PER_EXAM

  useEffect(() => {
    if (phase !== 'run') return
    const t = setInterval(() => setLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  useEffect(() => {
    if (phase === 'run' && left <= 0) finish()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, phase])

  const start = () => {
    const chosen = shuffle(pool).slice(0, 100)
    setSet(chosen)
    setAnswers({})
    setI(0)
    setLeft(chosen.length * SECONDS_PER_Q)
    setPhase('run')
    update((s) => ({ ...s, sims: { ...s.sims, [exam]: (s.sims[exam] ?? 0) + 1 } }))
  }

  const finish = () => {
    let ok = 0
    for (const q of set) {
      const a = answers[q.id]
      if (a) recordAnswer(q.id, a, a === q.correcta, 'simulacro')
      if (a === q.correcta) ok++
    }
    update((s) => ({ ...s, xp: s.xp + ok * 10, gems: s.gems + 5 }))
    setPhase('done')
  }

  if (phase === 'intro')
    return (
      <main className="screen sim">
        <h1 className="title">Simulacro</h1>
        <div className="filters" role="tablist" aria-label="Examen">
          {EXAMS.map((e) => (
            <button key={e.code} role="tab" type="button" aria-selected={exam === e.code} className={`filter ${exam === e.code ? 'is-on' : ''}`} onClick={() => setExam(e.code)}>
              {e.name}
            </button>
          ))}
        </div>
        <section className="sim-card px">
          <p className="next-title">{examInfo(exam).name}</p>
          <dl className="sim-facts">
            <div>
              <dt>Reactivos</dt>
              <dd>{Math.min(pool.length, 100)}</dd>
            </div>
            <div>
              <dt>Minutos</dt>
              <dd>{Math.round((Math.min(pool.length, 100) * SECONDS_PER_Q) / 60)}</dd>
            </div>
            <div>
              <dt>Gratis</dt>
              <dd>{state.pro ? '∞' : Math.max(0, FREE_SIMS_PER_EXAM - used)}</dd>
            </div>
          </dl>
          <p className="muted small">Sin pistas ni vidas. Al final ves tu puntaje sobre 100 y el detalle por área.</p>
          {canStart ? (
            <button type="button" className="btn btn-block" onClick={start} disabled={!pool.length}>
              Empezar simulacro
            </button>
          ) : (
            <button type="button" className="btn btn-gold btn-block" onClick={() => go({ name: 'pro' })}>
              Más simulacros con Pro
            </button>
          )}
        </section>
      </main>
    )

  if (phase === 'run') {
    const q = set[i]
    const mm = String(Math.floor(left / 60)).padStart(2, '0')
    const ss = String(left % 60).padStart(2, '0')
    const answered = Object.keys(answers).length
    return (
      <main className="screen sim-run">
        <div className="sim-bar">
          <span className="sim-count">
            {i + 1}/{set.length}
          </span>
          <span className={`sim-time ${left < 60 ? 'is-low' : ''}`} aria-live="off">
            {mm}:{ss}
          </span>
          <button type="button" className="btn btn-small btn-secondary" onClick={finish}>
            Entregar
          </button>
        </div>
        <p className="q-topic">
          <span className="chip">{q.area}</span>
        </p>
        <div className="historia px">
          <p>{q.enunciado}</p>
        </div>
        <ol className="options">
          {Object.keys(q.opciones)
            .sort()
            .map((l) => (
              <li key={l}>
                <button type="button" className={`option px ${answers[q.id] === l ? 'is-picked' : ''}`} aria-pressed={answers[q.id] === l} onClick={() => setAnswers({ ...answers, [q.id]: l })}>
                  <span className="option-letter">{l}</span>
                  <span className="option-text">{q.opciones[l]}</span>
                </button>
              </li>
            ))}
        </ol>
        <div className="row">
          <button type="button" className="btn btn-secondary" disabled={i === 0} onClick={() => setI(i - 1)}>
            Anterior
          </button>
          {i + 1 < set.length ? (
            <button type="button" className="btn" onClick={() => setI(i + 1)}>
              Siguiente
            </button>
          ) : (
            <button type="button" className="btn btn-gold" onClick={finish}>
              Entregar ({answered}/{set.length})
            </button>
          )}
        </div>
      </main>
    )
  }

  const ok = set.filter((q) => answers[q.id] === q.correcta).length
  const score = Math.round((ok / Math.max(set.length, 1)) * 100)
  const byArea = new Map<string, { ok: number; total: number }>()
  for (const q of set) {
    const a = byArea.get(q.area) ?? { ok: 0, total: 0 }
    a.total++
    if (answers[q.id] === q.correcta) a.ok++
    byArea.set(q.area, a)
  }
  const wrong = set.filter((q) => answers[q.id] !== q.correcta)

  return (
    <main className="screen sim-done">
      <p className="end-score">
        <span className="end-big">{score}</span>/100
      </p>
      <UkuSays sprite={score >= 70 ? UKU_HAPPY : UKU} tone={score >= 70 ? 'ok' : 'neutral'}>
        <p>
          {ok} de {set.length} correctas en el simulacro de {examInfo(exam).name}. {score >= 70 ? 'Buen nivel: sigue sosteniéndolo.' : 'Mira abajo qué áreas reforzar primero.'}
        </p>
      </UkuSays>
      <table className="area-table">
        <caption>Resultado por área</caption>
        <thead>
          <tr>
            <th scope="col">Área</th>
            <th scope="col">Aciertos</th>
          </tr>
        </thead>
        <tbody>
          {[...byArea.entries()]
            .sort((a, b) => a[1].ok / a[1].total - b[1].ok / b[1].total)
            .map(([area, r]) => (
              <tr key={area}>
                <td>{area}</td>
                <td>
                  <span className="bar" style={{ ['--w' as string]: `${(r.ok / r.total) * 100}%` }} />
                  {r.ok}/{r.total}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      {wrong.length > 0 && (
        <details className="review px">
          <summary>Revisar las {wrong.length} preguntas falladas</summary>
          {wrong.map((q) => (
            <div key={q.id} className="review-item">
              <p className="review-q">{q.enunciado}</p>
              <p>
                <strong>
                  {q.correcta}: {q.opciones[q.correcta]}
                </strong>
                {answers[q.id] ? ` (marcaste ${answers[q.id]})` : ' (sin responder)'}
              </p>
              <p className="muted small">{q.explicacion}</p>
            </div>
          ))}
        </details>
      )}
      <button
        type="button"
        className="btn btn-block"
        onClick={() => {
          update((s) => ({ ...s, wrong: Array.from(new Set([...s.wrong, ...wrong.map((q) => q.id)])) }))
          go({ name: 'campus' })
        }}
      >
        Guardar errores para repasar
      </button>
    </main>
  )
}
