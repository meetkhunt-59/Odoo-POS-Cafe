from fastapi import APIRouter, Depends, HTTPException, status
from app.db import Client, get_db
from app.deps import get_current_user
from app.schemas import (
    SessionOpenRequest, SessionSummary, OrderCreateRequest, OrderResponse,
    OrderPayRequest, OrderItemResponse, KitchenActionRequest,
    TransactionSummary, PaymentSummary, CustomerCreate, CustomerResponse
)
from decimal import Decimal
from collections import defaultdict
import razorpay
from app.config import settings

router = APIRouter(prefix="/terminal", tags=["terminal"])

@router.post("/sessions/open", response_model=SessionSummary)
def open_session(
    payload: SessionOpenRequest,
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    insert_data = {"responsible_user_id": current["id"]}
    if payload.pos_id:
        insert_data["pos_id"] = str(payload.pos_id)
    res = db.table("pos_sessions").insert(insert_data).execute()
    if not res.data:
        raise HTTPException(500, "Failed to open session: missing returned ID representation.")
    return SessionSummary(**res.data[0])

@router.get("/sessions/last-closing")
def get_last_closing_per_pos(
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    """Returns the total paid amount for each POS register from today's sessions."""
    from datetime import date
    today = date.today().isoformat()
    
    # Get all sessions that were opened today (or are still open) with a pos_id
    sessions_res = db.table("pos_sessions")\
        .select("id, pos_id")\
        .not_.is_("pos_id", "null")\
        .gte("opened_at", today)\
        .execute()
    
    if not sessions_res.data:
        return {}
    
    # Build session_id -> pos_id map
    session_pos_map = {}
    for s in sessions_res.data:
        session_pos_map[s["id"]] = s["pos_id"]
    
    session_ids = list(session_pos_map.keys())
    
    # Get all paid orders for these sessions
    orders_res = db.table("orders")\
        .select("session_id, total_amount")\
        .eq("payment_status", "paid")\
        .in_("session_id", session_ids)\
        .execute()
    
    # Aggregate totals per POS
    pos_totals: dict[str, float] = {}
    for order in orders_res.data:
        pos_id = session_pos_map.get(order["session_id"])
        if pos_id:
            pos_totals[pos_id] = pos_totals.get(pos_id, 0) + float(order["total_amount"] or 0)
    
    return pos_totals

@router.post("/orders", response_model=OrderResponse)
def create_order(
    payload: OrderCreateRequest,
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    order_data = {
        "session_id": str(payload.session_id),
        "table_id": str(payload.table_id) if payload.table_id else None,
        "customer_id": str(payload.customer_id) if payload.customer_id else None,
        "notes": payload.notes,
        "discount_percentage": float(payload.discount_percentage) if payload.discount_percentage is not None else 0.0,
    }
    order_res = db.table("orders").insert(order_data).execute()
    if not order_res.data:
        raise HTTPException(500, "Failed to process order creation representation.")
    order = order_res.data[0]
    
    total = Decimal("0")
    order_items = []
    
    # Fast Bulk Product Lookup
    product_ids = [str(i.product_id) for i in payload.items]
    prod_res = db.table("products").select("id, price, tax, in_stock").in_("id", product_ids).execute()
    prod_map = {p["id"]: p for p in prod_res.data}
    
    # Fast Bulk Variant Lookup
    variant_ids = [str(i.variant_id) for i in payload.items if i.variant_id]
    variant_map = {}
    if variant_ids:
        var_res = db.table("product_variants").select("id, extra_price").in_("id", variant_ids).execute()
        variant_map = {v["id"]: v for v in var_res.data}
    
    insert_data_list = []
    for item_data in payload.items:
        prod = prod_map.get(str(item_data.product_id))
        if not prod:
            raise HTTPException(404, f"Product {item_data.product_id} not found in catalog.")
        if prod.get("in_stock", True) is False:
            raise HTTPException(400, f"Cannot order out-of-stock product: {item_data.product_id}")
        
        # Calculate unit price = base + variant extra
        unit_price = Decimal(str(prod["price"]))
        if item_data.variant_id:
            variant = variant_map.get(str(item_data.variant_id))
            if variant:
                unit_price += Decimal(str(variant.get("extra_price", 0)))
            
        insert_data_list.append({
            "order_id": order["id"],
            "product_id": prod["id"],
            "variant_id": str(item_data.variant_id) if item_data.variant_id else None,
            "quantity": item_data.quantity,
            "price_at_checkout": float(unit_price),
        })
        line_price = unit_price * Decimal(str(item_data.quantity))
        line_tax = line_price * (Decimal(str(prod.get("tax", 0))) / Decimal("100"))
        
        total += (line_price + line_tax)
    
    # Fast Bulk Insert (O(1) instead of O(N))
    if insert_data_list:
        items_res = db.table("order_items").insert(insert_data_list).execute()
        if not items_res.data:
             raise HTTPException(500, "Failed to bulk insert order items.")
        order_items = items_res.data
    
    # Apply discount
    discount_pct = Decimal(str(payload.discount_percentage)) if payload.discount_percentage else Decimal("0")
    final_total = total * (Decimal("1") - (discount_pct / Decimal("100")))
    
    upd = db.table("orders").update({"total_amount": float(final_total)}).eq("id", order["id"]).execute()
    if not upd.data:
        raise HTTPException(500, "Failed to execute final order total calculation update.")
        
    # Auto mark table as busy
    if payload.table_id:
        db.table("tables").update({"appointment_resource": True}).eq("id", str(payload.table_id)).execute()
        
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
    
    # Auto mark table as busy after payment
    if final_order.get("table_id"):
        db.table("tables").update({"appointment_resource": True}).eq("id", str(final_order["table_id"])).execute()
        
    final_order["items"] = []
    return final_order

@router.delete("/orders/{order_id}", status_code=204)
def delete_order(
    order_id: str,
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    res = db.table("orders").delete().eq("id", order_id).execute()
    if not res.data:
        raise HTTPException(404, "Order not found.")

@router.post("/orders/{order_id}/razorpay")
def create_razorpay_order(
    order_id: str,
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        raise HTTPException(500, "Razorpay credentials not configured.")
        
    res = db.table("orders").select("total_amount").eq("id", order_id).execute()
    if not res.data:
        raise HTTPException(404, "Order not found.")
        
    total_amount = float(res.data[0]["total_amount"])
    amount_paise = int(total_amount * 100)
    
    try:
        client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))
        rzp_order = client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "receipt": order_id
        })
        return {
            "razorpay_order_id": rzp_order["id"],
            "amount": amount_paise,
            "currency": "INR",
            "key_id": settings.razorpay_key_id
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to create Razorpay order: {str(e)}")

@router.get("/transactions", response_model=list[TransactionSummary])
def get_transactions(
    limit: int = 50,
    offset: int = 0,
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    res = db.table("orders")\
        .select("*, payment_method:payment_methods(name)")\
        .order("created_at", desc=True)\
        .range(offset, offset + limit - 1)\
        .execute()
    
    transactions = []
    for order in res.data:
        pm = order.get("payment_method")
        pm_name = pm.get("name") if isinstance(pm, dict) else None
        
        transactions.append(TransactionSummary(
            id=order["id"],
            order_number=order["order_number"],
            created_at=order["created_at"],
            total_amount=order["total_amount"],
            payment_status=order["payment_status"],
            kitchen_status=order["kitchen_status"],
            payment_method=pm_name
        ))
    return transactions

@router.get("/payments/summary", response_model=list[PaymentSummary])
def get_payment_summary(
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    # Fetch all paid orders
    res = db.table("orders")\
        .select("created_at, total_amount, payment_method:payment_methods(name)")\
        .eq("payment_status", "paid")\
        .execute()
    
    # Aggregate in python:
    # Key: (date_str, method_name) -> total
    agg = defaultdict(Decimal)
    
    for order in res.data:
        date_str = order["created_at"].split("T")[0]
        pm = order.get("payment_method")
        pm_name = pm.get("name") if isinstance(pm, dict) else "Unknown"
        agg[(date_str, pm_name)] += Decimal(str(order["total_amount"]))
    
    summaries = []
    for (d, m), total in agg.items():
        summaries.append(PaymentSummary(date=d, payment_method=m, total_amount=total))
    
    # Sort newest first
    summaries.sort(key=lambda x: x.date, reverse=True)
    return summaries

@router.get("/customers", response_model=list[CustomerResponse])
def get_customers(
    search: str = "",
    limit: int = 50,
    offset: int = 0,
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    query = db.table("customers").select("*, orders(total_amount)")
    if search:
        query = query.or_(f"name.ilike.%{search}%,phone.ilike.%{search}%")
        
    res = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    
    customers = []
    for c in res.data:
        # Sum total_sales from related orders
        orders = c.get("orders") or []
        total_sales = sum(Decimal(str(o["total_amount"])) for o in orders)
        customers.append(CustomerResponse(
            id=c["id"],
            name=c["name"],
            phone=c.get("phone"),
            email=c.get("email"),
            address=c.get("address"),
            city=c.get("city"),
            state=c.get("state"),
            country=c.get("country"),
            total_sales=total_sales,
            created_at=c["created_at"]
        ))
    return customers

@router.post("/customers", response_model=CustomerResponse)
def create_customer(
    payload: CustomerCreate,
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    data = {
        "name": payload.name, 
        "phone": payload.phone, 
        "email": payload.email,
        "address": payload.address,
        "city": payload.city,
        "state": payload.state,
        "country": payload.country
    }
    res = db.table("customers").insert(data).execute()
    if not res.data:
        raise HTTPException(500, "Failed to create customer")
    
    c = res.data[0]
    return CustomerResponse(
        id=c["id"],
        name=c["name"],
        phone=c.get("phone"),
        email=c.get("email"),
        address=c.get("address"),
        city=c.get("city"),
        state=c.get("state"),
        country=c.get("country"),
        total_sales=Decimal("0.0"),
        created_at=c["created_at"]
    )

@router.get("/display/kitchen")
def get_kitchen_display(
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    # Get all active orders that are not cancelled or completed
    # We fetch products and variants in the same join for speed
    res = db.table("orders").select("*, order_items(*, product:products(name, send_to_kitchen, category:product_categories(name)), variant:product_variants(value))").neq("kitchen_status", "cancelled").order("created_at").execute()
    raw_orders = res.data
    
    kitchen_orders = []
    for order in raw_orders:
        valid_items = []
        for item in order.get("order_items", []):
            prod = item.get("product")
            if prod and prod.get("send_to_kitchen"):
                # Enrich item with combined name
                variant_data = item.get("variant")
                variant_val = variant_data.get("value") if isinstance(variant_data, dict) else None
                if variant_val:
                    item["product_name"] = f"{prod['name']} ({variant_val})"
                else:
                    item["product_name"] = prod["name"]
                
                # Fetch dynamically joined Category Name
                cat_dict = prod.get("category")
                item["category_name"] = cat_dict.get("name") if cat_dict else "General"
                
                valid_items.append(item)
        
        # Only show orders that have at least one kitchen item
        if valid_items:
            order["order_items"] = valid_items
            kitchen_orders.append(order)
                
    return kitchen_orders

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
        
    try:
        upd = db.table("orders").update({"kitchen_status": new_status}).eq("id", order_id).execute()
        if not upd.data:
            raise HTTPException(404, "Order not found.")
    except Exception as e:
        # Catch check constraint violations specifically to provide clear feedback
        if "violates check constraint" in str(e):
            raise HTTPException(400, f"Database constraint error: {str(e)}")
        raise HTTPException(500, f"Failed to update kitchen status: {str(e)}")
        
    # FETCH ENRICHED for response
    full_order = db.table("orders")\
        .select("*, order_items(*, product:products(name, send_to_kitchen), variant:product_variants(value))")\
        .eq("id", order_id)\
        .single().execute()
    
    if not full_order.data:
        raise HTTPException(404, "Order data lost during update.")
        
    order_data = full_order.data
    # Prepare items list with names for ProductResponse
    items = []
    for item in order_data.get("order_items", []):
        prod = item.get("product")
        if prod:
            variant_data = item.get("variant")
            variant_val = variant_data.get("value") if isinstance(variant_data, dict) else None
            item["product_name"] = f"{prod['name']} ({variant_val})" if variant_val else prod["name"]
        items.append(item)
    
    order_data["items"] = items
    return order_data

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
