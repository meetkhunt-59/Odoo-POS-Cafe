# Project Context: Odoo POS Cafe

## Current State (as of April 4, 2026)

We are in the process of finalizing the migration of the POS Cafe backend from a local SQLAlchemy setup to a cloud-native Supabase implementation. 

### Recent Critical Fixes

1.  **Authentication Migration**:
    *   Replaced manual `PyJWT` decoding with the official `supabase-py` SDK's `auth.get_user()` method. This fixed issues with the new Supabase JWT Signing Keys.
    *   Implemented a dual-client system in `app/db.py`:
        *   `get_db()`: Returns a `service_role` client for administrative/backend DB operations (bypassing RLS).
        *   `get_auth_client()`: Returns an `anon` client for safe token verification.
    *   Fixed **Infinite Recursion (42P17)** in PostgreSQL by ensuring that `get_current_user` does not use the same client instance that triggers the policy evaluation.

2.  **User Profile Synchronization**:
    *   Created an **Auto-Repair** mechanism in `app/deps.py`. If an authenticated user logs in but doesn't have a record in the `public.profiles` table, the backend automatically creates one using their Auth metadata.
    *   Added a PostgreSQL **Trigger** (`on_auth_user_created`) to `supabase/migrations/supabase_migrations.sql` to ensure all future signups automatically get a profile.

3.  **Database Security (RLS)**:
    *   Consolidated the entire schema and RLS policies into `supabase/full_schema.sql`.
    *   Hardened RLS policies to allow `authenticated` users to read core data (`floors`, `tables`, `payment_methods`, `products`) which was previously causing a "Blank Page" on the frontend.

### Architecture

*   **Backend**: FastAPI with Supabase Python SDK.
*   **Frontend**: React (Vite) + TypeScript + TailwindCSS (for some parts, though vanilla CSS is preferred for premium look).
*   **Database**: Supabase (PostgreSQL) with RLS enabled.

### Ongoing Tasks: Product Management (A2)

We are currently enhancing the Product Management UI and Backend to support:
*   **General Info**: Name, Category, Price, Unit, Tax, Description.
*   **Variants**: Dynamic attributes (e.g., Pack Size) with extra pricing.

### Known Configuration

*   `Backend Origin`: `http://localhost:8000`
*   `Frontend Origin`: `http://localhost:5173`
*   `Supabase URL`: `https://wkpoknjpuxajajoglmrr.supabase.co`

---
*This file serves as a hand-off and context document to ensure consistency across development sessions.*
