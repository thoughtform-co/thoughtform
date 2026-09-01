-- ═══════════════════════════════════════════════════════════════════
-- ADR-037 owner action 2 — applied 2026-09-01 (pre-launch hardening).
--
-- Tightens every "any authenticated user can write" policy on
-- admin-owned content to an allowlisted-admin check. Public READ
-- policies (landing content) are intentionally untouched.
--
-- Provenance: this is DRAFT-20260714_tighten_admin_write_policies.sql
-- with __ADMIN_EMAIL__ filled (the NEXT_PUBLIC_ALLOWED_EMAIL value —
-- already public by construction, it ships in the client bundle) and
-- the fill-guard DO block removed with the placeholder it guarded.
-- Dated 20260901 rather than the draft's 20260714 because migrations
-- are append-only and 20260830_design_corpus is already in the remote
-- history — an out-of-order version would demand --include-all on
-- every future push.
--
-- The dashboard half of ADR-037 (owner action 1: public signups
-- disabled / invite-only) is verified separately; this migration is
-- the defense-in-depth layer, not a replacement for that setting.
-- ═══════════════════════════════════════════════════════════════════

-- Single source of truth for "is this JWT the admin?"
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) = lower('vince@thoughtform.co');
$$;

-- ── Legacy page-editor tables (auth-rls.sql) ────────────────────────
-- NOTE: nothing in live code uses these (lib/queries.ts is orphaned);
-- dropping the tables entirely is the better long-term fix (ADR-037).

DROP POLICY IF EXISTS "Authenticated users can insert pages" ON pages;
CREATE POLICY "Admin can insert pages" ON pages
  FOR INSERT TO authenticated WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Authenticated users can update pages" ON pages;
CREATE POLICY "Admin can update pages" ON pages
  FOR UPDATE TO authenticated USING (is_admin());
DROP POLICY IF EXISTS "Authenticated users can delete pages" ON pages;
CREATE POLICY "Admin can delete pages" ON pages
  FOR DELETE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Authenticated users can insert sections" ON sections;
CREATE POLICY "Admin can insert sections" ON sections
  FOR INSERT TO authenticated WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Authenticated users can update sections" ON sections;
CREATE POLICY "Admin can update sections" ON sections
  FOR UPDATE TO authenticated USING (is_admin());
DROP POLICY IF EXISTS "Authenticated users can delete sections" ON sections;
CREATE POLICY "Admin can delete sections" ON sections
  FOR DELETE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Authenticated users can insert elements" ON elements;
CREATE POLICY "Admin can insert elements" ON elements
  FOR INSERT TO authenticated WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Authenticated users can update elements" ON elements;
CREATE POLICY "Admin can update elements" ON elements
  FOR UPDATE TO authenticated USING (is_admin());
DROP POLICY IF EXISTS "Authenticated users can delete elements" ON elements;
CREATE POLICY "Admin can delete elements" ON elements
  FOR DELETE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Authenticated users can insert design log entries" ON design_log;
CREATE POLICY "Admin can insert design log entries" ON design_log
  FOR INSERT TO authenticated WITH CHECK (is_admin());

-- ── particle_config: keep per-user rows, gate the shared default row ─

DROP POLICY IF EXISTS "Users can insert their own particle config" ON particle_config;
CREATE POLICY "Users can insert their own particle config" ON particle_config
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR (id = 'default' AND user_id IS NULL AND is_admin()));

DROP POLICY IF EXISTS "Users can update their own particle config" ON particle_config;
CREATE POLICY "Users can update their own particle config" ON particle_config
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR (id = 'default' AND user_id IS NULL AND is_admin()))
  WITH CHECK (user_id = auth.uid() OR (id = 'default' AND user_id IS NULL AND is_admin()));

DROP POLICY IF EXISTS "Users can delete their own particle config" ON particle_config;
CREATE POLICY "Users can delete their own particle config" ON particle_config
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR (id = 'default' AND user_id IS NULL AND is_admin()));

-- ── Landing-content tables: public read stays, writes become admin ──

DROP POLICY IF EXISTS "Allow authenticated insert" ON shape_presets;
CREATE POLICY "Admin insert" ON shape_presets
  FOR INSERT TO authenticated WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Allow authenticated update" ON shape_presets;
CREATE POLICY "Admin update" ON shape_presets
  FOR UPDATE TO authenticated USING (is_admin());
