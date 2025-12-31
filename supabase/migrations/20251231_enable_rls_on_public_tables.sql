-- ═══════════════════════════════════════════════════════════════════
-- ENABLE RLS ON PUBLIC TABLES
-- Security fix: Enable Row Level Security on tables exposed to PostgREST
-- ═══════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════
-- SHAPE_PRESETS - Orrery particle shape configurations
-- Public read, authenticated write
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE shape_presets ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read shape presets (needed for website display)
CREATE POLICY "Allow public read" ON shape_presets
  FOR SELECT USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated insert" ON shape_presets
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated update" ON shape_presets
  FOR UPDATE TO authenticated USING (true);

-- Allow authenticated users to delete
CREATE POLICY "Allow authenticated delete" ON shape_presets
  FOR DELETE TO authenticated USING (true);


-- ═══════════════════════════════════════════════════════════════════
-- MANIFESTO_VOICES - Video testimonials for manifesto section
-- Public read, authenticated write
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE manifesto_voices ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read voices (needed for website display)
CREATE POLICY "Allow public read" ON manifesto_voices
  FOR SELECT USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated insert" ON manifesto_voices
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated update" ON manifesto_voices
  FOR UPDATE TO authenticated USING (true);

-- Allow authenticated users to delete
CREATE POLICY "Allow authenticated delete" ON manifesto_voices
  FOR DELETE TO authenticated USING (true);


-- ═══════════════════════════════════════════════════════════════════
-- SERVICE_SIGILS - Service card sigil configurations
-- Public read, authenticated write
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE service_sigils ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read sigils (needed for website display)
CREATE POLICY "Allow public read" ON service_sigils
  FOR SELECT USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated insert" ON service_sigils
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated update" ON service_sigils
  FOR UPDATE TO authenticated USING (true);

-- Allow authenticated users to delete
CREATE POLICY "Allow authenticated delete" ON service_sigils
  FOR DELETE TO authenticated USING (true);

