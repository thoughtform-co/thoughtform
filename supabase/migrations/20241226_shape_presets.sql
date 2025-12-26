-- ═══════════════════════════════════════════════════════════════════
-- SHAPE PRESETS TABLE
-- Stores saved shape configurations from Shape Lab
-- ═══════════════════════════════════════════════════════════════════

-- Shape Presets table
create table if not exists shape_presets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  shape_id text not null, -- References shape registry ID (e.g., 'tf_filamentField')
  seed integer not null default 42,
  point_count integer not null default 300,
  category text default 'custom', -- 'thoughtform' | 'geometric' | 'custom'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for faster lookups
create index if not exists idx_shape_presets_shape_id on shape_presets(shape_id);
create index if not exists idx_shape_presets_category on shape_presets(category);
create index if not exists idx_shape_presets_created_at on shape_presets(created_at desc);

-- Apply updated_at trigger to shape_presets
drop trigger if exists update_shape_presets_updated_at on shape_presets;
create trigger update_shape_presets_updated_at
  before update on shape_presets
  for each row execute function update_updated_at_column();

-- Comment on table
comment on table shape_presets is 'Saved shape configurations from Shape Lab admin tool';
comment on column shape_presets.shape_id is 'References shape registry ID (e.g., tf_filamentField, torus)';
comment on column shape_presets.seed is 'Random seed for deterministic shape generation';
comment on column shape_presets.point_count is 'Number of particles in the shape';

