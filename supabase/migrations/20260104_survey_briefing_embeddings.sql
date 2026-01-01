-- ═══════════════════════════════════════════════════════════════════
-- SURVEY BRIEFING AND DUAL EMBEDDINGS
-- Adds description, briefing fields and separate embedding spaces
-- ═══════════════════════════════════════════════════════════════════

-- Add description field (AI-generated visual analysis, user-editable)
ALTER TABLE survey_items
ADD COLUMN IF NOT EXISTS description text;

-- Add briefing fields (AI-generated implementation brief, user-editable)
ALTER TABLE survey_items
ADD COLUMN IF NOT EXISTS briefing text;

ALTER TABLE survey_items
ADD COLUMN IF NOT EXISTS briefing_updated_at timestamptz;

-- Add briefing embedding columns (1024 dimensions for voyage-3-lite)
ALTER TABLE survey_items
ADD COLUMN IF NOT EXISTS briefing_embedding vector(1024);

ALTER TABLE survey_items
ADD COLUMN IF NOT EXISTS briefing_embedding_model text;

ALTER TABLE survey_items
ADD COLUMN IF NOT EXISTS briefing_embedding_text text;

-- Create index for briefing embedding similarity search
CREATE INDEX IF NOT EXISTS idx_survey_items_briefing_embedding ON survey_items 
  USING ivfflat (briefing_embedding vector_cosine_ops)
  WITH (lists = 100);

