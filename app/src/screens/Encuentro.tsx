import { useMemo, useState } from 'react'
import { QuestionView } from '../components/QuestionView'
import { MiUku } from '../components/Personaje'
import { Px, UkuSays } from '../components/ui'
import { GEM, UKU, UKU_HAPPY, UKU_SAD, type Sprite } from '../game/sprites'
import { useApp } from '../lib/app'
import {
  COSTO_DESCARTE,
  COSTO_REPARAR_GRATIS,
  DESAFIO_N,
  PREMIO,
  REPARAR_MIN,
  REPARAR_N,
  INCIDENTES,
  ataquePendiente,
  contarRespuesta,
  darInsignia,
  desafioHecho,
  gemas,
  hayPasillo,
  incidenteDe,
  incidenteDelDia,
  insignia,
  preguntasDe,
  quitarInsignia,
  rival,
  xp,
} from '../lib/eventos'
import { AUTO_REPAIR_MS } from '../lib/store'
import { recordAnswer, sendReport } from '../lib/sync'
import { edificio, examInfo, type ExamCode, type Modo } from '../lib/types'

type Fase = 'intro' | 'pregunta' | 'fin'

interface Resultado {
  titulo: string
  texto: string
  tono: 'ok' | 'bad' | 'neutral'
  gemas: number
  insignias: string[]
}

