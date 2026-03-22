# Supabase Setup Guide

## Step 1 — Create a Supabase project

1. Go to https://supabase.com and sign in
2. Click "New project"
3. Name it `expense-story`, pick a region close to you, set a DB password
4. Wait ~2 minutes for it to provision

---

## Step 2 — Get your keys

In your project dashboard go to:
**Settings → API**

Copy:
- `Project URL` → this is your `SUPABASE_URL`
- `anon public` key → this is your `SUPABASE_ANON_KEY`

Paste them into `.env.local`:
```
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Restart the server: `npm run dev`

---

## Step 3 — Create the expenses table

Go to **SQL Editor** in your Supabase dashboard and run:

```sql
create table expenses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  category   text not null,
  amount     numeric(10,2) not null,
  date       date not null,
  note       text,
  created_at timestamptz default now()
);

-- Row Level Security: users can only see their own expenses
alter table expenses enable row level security;

create policy "Users see own expenses"
  on expenses for select
  using (auth.uid() = user_id);

create policy "Users insert own expenses"
  on expenses for insert
  with check (auth.uid() = user_id);

create policy "Users delete own expenses"
  on expenses for delete
  using (auth.uid() = user_id);
```

---

## Step 4 — Create user_profiles view (for admin)

```sql
-- View that exposes user emails to admin queries
create view user_profiles as
  select
    id,
    email,
    created_at
  from auth.users;

-- Allow the anon/service role to read it
-- NOTE: for production, use a Supabase Edge Function with service_role key
-- For now, grant read to authenticated users (admin page does its own email check)
grant select on user_profiles to authenticated;
```

---

## Step 5 — Enable Email Auth

Go to **Authentication → Providers → Email**
- Make sure it's enabled
- For development, disable "Confirm email" so you can sign up instantly

---

## Step 6 — Test it

1. Go to `http://localhost:3000`
2. Sign up with your email
3. Add an expense — it should appear in your Supabase `expenses` table

---

## Admin Route

Access the admin panel at: `http://localhost:3000/#/admin`

Admin access is controlled by the `ADMIN_EMAILS` list in:
`public/js/config.js`

```js
const ADMIN_EMAILS = [
  'premraviraj2004@gmail.com',  // ← your email is already here
];
```

Add more emails to grant admin access to others.

The admin page shows:
- Total users, expenses, and tracked spend
- Per-user breakdown
- Last 50 expenses across all users

> For production admin, replace the `user_profiles` view with a Supabase Edge Function
> using the `service_role` key so it's never exposed to the client.

---

## Supabase Auth Redirect (optional)

If you deploy to a domain, add it to:
**Authentication → URL Configuration → Redirect URLs**

```
https://yourdomain.com
```
