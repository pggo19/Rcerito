import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Hud, NavBar, type Tab } from './components/ui'
import { Ctx, type AppCtx } from './lib/app'
import { buildLessons, loadQuestions } from './lib/questions'
import { useGame } from './lib/store'
import type { ExamCode, Question, Screen } from './lib/types'
import bundled from './data/questions.json'
import { Building } from './screens/Building'
import { Campus } from './screens/Campus'
import { LessonScreen } from './screens/Lesson'
import { Onboarding } from './screens/Onboarding'
import { Perfil, Pro } from './screens/Perfil'
import { Banco, Flashcards, Plaza } from './screens/Plaza'
import { Simulacro } from './screens/Simulacro'

const TAB_OF: Partial<Record<Screen['name'], Tab>> = {
  campus: 'campus',
  building: 'campus',
  plaza: 'plaza',
  banco: 'plaza',
  flashcards: 'plaza',
  simulacro: 'simulacro',
  perfil: 'perfil',
  pro: 'perfil',
}

export default function App() {
  const { state, update, reset } = useGame()
  const [questions, setQuestions] = useState<Question[]>(bundled as unknown as Question[])
  const [source, setSource] = useState<'nube' | 'local'>('local')
  const [screen, setScreen] = useState<Screen>(() => (state.target ? { name: 'campus' } : { name: 'onboarding' }))
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const toastTimer = useRef<number>(0)

  useEffect(() => {
    loadQuestions().then((r) => {
      setQuestions(r.questions)
      setSource(r.source)
    })
  }, [])

  const lessons = useMemo(
    () => ({
      ESSALUD: buildLessons(questions, 'ESSALUD'),
      ENAM: buildLessons(questions, 'ENAM'),
      SERUMS: buildLessons(questions, 'SERUMS'),
    }) as Record<ExamCode, ReturnType<typeof buildLessons>>,
    [questions],
  )

  const go = useCallback((s: Screen) => {
    setScreen(s)
    window.scrollTo({ top: 0 })
  }, [])

  const toast = useCallback((msg: string) => {
    setToastMsg(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2800)
  }, [])

  const ctx: AppCtx = { state, update, reset, questions, source, lessons, go, toast }
  const tab = TAB_OF[screen.name]
  const immersive = screen.name === 'lesson' || screen.name === 'onboarding'

  return (
    <Ctx.Provider value={ctx}>
      <div className={`app ${immersive ? 'is-immersive' : ''}`}>
        {!immersive && <Hud state={state} onLives={() => toast(state.pro ? 'Tienes vidas ilimitadas' : 'Recuperas 1 vida cada 30 minutos')} />}
        {screen.name === 'onboarding' && <Onboarding />}
        {screen.name === 'campus' && <Campus />}
        {screen.name === 'building' && <Building exam={screen.exam} />}
        {screen.name === 'lesson' && <LessonScreen lessonId={screen.lessonId} />}
        {screen.name === 'plaza' && <Plaza />}
        {screen.name === 'banco' && <Banco />}
        {screen.name === 'flashcards' && <Flashcards />}
        {screen.name === 'simulacro' && <Simulacro exam={screen.exam} />}
        {screen.name === 'perfil' && <Perfil />}
        {screen.name === 'pro' && <Pro />}
        {!immersive && tab && <NavBar active={tab} onGo={(t) => go({ name: t })} />}
        {toastMsg && (
          <div className="toast px" role="status">
            {toastMsg}
          </div>
        )}
      </div>
    </Ctx.Provider>
  )
}
