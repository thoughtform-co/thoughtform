-- ═══════════════════════════════════════════════════════════════════
-- ADD ANNOTATIONS FIELD TO SURVEY ITEMS
-- Allows users to draw regions and add notes on images
-- ═══════════════════════════════════════════════════════════════════

-- Add annotations column (stored as JSONB array)
ALTER TABLE survey_items 
ADD COLUMN IF NOT EXISTS annotations jsonb DEFAULT '[]'::jsonb;

-- Annotations structure:
-- [
--   {
--     "id": "uuid",
--     "x": 10.5,        -- Percentage of image width
--     "y": 20.3,        -- Percentage of image height
--     "width": 30.0,    -- Percentage of image width
--     "height": 15.0,   -- Percentage of image height
--     "note": "Great use of corner brackets here",
--     "created_at": "2026-01-02T12:00:00Z"
--   }
-- ]

