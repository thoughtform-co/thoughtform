-- Add presets and active_preset_id columns to particle_config table
-- This allows storing presets on the server (global config for all visitors)

ALTER TABLE particle_config
ADD COLUMN IF NOT EXISTS presets jsonb DEFAULT '[]'::jsonb;

ALTER TABLE particle_config
ADD COLUMN IF NOT EXISTS active_preset_id text DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN particle_config.presets IS 'Array of preset configurations: [{id, name, config, createdAt, updatedAt}]';
COMMENT ON COLUMN particle_config.active_preset_id IS 'Currently active preset ID (if any)';

