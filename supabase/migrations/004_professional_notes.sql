-- Profesionales pueden ver todos los perfiles de usuarios (para asignar planes)
CREATE POLICY "profiles_professional_select_users"
  ON public.profiles FOR SELECT
  USING (
    role = 'user'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'professional'
    )
  );

-- Notas internas del profesional sobre cada paciente
CREATE TABLE IF NOT EXISTS public.professional_patient_notes (
  professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (professional_id, user_id)
);

ALTER TABLE public.professional_patient_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notes_professional_all"
  ON public.professional_patient_notes FOR ALL
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

-- Usuario puede actualizar su respuesta al feedback
CREATE POLICY "feedbacks_user_update_response"
  ON public.feedbacks FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Respuesta del usuario al feedback (opcional)
ALTER TABLE public.feedbacks ADD COLUMN IF NOT EXISTS user_response TEXT;
ALTER TABLE public.feedbacks ADD COLUMN IF NOT EXISTS user_responded_at TIMESTAMPTZ;

-- Email en profiles para búsqueda (se actualiza en trigger)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Profesionales pueden leer datos de sus pacientes (para reportes/vista)
CREATE POLICY "body_metrics_professional_read"
  ON public.body_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.plan_assignments pa
      JOIN public.plans pl ON pl.id = pa.plan_id
      WHERE pa.user_id = body_metrics.user_id AND pl.professional_id = auth.uid()
    )
  );

CREATE POLICY "weekly_controls_professional_read"
  ON public.weekly_controls FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.plan_assignments pa
      JOIN public.plans pl ON pl.id = pa.plan_id
      WHERE pa.user_id = weekly_controls.user_id AND pl.professional_id = auth.uid()
    )
  );

CREATE POLICY "meal_entries_professional_read"
  ON public.meal_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.plan_assignments pa
      JOIN public.plans pl ON pl.id = pa.plan_id
      WHERE pa.user_id = meal_entries.user_id AND pl.professional_id = auth.uid()
    )
  );

-- Actualizar trigger para incluir email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
