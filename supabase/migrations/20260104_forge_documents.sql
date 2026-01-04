-- ═══════════════════════════════════════════════════════════════════
-- FORGE DOCUMENTS TABLE
-- Stores vector editor documents per user for the Astrogation Forge tool
-- ═══════════════════════════════════════════════════════════════════

-- Forge Documents table (stores user's vector editor drawings)
create table if not exists forge_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text default 'Untitled',
  document jsonb not null default '{}', -- Fabric.js JSON document
  svg text, -- Generated SVG for quick preview
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create index for user lookups
create index if not exists idx_forge_documents_user_id on forge_documents(user_id);

-- Apply updated_at trigger
drop trigger if exists update_forge_documents_updated_at on forge_documents;
create trigger update_forge_documents_updated_at
  before update on forge_documents
  for each row execute function update_updated_at_column();

-- Enable RLS
alter table forge_documents enable row level security;

-- RLS Policies: Users can only access their own documents
create policy "Users can view their own forge documents"
  on forge_documents for select
  using (auth.uid() = user_id);

create policy "Users can create their own forge documents"
  on forge_documents for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own forge documents"
  on forge_documents for update
  using (auth.uid() = user_id);

create policy "Users can delete their own forge documents"
  on forge_documents for delete
  using (auth.uid() = user_id);

