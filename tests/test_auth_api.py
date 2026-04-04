from __future__ import annotations

from datetime import datetime


def _login(client, email: str, password: str) -> str:
    resp = client.post("/auth/login", data={"username": email, "password": password})
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


def test_bootstrap_admin_then_create_users(client, fixed_now_utc: datetime):
    # Bootstrap first admin.
    resp = client.post(
        "/auth/signup",
        json={"email": "admin@example.com", "password": "secret123", "name": "Admin"},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["role"] == "admin"

    # Second signup is blocked.
    resp = client.post(
        "/auth/signup",
        json={"email": "admin2@example.com", "password": "secret123", "name": "Admin2"},
    )
    assert resp.status_code == 403

    admin_token = _login(client, "admin@example.com", "secret123")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Create POS + kitchen users.
    resp = client.post(
        "/admin/users",
        headers=admin_headers,
        json={"email": "pos1@example.com", "password": "secret123", "name": "POS 1", "role": "pos"},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["role"] == "pos"

    resp = client.post(
        "/admin/users",
        headers=admin_headers,
        json={"email": "kit1@example.com", "password": "secret123", "name": "Kitchen 1", "role": "kitchen"},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["role"] == "kitchen"

    pos_token = _login(client, "pos1@example.com", "secret123")
    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {pos_token}"})
    assert resp.status_code == 200, resp.text
    assert resp.json()["role"] == "pos"

    kitchen_token = _login(client, "kit1@example.com", "secret123")
    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {kitchen_token}"})
    assert resp.status_code == 200, resp.text
    assert resp.json()["role"] == "kitchen"
