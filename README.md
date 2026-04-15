# DevilMaxy Hub

Discord-style chat website for your subscribers and Free Fire guild mates, built with Next.js for Vercel deployment and Supabase for free realtime messaging.

## Stack

- Next.js (App Router)
- Supabase Postgres + Realtime + Presence (free tier)
- Vercel deployment

## 1) Install

```bash
npm install
```

## 2) Create Supabase Project (Free)

1. Go to Supabase and create a free project.
2. In SQL Editor, run:

```sql
create table if not exists public.messages (
  id bigint generated always as identity primary key,
  room_id text not null,
  username text not null,
  text text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter publication supabase_realtime add table public.messages;

alter table public.messages enable row level security;

drop policy if exists "Allow read messages" on public.messages;
create policy "Allow read messages"
on public.messages
for select
to anon
using (true);

drop policy if exists "Allow insert messages" on public.messages;
create policy "Allow insert messages"
on public.messages
for insert
to anon
with check (char_length(username) > 0 and char_length(text) > 0);
```

3. In Project Settings > API, copy:
	- `Project URL`
	- `anon public key`

## 3) Environment Variables

Create `.env.local`:

```bash
cp .env.example .env.local
```

Then fill these values:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 4) Run Local

```bash
npm run dev
```

Open `http://localhost:3000`.

## 5) Deploy to Vercel (Free)

1. Push this repo to GitHub.
2. Import repo in Vercel.
3. Add env vars in Vercel project settings:
	- `NEXT_PUBLIC_SUPABASE_URL`
	- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.

## Notes

- This app is designed for free-tier usage.
- Free tiers have limits (messages/usage/bandwidth). For larger communities, upgrade later.
- You can customize room names inside `components/ChatApp.js`.