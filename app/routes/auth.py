from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from supabase import Client

from app.db import get_db, get_auth_client
from app.deps import admin_exists, get_current_user
from app.schemas import ProfilePublic, SignupRequest, TokenResponse, RequestResetRequest, UpdatePasswordRequest

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", response_model=ProfilePublic)
def signup(
    payload: SignupRequest,
    db: Client = Depends(get_db),
    auth_client: Client = Depends(get_auth_client),
):
    try:
        sess = auth_client.auth.sign_up(
            {
                "email": payload.email, 
                "password": payload.password, 
                "options": {
                    "data": {"name": payload.name},
                    "email_redirect_to": "http://localhost:5173/"
                }
            }
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    if not sess.user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Supabase signup did not return user")

    role = "admin" if not admin_exists(db) else "staff"
    res = db.table("profiles").insert({"id": str(sess.user.id), "name": payload.name, "role": role}).execute()
    if not res.data:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Profile already exists")
    
    return ProfilePublic(**res.data[0])

@router.post("/login", response_model=TokenResponse)
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    auth_client: Client = Depends(get_auth_client),
):
    try:
        sess = auth_client.auth.sign_in_with_password({"email": form.username, "password": form.password})
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    
    if not sess.session or not sess.session.access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Login did not return access token")
        
    return TokenResponse(
        access_token=sess.session.access_token,
        token_type=sess.session.token_type or "bearer",
        expires_in=sess.session.expires_in,
        refresh_token=sess.session.refresh_token,
    )

@router.get("/me", response_model=ProfilePublic)
def me(current: dict = Depends(get_current_user)):
    return ProfilePublic(**current)

@router.post("/request-reset")
def request_password_reset(
    payload: RequestResetRequest,
    auth_client: Client = Depends(get_auth_client),
):
    try:
        auth_client.auth.reset_password_email(payload.email, {"redirect_to": "http://localhost:5173/update-password"})
        return {"detail": "If that email exists, we've sent a recovery link."}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/update-password")
def update_password(
    payload: UpdatePasswordRequest,
    auth_client: Client = Depends(get_auth_client),
):
    try:
        # Verify the OTP. This establishes a session internally on the client.
        auth_client.auth.verify_otp({
            "email": payload.email, 
            "token": payload.otp, 
            "type": "recovery"
        })
        # Overwrite the password using the established session
        auth_client.auth.update_user({"password": payload.new_password})
        return {"detail": "Password updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
