import { Px } from '../components/ui'
import { LOCK, MEDAL } from '../game/sprites'
import { earnedMedal, examProgress, lessonUnlocked, useApp } from '../lib/app'
import { examInfo, type ExamCode } from '../lib/types'

export function Building({ exam }: { exam: ExamCode }) {
  const { state, lessons, go } = useApp()
  const info = examInfo(exam)
  const list = lessons[exam]
  const prog = examProgress(state, list)
  const medal = earnedMedal(state, list)

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
      </header>

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
                    {d ? `Mejor puntaje: ${d.best} de ${d.total}` : `${l.questions.length} preguntas`}
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
    </main>
  )
}
