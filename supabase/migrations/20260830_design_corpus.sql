-- ═══════════════════════════════════════════════════════════════════
-- DESIGN CORPUS — the site's mirror of the substrate vault's design pool
--
-- The vault (02_thoughtform_astrolabe/content/substrate/) is the AUTHORITY:
-- its surveyor worker distills the reference library at
-- I:\My Drive\01_Thoughtform Branding\07_Artifacts Branding\_01_GENERAL REFERENCES
-- into `sources/ref-*.md` notes. This schema is a DERIVED, DISPOSABLE mirror,
-- pushed by scripts/design-corpus/sync.mjs and read by /api/design/mcp.
-- Rebuildable from the vault at any time; nothing here is a source of truth.
--
-- WHY IT EXISTS SEPARATELY FROM THE VAULT'S OWN CLOUD MIRROR: that mirror
-- syncs notes/passages/links only, so the vault's IMAGE vector space and its
-- facet co-occurrence map are local-disk capabilities. This table carries both
-- into a deployed surface for the first time.
--
-- ⚠ NOT `survey_items`. That table belongs to the frozen SURVEY admin tool
-- (2026-01-10), whose corpus is manually uploaded and whose RLS is
-- authenticated-read-write. This corpus is machine-synced and service-role
-- only. Two different systems; do not merge them.
-- ═══════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS vector;  -- already enabled by survey; idempotent

