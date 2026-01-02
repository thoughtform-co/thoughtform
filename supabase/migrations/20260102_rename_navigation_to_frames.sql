-- ═══════════════════════════════════════════════════════════════
-- CATEGORY STRUCTURE UPDATE: Navigation & Frames
-- ═══════════════════════════════════════════════════════════════
-- As of this migration, we have TWO categories:
--   - 'navigation' → For Navigation Bar component
--   - 'frames'     → For Frame, Card, HUD components
--
-- No data migration needed - both categories now exist.
-- If you previously had items tagged 'navigation' that should be
-- 'frames' (e.g., Frame or Card references), update them manually:
--
-- UPDATE survey_items 
-- SET category_id = 'frames' 
-- WHERE category_id = 'navigation' 
--   AND component_key IN ('frame-basic', 'card-content', 'card-data', 'hud-frame');

SELECT 'Migration 20260102: Navigation and Frames are now separate categories' AS status;

