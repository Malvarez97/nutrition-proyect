import { supabase } from '../lib/supabase'
import { startOfWeek, endOfWeek, format, subWeeks } from 'date-fns'

export const professionalService = {
  async getPatientDetail(professionalId, userId) {
    const { data: assignments } = await supabase
      .from('plan_assignments')
      .select('plan_id')
      .eq('user_id', userId)

    const planIds = (assignments || []).map((a) => a.plan_id)
    if (planIds.length === 0) return null

    const { data: plans } = await supabase
      .from('plans')
      .select('id')
      .eq('professional_id', professionalId)
      .in('id', planIds)

    if (!plans?.length) return null

    const [profile, goals, notes, mealEntries, weeklyControls, bodyMetrics, feedbacks] =
      await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('goals').select('*').eq('user_id', userId).single(),
        supabase
          .from('professional_patient_notes')
          .select('notes')
          .eq('professional_id', professionalId)
          .eq('user_id', userId)
          .single(),
        supabase
          .from('meal_entries')
          .select(
            `
            *,
            meal_foods (
              id, food_id, custom_name, quantity,
              foods (id, name, calories, macros, category)
            )
          `
          )
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .limit(200),
        supabase
          .from('weekly_controls')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false }),
        supabase
          .from('body_metrics')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false }),
        supabase
          .from('feedbacks')
          .select('*')
          .eq('user_id', userId)
          .order('week_date', { ascending: false })
      ])

    return {
      profile: profile.data,
      goals: goals.data,
      notes: notes.data?.notes,
      mealEntries: mealEntries.data || [],
      weeklyControls: weeklyControls.data || [],
      bodyMetrics: bodyMetrics.data || [],
      feedbacks: feedbacks.data || []
    }
  },

  async updatePatientProfile(professionalId, userId, data) {
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', userId)
    if (error) throw error
  },

  async updatePatientGoals(professionalId, userId, data) {
    const { error } = await supabase
      .from('goals')
      .upsert({ user_id: userId, ...data }, { onConflict: 'user_id' })
    if (error) throw error
  },

  async updateFeedback(professionalId, feedbackId, data) {
    const { error } = await supabase
      .from('feedbacks')
      .update(data)
      .eq('id', feedbackId)
      .eq('professional_id', professionalId)
    if (error) throw error
  },

  async getPatients(professionalId) {
    const { data: plans, error: plError } = await supabase
      .from('plans')
      .select('id')
      .eq('professional_id', professionalId)

    if (plError) throw plError
    const planIds = (plans || []).map((p) => p.id)
    if (planIds.length === 0) return []

    const { data: assignments, error: paError } = await supabase
      .from('plan_assignments')
      .select('user_id')
      .in('plan_id', planIds)

    if (paError) throw paError
    const userIds = [...new Set((assignments || []).map((a) => a.user_id))]
    if (userIds.length === 0) return []

    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('id, name, age, objective')
      .in('id', userIds)
      .eq('role', 'user')

    if (pError) throw pError

    const { data: notes } = await supabase
      .from('professional_patient_notes')
      .select('user_id, notes')
      .eq('professional_id', professionalId)

    const notesMap = Object.fromEntries(
      (notes || []).map((n) => [n.user_id, n.notes])
    )

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })
    const startStr = format(weekStart, 'yyyy-MM-dd')
    const endStr = format(weekEnd, 'yyyy-MM-dd')

    const compliancePromises = userIds.map(async (userId) => {
      const { data: entries } = await supabase
        .from('meal_entries')
        .select('date')
        .eq('user_id', userId)
        .gte('date', startStr)
        .lte('date', endStr)

      const daysWithRecords = new Set((entries || []).map((e) => e.date))
      const totalDays = 7
      const compliance = totalDays > 0
        ? Math.round((daysWithRecords.size / totalDays) * 100)
        : 0

      let status = 'bajo'
      if (compliance >= 70) status = 'activo'
      else if (compliance >= 40) status = 'regular'

      return { userId, compliance, status }
    })

    const complianceData = await Promise.all(compliancePromises)
    const complianceMap = Object.fromEntries(
      complianceData.map((c) => [c.userId, { compliance: c.compliance, status: c.status }])
    )

    const { data: latestWeights } = await supabase
      .from('weekly_controls')
      .select('user_id, weight')
      .in('user_id', userIds)
      .order('date', { ascending: false })

    const weightsByUser = {}
    for (const row of latestWeights || []) {
      if (!weightsByUser[row.user_id]) weightsByUser[row.user_id] = row.weight
    }

    const { data: emails } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', userIds)

    const emailMap = Object.fromEntries(
      (emails || []).map((e) => [e.id, e.email])
    )

    return (profiles || []).map((p) => ({
      id: p.id,
      name: p.name,
      email: emailMap[p.id],
      age: p.age,
      objective: p.objective,
      weight: weightsByUser[p.id] ?? null,
      compliance: complianceMap[p.id]?.compliance ?? 0,
      status: complianceMap[p.id]?.status ?? 'bajo',
      notes: notesMap[p.id] ?? null
    }))
  },

  async updatePatientNotes(professionalId, userId, notes) {
    const { error } = await supabase
      .from('professional_patient_notes')
      .upsert(
        {
          professional_id: professionalId,
          user_id: userId,
          notes: notes || null,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'professional_id,user_id' }
      )

    if (error) throw error
  },

  async createFeedback(professionalId, userId, weekDate, { general_observation, adjustments, recommendations }) {
    const { error } = await supabase.from('feedbacks').insert({
      professional_id: professionalId,
      user_id: userId,
      week_date: weekDate,
      general_observation: general_observation || null,
      adjustments: adjustments || null,
      recommendations: recommendations || null
    })

    if (error) throw error
  }
}
