from __future__ import annotations
from supabase import create_client, Client
from app.config import settings

# Global singletons for HTTP connection pooling (drastically improves latency)
_service_client: Client | None = None
_auth_client: Client | None = None

def get_db() -> Client:
    global _service_client
    if _service_client is None:
        _service_client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key or settings.supabase_anon_key
        )
    return _service_client

def get_auth_client() -> Client:
    global _auth_client
    if _auth_client is None:
        _auth_client = create_client(
            settings.supabase_url,
            settings.supabase_anon_key
        )
    return _auth_client
