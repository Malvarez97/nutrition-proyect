-- Muslo y brazo izquierdo/derecho
ALTER TABLE public.body_metrics ADD COLUMN IF NOT EXISTS left_thigh DECIMAL(10, 2);
ALTER TABLE public.body_metrics ADD COLUMN IF NOT EXISTS right_thigh DECIMAL(10, 2);
ALTER TABLE public.body_metrics ADD COLUMN IF NOT EXISTS left_biceps DECIMAL(10, 2);
ALTER TABLE public.body_metrics ADD COLUMN IF NOT EXISTS right_biceps DECIMAL(10, 2);
