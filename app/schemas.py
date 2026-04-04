from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, constr


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int | None = None
    refresh_token: str | None = None


class SignupRequest(BaseModel):
    email: constr(min_length=3, max_length=320)
    password: constr(min_length=6, max_length=128)
    name: constr(min_length=1, max_length=120)


class ProfilePublic(BaseModel):
    id: UUID
    name: str
    role: str
    created_at: datetime


class AdminCreateUserRequest(BaseModel):
    email: constr(min_length=3, max_length=320)
    password: constr(min_length=6, max_length=128)
    name: constr(min_length=1, max_length=120)
    role: str


class VariantInput(BaseModel):
    attribute: str
    value: str
    extra_price: Decimal = Field(default=Decimal("0"))


class ProductCreateRequest(BaseModel):
    name: str
    category: str = Field(default="General")
    price: Decimal = Field(gt=0)
    unit: str | None = None
    tax: Decimal = Field(default=Decimal("0"))
    description: str | None = None
    send_to_kitchen: bool = Field(default=True)
    variants: list[VariantInput] = Field(default_factory=list)


class ProductVariantResponse(BaseModel):
    id: UUID
    attribute: str
    value: str
    extra_price: Decimal


class ProductResponse(BaseModel):
    id: UUID
    name: str
    category: str
    price: Decimal
    unit: str | None
    tax: Decimal
    description: str | None
    send_to_kitchen: bool | None
    is_active: bool
    variants: list[ProductVariantResponse]


class FloorRequest(BaseModel):
    name: str


class CategoryRequest(BaseModel):
    name: str


class FloorResponse(BaseModel):
    id: UUID
    name: str
    tables: list["TableResponse"] = Field(default_factory=list)


class TableRequest(BaseModel):
    floor_id: UUID
    table_number: str
    seats: int = Field(default=2, ge=1)
    is_active: bool = True
    appointment_resource: bool = False


class TableResponse(BaseModel):
    id: UUID
    floor_id: UUID
    table_number: str
    seats: int
    is_active: bool
    appointment_resource: bool


class PaymentMethodRequest(BaseModel):
    type: str
    name: str
    is_enabled: bool = True
    upi_id: str | None = None


class PaymentMethodResponse(BaseModel):
    id: UUID
    name: str
    type: str
    is_enabled: bool
    upi_id: str | None


class SessionSummary(BaseModel):
    id: UUID
    status: str
    responsible_user_id: UUID
    opened_at: datetime
    closed_at: datetime | None
    closing_sale_amount: Decimal | None


class SessionOpenRequest(BaseModel):
    table_id: UUID | None = None


class SessionCloseRequest(BaseModel):
    closing_sale_amount: Decimal


class OrderItemInput(BaseModel):
    product_id: UUID
    variant_id: UUID | None = None
    quantity: int = Field(gt=0)


class OrderCreateRequest(BaseModel):
    session_id: UUID
    table_id: UUID | None = None
    items: list[OrderItemInput]


class OrderItemResponse(BaseModel):
    id: UUID
    product_id: UUID
    variant_id: UUID | None
    quantity: int
    price_at_checkout: Decimal
    is_prepared: bool


class OrderResponse(BaseModel):
    id: UUID
    order_number: int
    session_id: UUID
    table_id: UUID | None
    kitchen_status: str
    payment_status: str
    total_amount: Decimal
    items: list[OrderItemResponse]


class OrderPayRequest(BaseModel):
    payment_method_id: UUID


class KitchenActionRequest(BaseModel):
    action: str


class SelfOrderTokenRequest(BaseModel):
    session_id: UUID
    table_id: UUID


class SelfOrderTokenResponse(BaseModel):
    token: str


class ReportFilters(BaseModel):
    period_from: datetime | None = None
    period_to: datetime | None = None
    session_id: UUID | None = None
    responsible_user_id: UUID | None = None
    product_id: UUID | None = None


class ReportRow(BaseModel):
    product_id: UUID
    product_name: str
    total_amount: Decimal
    total_quantity: int


class ReportResponse(BaseModel):
    rows: list[ReportRow]
    total_sales: Decimal
    total_orders: int


FloorRequest.model_rebuild()
FloorResponse.model_rebuild()
