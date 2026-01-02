-- ═══════════════════════════════════════════════════════════════
-- RENAME CATEGORY: navigation → frames
-- ═══════════════════════════════════════════════════════════════
-- Updates survey_items.category_id from 'navigation' to 'frames'
-- to match the catalog.ts category rename

UPDATE survey_items 
SET category_id = 'frames' 
WHERE category_id = 'navigation';

-- Log the migration
DO $$
DECLARE
  updated_count integer;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % survey items from category navigation to frames', updated_count;
END $$;

