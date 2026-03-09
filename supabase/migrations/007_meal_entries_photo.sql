-- Foto opcional en cada entrada de comida (o entrada solo con foto)
ALTER TABLE public.meal_entries
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Comentario para documentar
COMMENT ON COLUMN public.meal_entries.photo_url IS 'URL pública de la foto de la comida (Storage). Puede ser entrada solo con foto.';

-- Profesionales pueden ver fotos de sus pacientes (Storage: path userId/meals/...)
-- Supabase Storage policy: SELECT si es dueño o si el primer segmento del path es un paciente asignado
DROP POLICY IF EXISTS "Users can read own photos" ON storage.objects;
CREATE POLICY "Users can read own photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'fotos-semanales'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.plan_assignments pa
        JOIN public.plans pl ON pl.id = pa.plan_id
        WHERE pl.professional_id = auth.uid()
          AND pa.user_id::text = (storage.foldername(name))[1]
      )
    )
  );

-- Permitir INSERT/UPDATE solo en carpetas propias (usuarios suben a su userId)
-- Las políticas existentes de upload ya restringen por (storage.foldername(name))[1] = auth.uid()
-- No cambiar INSERT/UPDATE para que profesionales no suban a carpetas de pacientes.
