-- Staff: acceso a pacientes. Usa is_staff() para no consultar profiles dentro de policies de profiles (recursión).

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('professional', 'admin')
  );
$$;

REVOKE ALL ON FUNCTION public.is_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;

DROP POLICY IF EXISTS "profiles_staff_select_all_users" ON public.profiles;
DROP POLICY IF EXISTS "profiles_staff_update_users" ON public.profiles;
DROP POLICY IF EXISTS "goals_staff_select" ON public.goals;
DROP POLICY IF EXISTS "goals_staff_insert" ON public.goals;
DROP POLICY IF EXISTS "goals_staff_update" ON public.goals;
DROP POLICY IF EXISTS "meal_entries_staff_read_users" ON public.meal_entries;
DROP POLICY IF EXISTS "weekly_controls_staff_read" ON public.weekly_controls;
DROP POLICY IF EXISTS "body_metrics_staff_read" ON public.body_metrics;

CREATE POLICY "profiles_staff_select_all_users"
  ON public.profiles FOR SELECT TO authenticated
  USING (role = 'user' AND public.is_staff());

CREATE POLICY "profiles_staff_update_users"
  ON public.profiles FOR UPDATE TO authenticated
  USING (profiles.role = 'user' AND public.is_staff());

CREATE POLICY "goals_staff_select" ON public.goals FOR SELECT TO authenticated
  USING (public.is_staff() AND EXISTS (SELECT 1 FROM public.profiles u WHERE u.id = goals.user_id AND u.role = 'user'));

CREATE POLICY "goals_staff_insert" ON public.goals FOR INSERT TO authenticated
  WITH CHECK (public.is_staff() AND EXISTS (SELECT 1 FROM public.profiles u WHERE u.id = goals.user_id AND u.role = 'user'));

CREATE POLICY "goals_staff_update" ON public.goals FOR UPDATE TO authenticated
  USING (public.is_staff() AND EXISTS (SELECT 1 FROM public.profiles u WHERE u.id = goals.user_id AND u.role = 'user'));

CREATE POLICY "meal_entries_staff_read_users" ON public.meal_entries FOR SELECT TO authenticated
  USING (public.is_staff() AND EXISTS (SELECT 1 FROM public.profiles u WHERE u.id = meal_entries.user_id AND u.role = 'user'));

CREATE POLICY "weekly_controls_staff_read" ON public.weekly_controls FOR SELECT TO authenticated
  USING (public.is_staff() AND EXISTS (SELECT 1 FROM public.profiles u WHERE u.id = weekly_controls.user_id AND u.role = 'user'));

CREATE POLICY "body_metrics_staff_read" ON public.body_metrics FOR SELECT TO authenticated
  USING (public.is_staff() AND EXISTS (SELECT 1 FROM public.profiles u WHERE u.id = body_metrics.user_id AND u.role = 'user'));