-- ═══════════════════════════════════════════════════════════════════
-- design_refs — one row per compiled reference note
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS design_refs (
  -- The vault's own note id, e.g. 'sources/ref-cyberpunk-weapon-chooser-3'.
  -- Natural key on purpose: the sync is an upsert keyed on identity, and a
  -- surrogate uuid would need a second lookup table to stay idempotent.
  id text PRIMARY KEY,

  title text NOT NULL,
  one_liner text,                            -- the note's `>` blockquote: the lesson in one line

  -- Provenance. `lane` records WHO MADE THE THING (canon = the field's work,
  -- groundtruth = Vince's own product captures), never what it depicts.
  lane text,
  series text,                               -- root | cyberpunk | panels | interfaces | lp | marathon
  org text,
  ingested date,
  encountered date,

  -- The absolute path into the reference library, exactly as the note states
  -- it (Windows form, spaces and all). Opaque — never normalised to posix, or
  -- the image sync stops finding files. This is what "show me the pixels"
  -- resolves to when a distillation is not enough.
  original_path text,

  -- TWO reuse keys, and they are not interchangeable:
  --   raw_sha256   the PICTURE's content hash, carried on the note's raw twin.
  --   content_hash the NOTE's hash, over its own markdown.
  -- Embedding the image on content_hash would re-embed an unchanged picture
  -- every time its prose was edited — looks equivalent, bills differently.
  raw_sha256 text,
  content_hash text NOT NULL,

  -- Which picture the STORED image vector was actually computed from.
  -- Distinct from raw_sha256 (the note's CURRENT picture hash) on purpose:
  -- reusing on raw_sha256 alone cannot tell "already embedded" from "was
  -- pending last run", so a picture that failed once would be either retried
  -- forever or skipped forever. Written ONLY on a successful embed, in the same
  -- row write as the vector, so it can never describe a vector that is absent.
  image_sha256 text,

  body text NOT NULL,                        -- full markdown, for design_read
  adopt_md text,                             -- '## Worth adopting', extracted for design_brief
  avoid_md text,                             -- '## Avoid', ditto

  -- The 17 closed-enum style axes as {axis: value}.
  -- jsonb, NOT 17 typed columns with CHECK constraints: the vault deliberately
  -- RECORDS values outside the enum as anomalies rather than discarding them
  -- ("the note says what it says"), and DDL constraints would reject exactly
  -- the drift the corpus wants visible. The enum is enforced at sync time,
  -- where it can warn instead of failing.
  facets jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- TWO VECTOR SPACES, never blended. The text space embeds the surveyor's
  -- prose about a picture; the image space embeds the pixels, so two
  -- references can be found similar on grounds nobody wrote down.
  text_embedding vector(1024),               -- voyage-3.5
  image_embedding vector(1024),              -- voyage-multimodal-3.5
  -- Why a picture has no vector ('original not found on disk', '24MB exceeds
  -- the 20MB limit', ...). A partial tier is fine; a SILENTLY partial one
  -- misleads every visual query, so the reason is stored and design_stats
  -- reports the coverage.
  image_pending_reason text,

  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_design_refs_lane ON design_refs(lane);
CREATE INDEX IF NOT EXISTS idx_design_refs_series ON design_refs(series);
-- jsonb_path_ops: smaller and faster than the default opclass for the only
-- query shape used here, containment (`facets @> '{"corner-language":"chamfered"}'`).
CREATE INDEX IF NOT EXISTS idx_design_refs_facets ON design_refs USING GIN(facets jsonb_path_ops);

-- HNSW, not IVFFlat. IVFFlat needs its `lists` tuned to the row count and
-- degrades badly when the table is small (the survey tables' lists=100 over a
-- few dozen rows is mostly empty lists); this corpus is ~53 rows today and
-- ~750 at full library coverage. HNSW needs no list tuning and behaves at
-- every size in that range.
CREATE INDEX IF NOT EXISTS idx_design_refs_text_vec ON design_refs
  USING hnsw (text_embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_design_refs_image_vec ON design_refs
  USING hnsw (image_embedding vector_cosine_ops);

-- ═══════════════════════════════════════════════════════════════════
-- design_meta — what the mirror was built with
--
-- Rows: text_embed_model · image_embed_model · embed_input_type · last_synced
--       corpus_git_sha · facet_map (the whole precomputed map) · facet_anomalies
--
-- The model rows exist so the MCP route can REFUSE to search when the mirror
-- was built by one model and the deployment is configured for another.
-- Querying across two vector spaces does not error — it returns plausible
-- nonsense, which is worse.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS design_meta (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════
-- RLS — enabled, with NO policies (deny-all)
--
-- Deliberate. Only two callers touch these tables and both hold the service
-- role: the sync script and the MCP route. Anon/authenticated access has no
-- use case, and the survey tables' `authenticated USING (true)` on all four
-- verbs is explicitly NOT the model being followed here.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE design_refs ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_meta ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════
-- SEARCH RPCs
--
-- Both return `distance` for ordering ONLY. The MCP route strips it and
-- publishes ranks: the vault's Law 5 says a reader can disagree with "dense"
-- but nobody can disagree with 0.87, which is a judgment wearing a
-- measurement's clothes. Similarity between two designs is a judgment.
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION match_design_refs(
  query_embedding vector(1024),
  match_count int DEFAULT 10,
  facet_filter jsonb DEFAULT NULL,
  filter_lane text DEFAULT NULL,
  filter_series text DEFAULT NULL
)
RETURNS TABLE (
  id text,
  title text,
  one_liner text,
  lane text,
  series text,
  facets jsonb,
  original_path text,
  distance float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.title, d.one_liner, d.lane, d.series, d.facets, d.original_path,
         (d.text_embedding <=> query_embedding)::float AS distance
  FROM design_refs d
  WHERE d.text_embedding IS NOT NULL
    AND (facet_filter IS NULL OR d.facets @> facet_filter)
    AND (filter_lane IS NULL OR d.lane = filter_lane)
    AND (filter_series IS NULL OR d.series = filter_series)
  ORDER BY d.text_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- The image space. `exclude_id` lets a caller ask "what looks like THIS note"
-- without the note itself taking rank 1 against its own vector.
CREATE OR REPLACE FUNCTION match_design_visual(
  query_embedding vector(1024),
  match_count int DEFAULT 10,
  filter_lane text DEFAULT NULL,
  exclude_id text DEFAULT NULL
)
RETURNS TABLE (
  id text,
  title text,
  one_liner text,
  lane text,
  series text,
  original_path text,
  distance float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.title, d.one_liner, d.lane, d.series, d.original_path,
         (d.image_embedding <=> query_embedding)::float AS distance
  FROM design_refs d
  WHERE d.image_embedding IS NOT NULL
    AND (exclude_id IS NULL OR d.id <> exclude_id)
    AND (filter_lane IS NULL OR d.lane = filter_lane)
  ORDER BY d.image_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Fetch one note's stored image vector, so "references that look like this
-- one" costs no embedding call. Returned as text because PostgREST renders
-- vector columns as a bracket literal anyway and the caller re-casts.
CREATE OR REPLACE FUNCTION design_image_vector(note_id text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT image_embedding::text FROM design_refs WHERE id = note_id;
$$;

-- Updated timestamp trigger (mirrors the survey tables' pattern)
CREATE OR REPLACE FUNCTION update_design_refs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_design_refs_updated_at ON design_refs;
CREATE TRIGGER set_design_refs_updated_at
  BEFORE UPDATE ON design_refs
  FOR EACH ROW
  EXECUTE FUNCTION update_design_refs_updated_at();
