-- Bucket para fotos semanales
-- Ejecutar si el bucket no existe (Supabase Dashboard > Storage)

INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos-semanales', 'fotos-semanales', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas: usuarios pueden subir/leer sus propias fotos
CREATE POLICY "Users can upload own photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'fotos-semanales'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read own photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'fotos-semanales'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'fotos-semanales'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