DROP POLICY IF EXISTS "Allow authenticated delete" ON shape_presets;
CREATE POLICY "Admin delete" ON shape_presets
  FOR DELETE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Allow authenticated insert" ON manifesto_voices;
CREATE POLICY "Admin insert" ON manifesto_voices
  FOR INSERT TO authenticated WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Allow authenticated update" ON manifesto_voices;
CREATE POLICY "Admin update" ON manifesto_voices
  FOR UPDATE TO authenticated USING (is_admin());
DROP POLICY IF EXISTS "Allow authenticated delete" ON manifesto_voices;
CREATE POLICY "Admin delete" ON manifesto_voices
  FOR DELETE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Allow authenticated insert" ON service_sigils;
CREATE POLICY "Admin insert" ON service_sigils
  FOR INSERT TO authenticated WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Allow authenticated update" ON service_sigils;
CREATE POLICY "Admin update" ON service_sigils
  FOR UPDATE TO authenticated USING (is_admin());
DROP POLICY IF EXISTS "Allow authenticated delete" ON service_sigils;
CREATE POLICY "Admin delete" ON service_sigils
  FOR DELETE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Allow authenticated insert" ON celestial_designs;
CREATE POLICY "Admin insert" ON celestial_designs
  FOR INSERT TO authenticated WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Allow authenticated update" ON celestial_designs;
CREATE POLICY "Admin update" ON celestial_designs
  FOR UPDATE TO authenticated USING (is_admin());
DROP POLICY IF EXISTS "Allow authenticated delete" ON celestial_designs;
CREATE POLICY "Admin delete" ON celestial_designs
  FOR DELETE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Allow authenticated insert" ON celestial_slots;
CREATE POLICY "Admin insert" ON celestial_slots
  FOR INSERT TO authenticated WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Allow authenticated update" ON celestial_slots;
CREATE POLICY "Admin update" ON celestial_slots
  FOR UPDATE TO authenticated USING (is_admin());
DROP POLICY IF EXISTS "Allow authenticated delete" ON celestial_slots;
CREATE POLICY "Admin delete" ON celestial_slots
  FOR DELETE TO authenticated USING (is_admin());

-- ── Admin-tool tables (no public read; writes become admin) ─────────

DROP POLICY IF EXISTS "Allow authenticated read" ON ui_component_presets;
CREATE POLICY "Admin read" ON ui_component_presets
  FOR SELECT TO authenticated USING (is_admin());
DROP POLICY IF EXISTS "Allow authenticated insert" ON ui_component_presets;
CREATE POLICY "Admin insert" ON ui_component_presets
  FOR INSERT TO authenticated WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Allow authenticated update" ON ui_component_presets;
CREATE POLICY "Admin update" ON ui_component_presets
  FOR UPDATE TO authenticated USING (is_admin());
DROP POLICY IF EXISTS "Allow authenticated delete" ON ui_component_presets;
CREATE POLICY "Admin delete" ON ui_component_presets
  FOR DELETE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Allow authenticated read" ON survey_items;
CREATE POLICY "Admin read" ON survey_items
  FOR SELECT TO authenticated USING (is_admin());
DROP POLICY IF EXISTS "Allow authenticated insert" ON survey_items;
CREATE POLICY "Admin insert" ON survey_items
  FOR INSERT TO authenticated WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Allow authenticated update" ON survey_items;
CREATE POLICY "Admin update" ON survey_items
  FOR UPDATE TO authenticated USING (is_admin());
DROP POLICY IF EXISTS "Allow authenticated delete" ON survey_items;
CREATE POLICY "Admin delete" ON survey_items
  FOR DELETE TO authenticated USING (is_admin());

-- ── OPTIONAL (class B, ADR-037): brandmark_presets anon insert ──────
-- The share-slug labs write this table anonymously by design. Left
-- commented at launch (2026-09-01), a decision rather than an
-- oversight: the table feeds only (internal) lab routes, its anon
-- policy is already constrained (slug format, ≤120-char label, ≤8 KB
-- settings, no anon UPDATE/DELETE), and requiring a session would
-- break the labs' local anonymous saves. Accepted as a bounded spam
-- vector. Uncomment to require a session for inserts (the anon SELECT
-- share-link read path keeps working either way).
--
-- DROP POLICY IF EXISTS "brandmark_presets anon insert" ON brandmark_presets;
-- CREATE POLICY "brandmark_presets authenticated insert" ON brandmark_presets
--   FOR INSERT TO authenticated WITH CHECK (true);
