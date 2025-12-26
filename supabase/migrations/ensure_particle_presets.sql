-- Ensure particle_config table has presets support
-- This migration is idempotent - safe to run multiple times

-- Add presets column if it doesn't exist
ALTER TABLE particle_config
ADD COLUMN IF NOT EXISTS presets jsonb DEFAULT '[]'::jsonb;

-- Add active_preset_id column if it doesn't exist
ALTER TABLE particle_config
ADD COLUMN IF NOT EXISTS active_preset_id text DEFAULT NULL;

-- Ensure the default row exists
INSERT INTO particle_config (id, config, presets, active_preset_id)
VALUES ('default', '{}'::jsonb, '[]'::jsonb, NULL)
ON CONFLICT (id) DO NOTHING;

-- Add comments for documentation
COMMENT ON COLUMN particle_config.presets IS 'Array of preset configurations: [{id, name, config, createdAt, updatedAt}]. Global presets visible to all visitors.';
COMMENT ON COLUMN particle_config.active_preset_id IS 'Currently active preset ID (if any). When a preset is loaded, it becomes the global config.';

