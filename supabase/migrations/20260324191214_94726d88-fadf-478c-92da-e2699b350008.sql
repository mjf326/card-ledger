ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS graded boolean NOT NULL DEFAULT false;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS grading_cost numeric DEFAULT NULL;