-- USERS TABLE
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  ff_id text unique not null,
  password text not null,
  display_name text not null,
  avatar_url text,
  bio text,
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc', now())
);

-- GUILDS TABLE
create table if not exists guilds (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  owner_id uuid references users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc', now())
);

-- GUILD MEMBERS
create table if not exists guild_members (
  user_id uuid references users(id) on delete cascade,
  guild_id uuid references guilds(id) on delete cascade,
  is_moderator boolean default false,
  joined_at timestamp with time zone default timezone('utc', now()),
  primary key (user_id, guild_id)
);

-- ROOMS (for group chat)
create table if not exists rooms (
  id uuid primary key default uuid_generate_v4(),
  guild_id uuid references guilds(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone default timezone('utc', now())
);

-- MESSAGES (for rooms)
create table if not exists messages (
  id serial primary key,
  room_id uuid references rooms(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  display_name text not null,
  content text not null,
  inserted_at timestamp with time zone default timezone('utc', now())
);

-- DIRECT MESSAGES
create table if not exists direct_messages (
  id serial primary key,
  sender_id uuid references users(id) on delete cascade,
  receiver_id uuid references users(id) on delete cascade,
  content text not null,
  inserted_at timestamp with time zone default timezone('utc', now())
);

-- MESSAGE REACTIONS
create table if not exists message_reactions (
  id serial primary key,
  message_id integer references messages(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  emoji text not null,
  reacted_at timestamp with time zone default timezone('utc', now())
);
