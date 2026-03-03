-- =============================================================================
-- FASE 1 — Modelado de Base de Datos
-- Ejecutar todo este archivo en el SQL Editor de Supabase
-- =============================================================================

-- Limpiar objetos existentes (para re-ejecución)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP TABLE IF EXISTS public.task_completions CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.plan_assignments CASCADE;
DROP TABLE IF EXISTS public.plans CASCADE;
DROP TABLE IF EXISTS public.feedbacks CASCADE;
DROP TABLE IF EXISTS public.goals CASCADE;
DROP TABLE IF EXISTS public.weekly_controls CASCADE;
DROP TABLE IF EXISTS public.body_metrics CASCADE;
DROP TABLE IF EXISTS public.meal_foods CASCADE;
DROP TABLE IF EXISTS public.meal_entries CASCADE;
DROP TABLE IF EXISTS public.foods CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- =============================================================================
-- Paso 1.1 — Usuarios y Roles (profiles)
-- =============================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'professional')),
  name TEXT,
  age INTEGER,
  objective TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.plan_assignments pa
      JOIN public.plans pl ON pl.id = pa.plan_id
      WHERE pa.user_id = profiles.id AND pl.professional_id = auth.uid()
    )
  );

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =============================================================================
-- Paso 1.2 — Base de alimentos (solo profesional)
-- =============================================================================
CREATE TABLE public.foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  calories DECIMAL(10, 2),
  macros JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;

-- Solo el profesional dueño puede gestionar sus alimentos
CREATE POLICY "foods_select_own"
  ON public.foods FOR SELECT
  USING (professional_id = auth.uid());

CREATE POLICY "foods_insert_own"
  ON public.foods FOR INSERT
  WITH CHECK (professional_id = auth.uid());

CREATE POLICY "foods_update_own"
  ON public.foods FOR UPDATE
  USING (professional_id = auth.uid());

CREATE POLICY "foods_delete_own"
  ON public.foods FOR DELETE
  USING (professional_id = auth.uid());

-- Usuarios pueden leer foods si tienen un plan asignado por ese profesional
CREATE POLICY "foods_select_by_assigned_professional"
  ON public.foods FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.plan_assignments pa
      JOIN public.plans pl ON pl.id = pa.plan_id
      WHERE pa.user_id = auth.uid() AND pl.professional_id = foods.professional_id
    )
  );

-- =============================================================================
-- Paso 1.3 — Registro de comidas
-- =============================================================================
CREATE TABLE public.meal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  emotion TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.meal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meal_entries_all_own"
  ON public.meal_entries FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE public.meal_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_entry_id UUID NOT NULL REFERENCES public.meal_entries(id) ON DELETE CASCADE,
  food_id UUID REFERENCES public.foods(id) ON DELETE SET NULL,
  custom_name TEXT,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT meal_foods_name_or_food CHECK (
    food_id IS NOT NULL OR custom_name IS NOT NULL
  )
);

ALTER TABLE public.meal_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meal_foods_select_via_entry"
  ON public.meal_foods FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_entries
      WHERE meal_entries.id = meal_foods.meal_entry_id AND meal_entries.user_id = auth.uid()
    )
  );

CREATE POLICY "meal_foods_insert_via_entry"
  ON public.meal_foods FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meal_entries
      WHERE meal_entries.id = meal_foods.meal_entry_id AND meal_entries.user_id = auth.uid()
    )
  );

CREATE POLICY "meal_foods_update_via_entry"
  ON public.meal_foods FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_entries
      WHERE meal_entries.id = meal_foods.meal_entry_id AND meal_entries.user_id = auth.uid()
    )
  );

CREATE POLICY "meal_foods_delete_via_entry"
  ON public.meal_foods FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_entries
      WHERE meal_entries.id = meal_foods.meal_entry_id AND meal_entries.user_id = auth.uid()
    )
  );

-- =============================================================================
-- Paso 1.4 — Métricas corporales
-- =============================================================================
CREATE TABLE public.body_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight DECIMAL(10, 2),
  neck DECIMAL(10, 2),
  shoulders DECIMAL(10, 2),
  chest DECIMAL(10, 2),
  waist DECIMAL(10, 2),
  hip DECIMAL(10, 2),
  thigh DECIMAL(10, 2),
  arm DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.body_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "body_metrics_all_own"
  ON public.body_metrics FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- Paso 1.5 — Control semanal
-- =============================================================================
CREATE TABLE public.weekly_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  front_photo_url TEXT,
  side_photo_url TEXT,
  weight DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.weekly_controls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weekly_controls_all_own"
  ON public.weekly_controls FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- Paso 1.6 — Objetivos
-- =============================================================================
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_weight DECIMAL(10, 2),
  daily_calories INTEGER,
  protein INTEGER,
  carbs INTEGER,
  fats INTEGER,
  water INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goals_all_own"
  ON public.goals FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- Paso 1.7 — Feedback
-- =============================================================================
CREATE TABLE public.feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_date DATE NOT NULL,
  general_observation TEXT,
  adjustments TEXT,
  recommendations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedbacks_professional_manage"
  ON public.feedbacks FOR ALL
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

CREATE POLICY "feedbacks_user_read"
  ON public.feedbacks FOR SELECT
  USING (user_id = auth.uid());

-- =============================================================================
-- Paso 1.8 — Planes
-- =============================================================================
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  version TEXT DEFAULT '1.0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans_professional_manage"
  ON public.plans FOR ALL
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

CREATE POLICY "plans_user_read_assigned"
  ON public.plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.plan_assignments
      WHERE plan_assignments.plan_id = plans.id AND plan_assignments.user_id = auth.uid()
    )
  );

CREATE TABLE public.plan_assignments (
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (plan_id, user_id)
);

ALTER TABLE public.plan_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plan_assignments_professional_manage"
  ON public.plan_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.plans
      WHERE plans.id = plan_assignments.plan_id AND plans.professional_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.plans
      WHERE plans.id = plan_assignments.plan_id AND plans.professional_id = auth.uid()
    )
  );

CREATE POLICY "plan_assignments_user_read_own"
  ON public.plan_assignments FOR SELECT
  USING (user_id = auth.uid());

-- =============================================================================
-- Paso 1.9 — Tareas
-- =============================================================================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('required', 'recommended')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_professional_manage"
  ON public.tasks FOR ALL
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

CREATE POLICY "tasks_user_read_assigned"
  ON public.tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.plan_assignments pa
      JOIN public.plans pl ON pl.id = pa.plan_id
      WHERE pl.professional_id = tasks.professional_id
        AND pa.user_id = auth.uid()
    )
  );

CREATE TABLE public.task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, task_id, date)
);

ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_completions_user_manage"
  ON public.task_completions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "task_completions_professional_read"
  ON public.task_completions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_completions.task_id AND t.professional_id = auth.uid()
    )
  );

-- =============================================================================
-- Trigger: crear perfil al registrarse
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- Fin Fase 1
-- =============================================================================
