-- ═══════════════════════════════════════════════════════════════════
-- FOUNDRY CANVAS TABLES
-- Phase 1: Multi-mockup Foundry canvas with autosave and templates
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- FOUNDRY DOCUMENTS TABLE
-- Stores the user's Foundry canvas state (multi-item document)
-- ───────────────────────────────────────────────────────────────────

create table if not exists foundry_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  -- The full canvas document as JSONB:
  -- {
  --   version: number,
  --   viewport: { panX: number, panY: number, zoom: number },
  --   items: Array<{
  --     id: string,
  --     name: string,
  --     componentId: string,
  --     props: Record<string, unknown>,
  --     styleVars?: Record<string, string>,
  --     frame: { x: number, y: number, w: number, h: number, z: number },
  --     locked?: boolean
  --   }>
  -- }
  document jsonb not null default '{"version":1,"viewport":{"panX":0,"panY":0,"zoom":1},"items":[]}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create index for user lookups (one doc per user)
create index if not exists idx_foundry_documents_user_id on foundry_documents(user_id);

-- Apply updated_at trigger
drop trigger if exists update_foundry_documents_updated_at on foundry_documents;
create trigger update_foundry_documents_updated_at
  before update on foundry_documents
  for each row execute function update_updated_at_column();

-- Enable RLS
alter table foundry_documents enable row level security;

-- RLS Policies: Users can only access their own documents
create policy "Users can view their own foundry documents"
  on foundry_documents for select
  using (auth.uid() = user_id);

create policy "Users can create their own foundry documents"
  on foundry_documents for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own foundry documents"
  on foundry_documents for update
  using (auth.uid() = user_id);

create policy "Users can delete their own foundry documents"
  on foundry_documents for delete
  using (auth.uid() = user_id);

-- ───────────────────────────────────────────────────────────────────
-- FOUNDRY TEMPLATES TABLE
-- Stores user-created draft templates (before Vault approval)
-- ───────────────────────────────────────────────────────────────────

create table if not exists foundry_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null default 'Untitled Template',
  -- The catalog component key (e.g. 'panel', 'card-landscape')
  component_key text not null,
  -- Category from catalog (e.g. 'frames', 'cards', 'brand')
  category_id text,
  -- Full config: props + styleVars + frame style preferences
  -- Same shape as UIComponentPreset.config but stored separately as drafts
  config jsonb not null default '{}',
  -- Optional thumbnail (base64 or storage path)
  thumbnail text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes
create index if not exists idx_foundry_templates_user_id on foundry_templates(user_id);
create index if not exists idx_foundry_templates_component_key on foundry_templates(component_key);
create index if not exists idx_foundry_templates_category_id on foundry_templates(category_id);

-- Apply updated_at trigger
drop trigger if exists update_foundry_templates_updated_at on foundry_templates;
create trigger update_foundry_templates_updated_at
  before update on foundry_templates
  for each row execute function update_updated_at_column();

-- Enable RLS
alter table foundry_templates enable row level security;

-- RLS Policies: Users can only access their own templates
create policy "Users can view their own foundry templates"
  on foundry_templates for select
  using (auth.uid() = user_id);

create policy "Users can create their own foundry templates"
  on foundry_templates for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own foundry templates"
  on foundry_templates for update
  using (auth.uid() = user_id);

create policy "Users can delete their own foundry templates"
  on foundry_templates for delete
  using (auth.uid() = user_id);
