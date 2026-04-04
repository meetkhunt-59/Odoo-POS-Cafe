from __future__ import annotations

from datetime import datetime


def _login(client, username: str, password: str) -> str:
    resp = client.post("/auth/login", data={"username": username, "password": password})
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


def test_bootstrap_admin_then_create_users_and_shifts(client, fixed_now_utc: datetime):
    # Bootstrap first admin.
    resp = client.post(
        "/auth/signup",
        json={"username": "admin", "email": "admin@example.com", "password": "secret123"},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["role"] == "admin"

    # Second signup is blocked.
    resp = client.post(
        "/auth/signup",
        json={"username": "admin2", "email": "admin2@example.com", "password": "secret123"},
    )
    assert resp.status_code == 403

    admin_token = _login(client, "admin", "secret123")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Create POS + kitchen users.
    resp = client.post(
        "/admin/users",
        headers=admin_headers,
        json={"username": "pos1", "email": "pos1@example.com", "password": "secret123", "role": "pos"},
    )
    assert resp.status_code == 200, resp.text
    pos_user_id = resp.json()["id"]

    resp = client.post(
        "/admin/users",
        headers=admin_headers,
        json={"username": "kit1", "email": "kit1@example.com", "password": "secret123", "role": "kitchen"},
    )
    assert resp.status_code == 200, resp.text
    kitchen_user_id = resp.json()["id"]

    # POS login is blocked without an active shift.
    resp = client.post("/auth/login", data={"username": "pos1", "password": "secret123"})
    assert resp.status_code == 403

    # Shifts can only be assigned to POS users.
    resp = client.post(
        "/admin/shifts",
        headers=admin_headers,
        json={
            "user_id": kitchen_user_id,
            "name": "kitchen-shift",
            "start_time": "11:00:00",
            "end_time": "13:00:00",
            "days": [fixed_now_utc.weekday()],
            "timezone": "UTC",
            "is_active": True,
        },
    )
    assert resp.status_code == 400

    # Assign an active shift that includes fixed_now_utc.
    resp = client.post(
        "/admin/shifts",
        headers=admin_headers,
        json={
            "user_id": pos_user_id,
            "name": "morning",
            "start_time": "11:00:00",
            "end_time": "13:00:00",
            "days": [fixed_now_utc.weekday()],
            "timezone": "UTC",
            "is_active": True,
        },
    )
    assert resp.status_code == 200, resp.text

    pos_token = _login(client, "pos1", "secret123")
    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {pos_token}"})
    assert resp.status_code == 200, resp.text
    assert resp.json()["role"] == "pos"

    kitchen_token = _login(client, "kit1", "secret123")
    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {kitchen_token}"})
    assert resp.status_code == 200, resp.text
    assert resp.json()["role"] == "kitchen"
