-- ═══════════════════════════════════════════════════════════════════
-- SURVEY MEDIA BUCKET SETUP
-- Creates bucket and policies (idempotent - safe to run multiple times)
-- ═══════════════════════════════════════════════════════════════════

-- Create the survey-media bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('survey-media', 'survey-media', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Auth Read" ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
DROP POLICY IF EXISTS "Auth Delete" ON storage.objects;

-- Allow authenticated users to read from the bucket (for signed URLs)
CREATE POLICY "Auth Read" ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'survey-media');

-- Allow authenticated users to upload
CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'survey-media');

-- Allow authenticated users to delete
CREATE POLICY "Auth Delete" ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'survey-media');

