// Deploy: supabase functions deploy create-patient
// SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY son auto-inyectados

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('[create-patient] Invocación POST')

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('[create-patient] 401: sin header Authorization Bearer')
      return new Response(JSON.stringify({ error: 'No autorizado: falta token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    console.log('[create-patient] SUPABASE_URL ok:', !!supabaseUrl)
    console.log('[create-patient] SUPABASE_ANON_KEY ok:', !!anonKey)
    console.log('[create-patient] SUPABASE_SERVICE_ROLE_KEY ok:', !!serviceKey)

    // Cliente con el JWT del usuario (patrón oficial Supabase Edge Functions)
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    console.log('[create-patient] getUser – id:', user?.id ?? 'null', 'error:', userError?.message ?? 'ninguno')

    if (!user?.id) {
      const msg = userError?.message || 'Token inválido o expirado'
      console.log('[create-patient] 401:', msg)
      return new Response(JSON.stringify({ error: `Sesión inválida. Cerrá sesión y volvé a entrar. [${msg}]` }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Cliente admin con service role para operaciones privilegiadas
    const admin = createClient(supabaseUrl, serviceKey)

    const { data: staff, error: staffError } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('[create-patient] role del caller:', staff?.role ?? 'sin rol', staffError?.message ?? '')

    if (!staff || !['professional', 'admin'].includes(staff.role)) {
      console.log('[create-patient] 403: rol no permitido:', staff?.role ?? 'sin perfil')
      return new Response(JSON.stringify({ error: 'Solo staff puede crear pacientes' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    const name = body.name != null ? String(body.name).trim() : ''
    const age = body.age != null && body.age !== '' ? parseInt(String(body.age), 10) : null
    const objective = ['weight_loss', 'muscle_gain', 'maintenance'].includes(body.objective)
      ? body.objective
      : 'weight_loss'
    const target_weight =
      body.target_weight != null && body.target_weight !== ''
        ? parseFloat(String(body.target_weight))
        : null
    const daily_calories =
      body.daily_calories != null && body.daily_calories !== ''
        ? parseInt(String(body.daily_calories), 10)
        : null

    if (!email || !password || password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Email y contraseña (mín. 6 caracteres) obligatorios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[create-patient] Creando usuario:', email)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: name || undefined }
    })

    if (createErr) {
      console.log('[create-patient] Error createUser:', createErr.message)
      return new Response(JSON.stringify({ error: createErr.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userId = created.user.id
    console.log('[create-patient] Usuario Auth creado:', userId)

    await admin.from('profiles').upsert(
      {
        id: userId,
        role: 'user',
        name: name || null,
        age: Number.isFinite(age) ? age : null,
        objective,
        email
      },
      { onConflict: 'id' }
    )

    if (target_weight != null || daily_calories != null) {
      await admin.from('goals').upsert(
        {
          user_id: userId,
          target_weight: Number.isFinite(target_weight) ? target_weight : null,
          daily_calories: Number.isFinite(daily_calories) ? daily_calories : null
        },
        { onConflict: 'user_id' }
      )
    }

    console.log('[create-patient] 200 OK – paciente creado:', userId)
    return new Response(
      JSON.stringify({ id: userId, email, message: 'Paciente creado. Ya puede iniciar sesión.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    console.error('[create-patient] 500:', e?.message ?? e)
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
