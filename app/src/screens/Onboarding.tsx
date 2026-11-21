import { useState } from 'react'
import { UkuSays } from '../components/ui'
import { UKU, UKU_HAPPY } from '../game/sprites'
import { useApp } from '../lib/app'
import { EXAMS, type ExamCode } from '../lib/types'

export function Onboarding() {
  const { update, go } = useApp()
  const [step, setStep] = useState<0 | 1>(0)
  const [name, setName] = useState('')
  const [target, setTarget] = useState<ExamCode | null>(null)

  if (step === 0)
    return (
      <main className="screen onboarding">
        <h1 className="title-xl">Rcerito</h1>
        <UkuSays sprite={UKU}>
          <p>Hola, soy Uku. Te acompaño desde el examen del internado hasta tu plaza SERUMS, un caso clínico a la vez.</p>
        </UkuSays>
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault()
            if (name.trim()) setStep(1)
          }}
        >
          <label className="field">
            <span>¿Cómo te llamo?</span>
            <input className="input px" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" autoComplete="given-name" maxLength={24} />
          </label>
          <button className="btn btn-block" type="submit" disabled={!name.trim()}>
            Seguir
          </button>
        </form>
      </main>
    )

  return (
    <main className="screen onboarding">
      <UkuSays sprite={UKU_HAPPY}>
        <p>Mucho gusto, {name.trim()}. ¿Qué examen das primero? Ese edificio se abre de inmediato.</p>
      </UkuSays>
      <div className="stack" role="radiogroup" aria-label="Examen objetivo">
        {EXAMS.map((e) => (
          <button key={e.code} type="button" role="radio" aria-checked={target === e.code} className={`exam-pick px ${target === e.code ? 'is-on' : ''}`} onClick={() => setTarget(e.code)}>
            <span className="exam-pick-name">{e.name}</span>
            <span className="exam-pick-meta">
              {e.building}. {e.who}.
            </span>
          </button>
        ))}
      </div>
      <button
        className="btn btn-block"
        type="button"
        disabled={!target}
        onClick={() => {
          update((s) => ({ ...s, name: name.trim(), target }))
          go({ name: 'campus' })
        }}
      >
        Entrar al campus
      </button>
    </main>
  )
}
