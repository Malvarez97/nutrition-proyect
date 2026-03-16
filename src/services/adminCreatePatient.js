import { supabase } from '../lib/supabase'

/**
 * Crea paciente vía Edge Function (service role). Requiere deploy de create-patient.
 */
export async function createPatientViaEdgeFunction(payload) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Sesión requerida')

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
  if (!res.ok) throw new Error(json.error || `Error ${res.status}`)
  return json
}
