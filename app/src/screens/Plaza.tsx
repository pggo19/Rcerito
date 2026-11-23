import { useMemo, useState } from 'react'
import { QuestionView } from '../components/QuestionView'
import { UkuSays } from '../components/ui'
import { UKU } from '../game/sprites'
import { useApp } from '../lib/app'
import { shuffle } from '../lib/questions'
import { recordAnswer, sendReport } from '../lib/sync'
import { EXAMS, type ExamCode, type Question } from '../lib/types'

export function Plaza() {
  const { state, go, questions } = useApp()
  return (
    <main className="screen plaza">
      <h1 className="title">Plaza central</h1>
      <UkuSays sprite={UKU}>
        <p>Aquí practicas sin gastar vidas, cuando quieras y de cualquier examen.</p>
      </UkuSays>
      <div className="plaza-grid">
        <button type="button" className="plaza-tile px tile-banco" onClick={() => go({ name: 'banco' })}>
          <span className="tile-name">Banco libre</span>
          <span className="tile-meta">{questions.length} preguntas de los tres exámenes</span>
        </button>
        <button type="button" className="plaza-tile px tile-repaso" onClick={() => go({ name: 'banco' })} disabled={!state.wrong.length}>
          <span className="tile-name">Repaso de errores</span>
          <span className="tile-meta">{state.wrong.length ? `${state.wrong.length} preguntas que fallaste` : 'Aún no tienes preguntas falladas'}</span>
        </button>
        <button type="button" className="plaza-tile px tile-flash" onClick={() => go({ name: 'flashcards' })}>
          <span className="tile-name">Tarjetas</span>
          <span className="tile-meta">Repaso rápido de conceptos clave</span>
        </button>
        <button type="button" className="plaza-tile px tile-tienda" onClick={() => go({ name: 'tienda' })}>
          <span className="tile-name">Tienda del Campus</span>
          <span className="tile-meta">Accesorios para ti y para {state.ukuNombre}, y ayudas para estudiar</span>
        </button>
      </div>
    </main>
  )
}

export function Banco() {
  const { state, update, questions, go, toast } = useApp()
  const [filter, setFilter] = useState<ExamCode | 'TODOS' | 'ERRORES'>(state.wrong.length ? 'ERRORES' : 'TODOS')
  const pool = useMemo<Question[]>(() => {
    const base = filter === 'TODOS' ? questions : filter === 'ERRORES' ? questions.filter((q) => state.wrong.includes(q.id)) : questions.filter((q) => q.examen === filter)
    return shuffle(base)
    // el orden se fija al cambiar de filtro
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, questions])
  const [i, setI] = useState(0)
  const [ok, setOk] = useState(0)
  const [n, setN] = useState(0)
  const q = pool[i % Math.max(pool.length, 1)]

  return (
    <main className="screen banco">
      <button type="button" className="back" onClick={() => go({ name: 'plaza' })}>
        ← Plaza
      </button>
      <div className="filters" role="tablist" aria-label="Filtrar preguntas">
        {(['TODOS', ...EXAMS.map((e) => e.code), 'ERRORES'] as const).map((f) => (
          <button
            key={f}
            role="tab"
            type="button"
            aria-selected={filter === f}
            className={`filter ${filter === f ? 'is-on' : ''}`}
            onClick={() => {
              setFilter(f)
              setI(0)
            }}
          >
            {f === 'TODOS' ? 'Todo' : f === 'ERRORES' ? 'Mis errores' : EXAMS.find((e) => e.code === f)!.name}
          </button>
        ))}
      </div>
      <p className="muted small">
        {n ? `${ok} de ${n} correctas en esta sesión` : 'Práctica libre: no gastas vidas.'}
      </p>
      {q ? (
        <QuestionView
          key={`${filter}-${i}`}
          question={q}
          onAnswer={(correct, chosen) => {
            setN((x) => x + 1)
            if (correct) setOk((x) => x + 1)
            recordAnswer(q.id, chosen, correct, 'banco')
            update((s) => ({
              ...s,
              xp: s.xp + (correct ? 5 : 0),
              wrong: correct ? s.wrong.filter((id) => id !== q.id) : Array.from(new Set([...s.wrong, q.id])),
            }))
          }}
          onNext={() => setI(i + 1)}
          onReport={(m) => {
            update((s) => ({ ...s, reports: [...s.reports, { qid: q.id, motivo: m, at: Date.now() }] }))
            sendReport(q.id, m)
            toast('Gracias, revisaremos esta pregunta')
          }}
          nextLabel="Siguiente pregunta"
        />
      ) : (
        <p className="empty">No tienes errores pendientes. Elige otro filtro para seguir practicando.</p>
      )}
    </main>
  )
}

export function Flashcards() {
  const { questions, go } = useApp()
  const deck = useMemo(() => shuffle(questions), [questions])
  const [i, setI] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState(0)
  const q = deck[i % deck.length]

  const next = (knew: boolean) => {
    if (knew) setKnown((k) => k + 1)
    setFlipped(false)
    setI(i + 1)
  }

  return (
    <main className="screen flash">
      <button type="button" className="back" onClick={() => go({ name: 'plaza' })}>
        ← Plaza
      </button>
      <p className="muted small">
        Tarjeta {(i % deck.length) + 1} de {deck.length}. Sabías {known}.
      </p>
      <button type="button" className={`card px ${flipped ? 'is-back' : ''}`} onClick={() => setFlipped(!flipped)} aria-label={flipped ? 'Ver la pregunta' : 'Ver la respuesta'}>
        {!flipped ? (
          <>
            <span className="chip">{q.tema}</span>
            <span className="card-front">{q.enunciado}</span>
            <span className="card-hint">Toca para ver la respuesta</span>
          </>
        ) : (
          <>
            <span className="card-answer">{q.opciones[q.correcta]}</span>
            <span className="card-why">{q.explicacion}</span>
          </>
        )}
      </button>
      {flipped && (
        <div className="row">
          <button type="button" className="btn btn-secondary" onClick={() => next(false)}>
            Repasar luego
          </button>
          <button type="button" className="btn" onClick={() => next(true)}>
            Lo sabía
          </button>
        </div>
      )}
    </main>
  )
}
