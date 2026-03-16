// Deploy: supabase functions deploy create-patient
// Secrets: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (auto en proyecto Supabase)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(supabaseUrl, serviceKey)

    const jwt = authHeader.replace('Bearer ', '')
    const { data: authData, error: authErr } = await admin.auth.getUser(jwt)
    if (authErr || !authData.user) {
      return new Response(JSON.stringify({ error: 'Sesión inválida' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: staff } = await admin
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single()

    if (!staff || !['professional', 'admin'].includes(staff.role)) {
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

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: name || undefined }
    })

    if (createErr) {
      return new Response(JSON.stringify({ error: createErr.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userId = created.user.id

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

    return new Response(
      JSON.stringify({ id: userId, email, message: 'Paciente creado. Ya puede iniciar sesión.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
