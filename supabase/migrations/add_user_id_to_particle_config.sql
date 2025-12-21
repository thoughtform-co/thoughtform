-- Migration: Add user_id column to particle_config table
-- This allows storing user-specific particle configurations

-- Step 1: Add user_id column (nullable to handle existing rows)
alter table particle_config 
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Step 2: Drop the old unique constraint on user_id if it exists (from schema.sql)
alter table particle_config 
  drop constraint if exists particle_config_user_id_key;

-- Step 3: Create partial unique index on user_id (allows nulls, but ensures one config per user)
-- This allows multiple rows with user_id = null (for global configs) but only one per user
create unique index if not exists idx_particle_config_user_id_unique on particle_config(user_id)
  where user_id is not null;

-- Step 4: Create regular index for faster lookups
create index if not exists idx_particle_config_user_id on particle_config(user_id);

-- Note: The existing 'default' row will have user_id = null, which is fine
-- User-specific configs will have user_id set, and the partial unique index ensures one per user

