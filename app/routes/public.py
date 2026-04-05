from fastapi import APIRouter, Depends, HTTPException
from app.db import Client, get_db
from app.schemas import OrderCreateRequest, OrderResponse, ProductResponse, CategoryResponse, ProductVariantResponse
from decimal import Decimal
import base64
from uuid import UUID

router = APIRouter(prefix="/public", tags=["public"])

def decode_token(token: str):
    try:
        decoded = base64.b64decode(token).decode("utf-8")
        session_id_str, table_id_str = decoded.split(":")
        return session_id_str, table_id_str
    except Exception:
        raise HTTPException(400, "Invalid or corrupted order token.")

@router.get("/products", response_model=list[ProductResponse])
def get_public_products(db: Client = Depends(get_db)):
    prods = db.table("products").select("*, product_variants(*), category:product_categories(name)").eq("is_active", True).execute()
    result = []
    for p in prods.data:
        cat_name = p.get("category", {}).get("name") if p.get("category") else "Unknown"
        variants = [ProductVariantResponse(**v) for v in p.get("product_variants", [])]

        result.append(ProductResponse(
            id=p["id"],
            name=p["name"],
            category=cat_name,
            price=p["price"],
            unit=p.get("unit"),
            tax=p["tax"],
            description=p.get("description"),
            image_url=p.get("image_url"),
            send_to_kitchen=p.get("send_to_kitchen"),
            is_active=p["is_active"],
            in_stock=p.get("in_stock", True),
            variants=variants,
        ))
    return result

@router.get("/categories", response_model=list[CategoryResponse])
def get_public_categories(db: Client = Depends(get_db)):
    res = db.table("product_categories").select("*").execute()
    return res.data

@router.post("/orders", response_model=OrderResponse)
def create_public_order(
    token: str,
    payload: OrderCreateRequest,
    db: Client = Depends(get_db)
):
    session_id_str, table_id_str = decode_token(token)
    
    order_data = {
        "session_id": session_id_str,
        "table_id": table_id_str,
        "customer_id": str(payload.customer_id) if payload.customer_id else None,
        "notes": payload.notes,
        "discount_percentage": float(payload.discount_percentage) if payload.discount_percentage is not None else 0.0,
    }
    
    order_res = db.table("orders").insert(order_data).execute()
    if not order_res.data:
        raise HTTPException(500, "Failed to process order creation.")
    order = order_res.data[0]
    
    total = Decimal("0")
    order_items = []
    
    product_ids = [str(i.product_id) for i in payload.items]
    prod_res = db.table("products").select("id, price, tax, in_stock").in_("id", product_ids).execute()
    prod_map = {p["id"]: p for p in prod_res.data}
    
    insert_data_list = []
    for item_data in payload.items:
        prod = prod_map.get(str(item_data.product_id))
        if not prod:
            raise HTTPException(404, f"Product {item_data.product_id} not found.")
        if prod.get("in_stock", True) is False:
            raise HTTPException(400, f"Cannot order out-of-stock product: {item_data.product_id}")
            
        insert_data_list.append({
            "order_id": order["id"],
            "product_id": prod["id"],
            "quantity": item_data.quantity,
            "price_at_checkout": prod["price"],
        })
        line_price = Decimal(str(prod["price"])) * Decimal(str(item_data.quantity))
        line_tax = line_price * (Decimal(str(prod.get("tax", 0))) / Decimal("100"))
        
        total += (line_price + line_tax)
    
    if insert_data_list:
        items_res = db.table("order_items").insert(insert_data_list).execute()
        if not items_res.data:
             raise HTTPException(500, "Failed to bulk insert order items.")
        order_items = items_res.data
    
    discount_pct = Decimal(str(payload.discount_percentage)) if payload.discount_percentage else Decimal("0")
    final_total = total * (Decimal("1") - (discount_pct / Decimal("100")))
    
    upd = db.table("orders").update({"total_amount": float(final_total)}).eq("id", order["id"]).execute()
    if not upd.data:
        raise HTTPException(500, "Failed to update order total.")
        
    # Auto mark table as busy
    if table_id_str:
        db.table("tables").update({"appointment_resource": True}).eq("id", table_id_str).execute()
        
    final_order = upd.data[0]
    final_order["items"] = order_items
    return final_order
