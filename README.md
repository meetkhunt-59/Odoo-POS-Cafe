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

## Backend API surface

- `POST /backend/product-categories` – add a category.
- `POST /backend/products` / `GET /backend/products` – manage products + variants.
- `POST /backend/floors` / `POST /backend/tables` – construct floor plans and tables.
- `POST /backend/payment-methods` – toggle cash/digital/UPI and store UPI IDs.
- `POST /backend/self-order-tokens` – issue QR/self-order tokens that target sessions and tables.
- `GET /backend/reports/sales` – filters (period, session, responsible, product) for shift-wise sales aggregates.
- `POST /terminal/sessions/open` / `/terminal/sessions/{id}/close` / `/terminal/sessions/last` to track POS shifts.
- `POST /terminal/orders` + `/terminal/orders/{order_id}/pay` + `/terminal/orders/{order_id}/send` for orders/kitchen flows.
- `GET /terminal/display/kitchen` and `/terminal/display/customer/{order_id}` for the secondary screens.

All backend endpoints respect Supabase-authenticated roles (`admin`, `pos`) and connect to the tables defined in `supabase/migrations/20260404120000_init.sql`.

## Frontend demo

Use the React/Vite UI in `frontend-vite/` (kept separate from the Python backend):

```sh
cd frontend-vite
npm install
npm run dev
# Vite serves at http://localhost:4173 by default
```

Set `VITE_API_BASE` in a `.env` inside `frontend-vite/` if your backend isn’t on `http://localhost:8000`.

Legacy static mock UI remains in `frontend/` for quick reference but is superseded by the Vite app.

## Development

```sh
pip install -r requirements-dev.txt
pytest
```

## Testing

- `python -m pytest -q` now covers auth + the new backend/terminal flow (`tests/test_auth_api.py` and `tests/test_backend_terminal.py`).

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
