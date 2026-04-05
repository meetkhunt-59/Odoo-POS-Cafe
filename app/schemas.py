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

class PointOfSaleRequest(BaseModel):
    name: str
    cash_enabled: bool = True
    upi_enabled: bool = True
    card_enabled: bool = True

class PointOfSaleUpdate(BaseModel):
    name: str | None = None
    cash_enabled: bool | None = None
    upi_enabled: bool | None = None
    card_enabled: bool | None = None

class PointOfSaleResponse(BaseModel):
    id: UUID
    name: str
    cash_enabled: bool
    upi_enabled: bool
    card_enabled: bool
    created_at: datetime


class SignupRequest(BaseModel):
    email: constr(min_length=3, max_length=320)
    password: constr(min_length=6, max_length=128)
    name: constr(min_length=1, max_length=120)

class RequestResetRequest(BaseModel):
    email: constr(min_length=3, max_length=320)

class UpdatePasswordRequest(BaseModel):
    email: constr(min_length=3, max_length=320)
    otp: constr(min_length=6, max_length=6)
    new_password: constr(min_length=6, max_length=128)


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

class ProductUpdateRequest(BaseModel):
    name: str | None = None
    category: str | None = None
    price: Decimal | None = Field(None, gt=0)
    unit: str | None = None
    tax: Decimal | None = None
    description: str | None = None
    send_to_kitchen: bool | None = None
    is_active: bool | None = None
    in_stock: bool | None = None
    variants: list[VariantInput] | None = None


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
    in_stock: bool = True
    variants: list[ProductVariantResponse]


class FloorRequest(BaseModel):
    name: str

class FloorUpdate(BaseModel):
    name: str | None = None


class CategoryRequest(BaseModel):
    name: str

class CategoryUpdate(BaseModel):
    name: str | None = None
    send_to_kitchen: bool | None = None


class CategoryResponse(BaseModel):
    id: UUID
    name: str
    send_to_kitchen: bool = True
    product_count: int = 0


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

class TableUpdate(BaseModel):
    floor_id: UUID | None = None
    table_number: str | None = None
    seats: int | None = Field(None, ge=1)
    is_active: bool | None = None
    appointment_resource: bool | None = None


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

class PaymentMethodUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    is_enabled: bool | None = None
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
    pos_id: UUID | None = None
    opened_at: datetime
    closed_at: datetime | None
    closing_sale_amount: Decimal | None


class SessionOpenRequest(BaseModel):
    table_id: UUID | None = None
    pos_id: UUID | None = None


class SessionCloseRequest(BaseModel):
    closing_sale_amount: Decimal


class OrderItemInput(BaseModel):
    product_id: UUID
    variant_id: UUID | None = None
    quantity: int = Field(gt=0)


class OrderCreateRequest(BaseModel):
    session_id: UUID
    table_id: UUID | None = None
    customer_id: UUID | None = None
    notes: str | None = None
    discount_percentage: Decimal | None = Field(default=Decimal("0"), ge=0, le=100)
    items: list[OrderItemInput]


class OrderItemResponse(BaseModel):
    id: UUID
    product_id: UUID
    product_name: str | None = None
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
    notes: str | None = None
    discount_percentage: Decimal | None = None
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


class TransactionSummary(BaseModel):
    id: UUID
    order_number: int
    created_at: datetime
    total_amount: Decimal
    payment_status: str
    kitchen_status: str
    payment_method: str | None = None

class PaymentSummary(BaseModel):
    date: str
    payment_method: str
    total_amount: Decimal

class CustomerCreate(BaseModel):
    name: str
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None

class CustomerResponse(BaseModel):
    id: UUID
    name: str
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    total_sales: Decimal
    created_at: datetime
class DashboardKPIRes(BaseModel):
    total_orders: int
    revenue: Decimal
    average_order: Decimal

class ChartDataPoint(BaseModel):
    name: str
    sales: Decimal | float
    
class PieDataPoint(BaseModel):
    name: str
    value: Decimal | float

class TopProductRow(BaseModel):
    name: str
    sold: int

class TopCategoryRow(BaseModel):
    name: str
    percentage: str

class TopOrderRow(BaseModel):
    order_number: str
    date: str
    items: int
    total: Decimal
    status: str

class DashboardStatsResponse(BaseModel):
    kpis: DashboardKPIRes
    line_chart: list[ChartDataPoint]
    pie_chart: list[PieDataPoint]
    top_products: list[TopProductRow]
    top_categories: list[TopCategoryRow]
    top_orders: list[TopOrderRow]

FloorRequest.model_rebuild()
FloorResponse.model_rebuild()
