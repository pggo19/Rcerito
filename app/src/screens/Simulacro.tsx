import { useEffect, useMemo, useState } from 'react'
import { MiUku } from '../components/Personaje'
import { UkuSays } from '../components/ui'
import { ETAPAS } from '../game/pixel'
import { UKU, UKU_HAPPY } from '../game/sprites'
import { useApp } from '../lib/app'
import { cerrarSimulacro, expressGratisDisponibles, LECCIONES_GRATIS_POR_SALA, NOTA_APROBATORIA, SIMULACRO_OFICIAL } from '../lib/economia'
import { shuffle } from '../lib/questions'
import { recordAnswer } from '../lib/sync'
import { EXAMS, examInfo, type ExamCode, type Question } from '../lib/types'

type Modo = 'express20' | 'express50' | 'oficial'

/** Muestra estratificada por área, proporcional al banco (como arma el servidor). */
function armar(pool: Question[], n: number): Question[] {
  const porArea = new Map<string, Question[]>()
  for (const q of shuffle(pool)) porArea.set(q.area, [...(porArea.get(q.area) ?? []), q])
  const elegidas: Question[] = []
  for (const lista of porArea.values()) elegidas.push(...lista.slice(0, Math.max(1, Math.round((n * lista.length) / pool.length))))
  return shuffle(elegidas).slice(0, n)
}

