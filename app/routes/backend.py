from fastapi import APIRouter, Depends, HTTPException, status
from app.db import Client, get_db
from app.deps import get_current_user
from app.schemas import (
    CategoryRequest, CategoryResponse, CategoryUpdate,
    FloorRequest, FloorResponse, FloorUpdate,
    TableRequest, TableResponse, TableUpdate,
    PaymentMethodRequest, PaymentMethodResponse, PaymentMethodUpdate,
    ProductCreateRequest, ProductResponse, ProductVariantResponse, ProductUpdateRequest,
    PointOfSaleRequest, PointOfSaleResponse, PointOfSaleUpdate,
    DashboardStatsResponse,
)

router = APIRouter(prefix="/backend", tags=["backend"])

# ─── POINT OF SALES ───────────────────────────────────────────

@router.get("/pos", response_model=list[PointOfSaleResponse])
def list_pos(
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    res = db.table("point_of_sales").select("*").order("created_at").execute()
    return [PointOfSaleResponse(**p) for p in res.data]

@router.post("/pos", response_model=PointOfSaleResponse)
def create_pos(
    payload: PointOfSaleRequest,
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    data = payload.model_dump()
    res = db.table("point_of_sales").insert(data).execute()
    if not res.data:
        raise HTTPException(500, "Failed to create POS.")
    return PointOfSaleResponse(**res.data[0])

@router.put("/pos/{pos_id}", response_model=PointOfSaleResponse)
def update_pos(
    pos_id: str,
    payload: PointOfSaleUpdate,
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    update_data = payload.model_dump(exclude_unset=True, mode='json')
    res = db.table("point_of_sales").update(update_data).eq("id", pos_id).execute()
    if not res.data:
        raise HTTPException(404, "POS not found.")
    return PointOfSaleResponse(**res.data[0])

@router.delete("/pos/{pos_id}", status_code=204)
def delete_pos(
    pos_id: str,
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    res = db.table("point_of_sales").delete().eq("id", pos_id).execute()
    if not res.data:
        raise HTTPException(404, "POS not found.")

# ─── PRODUCT CATEGORIES ───────────────────────────────────────

@router.get("/product-categories", response_model=list[CategoryResponse])
def list_categories(
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    # Use join instead of N+1 loop for product counts
    cats = db.table("product_categories").select("*, products(id)").order("created_at").execute()
    result = []
    for c in cats.data:
        result.append(CategoryResponse(
            id=c["id"],
            name=c["name"],
            send_to_kitchen=c.get("send_to_kitchen", True),
            product_count=len(c.get("products", [])),
        ))
    return result


@router.post("/product-categories", response_model=CategoryResponse)
def create_category(
    payload: CategoryRequest,
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    res = db.table("product_categories").insert({"name": payload.name}).execute()
    if not res.data:
        raise HTTPException(500, "Failed to create category.")
    c = res.data[0]
    return CategoryResponse(id=c["id"], name=c["name"], send_to_kitchen=c.get("send_to_kitchen", True), product_count=0)


@router.put("/product-categories/{cat_id}", response_model=CategoryResponse)
def update_category(
    cat_id: str,
    payload: CategoryUpdate,
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    update_data = payload.model_dump(exclude_unset=True, mode='json')
    res = db.table("product_categories").update(update_data).eq("id", cat_id).execute()
    if not res.data:
        raise HTTPException(404, "Category not found.")
    c = res.data[0]
    return CategoryResponse(id=c["id"], name=c["name"], send_to_kitchen=c.get("send_to_kitchen", True))


# ─── PRODUCTS ─────────────────────────────────────────────────

@router.get("/products", response_model=list[ProductResponse])
def list_products(
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    # Deep join with variants and categories instead of N+1 sequence
    prods = db.table("products").select("*, product_variants(*), category:product_categories(name)").eq("is_active", True).order("created_at").execute()
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
            send_to_kitchen=p.get("send_to_kitchen"),
            is_active=p["is_active"],
            variants=variants,
        ))
    return result


@router.post("/products", response_model=ProductResponse)
def create_product(
    payload: ProductCreateRequest,
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    # Resolve or create category
    cat_res = db.table("product_categories").select("*").eq("name", payload.category).execute()
    if cat_res.data:
        cat_id = cat_res.data[0]["id"]
        cat_name = cat_res.data[0]["name"]
    else:
        new_cat = db.table("product_categories").insert({"name": payload.category}).execute()
        if not new_cat.data:
            raise HTTPException(500, "Failed to create product category.")
        cat_id = new_cat.data[0]["id"]
        cat_name = new_cat.data[0]["name"]

    # 2. Bulk Insert Product and Variants
    prod_data = {
        "category_id": cat_id,
        "name": payload.name,
        "price": float(payload.price),
        "unit": payload.unit,
        "tax": float(payload.tax),
        "description": payload.description,
        "send_to_kitchen": payload.send_to_kitchen,
    }
    prod_res = db.table("products").insert(prod_data).execute()
    if not prod_res.data:
        raise HTTPException(500, "Failed to create product.")
    new_prod_id = prod_res.data[0]["id"]

    if payload.variants:
        variants_data = [
            {
                "product_id": new_prod_id,
                "attribute": v.attribute,
                "value": v.value,
                "extra_price": float(v.extra_price)
            }
            for v in payload.variants
        ]
        db.table("product_variants").insert(variants_data).execute()

    # 3. Consolidated Refresh with Single Join
    full_prod = db.table("products")\
        .select("*, product_variants(*), category:product_categories(name)")\
        .eq("id", new_prod_id)\
        .single().execute()
    
    if not full_prod.data:
        raise HTTPException(500, "Failed to retrieve fresh product data.")
    
    p = full_prod.data
    return ProductResponse(
        id=p["id"],
        name=p["name"],
        category=p["category"]["name"] if p.get("category") else "General",
        price=p["price"],
        unit=p.get("unit"),
        tax=p["tax"],
        description=p.get("description"),
        send_to_kitchen=p.get("send_to_kitchen"),
        is_active=p["is_active"],
        variants=[ProductVariantResponse(**v) for v in p.get("product_variants", [])],
    )


@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: str,
    payload: ProductUpdateRequest,
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    update_data = payload.model_dump(exclude_unset=True, mode='json')
    
    # 1. Handle Variants sync handled later for better retrieval consistency
    payload_dict = payload.model_dump(exclude_unset=True, mode='json')

    # 2. Handle Category resolution
    if "category" in update_data:
        cat_name = update_data.pop("category")
        cat_res = db.table("product_categories").select("id").eq("name", cat_name).execute()
        if cat_res.data:
            update_data["category_id"] = cat_res.data[0]["id"]
        else:
            # Create category if not found
            new_cat = db.table("product_categories").insert({"name": cat_name}).execute()
            if new_cat.data:
                update_data["category_id"] = new_cat.data[0]["id"]

    # 3. Update Product
    if update_data:
        res = db.table("products").update(update_data).eq("id", product_id).execute()
        if not res.data:
            raise HTTPException(404, "Product not found.")

    # 1. Handle Variants sync (moved after update for logic flow, but before retrieval)
    if "variants" in payload_dict and payload_dict["variants"] is not None:
        variants_in = payload_dict["variants"]
        # Delete existing
        db.table("product_variants").delete().eq("product_id", product_id).execute()
        # Bulk Insert
        if variants_in:
            to_insert = [
                {
                    "product_id": product_id,
                    "attribute": v["attribute"],
                    "value": v["value"],
                    "extra_price": float(v["extra_price"])
                } for v in variants_in
            ]
            db.table("product_variants").insert(to_insert).execute()

    # 4. Consolidated Refresh with Single Join
    full_prod = db.table("products")\
        .select("*, product_variants(*), category:product_categories(name)")\
        .eq("id", product_id)\
        .single().execute()
    
    if not full_prod.data:
        raise HTTPException(404, "Product not found after update.")
        
    p = full_prod.data
    return ProductResponse(
        id=p["id"],
        name=p["name"],
        category=p["category"]["name"] if p.get("category") else "General",
        price=p["price"],
        unit=p.get("unit"),
        tax=p["tax"],
        description=p.get("description"),
        send_to_kitchen=p.get("send_to_kitchen"),
        is_active=p["is_active"],
        variants=[ProductVariantResponse(**v) for v in p.get("product_variants", [])],
    )


@router.delete("/products/{product_id}", status_code=204)
def delete_product(
    product_id: str,
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    res = db.table("products").update({"is_active": False}).eq("id", product_id).execute()
    if not res.data:
        raise HTTPException(404, "Product not found.")


# ─── FLOORS ───────────────────────────────────────────────────

@router.get("/floors", response_model=list[FloorResponse])
def list_floors(
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    # Deep join with tables instead of N+1 sequence
    floors = db.table("floors").select("*, tables(*)").order("created_at").execute()
    result = []
    for f in floors.data:
        sorted_tables = sorted(f.get("tables", []), key=lambda t: t.get("table_number"))
        result.append(FloorResponse(
            id=f["id"],
            name=f["name"],
            tables=[TableResponse(**t) for t in sorted_tables],
        ))
    return result


@router.post("/floors", response_model=FloorResponse)
def create_floor(
    payload: FloorRequest,
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    res = db.table("floors").insert({"name": payload.name}).execute()
    if not res.data:
        raise HTTPException(500, "Failed to create floor.")
    return FloorResponse(**res.data[0])


@router.put("/floors/{floor_id}", response_model=FloorResponse)
def update_floor(
    floor_id: str,
    payload: FloorUpdate,
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    update_data = payload.model_dump(exclude_unset=True, mode='json')
    res = db.table("floors").update(update_data).eq("id", floor_id).execute()
    if not res.data:
        raise HTTPException(404, "Floor not found.")
    return FloorResponse(**res.data[0])


@router.delete("/floors/{floor_id}", status_code=204)
def delete_floor(
    floor_id: str,
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    res = db.table("floors").delete().eq("id", floor_id).execute()
    if not res.data:
        raise HTTPException(404, "Floor not found.")


# ─── TABLES ───────────────────────────────────────────────────

@router.get("/tables", response_model=list[TableResponse])
def list_tables(
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    res = db.table("tables").select("*").order("table_number").execute()
    return [TableResponse(**t) for t in res.data]


@router.post("/tables", response_model=TableResponse)
def create_table(
    payload: TableRequest,
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    # Check uniqueness
    existing = db.table("tables").select("id").eq("table_number", payload.table_number).execute()
    if existing.data:
        raise HTTPException(400, "A table with this number already exists.")

    data = {
        "floor_id": str(payload.floor_id),
        "table_number": payload.table_number,
        "seats": payload.seats,
        "is_active": payload.is_active,
        "appointment_resource": payload.appointment_resource,
    }
    res = db.table("tables").insert(data).execute()
    if not res.data:
        raise HTTPException(500, "Failed to create table.")
    return TableResponse(**res.data[0])


@router.put("/tables/{table_id}", response_model=TableResponse)
def update_table(
    table_id: str,
    payload: TableUpdate,
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    update_data = payload.model_dump(exclude_unset=True, mode='json')
    
    if "table_number" in update_data:
        existing = db.table("tables").select("id").eq("table_number", update_data["table_number"]).neq("id", table_id).execute()
        if existing.data:
            raise HTTPException(400, "A table with this number already exists.")

    res = db.table("tables").update(update_data).eq("id", table_id).execute()
    if not res.data:
        raise HTTPException(404, "Table not found.")
    return TableResponse(**res.data[0])


@router.delete("/tables/{table_id}", status_code=204)
def delete_table(
    table_id: str,
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    res = db.table("tables").delete().eq("id", table_id).execute()
    if not res.data:
        raise HTTPException(404, "Table not found.")


# ─── PAYMENT METHODS ─────────────────────────────────────────

@router.get("/payment-methods", response_model=list[PaymentMethodResponse])
def list_payment_methods(
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    res = db.table("payment_methods").select("*").eq("is_enabled", True).order("created_at").execute()
    return [PaymentMethodResponse(**pm) for pm in res.data]


@router.post("/payment-methods", response_model=PaymentMethodResponse)
def create_payment_method(
    payload: PaymentMethodRequest,
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    data = {
        "name": payload.name,
        "type": payload.type,
        "is_enabled": payload.is_enabled,
        "upi_id": payload.upi_id,
    }
    res = db.table("payment_methods").insert(data).execute()
    if not res.data:
        raise HTTPException(500, "Failed to create payment method.")
    return PaymentMethodResponse(**res.data[0])


@router.put("/payment-methods/{pm_id}", response_model=PaymentMethodResponse)
def update_payment_method(
    pm_id: str,
    payload: PaymentMethodUpdate,
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    update_data = payload.model_dump(exclude_unset=True, mode='json')
    res = db.table("payment_methods").update(update_data).eq("id", pm_id).execute()
    if not res.data:
        raise HTTPException(404, "Payment method not found.")
    return PaymentMethodResponse(**res.data[0])


@router.delete("/payment-methods/{pm_id}", status_code=204)
def delete_payment_method(
    pm_id: str,
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    res = db.table("payment_methods").update({"is_enabled": False}).eq("id", pm_id).execute()
    if not res.data:
        raise HTTPException(404, "Payment method not found.")


# ─── DASHBOARD ───────────────────────────────────────────────

@router.get("/dashboard/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    period: str = "all",
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    try:
        from datetime import datetime, timedelta, timezone
        
        now = datetime.now(timezone.utc)
        start_date = None
        if period == "today":
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        elif period == "monthly":
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
        elif period == "last7":
            start_date = (now - timedelta(days=7)).isoformat()
            
        if not start_date:
            kpi_res = db.table("v_kpi_summary").select("*").execute()
            kpi_data = kpi_res.data[0] if kpi_res.data else {"total_lifetime_orders": 0, "lifetime_revenue": 0, "average_order_value": 0}
            
            sales_res = db.table("v_daily_sales").select("*").limit(7).execute()
            line_chart = [
                {"name": r["sale_date"], "sales": r["total_revenue"]}
                for r in reversed(sales_res.data)
            ]
            
            cat_res = db.table("v_top_categories").select("*").execute()
            total_rev = sum([float(r["category_revenue"] or 0) for r in cat_res.data])
            pie_chart = []
            top_categories = []
            for r in cat_res.data:
                rev = float(r["category_revenue"] or 0)
                pie_chart.append({"name": r["category_name"], "value": rev})
                pct = f"{(rev / total_rev * 100):.1f}%" if total_rev > 0 else "0%"
                top_categories.append({"name": r["category_name"], "percentage": pct})
                
            prod_res = db.table("v_top_products").select("*").limit(5).execute()
            top_products = [{"name": r["product_name"], "sold": r["total_sold"]} for r in prod_res.data]
            
            orders_res = db.table("orders").select("id, order_number, created_at, payment_status, total_amount").eq("payment_status", "paid").order("total_amount", desc=True).limit(5).execute()
            
            top_orders = []
            for o in orders_res.data:
                try:
                    date_str = o["created_at"][:16].replace("T", " ")
                except:
                    date_str = o["created_at"]
                    
                items_res = db.table("order_items").select("quantity").eq("order_id", o["id"]).execute()
                items_count = sum([i["quantity"] for i in (items_res.data or [])])

                top_orders.append({
                    "order_number": f"ORD-{o['order_number']}",
                    "date": date_str,
                    "items": items_count,
                    "total": o["total_amount"],
                    "status": o["payment_status"].capitalize()
                })
                
            return {
                "kpis": {
                    "total_orders": kpi_data["total_lifetime_orders"],
                    "revenue": kpi_data["lifetime_revenue"],
                    "average_order": kpi_data["average_order_value"],
                },
                "line_chart": line_chart,
                "pie_chart": pie_chart,
                "top_products": top_products[:5],
                "top_categories": top_categories[:5],
                "top_orders": top_orders
            }
        else:
            # Native Python Aggregation for specific periods
            orders_q = db.table("orders").select("id, order_number, created_at, payment_status, total_amount").eq("payment_status", "paid").gte("created_at", start_date).execute()
            orders = orders_q.data or []
            
            total_orders = len(orders)
            revenue = sum(float(o["total_amount"]) for o in orders)
            avg = revenue / total_orders if total_orders > 0 else 0
            
            daily_aggregates = {}
            for o in orders:
                day = o["created_at"][:10]
                daily_aggregates[day] = daily_aggregates.get(day, 0) + float(o["total_amount"])
                
            line_chart = [{"name": day, "sales": amt} for day, amt in sorted(daily_aggregates.items())]
            
            order_ids = [o["id"] for o in orders]
            top_products = []
            pie_chart = []
            top_categories = []
            items = []
            
            if order_ids:
                # Handle large chunks if there are too many orders (Supabase IN clause limit)
                # For POS Cafe, we slice up to 200 orders safely
                safe_order_ids = order_ids[:200]
                items_res = db.table("order_items").select("quantity, price_at_checkout, product_id, order_id").in_("order_id", safe_order_ids).execute()
                items = items_res.data or []
                
                if items:
                    p_ids = list(set([i["product_id"] for i in items]))
                    p_res = db.table("products").select("id, name, category_id").in_("id", p_ids).execute()
                    products = {p["id"]: p for p in p_res.data or []}
                    
                    c_ids = list(set([p["category_id"] for p in products.values()]))
                    c_res = db.table("product_categories").select("id, name").in_("id", c_ids).execute()
                    categories = {c["id"]: c["name"] for c in c_res.data or []}
                    
                    prod_agg = {}
                    cat_agg = {}
                    
                    for item in items:
                        pid = item["product_id"]
                        p = products.get(pid)
                        if not p: continue
                        
                        qty = item["quantity"]
                        rev = qty * float(item["price_at_checkout"])
                        
                        prod_agg[p["name"]] = prod_agg.get(p["name"], 0) + qty
                        
                        cname = categories.get(p["category_id"], "Unknown")
                        cat_agg[cname] = cat_agg.get(cname, 0.0) + rev
                        
                    sorted_prods = sorted(prod_agg.items(), key=lambda x: x[1], reverse=True)[:5]
                    top_products = [{"name": sp[0], "sold": sp[1]} for sp in sorted_prods]
                    
                    sorted_cats = sorted(cat_agg.items(), key=lambda x: x[1], reverse=True)
                    total_cat_rev = sum(cat_agg.values())
                    
                    for cat_name, cat_rev in sorted_cats:
                        pie_chart.append({"name": cat_name, "value": cat_rev})
                        pct = f"{(cat_rev / total_cat_rev * 100):.1f}%" if total_cat_rev > 0 else "0%"
                        top_categories.append({"name": cat_name, "percentage": pct})
                        
            top_orders_list = sorted(orders, key=lambda x: float(x["total_amount"]), reverse=True)[:5]
            top_orders_formatted = []
            for o in top_orders_list:
                try: date_str = o["created_at"][:16].replace("T", " ")
                except: date_str = o["created_at"]
                
                qty = 0
                if items:
                    qty = sum(i["quantity"] for i in items if i["order_id"] == o["id"])
                    
                top_orders_formatted.append({
                    "order_number": f"ORD-{o['order_number']}",
                    "date": date_str,
                    "items": qty,
                    "total": o["total_amount"],
                    "status": o["payment_status"].capitalize()
                })
                
            return {
                "kpis": {"total_orders": total_orders, "revenue": revenue, "average_order": avg},
                "line_chart": line_chart,
                "pie_chart": pie_chart,
                "top_products": top_products[:5],
                "top_categories": top_categories[:5],
                "top_orders": top_orders_formatted
            }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "kpis": {"total_orders": 0, "revenue": 0, "average_order": 0},
            "line_chart": [],
            "pie_chart": [],
            "top_products": [],
            "top_categories": [],
            "top_orders": []
        }
