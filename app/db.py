from __future__ import annotations
from supabase import create_client, Client
from app.config import settings

# We instantiate a single client globally for connection pooling efficiency
_client = create_client(
    settings.supabase_url,
    settings.supabase_service_role_key or settings.supabase_anon_key
)

def get_db() -> Client:
    return _client