export function Simulacro({ exam: initial }: { exam?: ExamCode }) {
  const { state, update, questions, lessons, go } = useApp()
  const [exam, setExam] = useState<ExamCode>(initial ?? state.target ?? 'ENAM')
  const [modo, setModo] = useState<Modo>('express20')
  const [phase, setPhase] = useState<'intro' | 'run' | 'done'>('intro')
  const [set, setSet] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [i, setI] = useState(0)
  const [left, setLeft] = useState(0)
  const [jugado, setJugado] = useState<{ modo: Modo; esperadas: number; aTiempo: boolean } | null>(null)
  const [resultado, setResultado] = useState<{ nota: number; aprobado: boolean; evoluciono: boolean } | null>(null)

  // Gratis: el Express usa solo las lecciones gratis. Pro o con pase: todo el banco descargado.
  const gratisIds = useMemo(
    () => new Set(lessons[exam].filter((l) => l.index < LECCIONES_GRATIS_POR_SALA).flatMap((l) => l.questions.map((q) => q.id))),
    [lessons, exam],
  )
  const poolTodo = useMemo(() => questions.filter((q) => q.examen === exam), [questions, exam])
  const oficial = SIMULACRO_OFICIAL[exam]
  const n = modo === 'express20' ? 20 : modo === 'express50' ? 50 : oficial.preguntas
  const minutos = modo === 'oficial' ? oficial.minutos : n
  const gratisLibres = expressGratisDisponibles(state)
  const pool = modo !== 'oficial' && !state.pro ? poolTodo.filter((q) => gratisIds.has(q.id)) : poolTodo
  const total = Math.min(pool.length, n)
  const puede = state.pro || (modo === 'oficial' ? state.pases > 0 : gratisLibres > 0)

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
    const chosen = armar(pool, n)
    setSet(chosen)
    setAnswers({})
    setI(0)
    setLeft(Math.round((minutos * 60 * chosen.length) / n))
    setJugado({ modo, esperadas: n, aTiempo: true })
    setResultado(null)
    setPhase('run')
    if (!state.pro) {
      update((s) => (modo === 'oficial' ? { ...s, pases: Math.max(0, s.pases - 1) } : { ...s, simsGratis: [...s.simsGratis, Date.now()] }))
    }
  }

  const finish = () => {
    let ok = 0
    for (const q of set) {
      const a = answers[q.id]
      if (a) recordAnswer(q.id, a, a === q.correcta, 'simulacro')
      if (a === q.correcta) ok++
    }
    const modoJugado = jugado?.modo === 'oficial' ? 'oficial' : 'express'
    const completo = set.length >= (jugado?.esperadas ?? Infinity)
    const r = cerrarSimulacro(state, exam, modoJugado, ok, set.length, completo)
    setResultado({ nota: r.nota, aprobado: r.aprobado, evoluciono: r.evoluciono })
    update((s) => cerrarSimulacro(s, exam, modoJugado, ok, set.length, completo).s)
    setPhase('done')
  }

  if (phase === 'intro')
    return (
      <main className="screen sim">
        <h1 className="title">Simulacro</h1>
        <div className="filters">
          {EXAMS.map((e) => (
            <button key={e.code} type="button" aria-pressed={exam === e.code} className={`filter ${exam === e.code ? 'is-on' : ''}`} onClick={() => setExam(e.code)}>
              {e.name}
            </button>
          ))}
        </div>
        <div className="filters">
          {(
            [
              ['express20', 'Express 20'],
              ['express50', 'Express 50'],
              ['oficial', 'Oficial'],
            ] as [Modo, string][]
          ).map(([id, label]) => (
            <button key={id} type="button" aria-pressed={modo === id} className={`filter ${modo === id ? 'is-on' : ''}`} onClick={() => setModo(id)}>
              {label}
            </button>
          ))}
        </div>
        <section className="sim-card px">
          <p className="next-title">
            {examInfo(exam).name} · {modo === 'oficial' ? 'Oficial' : 'Express'}
          </p>
          <dl className="sim-facts">
            <div>
              <dt>Preguntas</dt>
              <dd>{total}</dd>
            </div>
            <div>
              <dt>Minutos</dt>
              <dd>{Math.round((minutos * total) / n)}</dd>
            </div>
            <div>
              <dt>{modo === 'oficial' ? 'Pases' : 'Gratis'}</dt>
              <dd>{state.pro ? '∞' : modo === 'oficial' ? state.pases : gratisLibres}</dd>
            </div>
          </dl>
          {modo === 'oficial' ? (
            <p className="muted small">
              Como el examen real: {oficial.preguntas} preguntas en {oficial.minutos} minutos, nota sobre 20. Si lo completas a tiempo con {NOTA_APROBATORIA[exam]} o más, cuenta como aprobado y{' '}
              {state.ukuNombre} puede evolucionar.
              {total < oficial.preguntas && ` Por ahora el banco tiene ${total}: puedes practicarlo, pero aún no cuenta como aprobado.`}
            </p>
          ) : (
            <p className="muted small">Sin pistas ni vidas. Al final ves tu nota y el detalle por área. {!state.pro && 'Gratis: 1 por semana, con las lecciones gratis.'}</p>
          )}
          {puede ? (
            <button type="button" className="btn btn-block" onClick={start} disabled={!total}>
              Empezar simulacro
            </button>
          ) : (
            <div className="stack">
              <button type="button" className="btn btn-gold btn-block" onClick={() => go({ name: 'pro' })}>
                Simulacros sin tope con Pro
              </button>
              {modo === 'oficial' && (
                <button type="button" className="btn btn-secondary btn-block" onClick={() => go({ name: 'tienda' })}>
                  Comprar un pase con gemas
                </button>
              )}
            </div>
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
  const nota = resultado?.nota ?? 0
  const bien = nota >= NOTA_APROBATORIA[exam]
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
        <span className="end-big">{nota.toFixed(1)}</span>/20
      </p>
      <UkuSays sprite={bien ? UKU_HAPPY : UKU} tone={bien ? 'ok' : 'neutral'}>
        <p>
          {ok} de {set.length} correctas en el simulacro de {examInfo(exam).name}.{' '}
          {resultado?.aprobado
            ? '¡Aprobado! Cuenta como examen superado.'
            : bien
              ? 'Nota aprobatoria: sigue sosteniéndola.'
              : `La nota mínima es ${NOTA_APROBATORIA[exam]}. Mira abajo qué áreas reforzar primero.`}
        </p>
      </UkuSays>
      {resultado?.evoluciono && (
        <section className="evolucion px">
          <MiUku animo="feliz" size={128} />
          <p className="next-title">
            ¡{state.ukuNombre} evolucionó a {ETAPAS[state.ukuEtapa].nombre}!
          </p>
        </section>
      )}
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
