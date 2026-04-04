from fastapi import APIRouter, Depends, HTTPException, status
from app.db import Client, get_db
from app.deps import get_current_user
from app.schemas import (
    CategoryRequest, CategoryResponse, CategoryUpdate,
    FloorRequest, FloorResponse, FloorUpdate,
    TableRequest, TableResponse, TableUpdate,
    PaymentMethodRequest, PaymentMethodResponse, PaymentMethodUpdate,
    ProductCreateRequest, ProductResponse, ProductVariantResponse, ProductUpdateRequest,
)

router = APIRouter(prefix="/backend", tags=["backend"])

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
