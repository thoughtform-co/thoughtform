-- ═══════════════════════════════════════════════════════════════════
-- MANIFESTO VOICES - Video testimonials/content for the manifesto section
-- ═══════════════════════════════════════════════════════════════════

-- Voices table - stores video card data for ManifestoVideoStack
create table if not exists manifesto_voices (
  id uuid primary key default gen_random_uuid(),
  
  -- Core content
  title text not null,                    -- Speaker name or title (e.g., "AI as Intelligence")
  description text,                       -- Short description shown on card
  full_text text,                         -- Full quote/text shown in modal
  role text,                              -- Speaker role/affiliation (optional)
  type text default 'Voice',              -- Type label (e.g., "Voice", "Testimonial")
  
  -- Media
  video_url text,                         -- URL to video in Supabase storage
  thumbnail_url text,                     -- URL to thumbnail in Supabase storage
  
  -- Display order
  order_index integer not null default 0, -- Order in the stack (0 = top)
  
  -- Status
  is_active boolean default true,         -- Whether to show in the stack
  
  -- Metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for ordering and filtering
create index if not exists idx_manifesto_voices_order on manifesto_voices(order_index);
create index if not exists idx_manifesto_voices_active on manifesto_voices(is_active) where is_active = true;

-- Apply updated_at trigger
drop trigger if exists update_manifesto_voices_updated_at on manifesto_voices;
create trigger update_manifesto_voices_updated_at
  before update on manifesto_voices
  for each row execute function update_updated_at_column();

-- Insert default placeholder voices (matching current PLACEHOLDER_CARDS)
insert into manifesto_voices (title, description, full_text, role, type, order_index)
values 
  (
    'AI as Intelligence',
    'It leaps across dimensions we can''t fathom.',
    'AI isn''t just a tool—it''s a strange, new intelligence that leaps across dimensions we can''t fully comprehend. It sees patterns in places we''ve never looked.',
    'Manifesto',
    'Voice',
    0
  ),
  (
    'Navigate Strangeness',
    'The source of truly novel ideas.',
    'In technical work, AI''s strangeness must be constrained. But in creative and strategic work, that strangeness becomes the source of truly novel ideas.',
    'Manifesto',
    'Voice',
    1
  ),
  (
    'Think WITH AI',
    'Navigating its strangeness for creative breakthroughs.',
    'Thoughtform teaches teams to think WITH that intelligence—not against it, not around it—navigating its strangeness for creative breakthroughs.',
    'Manifesto',
    'Voice',
    2
  )
on conflict do nothing;

-- ═══════════════════════════════════════════════════════════════════
-- STORAGE BUCKET SETUP
-- Run this in the Supabase dashboard SQL editor:
-- ═══════════════════════════════════════════════════════════════════
-- 
-- -- Create the voices-media bucket (if using Supabase Storage)
-- insert into storage.buckets (id, name, public)
-- values ('voices-media', 'voices-media', true)
-- on conflict (id) do nothing;
-- 
-- -- Allow public read access to the bucket
-- create policy "Public Access" on storage.objects for select
--   using (bucket_id = 'voices-media');
-- 
-- -- Allow authenticated users to upload (restricted by API)
-- create policy "Auth Upload" on storage.objects for insert
--   with check (bucket_id = 'voices-media' and auth.role() = 'authenticated');
-- 
-- ═══════════════════════════════════════════════════════════════════

