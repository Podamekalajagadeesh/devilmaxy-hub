-- Create a users table for custom auth
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  ff_id text unique not null,
  password text not null,
  display_name text not null,
  avatar_url text,
  bio text,
  created_at timestamp with time zone default timezone('utc', now())
);

-- Create a messages table for chat
create table if not exists messages (
  id serial primary key,
  content text not null,
  user_id uuid references users(id) on delete cascade,
  display_name text not null,
  inserted_at timestamp with time zone default timezone('utc', now())
);
