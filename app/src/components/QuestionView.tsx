import { useEffect, useRef, useState } from 'react'
import type { Question } from '../lib/types'
import { UKU_HAPPY, UKU_SAD } from '../game/sprites'
import { Sheet, UkuSays } from './ui'

const MOTIVOS = ['La clave está mal', 'La explicación es confusa', 'Información desactualizada', 'Error de redacción']

interface Props {
  question: Question
  onAnswer: (correct: boolean, chosen: string) => void
  onNext: () => void
  onReport: (motivo: string) => void
  nextLabel?: string
}

export function QuestionView({ question: q, onAnswer, onNext, onReport, nextLabel = 'Continuar' }: Props) {
  const [chosen, setChosen] = useState<string | null>(null)
  const [reporting, setReporting] = useState(false)
  const [reported, setReported] = useState(false)
  const answered = chosen !== null
  const correct = chosen === q.correcta
  const letters = Object.keys(q.opciones).sort()
  const fbRef = useRef<HTMLElement>(null)
  useEffect(() => {
    if (chosen) fbRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
  }, [chosen])

  const pick = (letter: string) => {
    if (answered) return
    setChosen(letter)
    onAnswer(letter === q.correcta, letter)
  }

  return (
    <div className="question">
      <p className="q-topic">
        <span className="chip">{q.subarea ?? q.area}</span> <span className="q-tema">{q.tema}</span>
      </p>
      <div className="historia px">
        <p>{q.enunciado}</p>
      </div>
      <ol className="options" aria-label="Opciones">
        {letters.map((l) => {
          const state = !answered ? '' : l === q.correcta ? 'is-correct' : l === chosen ? 'is-wrong' : 'is-dim'
          return (
            <li key={l}>
              <button type="button" className={`option px ${state}`} onClick={() => pick(l)} disabled={answered} aria-pressed={chosen === l}>
                <span className="option-letter">{l}</span>
                <span className="option-text">{q.opciones[l]}</span>
              </button>
            </li>
          )
        })}
      </ol>

      {answered && (
        <section ref={fbRef} className={`feedback ${correct ? 'is-ok' : 'is-bad'}`} aria-live="polite">
          <UkuSays sprite={correct ? UKU_HAPPY : UKU_SAD} tone={correct ? 'ok' : 'bad'}>
            <h2 className="feedback-title">{correct ? '¡Correcto!' : 'Esta vez no'}</h2>
            {!correct && (
              <p className="feedback-answer">
                La respuesta es <strong>{q.correcta}: {q.opciones[q.correcta]}</strong>
              </p>
            )}
          </UkuSays>
          <p className="feedback-why">{q.explicacion}</p>
          {!correct && chosen && q.por_que_no[chosen] && (
            <p className="feedback-not">
              <strong>Tu opción ({chosen}):</strong> {q.por_que_no[chosen]}
            </p>
          )}
          <p className="feedback-source">
            Fuente:{' '}
            {q.fuente.url ? (
              <a href={q.fuente.url} target="_blank" rel="noreferrer">
                {q.fuente.documento}
              </a>
            ) : (
              q.fuente.documento
            )}{' '}
            ({q.fuente.anio})
          </p>
          <div className="feedback-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setReporting(true)} disabled={reported}>
              {reported ? 'Reporte enviado' : 'Reportar error'}
            </button>
            <button type="button" className={`btn ${correct ? '' : 'btn-danger'}`} onClick={onNext} autoFocus>
              {nextLabel}
            </button>
          </div>
        </section>
      )}

      {reporting && (
        <Sheet label="Reportar un error en la pregunta" onClose={() => setReporting(false)}>
          <h2 className="sheet-title">¿Qué está mal en esta pregunta?</h2>
          <div className="stack">
            {MOTIVOS.map((m) => (
              <button
                key={m}
                type="button"
                className="btn btn-secondary btn-block"
                onClick={() => {
                  onReport(m)
                  setReported(true)
                  setReporting(false)
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  )
}
