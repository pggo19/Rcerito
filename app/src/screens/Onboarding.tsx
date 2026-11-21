import { useState } from 'react'
import { Escena } from '../components/Personaje'
import { UkuSays } from '../components/ui'
import { ETAPAS } from '../game/pixel'
import { UKU, UKU_HAPPY } from '../game/sprites'
import { useApp } from '../lib/app'
import { etapaInicial, evolucionar } from '../lib/economia'
import { EXAMS, type ExamCode } from '../lib/types'
import { EditorApariencia } from './MiAvatar'

export function Onboarding() {
  const { state, update, go } = useApp()
  const [step, setStep] = useState<0 | 1 | 2>(0)
  const [apariencia, setApariencia] = useState(state.apariencia)
  const [name, setName] = useState('')
  const [target, setTarget] = useState<ExamCode | null>(null)

  if (step === 0)
    return (
      <main className="screen onboarding">
        <h1 className="title-xl">Rcerito</h1>
        <UkuSays sprite={UKU}>
          <p>Hola, soy Uku. Te acompaño desde el examen del internado hasta tu plaza SERUMS, un caso clínico a la vez. Y crezco contigo.</p>
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

  if (step === 1)
    return (
      <main className="screen onboarding">
        <UkuSays sprite={UKU_HAPPY}>
          <p>Mucho gusto, {name.trim()}. ¿Qué examen das primero? Los tres edificios están abiertos; el tuyo marca cómo empiezo.</p>
        </UkuSays>
        <div className="stack" role="radiogroup" aria-label="Examen objetivo">
          {EXAMS.map((e) => (
            <button key={e.code} type="button" role="radio" aria-checked={target === e.code} className={`exam-pick px ${target === e.code ? 'is-on' : ''}`} onClick={() => setTarget(e.code)}>
              <span className="exam-pick-name">{e.name}</span>
              <span className="exam-pick-meta">
                {e.building}. {e.who}. Uku empieza como {ETAPAS[etapaInicial(e.code)].nombre.replace('Uku ', '').toLowerCase()}.
              </span>
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-block" disabled={!target} onClick={() => setStep(2)}>
          Seguir
        </button>
      </main>
    )

  const etapa = etapaInicial(target ?? 'ESSALUD')
  return (
    <main className="screen onboarding">
      <h1 className="title">Crea tu avatar</h1>
      <Escena apariencia={apariencia} equipoAvatar={state.equipoAvatar} etapa={etapa} equipoUku={{}} alto={200} />
      <EditorApariencia valor={apariencia} onChange={setApariencia} />
      <p className="muted small">Luego podrás vestirte a ti y a Uku con lo que compres en la tienda.</p>
      <button
        className="btn btn-block"
        type="button"
        onClick={() => {
          update((s) => evolucionar({ ...s, name: name.trim(), target, apariencia, avatarListo: true }, etapa))
          go({ name: 'campus' })
        }}
      >
        Entrar al campus
      </button>
    </main>
  )
}
