-- ═══════════════════════════════════════════════════════════════════
-- CELESTIAL CONNECTORS — designs + slot assignments
-- Parametric SVG diagrams rendered between landing page sections.
-- Public read (server-side RSC fetch); writes via service role only.
-- ═══════════════════════════════════════════════════════════════════

-- ── celestial_designs ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS celestial_designs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  config      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE celestial_designs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON celestial_designs
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert" ON celestial_designs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON celestial_designs
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON celestial_designs
  FOR DELETE TO authenticated USING (true);

-- ── celestial_slots ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS celestial_slots (
  slot_id     text PRIMARY KEY,
  design_id   uuid REFERENCES celestial_designs(id) ON DELETE SET NULL,
  orientation text NOT NULL DEFAULT 'horizontal',
  enabled     boolean NOT NULL DEFAULT true,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE celestial_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON celestial_slots
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert" ON celestial_slots
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON celestial_slots
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON celestial_slots
  FOR DELETE TO authenticated USING (true);

-- Pre-create the three known slot positions
INSERT INTO celestial_slots (slot_id) VALUES
  ('definition-to-continuum'),
  ('continuum-to-practice'),
  ('practice-to-about')
ON CONFLICT (slot_id) DO NOTHING;
