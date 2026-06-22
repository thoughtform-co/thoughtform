-- ═══════════════════════════════════════════════════════════════
-- BRANDMARK PRESETS
-- Shareable saved tuning combos for the Services-centerpiece brandmark
-- (BrandmarkPhysicsCore, ADR-023), authored in the
-- /test/brandmark-physics-core tuning lab. Each row is an IMMUTABLE snapshot
-- keyed by a short shareable slug (e.g. "k3f9az").
--
-- RLS note (deliberate deviation): the tuning lab is an UNAUTHENTICATED
-- (internal) dev page, so presets are anon-insertable + anon-readable. Rows are
-- immutable (no UPDATE / DELETE policy) and hold non-sensitive particle
-- settings only; size + format CHECKs bound abuse. This intentionally differs
-- from the authenticated-only admin preset tables (ui_component_presets,
-- shape_presets) — see ADR-023 § Tuning lab + presets.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS brandmark_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  label text,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT brandmark_presets_slug_fmt CHECK (slug ~ '^[a-z0-9]{4,16}$'),
  CONSTRAINT brandmark_presets_label_len CHECK (label IS NULL OR char_length(label) <= 120),
  CONSTRAINT brandmark_presets_settings_size CHECK (char_length(settings::text) <= 8000)
);

CREATE INDEX IF NOT EXISTS idx_brandmark_presets_slug ON brandmark_presets(slug);

ALTER TABLE brandmark_presets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brandmark_presets anon insert" ON brandmark_presets;
CREATE POLICY "brandmark_presets anon insert" ON brandmark_presets
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "brandmark_presets anon select" ON brandmark_presets;
CREATE POLICY "brandmark_presets anon select" ON brandmark_presets
  FOR SELECT TO anon, authenticated USING (true);
