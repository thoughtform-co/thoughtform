-- ═══════════════════════════════════════════════════════════════════
-- THOUGHTFORM PAGE EDITOR SCHEMA
-- ═══════════════════════════════════════════════════════════════════

-- Pages table
create table if not exists pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sections table
create table if not exists sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid references pages(id) on delete cascade,
  type text not null, -- 'hero' | 'problem' | 'quote' | 'shift' | 'proof' | 'tagline' | 'services' | 'about' | 'musings' | 'cta' | 'freeform'
  order_index int not null,
  config jsonb default '{}',
  background jsonb default null, -- { type: 'image' | 'canvas' | 'threejs', config: {...} }
  min_height text default 'auto', -- 'auto' | '100vh' | '50vh' | custom
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Elements table (for freeform sections)
create table if not exists elements (
  id uuid primary key default gen_random_uuid(),
  section_id uuid references sections(id) on delete cascade,
  type text not null, -- 'text' | 'image' | 'video'
  x int default 0,
  y int default 0,
  width int,
  height int,
  content jsonb not null, -- type-specific content
  z_index int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Design Log table (for AI editing context)
-- Tracks all design changes for use as context in the semantic editor
create table if not exists design_log (
  id uuid primary key default gen_random_uuid(),
  -- What changed
  change_type text not null, -- 'create' | 'update' | 'delete' | 'style' | 'content' | 'layout'
  target_type text not null, -- 'page' | 'section' | 'element' | 'background' | 'global'
  target_id uuid, -- Reference to the changed entity (nullable for global changes)
  -- Description (can be used as AI context)
  summary text not null, -- Short description like git commit message
  details jsonb, -- Detailed change info (before/after, specific fields changed)
  -- Metadata
  author text, -- Who made the change (user email or 'system')
  source text default 'cursor', -- 'cursor' | 'editor' | 'chat' | 'mcp' | 'api'
  commit_hash text, -- Git commit hash if available
  created_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_sections_page_id on sections(page_id);
create index if not exists idx_sections_order on sections(page_id, order_index);
create index if not exists idx_elements_section_id on elements(section_id);
create index if not exists idx_design_log_created_at on design_log(created_at desc);
create index if not exists idx_design_log_target on design_log(target_type, target_id);

-- Updated at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply triggers
drop trigger if exists update_pages_updated_at on pages;
create trigger update_pages_updated_at
  before update on pages
  for each row execute function update_updated_at_column();

drop trigger if exists update_sections_updated_at on sections;
create trigger update_sections_updated_at
  before update on sections
  for each row execute function update_updated_at_column();

drop trigger if exists update_elements_updated_at on elements;
create trigger update_elements_updated_at
  before update on elements
  for each row execute function update_updated_at_column();

-- Row Level Security (optional, enable if needed)
-- alter table pages enable row level security;
-- alter table sections enable row level security;
-- alter table elements enable row level security;

-- Particle Config table (for storing particle system configuration)
create table if not exists particle_config (
  id text primary key default 'default',
  config jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Apply updated_at trigger to particle_config
drop trigger if exists update_particle_config_updated_at on particle_config;
create trigger update_particle_config_updated_at
  before update on particle_config
  for each row execute function update_updated_at_column();

-- Insert default home page
insert into pages (slug, title) 
values ('home', 'Thoughtform | Navigate AI for Creative Breakthroughs')
on conflict (slug) do nothing;

