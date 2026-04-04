from fastapi import APIRouter, Depends, HTTPException, status
from app.db import Client, get_db
from app.deps import get_current_user
from app.schemas import FloorRequest, FloorResponse, TableRequest, TableResponse, PaymentMethodRequest, PaymentMethodResponse, ProductCreateRequest, ProductResponse

router = APIRouter(prefix="/backend", tags=["backend"])

@router.post("/floors", response_model=FloorResponse)
def create_floor(
    payload: FloorRequest,
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    res = db.table("floors").insert({"name": payload.name}).execute()
    if not res.data:
        raise HTTPException(500, "Failed back-office: no floor representation returned from database.")
    return FloorResponse(**res.data[0])

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
        raise HTTPException(500, "Failed back-office: no table representation returned from database.")
    return TableResponse(**res.data[0])

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
        raise HTTPException(500, "Failed back-office: no payment method representation returned from database.")
    return PaymentMethodResponse(**res.data[0])

@router.post("/products", response_model=ProductResponse)
def create_product(
    payload: ProductCreateRequest,
    db: Client = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    cat_res = db.table("product_categories").select("*").eq("name", payload.category).execute()
    if cat_res.data:
        cat_id = cat_res.data[0]["id"]
        cat_name = cat_res.data[0]["name"]
    else:
        new_cat = db.table("product_categories").insert({"name": payload.category}).execute()
        if not new_cat.data:
            raise HTTPException(500, "Failed back-office: no product category representation returned.")
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
        raise HTTPException(500, "Failed back-office: no product representation returned.")
    
    prod = prod_res.data[0]
    return ProductResponse(
        id=prod["id"],
        name=prod["name"],
        category=cat_name,
        price=prod["price"],
        unit=prod["unit"],
        tax=prod["tax"],
        description=prod["description"],
        send_to_kitchen=prod["send_to_kitchen"],
        is_active=prod["is_active"],
        variants=[]
    )
