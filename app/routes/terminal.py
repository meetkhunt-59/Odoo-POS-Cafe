from fastapi import APIRouter, Depends, HTTPException, status
from app.db import Client, get_db
from app.deps import get_current_user
from app.schemas import (
    SessionOpenRequest, SessionSummary, OrderCreateRequest, OrderResponse, 
    OrderPayRequest, OrderItemResponse, KitchenActionRequest
)
from decimal import Decimal

router = APIRouter(prefix="/terminal", tags=["terminal"])

@router.post("/sessions/open", response_model=SessionSummary)
def open_session(
    payload: SessionOpenRequest,
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    res = db.table("pos_sessions").insert({"responsible_user_id": current["id"]}).execute()
    if not res.data:
        raise HTTPException(500, "Failed to open session: missing returned ID representation.")
    return SessionSummary(**res.data[0])

@router.post("/orders", response_model=OrderResponse)
def create_order(
    payload: OrderCreateRequest,
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    order_data = {
        "session_id": str(payload.session_id),
        "table_id": str(payload.table_id) if payload.table_id else None,
    }
    order_res = db.table("orders").insert(order_data).execute()
    if not order_res.data:
        raise HTTPException(500, "Failed to process order creation representation.")
    order = order_res.data[0]
    
    total = Decimal("0")
    order_items = []
    for item_data in payload.items:
        prod_res = db.table("products").select("*").eq("id", str(item_data.product_id)).execute()
        if not prod_res.data:
            raise HTTPException(404, f"Product {item_data.product_id} not found in catalog.")
        prod = prod_res.data[0]
        
        insert_data = {
            "order_id": order["id"],
            "product_id": prod["id"],
            "quantity": item_data.quantity,
            "price_at_checkout": prod["price"],
        }
        item_res = db.table("order_items").insert(insert_data).execute()
        if not item_res.data:
             raise HTTPException(500, "Failed to insert order item representation.")
        order_items.append(item_res.data[0])
        total += Decimal(str(prod["price"])) * Decimal(str(item_data.quantity))
    
    upd = db.table("orders").update({"total_amount": float(total)}).eq("id", order["id"]).execute()
    if not upd.data:
        raise HTTPException(500, "Failed to execute final order total calculation update.")
        
    final_order = upd.data[0]
    final_order["items"] = order_items
    return final_order

@router.post("/orders/{order_id}/pay", response_model=OrderResponse)
def pay_order(
    order_id: str,
    payload: OrderPayRequest,
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    upd = db.table("orders").update({
        "payment_method_id": str(payload.payment_method_id),
        "payment_status": "paid"
    }).eq("id", order_id).execute()
    if not upd.data:
        raise HTTPException(status_code=404, detail="Order not found or update returned no data.")
    final_order = upd.data[0]
    final_order["items"] = []
    return final_order

@router.get("/display/kitchen")
def get_kitchen_display(
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    # Get all active orders that are not completed (or just for today)
    res = db.table("orders").select("*, order_items(*)").neq("kitchen_status", "cancelled").order("created_at").execute()
    orders = res.data
    
    # Enrich with products
    for order in orders:
        for item in order.get("order_items", []):
            p_res = db.table("products").select("name").eq("id", item["product_id"]).execute()
            if p_res.data:
                item["product_name"] = p_res.data[0]["name"]
                
    return orders

@router.patch("/orders/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: str,
    payload: KitchenActionRequest,
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    # Action mapping
    status_map = {
        "mark_preparing": "preparing",
        "mark_completed": "completed",
        "mark_cancelled": "cancelled"
    }
    new_status = status_map.get(payload.action)
    if not new_status:
        raise HTTPException(400, "Invalid kitchen action.")
        
    upd = db.table("orders").update({"kitchen_status": new_status}).eq("id", order_id).execute()
    if not upd.data:
        raise HTTPException(404, "Order not found.")
        
    final_order = upd.data[0]
    # Fetch items for response model consistency
    items_res = db.table("order_items").select("*").eq("order_id", order_id).execute()
    final_order["items"] = items_res.data
    return final_order

@router.get("/display/customer/{order_id}")
def get_customer_display(
    order_id: str,
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    res = db.table("orders").select("*").eq("id", order_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Display target order not found.")
    return res.data[0]
