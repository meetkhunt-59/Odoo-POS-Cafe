# Supabase (Postgres) Setup

This project uses Supabase as the Postgres database. The Python backend connects using `DATABASE_URL`.

## 1) Create a Supabase project

In Supabase dashboard:
- Create project
- Copy the **Database connection string** (Settings -> Database -> Connection string)

Set in `.env`:
- `DATABASE_URL=postgresql+psycopg://postgres:<PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require`

## 2) Apply schema

Option A (fastest): paste the migration SQL into Supabase SQL Editor:
- `supabase/migrations/20260404120000_init.sql`

Option B (CLI): use Supabase CLI migrations (if you use the CLI locally).

