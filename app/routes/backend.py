from fastapi import APIRouter, Depends, HTTPException, status
from app.db import Client, get_db
from app.deps import get_current_user
from app.schemas import (
    CategoryRequest, CategoryResponse,
    FloorRequest, FloorResponse,
    TableRequest, TableResponse,
    PaymentMethodRequest, PaymentMethodResponse,
    ProductCreateRequest, ProductResponse, ProductVariantResponse,
)

router = APIRouter(prefix="/backend", tags=["backend"])

# ─── PRODUCT CATEGORIES ───────────────────────────────────────

@router.get("/product-categories", response_model=list[CategoryResponse])
def list_categories(
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    cats = db.table("product_categories").select("*").order("created_at").execute()
    result = []
    for c in cats.data:
        count_res = db.table("products").select("id", count="exact").eq("category_id", c["id"]).execute()
        result.append(CategoryResponse(
            id=c["id"],
            name=c["name"],
            send_to_kitchen=c.get("send_to_kitchen", True),
            product_count=count_res.count or 0,
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


# ─── PRODUCTS ─────────────────────────────────────────────────

@router.get("/products", response_model=list[ProductResponse])
def list_products(
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    prods = db.table("products").select("*").eq("is_active", True).order("created_at").execute()
    cats_cache: dict[str, str] = {}
    result = []
    for p in prods.data:
        cat_id = p["category_id"]
        if cat_id not in cats_cache:
            cat_res = db.table("product_categories").select("name").eq("id", cat_id).execute()
            cats_cache[cat_id] = cat_res.data[0]["name"] if cat_res.data else "Unknown"

        variants_res = db.table("product_variants").select("*").eq("product_id", p["id"]).execute()
        variants = [ProductVariantResponse(**v) for v in variants_res.data]

        result.append(ProductResponse(
            id=p["id"],
            name=p["name"],
            category=cats_cache[cat_id],
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

    prod = prod_res.data[0]

    # Insert variants if provided
    variants: list[ProductVariantResponse] = []
    for v in payload.variants:
        v_data = {
            "product_id": prod["id"],
            "attribute": v.attribute,
            "value": v.value,
            "extra_price": float(v.extra_price),
        }
        v_res = db.table("product_variants").insert(v_data).execute()
        if v_res.data:
            variants.append(ProductVariantResponse(**v_res.data[0]))

    return ProductResponse(
        id=prod["id"],
        name=prod["name"],
        category=cat_name,
        price=prod["price"],
        unit=prod.get("unit"),
        tax=prod["tax"],
        description=prod.get("description"),
        send_to_kitchen=prod.get("send_to_kitchen"),
        is_active=prod["is_active"],
        variants=variants,
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
    floors = db.table("floors").select("*").order("created_at").execute()
    result = []
    for f in floors.data:
        tables_res = db.table("tables").select("*").eq("floor_id", f["id"]).order("table_number").execute()
        result.append(FloorResponse(
            id=f["id"],
            name=f["name"],
            tables=[TableResponse(**t) for t in tables_res.data],
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


@router.delete("/payment-methods/{pm_id}", status_code=204)
def delete_payment_method(
    pm_id: str,
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    res = db.table("payment_methods").update({"is_enabled": False}).eq("id", pm_id).execute()
    if not res.data:
        raise HTTPException(404, "Payment method not found.")
