# Zentrix Technologies Website

A responsive, single-page marketing website for an IT services company, built with plain HTML, CSS and JavaScript. The contact and quote forms save submissions to [Supabase](https://supabase.com).

## Features

- **Six page views** in one file — Home, About, Services, Advantage, Contact and Get a Quote — each with its own clean URL (`/`, `/about`, `/contact`, …), including browser back/forward support
- **Dark / light theme** toggle, remembered across visits
- **Services carousel** with arrows, dots and touch swipe
- **Animated stats** that count up when scrolled into view
- **Mobile-friendly** layout with a hamburger menu
- **Contact & quote forms** stored in Supabase

## Tech Stack

| Layer | Tool |
|---|---|
| Markup / styling | HTML5, CSS3 (custom properties for theming) |
| Scripting | Vanilla JavaScript (no framework, no build step) |
| Backend / database | Supabase (Postgres + Row Level Security) |
| Dev server | `live-server` via npm, or the included PowerShell script |

## Project Structure

```
├── index.html         # All page views, navbar, footer and forms
├── style.css          # Styles and dark/light theme tokens
├── script.js          # Routing, theme, carousel, counters, Supabase forms
├── office-hero.jpg    # Hero background image
├── package.json       # npm dev/start scripts
├── start-server.ps1   # Local server without Node.js (Windows)
└── server.ps1         # Alternative PowerShell server
```

## Getting Started

### Option 1 — npm (requires Node.js)

```bash
npm run dev
```

Opens http://localhost:3000 with live reload.

### Option 2 — PowerShell (no Node.js needed)

```powershell
.\start-server.ps1
```

Then visit http://localhost:3000.

## Supabase Setup

### 1. Create the tables

In your Supabase project, open **SQL Editor** and run:

```sql
create table public.contact_messages (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  name        text not null check (char_length(name) between 1 and 120),
  email       text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone       text check (char_length(phone) <= 30),
  category    text check (char_length(category) <= 60),
  message     text not null check (char_length(message) between 1 and 5000),
  status      text not null default 'new'
);

create table public.quote_requests (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  services    text[] not null default '{}',
  timeline    text check (char_length(timeline) <= 60),
  budget      text check (char_length(budget) <= 30),
  name        text not null check (char_length(name) between 1 and 120),
  company     text check (char_length(company) <= 120),
  email       text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone       text check (char_length(phone) <= 30),
  details     text check (char_length(details) <= 5000),
  status      text not null default 'new'
);

-- Visitors may only INSERT; they can never read, update or delete rows
alter table public.contact_messages enable row level security;
alter table public.quote_requests   enable row level security;

create policy "public can submit contact" on public.contact_messages
  for insert to anon with check (true);

create policy "public can submit quote" on public.quote_requests
  for insert to anon with check (true);
```

### 2. Add your keys

In `script.js`, replace the placeholders with the values from **Project Settings → API**:

```js
const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY';
```

> The **anon / publishable** key is safe to use in browser code — Row Level Security restricts it to inserts only. **Never** put the `service_role` key in this project.

### 3. View submissions

Open **Table Editor** in the Supabase dashboard to see entries in `contact_messages` and `quote_requests`.

## Troubleshooting

| Error in browser console | Fix |
|---|---|
| `new row violates row-level security policy` | The insert policy for the `anon` role is missing on that table |
| `column ... does not exist` | Table columns don't match the SQL above |
| Form says "unavailable right now" | The Supabase script failed to load — check your internet connection |