export function Encuentro({ exam, modo }: { exam: ExamCode; modo: Modo }) {
  const app = useApp()
  const { state, update, questions, go, toast } = app
  const info = examInfo(exam)
  const [intento] = useState(() => Math.floor(Math.random() * 1e6))
  const qs = useMemo(() => preguntasDe(modo, questions, exam, undefined, intento), [modo, questions, exam, intento])
  // el incidente que hay que remediar, o el que pasará hoy si se pierde el ataque
  const [inc] = useState(() => incidenteDe(state, exam) ?? incidenteDelDia(exam))
  const r = rival(modo, qs[0], exam, inc)

  // el desafío se puede retomar donde quedó
  const inicio = modo === 'desafio' ? (state.ev.desafio[exam]?.n ?? 0) : 0
  const [i, setI] = useState(inicio)
  const [ok, setOk] = useState(modo === 'desafio' ? (state.ev.desafio[exam]?.ok ?? 0) : 0)
  const [fase, setFase] = useState<Fase>('intro')
  const [linea, setLinea] = useState(r.intro)
  const [descarte, setDescarte] = useState<string[]>([])
  const [golpe, setGolpe] = useState<'rival' | 'uku' | null>(null)
  const [res, setRes] = useState<Resultado | null>(null)
  const [ukuHp, setUkuHp] = useState(100)
  const [respondida, setRespondida] = useState(false)

  const disponible =
    modo === 'ataque' ? ataquePendiente(state, exam) : modo === 'desafio' ? !desafioHecho(state, exam) : modo === 'pasillo' ? hayPasillo(state, exam) : Boolean(incidenteDe(state, exam))

  const total = modo === 'ataque' || modo === 'pasillo' ? 1 : modo === 'desafio' ? DESAFIO_N : REPARAR_N
  const q = qs[i]
  const volver = () => go({ name: 'building', exam })

  // barra del rival: amenaza que baja, o incidente/paciente que se recupera
  const rivalHp =
    modo === 'ataque' ? (respondida && ok > 0 ? 0 : 100) : modo === 'desafio' ? Math.round(((total - i - (respondida ? 1 : 0)) / total) * 100) : Math.round((ok / (modo === 'reparar' ? REPARAR_MIN : 1)) * 100)
  const rivalBarLabel = modo === 'ataque' ? 'Amenaza' : modo === 'desafio' ? 'Tiempo' : modo === 'reparar' ? inc.barra : 'Salud'

  const sacudir = (quien: 'rival' | 'uku') => {
    setGolpe(quien)
    window.setTimeout(() => setGolpe(null), 450)
  }

  /* ----- menú ----- */

  const empezar = () => {
    if (modo === 'reparar' && !state.pro) {
      if (state.gems < COSTO_REPARAR_GRATIS) return
      update((s) => gemas(s, -COSTO_REPARAR_GRATIS))
    }
    if (modo === 'desafio' && !state.ev.desafio[exam]) update((s) => ({ ...s, ev: { ...s.ev, desafio: { ...s.ev.desafio, [exam]: { ok: 0, n: 0 } } } }))
    setLinea(modo === 'ataque' ? '¡Uku se pone el mandil! Responde para defender.' : modo === 'reparar' ? `${inc.remedio}: cada acierto cuenta.` : modo === 'pasillo' ? 'Revisas al paciente…' : '¡Corre el reloj!')
    setFase('pregunta')
  }

  const usarDescarte = () => {
    const gratis = state.pro
    if (!gratis && state.gems < COSTO_DESCARTE) {
      toast(`Necesitas ${COSTO_DESCARTE} gemas para el Descarte`)
      return
    }
    const malas = Object.keys(q.opciones).filter((l) => l !== q.correcta)
    const fuera = malas.sort(() => Math.random() - 0.5).slice(0, 2)
    setDescarte(fuera)
    if (!gratis) update((s) => gemas(s, -COSTO_DESCARTE))
    setLinea(`Usaste Descarte: dos opciones falsas quedan tachadas${gratis ? ' (gratis con Pro)' : ` (−${COSTO_DESCARTE} gemas)`}.`)
  }

  const huir = () => {
    update((s) => darInsignia({ ...gemas(s, PREMIO.huir), ev: { ...s.ev, huidas: s.ev.huidas + 1 } }, 'huida'))
    toast(`Huiste. La emergencia sigue y perdiste ${-PREMIO.huir} gemas.`)
    volver()
  }

  const seguirDeLargo = () => {
    update((s) => ({ ...s, ev: { ...s.ev, pasillo: { ...s.ev.pasillo, [exam]: false } } }))
    volver()
  }

  /* ----- respuesta ----- */

  const onAnswer = (correct: boolean, chosen: string) => {
    setRespondida(true)
    recordAnswer(q.id, chosen, correct, 'banco')
    if (correct) setOk((n) => n + 1)
    sacudir(correct ? 'rival' : 'uku')
    if (!correct) setUkuHp((h) => Math.max(0, h - (modo === 'ataque' ? 100 : Math.ceil(100 / total))))

    if (modo === 'ataque') {
      if (correct) {
        setLinea(`¡Bien resuelto! El caso de «${q.tema}» quedó controlado ${edificio(exam, 'en')}.`)
        update((s) => {
          let n = contarRespuesta(s, q, true)
          n = gemas(xp({ ...n, ev: { ...n.ev, ataque: { ...n.ev.ataque, [exam]: 'ganada' } } }, PREMIO.defensa.xp), PREMIO.defensa.gems)
          n = darInsignia(n, `defensor:${exam}`)
          // defender el edificio borra sus insignias rojas de incidentes
          for (const i of INCIDENTES.filter((x) => x.exam === exam)) n = quitarInsignia(n, `inc:${i.id}`)
          return n
        })
      } else {
        setLinea(`¡Salió mal! ${inc.titulo}.`)
        update((s) => {
          const n = contarRespuesta(s, q, false)
          return darInsignia(
            gemas({ ...n, incidentes: { ...n.incidentes, [exam]: { id: inc.id, at: Date.now() } }, ev: { ...n.ev, ataque: { ...n.ev.ataque, [exam]: 'perdida' } } }, PREMIO.perderTecho),
            `inc:${inc.id}`,
          )
        })
      }
      return
    }

    if (modo === 'pasillo') {
      setLinea(correct ? '«¡Gracias, doctor!» El paciente se va mejor.' : 'El paciente se va con dudas. Repasa la explicación.')
      update((s) => {
        const n = contarRespuesta({ ...s, ev: { ...s.ev, pasillo: { ...s.ev.pasillo, [exam]: correct } } }, q, correct)
        return correct ? darInsignia(gemas(n, PREMIO.pasillo), 'ojo_clinico') : n
      })
      return
    }

    if (modo === 'desafio') {
      setLinea(correct ? `¡Bien! +${PREMIO.desafioPorAcierto} gemas.` : 'Esa no. Sigue, aún hay tiempo.')
      update((s) => {
        const d = s.ev.desafio[exam] ?? { ok: 0, n: 0 }
        const n = contarRespuesta({ ...s, ev: { ...s.ev, desafio: { ...s.ev.desafio, [exam]: { ok: d.ok + (correct ? 1 : 0), n: d.n + 1 } } } }, q, correct)
        return correct ? gemas(n, PREMIO.desafioPorAcierto) : n
      })
      return
    }

    // reparar
    setLinea(correct ? '¡Viga puesta!' : 'La viga se cae. Lee la explicación y sigue.')
    update((s) => contarRespuesta(s, q, correct))
  }

  const onNext = () => {
    setDescarte([])
    setRespondida(false)
    if (i + 1 < total && i + 1 < qs.length) {
      setI(i + 1)
      return
    }
    terminar()
  }

  const terminar = () => {
    // ok ya incluye la última respuesta (se actualizó al responder)
    const aciertos = ok
    if (modo === 'ataque') {
      const gano = aciertos > 0
      setRes(
        gano
          ? { titulo: `¡Salvaste ${edificio(exam, 'el')}!`, texto: 'Uku te aplaude desde la puerta. Mañana habrá otra emergencia en el campus.', tono: 'ok', gemas: PREMIO.defensa.gems, insignias: [`defensor:${exam}`] }
          : {
              titulo: inc.titulo,
              texto: `Mientras no lo remedies, las lecciones ${edificio(exam, 'del')} dan la mitad de gemas. Misión «${inc.remedio}»: ${REPARAR_N} preguntas${state.pro ? '' : ` (${COSTO_REPARAR_GRATIS} gemas en el plan gratis)`}, o espera 24 h.`,
              tono: 'bad',
              gemas: PREMIO.perderTecho,
              insignias: [`inc:${inc.id}`],
            },
      )
    } else if (modo === 'pasillo') {
      setRes(aciertos ? { titulo: 'Paciente atendido', texto: 'Buen ojo clínico.', tono: 'ok', gemas: PREMIO.pasillo, insignias: ['ojo_clinico'] } : { titulo: 'El paciente se fue', texto: 'La pregunta quedó en tu repaso de la Plaza.', tono: 'neutral', gemas: 0, insignias: [] })
    } else if (modo === 'desafio') {
      const perfecto = aciertos === DESAFIO_N
      const cero = aciertos === 0
      update((s) => (perfecto ? darInsignia(gemas(s, PREMIO.desafioPerfecto), 'desafio_perfecto') : cero ? darInsignia(s, 'mal_dia') : s))
      setRes({
        titulo: `Desafío: ${aciertos} de ${DESAFIO_N}`,
        texto: perfecto ? '¡Perfecto! Vuelve mañana por otro.' : cero ? 'Mal día, pasa. Mañana hay revancha.' : 'Vuelve mañana por otro desafío.',
        tono: perfecto ? 'ok' : cero ? 'bad' : 'neutral',
        gemas: aciertos * PREMIO.desafioPorAcierto + (perfecto ? PREMIO.desafioPerfecto : 0),
        insignias: perfecto ? ['desafio_perfecto'] : cero ? ['mal_dia'] : [],
      })
    } else {
      const reparado = aciertos >= REPARAR_MIN
      if (reparado)
        update((s) => {
          const incidentes = { ...s.incidentes }
          delete incidentes[exam]
          return darInsignia(gemas({ ...s, incidentes }, PREMIO.reparar), 'reparador')
        })
      setRes(
        reparado
          ? { titulo: '¡Lo arreglaste!', texto: `${inc.remedio}: hecho. Las lecciones ${edificio(exam, 'del')} vuelven a dar gemas completas.`, tono: 'ok', gemas: PREMIO.reparar, insignias: ['reparador'] }
          : { titulo: 'Todavía no se resuelve', texto: `Necesitabas ${REPARAR_MIN} de ${REPARAR_N}. Puedes intentarlo otra vez.`, tono: 'bad', gemas: modo === 'reparar' && !state.pro ? -COSTO_REPARAR_GRATIS : 0, insignias: [] },
      )
    }
    setFase('fin')
  }

  /* ----- vistas ----- */

  if (!qs.length) {
    return (
      <main className="screen">
        <button type="button" className="back" onClick={volver}>
          ← {info.building}
        </button>
        <p>Aún no hay preguntas para este evento.</p>
      </main>
    )
  }

  const arena = (
    <Arena
      exam={exam}
      sprite={r.sprite}
      nombre={r.nombre}
      rivalHp={rivalHp}
      rivalBarLabel={rivalBarLabel}
      rivalBuena={modo === 'reparar' || modo === 'pasillo'}
      ukuHp={ukuHp}
      golpe={golpe}
      linea={linea}
      animo={ukuHp < 100 ? 'triste' : respondida && ok > 0 ? 'feliz' : 'normal'}
    />
  )

  if (fase === 'fin' && res) {
    return (
      <main className="screen encuentro">
        {arena}
        <UkuSays sprite={res.tono === 'ok' ? UKU_HAPPY : res.tono === 'bad' ? UKU_SAD : UKU} tone={res.tono}>
          <h2 className="feedback-title">{res.titulo}</h2>
          <p>{res.texto}</p>
        </UkuSays>
        <div className="premios">
          {res.gemas !== 0 && (
            <span className={`premio px ${res.gemas < 0 ? 'is-bad' : ''}`}>
              <Px sprite={GEM} scale={3} /> {res.gemas > 0 ? '+' : ''}
              {res.gemas}
            </span>
          )}
          {res.insignias.map((id) => {
            const b = insignia(id)
            return (
              <span key={id} className={`premio px ${b.mala ? 'is-bad' : ''}`}>
                <Px sprite={b.sprite} scale={3} /> {b.nombre}
              </span>
            )
          })}
        </div>
        <div className="stack">
          {modo === 'ataque' && res.tono === 'bad' && (
            <button type="button" className="btn btn-block" onClick={() => go({ name: 'encuentro', exam, modo: 'reparar' })}>
              {inc.remedio}
            </button>
          )}
          {modo === 'reparar' && res.tono === 'bad' && (
            <button type="button" className="btn btn-block" onClick={() => go({ name: 'building', exam })}>
              Intentar más tarde
            </button>
          )}
          <button type="button" className="btn btn-secondary btn-block" onClick={volver}>
            Volver {edificio(exam, 'al')}
          </button>
        </div>
      </main>
    )
  }

  if (fase === 'intro') {
    const pend = state.incidentes[exam]
    const horas = pend ? Math.max(1, Math.ceil((AUTO_REPAIR_MS - (Date.now() - pend.at)) / 3600000)) : 0
    return (
      <main className="screen encuentro">
        <button type="button" className="back" onClick={volver}>
          ← {info.building}
        </button>
        {arena}
        {!disponible ? (
          <div className="stack">
            <p className="muted">{modo === 'reparar' ? 'Aquí no hay nada que remediar.' : 'Este evento ya terminó por hoy. Vuelve mañana.'}</p>
            <button type="button" className="btn btn-block" onClick={volver}>
              Volver
            </button>
          </div>
        ) : (
          <div className="battle-menu" role="group" aria-label="Acciones">
            {modo === 'ataque' && (
              <>
                <button type="button" className="btn" onClick={empezar}>
                  Defender
                </button>
                <button type="button" className="btn btn-secondary" onClick={huir}>
                  Huir <small>−{-PREMIO.huir} gemas</small>
                </button>
              </>
            )}
            {modo === 'pasillo' && (
              <>
                <button type="button" className="btn" onClick={empezar}>
                  Atender
                </button>
                <button type="button" className="btn btn-secondary" onClick={seguirDeLargo}>
                  Seguir de largo
                </button>
              </>
            )}
            {modo === 'desafio' && (
              <>
                <button type="button" className="btn" onClick={empezar}>
                  {inicio > 0 ? `Seguir (${inicio}/${DESAFIO_N})` : 'Empezar'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={volver}>
                  Luego
                </button>
              </>
            )}
            {modo === 'reparar' &&
              (state.pro ? (
                <button type="button" className="btn wide" onClick={empezar}>
                  {inc.remedio} (gratis con Pro)
                </button>
              ) : (
                <>
                  <button type="button" className="btn wide" onClick={empezar} disabled={state.gems < COSTO_REPARAR_GRATIS}>
                    {inc.remedio}: {COSTO_REPARAR_GRATIS} gemas
                  </button>
                  <button type="button" className="btn btn-gold wide" onClick={() => go({ name: 'pro' })}>
                    Gratis con Pro
                  </button>
                  <p className="muted small wide">O espera: se resuelve solo en {horas} h.</p>
                </>
              ))}
          </div>
        )}
      </main>
    )
  }

  // pregunta
  return (
    <main className="screen encuentro">
      {arena}
      {modo === 'ataque' && !respondida && (
        <div className="battle-menu" role="group" aria-label="Mochila">
          <button type="button" className="btn btn-secondary btn-small" onClick={usarDescarte} disabled={descarte.length > 0}>
            Mochila: Descarte {state.pro ? '(gratis)' : `(${COSTO_DESCARTE} gemas)`}
          </button>
          <button type="button" className="btn btn-secondary btn-small" onClick={huir}>
            Huir
          </button>
        </div>
      )}
      {(modo === 'desafio' || modo === 'reparar') && (
        <p className="muted small">
          Pregunta {i + 1} de {total}
        </p>
      )}
      <QuestionView
        key={q.id}
        question={q}
        hidden={descarte}
        onAnswer={onAnswer}
        onNext={onNext}
        onReport={(m) => {
          update((s) => ({ ...s, reports: [...s.reports, { qid: q.id, motivo: m, at: Date.now() }] }))
          sendReport(q.id, m)
          app.toast('Gracias, revisaremos esta pregunta')
        }}
        nextLabel={i + 1 < total ? 'Siguiente' : 'Ver resultado'}
      />
    </main>
  )
}

/* Arena de combate: rival arriba a la derecha, Uku abajo a la izquierda, caja de diálogo debajo. */
function Arena(p: {
  exam: ExamCode
  sprite: Sprite
  nombre: string
  rivalHp: number
  rivalBarLabel: string
  rivalBuena: boolean
  ukuHp: number
  golpe: 'rival' | 'uku' | null
  linea: string
  animo: 'normal' | 'feliz' | 'triste'
}) {
  return (
    <section className={`arena px arena-${p.exam.toLowerCase()}`} aria-label="Combate">
      <div className="arena-field">
        <div className="arena-foe">
          <Stat nombre={p.nombre} hp={p.rivalHp} label={p.rivalBarLabel} buena={p.rivalBuena} />
          <div className={`arena-sprite ${p.golpe === 'rival' ? 'is-hit' : ''}`}>
            <Px sprite={p.sprite} scale={p.sprite[0].length < 12 ? 8 : 5} alt={p.nombre} />
          </div>
        </div>
        <div className="arena-me">
          <div className={`arena-sprite ${p.golpe === 'uku' ? 'is-hit' : ''}`}>
            <MiUku animo={p.animo} size={88} />
          </div>
          <Stat nombre="Uku" hp={p.ukuHp} label="Ánimo" buena />
        </div>
      </div>
      <p className="arena-line" aria-live="polite">
        {p.linea}
      </p>
    </section>
  )
}

function Stat({ nombre, hp, label, buena }: { nombre: string; hp: number; label: string; buena: boolean }) {
  const tone = buena ? (hp > 50 ? 'hi' : hp > 20 ? 'mid' : 'lo') : hp > 50 ? 'lo' : hp > 20 ? 'mid' : 'hi'
  return (
    <div className="stat px">
      <p className="stat-name">{nombre}</p>
      <div className="stat-bar" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={hp}>
        <span className="stat-label">{label}</span>
        <span className="stat-track">
          <span className={`stat-fill tone-${tone}`} style={{ width: `${Math.max(0, Math.min(100, hp))}%` }} />
        </span>
      </div>
    </div>
  )
}
