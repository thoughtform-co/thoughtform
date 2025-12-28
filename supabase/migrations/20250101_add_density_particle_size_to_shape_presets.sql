-- ═══════════════════════════════════════════════════════════════════
-- ADD DENSITY AND PARTICLE SIZE TO SHAPE PRESETS
-- Extends shape_presets table to store density and particle size
-- ═══════════════════════════════════════════════════════════════════

-- Add density column (default 1.0)
alter table shape_presets
  add column if not exists density numeric(4, 2) default 1.0;

-- Add particle_size column (default 1.0)
alter table shape_presets
  add column if not exists particle_size numeric(4, 2) default 1.0;

-- Comments
comment on column shape_presets.density is 'Particle density multiplier (0.1 to 3.0)';
comment on column shape_presets.particle_size is 'Particle size multiplier (0.5 to 3.0)';

