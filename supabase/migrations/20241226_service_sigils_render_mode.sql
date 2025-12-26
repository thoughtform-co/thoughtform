-- ═══════════════════════════════════════════════════════════════════
-- ADD MISSING COLUMNS TO SERVICE SIGILS
-- Adds size, offset, and render_mode columns for full sigil config
-- ═══════════════════════════════════════════════════════════════════

-- Add size column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_sigils' AND column_name = 'size'
  ) THEN
    ALTER TABLE service_sigils 
    ADD COLUMN size integer DEFAULT 140;
  END IF;
END $$;

-- Add offset_x column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_sigils' AND column_name = 'offset_x'
  ) THEN
    ALTER TABLE service_sigils 
    ADD COLUMN offset_x integer DEFAULT 0;
  END IF;
END $$;

-- Add offset_y column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_sigils' AND column_name = 'offset_y'
  ) THEN
    ALTER TABLE service_sigils 
    ADD COLUMN offset_y integer DEFAULT 0;
  END IF;
END $$;

-- Add render_mode column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_sigils' AND column_name = 'render_mode'
  ) THEN
    ALTER TABLE service_sigils 
    ADD COLUMN render_mode text DEFAULT 'sigil';
  END IF;
END $$;

-- Add comments
COMMENT ON COLUMN service_sigils.size IS 'Sigil size in pixels (default 140, max ~400 for full bleed)';
COMMENT ON COLUMN service_sigils.offset_x IS 'Horizontal offset as percentage (-50 to 50, 0 = centered)';
COMMENT ON COLUMN service_sigils.offset_y IS 'Vertical offset as percentage (-50 to 50, 0 = centered)';
COMMENT ON COLUMN service_sigils.render_mode IS 'Render mode: sigil (2D flat) or landmark (3D rotating)';

