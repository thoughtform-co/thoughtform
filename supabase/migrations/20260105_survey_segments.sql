-- ═══════════════════════════════════════════════════════════════
-- SURVEY SEGMENTS TABLE
-- Store SAM-generated segments for UI element extraction
-- ═══════════════════════════════════════════════════════════════

-- Create the survey_segments table
CREATE TABLE IF NOT EXISTS survey_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_item_id uuid NOT NULL REFERENCES survey_items(id) ON DELETE CASCADE,
  
  -- Segment identification
  segment_index int NOT NULL,  -- Position in the segment list (sorted by area)
  
  -- Bounding box (in pixels)
  bbox_x int NOT NULL,
  bbox_y int NOT NULL,
  bbox_width int NOT NULL,
  bbox_height int NOT NULL,
  
  -- Crop bounding box (with padding)
  crop_x int NOT NULL,
  crop_y int NOT NULL,
  crop_width int NOT NULL,
  crop_height int NOT NULL,
  
  -- Segment metrics
  area int NOT NULL,
  predicted_iou float NOT NULL,
  stability_score float NOT NULL,
  
  -- User-editable label
  label text,
  label_updated_at timestamptz,
  
  -- AI-generated description (from Claude)
  ai_label text,
  ai_description text,
  ai_labeled_at timestamptz,
  
  -- Storage paths for segment assets
  mask_path text,  -- Storage path for mask PNG
  crop_path text,  -- Storage path for cropped segment
  
  -- Visibility/state
  is_visible boolean NOT NULL DEFAULT true,
  is_selected boolean NOT NULL DEFAULT false,
  
  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_survey_segments_item_id ON survey_segments(survey_item_id);
CREATE INDEX idx_survey_segments_area ON survey_segments(area DESC);
CREATE INDEX idx_survey_segments_label ON survey_segments(label) WHERE label IS NOT NULL;

-- RLS Policies
ALTER TABLE survey_segments ENABLE ROW LEVEL SECURITY;

-- Users can view segments for items they own
CREATE POLICY "Users can view segments for their items"
ON survey_segments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM survey_items
    WHERE survey_items.id = survey_segments.survey_item_id
    AND survey_items.user_id = auth.uid()
  )
);

-- Users can insert segments for items they own
CREATE POLICY "Users can insert segments for their items"
ON survey_segments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM survey_items
    WHERE survey_items.id = survey_segments.survey_item_id
    AND survey_items.user_id = auth.uid()
  )
);

-- Users can update segments for items they own
CREATE POLICY "Users can update segments for their items"
ON survey_segments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM survey_items
    WHERE survey_items.id = survey_segments.survey_item_id
    AND survey_items.user_id = auth.uid()
  )
);

-- Users can delete segments for items they own
CREATE POLICY "Users can delete segments for their items"
ON survey_segments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM survey_items
    WHERE survey_items.id = survey_segments.survey_item_id
    AND survey_items.user_id = auth.uid()
  )
);

-- Add has_segments flag to survey_items for quick filtering
ALTER TABLE survey_items
ADD COLUMN IF NOT EXISTS has_segments boolean NOT NULL DEFAULT false;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_survey_segment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
CREATE TRIGGER survey_segments_updated_at
  BEFORE UPDATE ON survey_segments
  FOR EACH ROW
  EXECUTE FUNCTION update_survey_segment_timestamp();

-- ═══════════════════════════════════════════════════════════════
-- COMMENTS
-- ═══════════════════════════════════════════════════════════════

COMMENT ON TABLE survey_segments IS 'SAM-generated segments for survey item images';
COMMENT ON COLUMN survey_segments.segment_index IS 'Position in segment list, sorted by area (0 = largest)';
COMMENT ON COLUMN survey_segments.bbox_x IS 'Bounding box X coordinate in pixels';
COMMENT ON COLUMN survey_segments.bbox_y IS 'Bounding box Y coordinate in pixels';
COMMENT ON COLUMN survey_segments.bbox_width IS 'Bounding box width in pixels';
COMMENT ON COLUMN survey_segments.bbox_height IS 'Bounding box height in pixels';
COMMENT ON COLUMN survey_segments.crop_x IS 'Crop bounding box X with padding';
COMMENT ON COLUMN survey_segments.crop_y IS 'Crop bounding box Y with padding';
COMMENT ON COLUMN survey_segments.area IS 'Segment area in pixels';
COMMENT ON COLUMN survey_segments.predicted_iou IS 'SAM predicted IoU score';
COMMENT ON COLUMN survey_segments.stability_score IS 'SAM stability score';
COMMENT ON COLUMN survey_segments.label IS 'User-defined label for the segment';
COMMENT ON COLUMN survey_segments.ai_label IS 'Claude-generated short label (e.g., "navigation panel")';
COMMENT ON COLUMN survey_segments.ai_description IS 'Claude-generated description of the UI element';
COMMENT ON COLUMN survey_segments.mask_path IS 'Storage path for segment mask PNG';
COMMENT ON COLUMN survey_segments.crop_path IS 'Storage path for cropped segment image';
COMMENT ON COLUMN survey_segments.is_visible IS 'Whether segment is visible in overlay';
COMMENT ON COLUMN survey_segments.is_selected IS 'Whether segment is currently selected';

