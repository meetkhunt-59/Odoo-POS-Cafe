from __future__ import annotations
from supabase import create_client, Client
from app.config import settings

def get_db() -> Client:
    # Always acts as service_role (bypasses RLS).
    # We create a new client to ensure headers are never leaked between requests.
    return create_client(
        settings.supabase_url,
        settings.supabase_service_role_key or settings.supabase_anon_key
    )

def get_auth_client() -> Client:
    # Separate client strictly for evaluating auth tokens.
    return create_client(
        settings.supabase_url,
        settings.supabase_anon_key
    )
