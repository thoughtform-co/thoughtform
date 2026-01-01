-- ═══════════════════════════════════════════════════════════════════
-- SURVEY ITEMS TABLE
-- Stores design inspiration references with AI analysis and embeddings
-- ═══════════════════════════════════════════════════════════════════

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Survey items table
CREATE TABLE IF NOT EXISTS survey_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Classification (matches catalog.ts CATEGORIES and ComponentDef)
  category_id text,                          -- e.g., 'navigation', 'buttons', 'brand'
  component_key text,                        -- e.g., 'hud-frame', 'button', 'navbar'
  
  -- User-provided metadata
  title text,
  notes text,                                -- Subjective commentary
  sources jsonb DEFAULT '[]'::jsonb,         -- Array of { label, url, note }
  tags text[] DEFAULT '{}',
  
  -- Image storage (private bucket: survey-media)
  image_path text NOT NULL,                  -- Storage path within bucket
  image_mime text,
  image_width integer,
  image_height integer,
  
  -- AI analysis (Claude output; versioned with history)
  analysis jsonb DEFAULT '{}'::jsonb,
  
  -- Embeddings (Voyage AI)
  -- Using 1024 dimensions for voyage-3-lite (default model)
  embedding vector(1024),
  embedding_model text,                      -- e.g., 'voyage-3-lite'
  embedding_text text,                       -- Text used to generate embedding
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_survey_items_category ON survey_items(category_id);
CREATE INDEX IF NOT EXISTS idx_survey_items_component ON survey_items(component_key);
CREATE INDEX IF NOT EXISTS idx_survey_items_created ON survey_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_survey_items_tags ON survey_items USING GIN(tags);

-- Vector similarity index (IVFFlat for approximate nearest neighbor)
-- Using cosine distance for normalized embeddings
CREATE INDEX IF NOT EXISTS idx_survey_items_embedding ON survey_items 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_survey_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_survey_items_updated_at ON survey_items;
CREATE TRIGGER set_survey_items_updated_at
  BEFORE UPDATE ON survey_items
  FOR EACH ROW
  EXECUTE FUNCTION update_survey_items_updated_at();

-- ═══════════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE survey_items ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated read" ON survey_items
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated insert" ON survey_items
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated update" ON survey_items
  FOR UPDATE TO authenticated USING (true);

-- Allow authenticated users to delete
CREATE POLICY "Allow authenticated delete" ON survey_items
  FOR DELETE TO authenticated USING (true);

-- ═══════════════════════════════════════════════════════════════════
-- VECTOR SEARCH RPC
-- Returns top-K similar items with cosine similarity score
-- ═══════════════════════════════════════════════════════════════════

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
  sources jsonb,
  tags text[],
  image_path text,
  image_mime text,
  image_width integer,
  image_height integer,
  analysis jsonb,
  embedding_model text,
  embedding_text text,
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
    si.sources,
    si.tags,
    si.image_path,
    si.image_mime,
    si.image_width,
    si.image_height,
    si.analysis,
    si.embedding_model,
    si.embedding_text,
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
-- HELPER FUNCTION TO UPDATE EMBEDDING
-- Required because Supabase JS client can't directly set vector type
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_survey_embedding(
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
    embedding = embedding_vector::vector,
    embedding_model = embedding_model_name,
    embedding_text = embedding_text_content,
    updated_at = now()
  WHERE id = item_id;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- STORAGE BUCKET SETUP INSTRUCTIONS
-- Run these commands in the Supabase Dashboard SQL Editor:
-- ═══════════════════════════════════════════════════════════════════
--
-- -- Create the survey-media bucket (private)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('survey-media', 'survey-media', false)
-- ON CONFLICT (id) DO NOTHING;
--
-- -- Allow authenticated users to read from the bucket (for signed URLs)
-- CREATE POLICY "Auth Read" ON storage.objects FOR SELECT
--   TO authenticated
--   USING (bucket_id = 'survey-media');
--
-- -- Allow authenticated users to upload
-- CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT
--   TO authenticated
--   WITH CHECK (bucket_id = 'survey-media');
--
-- -- Allow authenticated users to delete
-- CREATE POLICY "Auth Delete" ON storage.objects FOR DELETE
--   TO authenticated
--   USING (bucket_id = 'survey-media');
--
-- ═══════════════════════════════════════════════════════════════════

