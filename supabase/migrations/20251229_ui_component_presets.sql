-- ═══════════════════════════════════════════════════════════════
-- UI COMPONENT PRESETS TABLE
-- Stores saved UI component configurations from Astrogation
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ui_component_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  component_key text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for faster lookups by component type
CREATE INDEX IF NOT EXISTS idx_ui_component_presets_component_key 
  ON ui_component_presets(component_key);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_ui_component_presets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_ui_component_presets_updated_at ON ui_component_presets;
CREATE TRIGGER set_ui_component_presets_updated_at
  BEFORE UPDATE ON ui_component_presets
  FOR EACH ROW
  EXECUTE FUNCTION update_ui_component_presets_updated_at();

-- RLS policies (admin only for now)
ALTER TABLE ui_component_presets ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated read" ON ui_component_presets
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated insert" ON ui_component_presets
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated update" ON ui_component_presets
  FOR UPDATE TO authenticated USING (true);

-- Allow authenticated users to delete
CREATE POLICY "Allow authenticated delete" ON ui_component_presets
  FOR DELETE TO authenticated USING (true);

