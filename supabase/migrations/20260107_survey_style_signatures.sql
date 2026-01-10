-- ═══════════════════════════════════════════════════════════════
-- SURVEY STYLE SIGNATURES TABLE
-- Store derived style parameters and vectors for StyleSpace mixing
-- Mosaic-inspired: interpretable style features that can be mixed/interpolated
-- ═══════════════════════════════════════════════════════════════

-- Create the survey_style_signatures table
CREATE TABLE IF NOT EXISTS survey_style_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_item_id uuid NOT NULL REFERENCES survey_items(id) ON DELETE CASCADE,
  
  -- ═══════════════════════════════════════════════════════════════
  -- STYLE PARAMETERS (interpretable JSON structure)
  -- ═══════════════════════════════════════════════════════════════
  -- Contains structured style features:
  --   motifs: { brackets, reticles, tick_marks, grids, scanlines, label_styles }
  --   geometry: { sharpness, chamfer_prevalence, corner_language, line_weight_bands }
  --   composition: { density, spacing_rhythm, layering_depth, panel_hierarchy }
  --   texture: { noise, scanlines, glow, grain } (as 0-1 scalars)
  --   color_roles: { background, surface, border, accent, text } (role names, not actual colors)
  --   typography_roles: { display, body, mono } (treatment descriptions)
  --   brand_projection: { mapped tokens for each color role }
  style_params jsonb NOT NULL DEFAULT '{}',
  
  -- ═══════════════════════════════════════════════════════════════
  -- STYLE VECTOR (for similarity/mixing in StyleSpace)
  -- ═══════════════════════════════════════════════════════════════
  -- 64-dimensional interpretable vector derived from style_params
  -- Dimensions map to specific style attributes for deterministic mixing
  -- Much smaller than semantic embeddings (1024) since these are structured features
  style_vector vector(64),
  
  -- ═══════════════════════════════════════════════════════════════
  -- VERSIONING & PROVENANCE
  -- ═══════════════════════════════════════════════════════════════
  version int NOT NULL DEFAULT 1,
  source_hash text,  -- Hash of inputs used to generate (for cache invalidation)
  model_version text,  -- Claude model used for derivation
  
  -- Metadata
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure one signature per item (can be regenerated/versioned)
  UNIQUE(survey_item_id)
);

-- Indexes
CREATE INDEX idx_survey_style_signatures_item_id ON survey_style_signatures(survey_item_id);
CREATE INDEX idx_survey_style_signatures_generated ON survey_style_signatures(generated_at DESC);

-- Vector similarity index (for StyleSpace mixing)
CREATE INDEX idx_survey_style_signatures_vector ON survey_style_signatures 
  USING ivfflat (style_vector vector_cosine_ops)
  WITH (lists = 10);

-- RLS Policies
ALTER TABLE survey_style_signatures ENABLE ROW LEVEL SECURITY;

-- Users can view style signatures for items they own
CREATE POLICY "Users can view style signatures for their items"
ON survey_style_signatures FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM survey_items
    WHERE survey_items.id = survey_style_signatures.survey_item_id
    AND survey_items.user_id = auth.uid()
  )
);

-- Users can insert style signatures for items they own
CREATE POLICY "Users can insert style signatures for their items"
ON survey_style_signatures FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM survey_items
    WHERE survey_items.id = survey_style_signatures.survey_item_id
    AND survey_items.user_id = auth.uid()
  )
);

-- Users can update style signatures for items they own
CREATE POLICY "Users can update style signatures for their items"
ON survey_style_signatures FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM survey_items
    WHERE survey_items.id = survey_style_signatures.survey_item_id
    AND survey_items.user_id = auth.uid()
  )
);

-- Users can delete style signatures for items they own
CREATE POLICY "Users can delete style signatures for their items"
ON survey_style_signatures FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM survey_items
    WHERE survey_items.id = survey_style_signatures.survey_item_id
    AND survey_items.user_id = auth.uid()
  )
);

-- Add has_style_signature flag to survey_items for quick filtering
ALTER TABLE survey_items
ADD COLUMN IF NOT EXISTS has_style_signature boolean NOT NULL DEFAULT false;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_survey_style_signature_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
CREATE TRIGGER survey_style_signatures_updated_at
  BEFORE UPDATE ON survey_style_signatures
  FOR EACH ROW
  EXECUTE FUNCTION update_survey_style_signature_timestamp();

