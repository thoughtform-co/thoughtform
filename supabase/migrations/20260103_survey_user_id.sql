-- ═══════════════════════════════════════════════════════════════════
-- ADD USER_ID TO SURVEY_ITEMS
-- Links survey items to authenticated users
-- ═══════════════════════════════════════════════════════════════════

-- Add user_id column
ALTER TABLE survey_items
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_survey_items_user_id ON survey_items(user_id);

-- Update RLS policies to filter by user_id
DROP POLICY IF EXISTS "Allow authenticated read" ON survey_items;
DROP POLICY IF EXISTS "Allow authenticated insert" ON survey_items;
DROP POLICY IF EXISTS "Allow authenticated update" ON survey_items;
DROP POLICY IF EXISTS "Allow authenticated delete" ON survey_items;

-- Users can only read their own items
CREATE POLICY "Users can read own items" ON survey_items
  FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

-- Users can only insert items with their own user_id
CREATE POLICY "Users can insert own items" ON survey_items
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own items
CREATE POLICY "Users can update own items" ON survey_items
  FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own items
CREATE POLICY "Users can delete own items" ON survey_items
  FOR DELETE TO authenticated 
  USING (auth.uid() = user_id);

