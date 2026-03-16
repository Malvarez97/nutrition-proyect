-- Asegurar que body_metrics tenga la columna shoulders (y el resto que usa la app)
ALTER TABLE public.body_metrics ADD COLUMN IF NOT EXISTS shoulders DECIMAL(10, 2);
ALTER TABLE public.body_metrics ADD COLUMN IF NOT EXISTS neck DECIMAL(10, 2);
ALTER TABLE public.body_metrics ADD COLUMN IF NOT EXISTS chest DECIMAL(10, 2);
ALTER TABLE public.body_metrics ADD COLUMN IF NOT EXISTS waist DECIMAL(10, 2);
ALTER TABLE public.body_metrics ADD COLUMN IF NOT EXISTS hip DECIMAL(10, 2);
ALTER TABLE public.body_metrics ADD COLUMN IF NOT EXISTS left_thigh DECIMAL(10, 2);
ALTER TABLE public.body_metrics ADD COLUMN IF NOT EXISTS right_thigh DECIMAL(10, 2);
ALTER TABLE public.body_metrics ADD COLUMN IF NOT EXISTS left_biceps DECIMAL(10, 2);
ALTER TABLE public.body_metrics ADD COLUMN IF NOT EXISTS right_biceps DECIMAL(10, 2);
