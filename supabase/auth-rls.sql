-- ═══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY FOR PAGE EDITOR
-- Run this after the initial schema
-- ═══════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
alter table pages enable row level security;
alter table sections enable row level security;
alter table elements enable row level security;
alter table design_log enable row level security;
alter table particle_config enable row level security;

-- PAGES: Anyone can read, only authenticated users can write
create policy "Pages are viewable by everyone"
  on pages for select
  using (true);

create policy "Authenticated users can insert pages"
  on pages for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update pages"
  on pages for update
  to authenticated
  using (true);

create policy "Authenticated users can delete pages"
  on pages for delete
  to authenticated
  using (true);

-- SECTIONS: Anyone can read, only authenticated users can write
create policy "Sections are viewable by everyone"
  on sections for select
  using (true);

create policy "Authenticated users can insert sections"
  on sections for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update sections"
  on sections for update
  to authenticated
  using (true);

create policy "Authenticated users can delete sections"
  on sections for delete
  to authenticated
  using (true);

-- ELEMENTS: Anyone can read, only authenticated users can write
create policy "Elements are viewable by everyone"
  on elements for select
  using (true);

create policy "Authenticated users can insert elements"
  on elements for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update elements"
  on elements for update
  to authenticated
  using (true);

create policy "Authenticated users can delete elements"
  on elements for delete
  to authenticated
  using (true);

-- DESIGN_LOG: Anyone can read, only authenticated users can insert
create policy "Design log is viewable by everyone"
  on design_log for select
  using (true);

create policy "Authenticated users can insert design log entries"
  on design_log for insert
  to authenticated
  with check (true);

-- PARTICLE_CONFIG: Anyone can read, users can manage their own config
create policy "Particle config is viewable by everyone"
  on particle_config for select
  using (true);

create policy "Users can insert their own particle config"
  on particle_config for insert
  to authenticated
  with check (user_id = auth.uid() OR (id = 'default' AND user_id IS NULL));

create policy "Users can update their own particle config"
  on particle_config for update
  to authenticated
  using (user_id = auth.uid() OR (id = 'default' AND user_id IS NULL))
  with check (user_id = auth.uid() OR (id = 'default' AND user_id IS NULL));

create policy "Users can delete their own particle config"
  on particle_config for delete
  to authenticated
  using (user_id = auth.uid() OR (id = 'default' AND user_id IS NULL));

