-- ============================================================================
-- Survey Collections - Group related survey items (same brand/website/campaign)
-- ============================================================================

-- Collections table
CREATE TABLE IF NOT EXISTS survey_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT, -- Optional accent color for visual distinction
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add collection_id to survey_items
ALTER TABLE survey_items 
ADD COLUMN IF NOT EXISTS collection_id UUID REFERENCES survey_collections(id) ON DELETE SET NULL;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_survey_items_collection_id ON survey_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_survey_collections_user_id ON survey_collections(user_id);

-- Enable RLS
ALTER TABLE survey_collections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for survey_collections
CREATE POLICY "Users can view their own collections"
  ON survey_collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own collections"
  ON survey_collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
  ON survey_collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
  ON survey_collections FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_survey_collections_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS survey_collections_updated_at ON survey_collections;
CREATE TRIGGER survey_collections_updated_at
  BEFORE UPDATE ON survey_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_survey_collections_updated_at();

-- Grant permissions
GRANT ALL ON survey_collections TO authenticated;
GRANT ALL ON survey_collections TO service_role;

