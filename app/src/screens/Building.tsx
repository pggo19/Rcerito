import { useEffect, useState } from 'react'
import { Px, Sheet, UkuSays } from '../components/ui'
import { AMENAZA_VIRUS, CRONO, LOCK, MEDAL, PACIENTE, UKU, UKU_SAD, type Sprite } from '../game/sprites'
import { earnedMedal, examProgress, lessonUnlocked, useApp } from '../lib/app'
import { COSTO_REPARAR_GRATIS, DESAFIO_N, PREMIO, REPARAR_N, alarma, ataquePendiente, desafioHecho, hayPasillo, incidenteDe, marcarVisto } from '../lib/eventos'
import { edificio, examInfo, type ExamCode, type Modo } from '../lib/types'

interface Evento {
  modo: Modo
  sprite: Sprite
  titulo: string
  detalle: string
  urgente?: boolean
}

function eventosDe(state: ReturnType<typeof useApp>['state'], exam: ExamCode): Evento[] {
  const list: Evento[] = []
  if (ataquePendiente(state, exam))
    list.push({ modo: 'ataque', sprite: AMENAZA_VIRUS, titulo: alarma(exam).titulo, detalle: `Resuélvelo con 1 pregunta: +${PREMIO.defensa.gems} gemas. Si fallas, algo saldrá mal.`, urgente: true })
  const inc = incidenteDe(state, exam)
  if (inc)
    list.push({ modo: 'reparar', sprite: inc.sprite, titulo: inc.titulo, detalle: `Las lecciones aquí dan la mitad de gemas. «${inc.remedio}»: ${REPARAR_N} preguntas${state.pro ? ' (gratis con Pro)' : ` (${COSTO_REPARAR_GRATIS} gemas)`}.`, urgente: true })
  if (hayPasillo(state, exam)) list.push({ modo: 'pasillo', sprite: PACIENTE, titulo: 'Un paciente te espera en el pasillo', detalle: `1 pregunta sorpresa: +${PREMIO.pasillo} gemas.` })
  if (!desafioHecho(state, exam)) {
    const d = state.ev.desafio[exam]
    list.push({ modo: 'desafio', sprite: CRONO, titulo: 'Desafío del día', detalle: d ? `Vas ${d.n} de ${DESAFIO_N}. Termínalo antes de medianoche.` : `${DESAFIO_N} preguntas, +${PREMIO.desafioPorAcierto} gemas por acierto.` })
  }
  return list
}

export function Building({ exam }: { exam: ExamCode }) {
  const { state, update, lessons, go } = useApp()
  const info = examInfo(exam)
  const list = lessons[exam]
  const prog = examProgress(state, list)
  const medal = earnedMedal(state, list)
  const eventos = eventosDe(state, exam)
  // al entrar por primera vez en el día, Uku cuenta lo que está pasando
  const [entrada, setEntrada] = useState(() => !state.ev.seen.includes(exam) && eventos.length > 0)
  useEffect(() => {
    update((s) => marcarVisto(s, exam))
  }, [exam, update])
  const urgente = eventos.find((e) => e.urgente)

  return (
    <main className="screen building">
      <button type="button" className="back" onClick={() => go({ name: 'campus' })}>
        ← Campus
      </button>
      <header className={`building-head bh-${exam.toLowerCase()} px`}>
        <h1 className="title">{info.building}</h1>
        <p className="building-exam">{info.name}</p>
        <p className="building-blurb">{info.blurb}</p>
        <div className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={prog.total} aria-valuenow={prog.done} aria-label="Salas completas">
          {list.map((l) => (
            <span key={l.id} className={state.done[l.id] ? 'on' : ''} />
          ))}
        </div>
        <p className="small">
          {prog.done} de {prog.total} salas completas. {medal ? 'Medalla ganada.' : 'La medalla pide 80 % en cada sala.'}
        </p>
        {incidenteDe(state, exam) && <p className="damage-tag">{incidenteDe(state, exam)!.corto}: lecciones a mitad de gemas</p>}
      </header>

      {eventos.length > 0 && (
        <section className="eventos" aria-label={`Hoy en ${edificio(exam, 'el')}`}>
          <h2 className="subtitle">Hoy en {edificio(exam, 'el')}</h2>
          {eventos.map((e) => (
            <button key={e.modo} type="button" className={`evento px ${e.urgente ? 'is-urgent' : ''}`} onClick={() => go({ name: 'encuentro', exam, modo: e.modo })}>
              <span className="evento-icon">
                <Px sprite={e.sprite} scale={3} />
              </span>
              <span className="room-body">
                <span className="room-name">{e.titulo}</span>
                <span className="room-meta">{e.detalle}</span>
              </span>
            </button>
          ))}
        </section>
      )}

      <ol className="corridor">
        {list.map((l, i) => {
          const open = lessonUnlocked(state, list, i) || state.pro
          const d = state.done[l.id]
          return (
            <li key={l.id}>
              <button type="button" className={`room px ${d ? 'is-done' : ''}`} disabled={!open} onClick={() => go({ name: 'lesson', lessonId: l.id })}>
                <span className="room-door" aria-hidden="true">
                  {open ? i + 1 : <Px sprite={LOCK} scale={2} />}
                </span>
                <span className="room-body">
                  <span className="room-name">{l.area}</span>
                  <span className="room-meta">
                    {d ? `Mejor puntaje: ${d.best} de ${d.total}` : `${l.questions.length} ${l.questions.length === 1 ? "pregunta" : "preguntas"}`}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      <section className="boss px">
        <div className="boss-medal">
          <Px sprite={MEDAL} scale={4} />
        </div>
        <div>
          <p className="next-title">Simulacro de {info.name}</p>
          <p className="muted small">Con tiempo y sin pistas, como el día del examen.</p>
        </div>
        <button type="button" className="btn btn-gold" onClick={() => go({ name: 'simulacro', exam })}>
          Rendir
        </button>
      </section>

      {entrada && (
        <Sheet label={`Al entrar ${edificio(exam, 'al')}`} onClose={() => setEntrada(false)}>
          <UkuSays sprite={urgente ? UKU_SAD : UKU} tone={urgente ? 'bad' : 'neutral'}>
            <p>
              {urgente?.modo === 'ataque'
                ? `¡Llegaste justo! ${alarma(exam).titulo} ¿Vamos?`
                : urgente
                  ? `${incidenteDe(state, exam)?.titulo}. Hay que remediarlo.`
                  : `Al entrar ${edificio(exam, 'al')} encuentras esto:`}
            </p>
          </UkuSays>
          <div className="stack">
            {eventos.map((e) => (
              <button key={e.modo} type="button" className={`btn btn-block ${e.urgente ? 'btn-danger' : 'btn-secondary'}`} onClick={() => go({ name: 'encuentro', exam, modo: e.modo })}>
                {e.titulo}
              </button>
            ))}
            <button type="button" className="btn btn-ghost" onClick={() => setEntrada(false)}>
              Ir directo a las salas
            </button>
          </div>
        </Sheet>
      )}
    </main>
  )
}
