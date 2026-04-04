import jwt
from app.config import settings

def create_access_token(*, subject: str, expires_minutes: int | None = None) -> str:
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes or settings.access_token_expire_minutes)
    payload = {"sub": subject, "exp": expire.timestamp()}
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")

def decode_token(token: str) -> dict:
    # PyJWT automatically handles HS256 if passed in algorithms
    # verify_aud=False ensures Supabase tokens aren't rejected due to 'authenticated' aud
    return jwt.decode(token, settings.secret_key, algorithms=["HS256"], options={"verify_aud": False})