-- ═══════════════════════════════════════════════════════════════════
-- HELPER FUNCTION TO UPDATE BRIEFING EMBEDDING
-- Required because Supabase JS client can't directly set vector type
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_survey_embedding_briefing(
  item_id uuid,
  embedding_vector text,
  embedding_model_name text,
  embedding_text_content text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE survey_items
  SET 
    briefing_embedding = embedding_vector::vector,
    briefing_embedding_model = embedding_model_name,
    briefing_embedding_text = embedding_text_content,
    updated_at = now()
  WHERE id = item_id;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- VECTOR SEARCH RPC FOR BRIEFING EMBEDDINGS
-- Returns top-K similar items using briefing embedding (cleaner retrieval)
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION match_survey_items_briefing(
  query_embedding vector(1024),
  match_threshold float DEFAULT 0.0,
  match_count int DEFAULT 10,
  filter_category_id text DEFAULT NULL,
  filter_component_key text DEFAULT NULL,
  filter_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  category_id text,
  component_key text,
  title text,
  notes text,
  description text,
  briefing text,
  briefing_updated_at timestamptz,
  sources jsonb,
  tags text[],
  annotations jsonb,
  image_path text,
  image_mime text,
  image_width integer,
  image_height integer,
  analysis jsonb,
  embedding_model text,
  embedding_text text,
  briefing_embedding_model text,
  briefing_embedding_text text,
  user_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    si.id,
    si.category_id,
    si.component_key,
    si.title,
    si.notes,
    si.description,
    si.briefing,
    si.briefing_updated_at,
    si.sources,
    si.tags,
    si.annotations,
    si.image_path,
    si.image_mime,
    si.image_width,
    si.image_height,
    si.analysis,
    si.embedding_model,
    si.embedding_text,
    si.briefing_embedding_model,
    si.briefing_embedding_text,
    si.user_id,
    si.created_at,
    si.updated_at,
    1 - (si.briefing_embedding <=> query_embedding) AS similarity
  FROM survey_items si
  WHERE 
    si.briefing_embedding IS NOT NULL
    AND (filter_category_id IS NULL OR si.category_id = filter_category_id)
    AND (filter_component_key IS NULL OR si.component_key = filter_component_key)
    AND (filter_user_id IS NULL OR si.user_id = filter_user_id)
    AND 1 - (si.briefing_embedding <=> query_embedding) > match_threshold
  ORDER BY si.briefing_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- VECTOR SEARCH RPC FOR FULL-CONTEXT EMBEDDINGS
-- Same as existing match_survey_items but with new fields + user filter
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION match_survey_items_full(
  query_embedding vector(1024),
  match_threshold float DEFAULT 0.0,
  match_count int DEFAULT 10,
  filter_category_id text DEFAULT NULL,
  filter_component_key text DEFAULT NULL,
  filter_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  category_id text,
  component_key text,
  title text,
  notes text,
  description text,
  briefing text,
  briefing_updated_at timestamptz,
  sources jsonb,
  tags text[],
  annotations jsonb,
  image_path text,
  image_mime text,
  image_width integer,
  image_height integer,
  analysis jsonb,
  embedding_model text,
  embedding_text text,
  briefing_embedding_model text,
  briefing_embedding_text text,
  user_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    si.id,
    si.category_id,
    si.component_key,
    si.title,
    si.notes,
    si.description,
    si.briefing,
    si.briefing_updated_at,
    si.sources,
    si.tags,
    si.annotations,
    si.image_path,
    si.image_mime,
    si.image_width,
    si.image_height,
    si.analysis,
    si.embedding_model,
    si.embedding_text,
    si.briefing_embedding_model,
    si.briefing_embedding_text,
    si.user_id,
    si.created_at,
    si.updated_at,
    1 - (si.embedding <=> query_embedding) AS similarity
  FROM survey_items si
  WHERE 
    si.embedding IS NOT NULL
    AND (filter_category_id IS NULL OR si.category_id = filter_category_id)
    AND (filter_component_key IS NULL OR si.component_key = filter_component_key)
    AND (filter_user_id IS NULL OR si.user_id = filter_user_id)
    AND 1 - (si.embedding <=> query_embedding) > match_threshold
  ORDER BY si.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- UPDATE LEGACY match_survey_items TO INCLUDE NEW FIELDS
-- Maintains backwards compatibility while adding new columns
-- ═══════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS match_survey_items(vector(1024), float, int, text, text);

CREATE OR REPLACE FUNCTION match_survey_items(
  query_embedding vector(1024),
  match_threshold float DEFAULT 0.0,
  match_count int DEFAULT 10,
  filter_category_id text DEFAULT NULL,
  filter_component_key text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  category_id text,
  component_key text,
  title text,
  notes text,
  description text,
  briefing text,
  briefing_updated_at timestamptz,
  sources jsonb,
  tags text[],
  annotations jsonb,
  image_path text,
  image_mime text,
  image_width integer,
  image_height integer,
  analysis jsonb,
  embedding_model text,
  embedding_text text,
  briefing_embedding_model text,
  briefing_embedding_text text,
  user_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    si.id,
    si.category_id,
    si.component_key,
    si.title,
    si.notes,
    si.description,
    si.briefing,
    si.briefing_updated_at,
    si.sources,
    si.tags,
    si.annotations,
    si.image_path,
    si.image_mime,
    si.image_width,
    si.image_height,
    si.analysis,
    si.embedding_model,
    si.embedding_text,
    si.briefing_embedding_model,
    si.briefing_embedding_text,
    si.user_id,
    si.created_at,
    si.updated_at,
    1 - (si.embedding <=> query_embedding) AS similarity
  FROM survey_items si
  WHERE 
    si.embedding IS NOT NULL
    AND (filter_category_id IS NULL OR si.category_id = filter_category_id)
    AND (filter_component_key IS NULL OR si.component_key = filter_component_key)
    AND 1 - (si.embedding <=> query_embedding) > match_threshold
  ORDER BY si.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- COMMENT ON EMBEDDING STRATEGY
-- ═══════════════════════════════════════════════════════════════════
-- 
-- BRIEFING EMBEDDING (briefing_embedding):
--   - Based on: briefing + category/component + tags
--   - Purpose: Clean semantic search for "find me references for X"
--   - When to use: Default search, design intent queries
--
-- FULL-CONTEXT EMBEDDING (embedding):
--   - Based on: briefing + description + notes + annotations + analysis + tags + sources
--   - Purpose: Deep similarity search including user commentary
--   - When to use: "Find similar" operations, detailed context matching
--

