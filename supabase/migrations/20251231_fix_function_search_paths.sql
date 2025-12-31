-- ═══════════════════════════════════════════════════════════════════
-- FIX FUNCTION SEARCH PATHS
-- Security: Set explicit search_path on trigger functions
-- ═══════════════════════════════════════════════════════════════════

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix update_ui_component_presets_updated_at function
CREATE OR REPLACE FUNCTION public.update_ui_component_presets_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

