<<<<<<< HEAD
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
  text text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter publication supabase_realtime add table public.messages;

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

- Free tiers have limits (messages/usage/bandwidth). For larger communities, upgrade later.
  create policy "Allow read messages"
  on public.messages
  for select
  to anon
  using (true);

- You can customize room names inside `components/ChatApp.js`.
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
=======
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
>>>>>>> ee991a1 (Initial commit from Create Next App)
