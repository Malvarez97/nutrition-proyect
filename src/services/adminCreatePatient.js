import { supabase } from '../lib/supabase'

/**
 * Crea paciente vía Edge Function. Usamos fetch para poder leer el mensaje exacto
 * cuando la función devuelve 401 (el cliente invoke no expone el body en ese caso).
 */
export async function createPatientViaEdgeFunction(payload) {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw new Error(sessionError.message || 'Error de sesión')
  if (!session?.access_token) throw new Error('Sesión requerida. Cerrá sesión y volvé a entrar.')

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-patient`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY
    },
    body: JSON.stringify(payload)
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401 && json.auth_detail) {
      console.error('create-patient 401 – detalle de Auth:', json.auth_detail)
      if (json.project_url) console.error('URL del proyecto donde corre la función:', json.project_url)
    }
    const msg = json.error || (res.status === 401 ? 'Sesión inválida. Abrí la consola (F12) para ver el detalle.' : `Error ${res.status}`)
    const err = new Error(msg)
    err.status = res.status
    throw err
  }
  return json
}
