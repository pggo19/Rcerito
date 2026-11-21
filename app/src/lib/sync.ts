import { supabase } from './supabase'

/** Guarda la respuesta en la nube solo si hay sesión iniciada; sin sesión el progreso vive en el teléfono. */
export async function recordAnswer(questionId: string, chosen: string, isCorrect: boolean, mode: 'leccion' | 'banco' | 'simulacro') {
  try {
    const { data } = await supabase.auth.getSession()
    const user = data.session?.user
    if (!user) return
    await supabase.from('answers').insert({ user_id: user.id, question_id: questionId, chosen, is_correct: isCorrect, mode })
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
