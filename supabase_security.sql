-- Password hashing function (pgcrypto extension required)
create extension if not exists pgcrypto;

-- Update users table to store hashed passwords
alter table users alter column password type text;

-- RLS policies (example for users table)
alter table users enable row level security;
create policy "Users can update their own profile" on users
  for update using (id = auth.uid());

-- RLS for messages (only allow insert/select for members)
alter table messages enable row level security;
create policy "Guild members can insert messages" on messages
  for insert using (exists (select 1 from guild_members where guild_members.user_id = auth.uid() and guild_members.guild_id = (select guild_id from rooms where rooms.id = messages.room_id)));
create policy "Guild members can select messages" on messages
  for select using (exists (select 1 from guild_members where guild_members.user_id = auth.uid() and guild_members.guild_id = (select guild_id from rooms where rooms.id = messages.room_id)));

-- Add more RLS policies as needed for other tables