-- Trigger to update has_style_signature flag on survey_items
CREATE OR REPLACE FUNCTION update_survey_item_style_flag()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE survey_items SET has_style_signature = true WHERE id = NEW.survey_item_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE survey_items SET has_style_signature = false WHERE id = OLD.survey_item_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER survey_style_signatures_sync_flag
  AFTER INSERT OR DELETE ON survey_style_signatures
  FOR EACH ROW
  EXECUTE FUNCTION update_survey_item_style_flag();

-- ═══════════════════════════════════════════════════════════════
-- RPC FUNCTIONS FOR STYLESPACE OPERATIONS
-- ═══════════════════════════════════════════════════════════════

-- Upsert a style signature (insert or update)
CREATE OR REPLACE FUNCTION upsert_style_signature(
  p_survey_item_id uuid,
  p_style_params jsonb,
  p_style_vector vector(64),
  p_source_hash text DEFAULT NULL,
  p_model_version text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  result_id uuid;
BEGIN
  INSERT INTO survey_style_signatures (
    survey_item_id, style_params, style_vector, source_hash, model_version, version
  )
  VALUES (
    p_survey_item_id, p_style_params, p_style_vector, p_source_hash, p_model_version, 1
  )
  ON CONFLICT (survey_item_id) DO UPDATE SET
    style_params = EXCLUDED.style_params,
    style_vector = EXCLUDED.style_vector,
    source_hash = EXCLUDED.source_hash,
    model_version = EXCLUDED.model_version,
    version = survey_style_signatures.version + 1,
    generated_at = now(),
    updated_at = now()
  RETURNING id INTO result_id;
  
  RETURN result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Find similar style signatures by vector similarity
CREATE OR REPLACE FUNCTION match_style_signatures(
  query_vector vector(64),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  survey_item_id uuid,
  style_params jsonb,
  similarity float
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sss.id,
    sss.survey_item_id,
    sss.style_params,
    1 - (sss.style_vector <=> query_vector) AS similarity
  FROM survey_style_signatures sss
  WHERE 1 - (sss.style_vector <=> query_vector) > match_threshold
  ORDER BY sss.style_vector <=> query_vector
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get style signatures for multiple survey items (for batch retrieval in Foundry)
CREATE OR REPLACE FUNCTION get_style_signatures_for_items(
  p_item_ids uuid[]
)
RETURNS TABLE (
  id uuid,
  survey_item_id uuid,
  style_params jsonb,
  style_vector vector(64),
  version int,
  generated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sss.id,
    sss.survey_item_id,
    sss.style_params,
    sss.style_vector,
    sss.version,
    sss.generated_at
  FROM survey_style_signatures sss
  WHERE sss.survey_item_id = ANY(p_item_ids);
END;
$$ LANGUAGE plpgsql STABLE;

-- ═══════════════════════════════════════════════════════════════
-- COMMENTS
-- ═══════════════════════════════════════════════════════════════

COMMENT ON TABLE survey_style_signatures IS 'Derived style parameters and vectors for StyleSpace mixing (Mosaic-inspired)';
COMMENT ON COLUMN survey_style_signatures.style_params IS 'Structured JSON with motifs, geometry, composition, texture, color_roles, typography_roles, brand_projection';
COMMENT ON COLUMN survey_style_signatures.style_vector IS '64-dimensional interpretable vector for similarity/mixing in StyleSpace';
COMMENT ON COLUMN survey_style_signatures.version IS 'Incremented each time the signature is regenerated';
COMMENT ON COLUMN survey_style_signatures.source_hash IS 'Hash of inputs (briefing, annotations, segments) for cache invalidation';
COMMENT ON COLUMN survey_style_signatures.model_version IS 'Claude model version used for derivation';
COMMENT ON FUNCTION upsert_style_signature IS 'Insert or update a style signature, auto-incrementing version';
COMMENT ON FUNCTION match_style_signatures IS 'Find similar style signatures by vector cosine similarity';
COMMENT ON FUNCTION get_style_signatures_for_items IS 'Batch retrieve style signatures for multiple survey items';

