import { supabase } from './supabase'

// Con sesión iniciada, la nube corrige cada respuesta (registrar_respuestas) y lleva el
// repaso espaciado. Sin sesión, el progreso vive en el teléfono.
export async function recordAnswer(questionId: string, chosen: string, _isCorrect: boolean, mode: 'leccion' | 'banco' | 'simulacro') {
  try {
    const { data } = await supabase.auth.getSession()
    if (!data.session?.user || mode === 'simulacro') return
    await supabase.rpc('registrar_respuestas', {
      p: [{ client_id: crypto.randomUUID(), question_id: questionId, elegida: chosen, modo: mode, answered_at: new Date().toISOString() }],
    })
  } catch {
    /* sin red: no bloquea el estudio */
  }
}

export async function sendReport(questionId: string, motivo: string) {
  try {
    const { data } = await supabase.auth.getSession()
    const user = data.session?.user
    if (!user) return
    await supabase.from('question_reports').insert({ user_id: user.id, question_id: questionId, motivo })
  } catch {
    /* se reintenta en una versión futura desde la cola local */
  }
}
