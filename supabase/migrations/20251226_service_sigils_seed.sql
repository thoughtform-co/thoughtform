-- ═══════════════════════════════════════════════════════════════════
-- ADD SEED COLUMN TO SERVICE SIGILS
-- Enables deterministic (and editable) per-card particle variations
-- ═══════════════════════════════════════════════════════════════════

-- Add seed column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_sigils' AND column_name = 'seed'
  ) THEN
    ALTER TABLE service_sigils
    ADD COLUMN seed integer;
  END IF;
END $$;

COMMENT ON COLUMN service_sigils.seed IS 'Deterministic seed for particle placement (optional; when null, frontend falls back to default per-card seed)';


