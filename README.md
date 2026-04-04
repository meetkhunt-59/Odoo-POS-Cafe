# POS Cafe Backend (Auth + Shifts)

Minimal Python backend for signup/login with role-based auth (admin/pos/kitchen) and shift-restricted POS logins.

## Quickstart

```sh
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Open API docs at `http://localhost:8000/docs`.

## Supabase database

- Set `DATABASE_URL` to your Supabase Postgres connection string (see `supabase/README.md`).
- Apply schema using `supabase/migrations/20260404120000_init.sql`.

## Development

```sh
pip install -r requirements-dev.txt
pytest
```

## Auth behavior

- First ever signup creates an `admin` without authentication.
- After an admin exists, only admins can create new users and shifts.
- `pos` users can only log in during an active shift.

## Useful endpoints

- `POST /auth/signup` (bootstrap first admin)
- `POST /auth/login` (OAuth2 form: `username`, `password`)
- `GET /auth/me` (Bearer token)
- `POST /admin/users` (create `pos`/`kitchen` users)
- `POST /admin/shifts` (assign shift; supports `days` as `0=Mon .. 6=Sun`)
