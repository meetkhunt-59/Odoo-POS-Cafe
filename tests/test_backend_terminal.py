from __future__ import annotations

from decimal import Decimal


def _login(client, email: str, password: str) -> str:
    resp = client.post("/auth/login", data={"username": email, "password": password})
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


def test_backend_terminal_flow(client):
    resp = client.post(
        "/auth/signup",
        json={"email": "admin@example.com", "password": "secret123", "name": "Admin"},
    )
    assert resp.status_code == 200, resp.text

    token = _login(client, "admin@example.com", "secret123")
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    floor = client.post("/backend/floors", json={"name": "Ground Floor"}, headers=headers)
    assert floor.status_code == 200, floor.text
    floor_id = floor.json()["id"]

    table = client.post(
        "/backend/tables",
        json={"floor_id": floor_id, "table_number": "A1", "seats": 4},
        headers=headers,
    )
    assert table.status_code == 200, table.text
    table_id = table.json()["id"]

    payment = client.post(
        "/backend/payment-methods",
        json={"name": "Cash", "type": "cash", "is_enabled": True},
        headers=headers,
    )
    assert payment.status_code == 200, payment.text
    payment_id = payment.json()["id"]

    product = client.post(
        "/backend/products",
        json={"name": "Pizza", "category": "Kitchen", "price": 320},
        headers=headers,
    )
    assert product.status_code == 200, product.text
    product_id = product.json()["id"]

    session = client.post("/terminal/sessions/open", json={}, headers=headers)
    assert session.status_code == 200, session.text
    session_id = session.json()["id"]

    order = client.post(
        "/terminal/orders",
        json={
            "session_id": session_id,
            "table_id": table_id,
            "items": [{"product_id": product_id, "quantity": 2}],
        },
        headers=headers,
    )
    assert order.status_code == 200, order.text
    order_data = order.json()
    assert Decimal(order_data["total_amount"]) == Decimal("640")

    paid = client.post(
        f"/terminal/orders/{order_data['id']}/pay",
        json={"payment_method_id": payment_id},
        headers=headers,
    )
    assert paid.status_code == 200, paid.text
    assert paid.json()["payment_status"] == "paid"

    kitchen = client.get("/terminal/display/kitchen", headers=headers)
    assert kitchen.status_code == 200, kitchen.text
    assert kitchen.json(), "Kitchen must show orders"

    customer = client.get(f"/terminal/display/customer/{order_data['id']}", headers=headers)
    assert customer.status_code == 200, customer.text
    assert customer.json()["payment_status"] == "paid"
