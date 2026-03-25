from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    name: str
    phone: str
    email: str
    role: Optional[str] = "customer"
    street_address: str
    city: str
    state: str
    pincode: str
    landmark: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    class Config:
        from_attributes = True

class PickupLocationBase(BaseModel):
    name: str
    address: str
    city: str
    pincode: str
    is_active: bool = True

class PickupLocationCreate(PickupLocationBase):
    pass

class PickupLocationResponse(PickupLocationBase):
    id: int
    class Config:
        from_attributes = True

class UserAddressBase(BaseModel):
    name: str # Home, Office, etc.
    street_address: str
    city: str
    state: str
    pincode: str
    landmark: Optional[str] = None
    is_default: bool = False

class UserAddressCreate(UserAddressBase):
    pass

class UserAddressResponse(UserAddressBase):
    id: int
    user_id: int
    class Config:
        from_attributes = True

class CartItemBase(BaseModel):
    product_id: int
    quantity: int

class CartItemCreate(CartItemBase):
    pass

class CartItemResponse(CartItemBase):
    id: int
    user_id: int
    product_name: Optional[str] = None
    product_image: Optional[str] = None
    product_price: Optional[float] = None
    class Config:
        from_attributes = True

class PickItemStatus(BaseModel):
    is_checked: bool

class AuthLogin(BaseModel):
    phone: str
    password: str

class AuthOtp(BaseModel):
    phone: str

class VerifyOtp(BaseModel):
    phone: str
    otp: str

class SubCategoryCreate(BaseModel):
    name: str
    category_id: int
    image_url: Optional[str] = None
    display_order: Optional[int] = 0

class SubCategoryResponse(BaseModel):
    id: int
    name: str
    category_id: int
    image_url: Optional[str] = None
    display_order: int
    class Config:
        from_attributes = True

class CategoryCreate(BaseModel):
    name: str
    icon: Optional[str] = None
    image_url: Optional[str] = None
    parent_id: Optional[int] = None
    display_order: Optional[int] = 0

class CategoryResponse(BaseModel):
    id: int
    name: str
    icon: Optional[str] = None
    image_url: Optional[str] = None
    parent_id: Optional[int] = None
    display_order: int
    class Config:
        from_attributes = True

class ProductCreate(BaseModel):
    product_id: Optional[str] = None  # Custom ID set by admin e.g. AK-001
    name: str
    price: float
    cost_price: Optional[float] = 0.0
    mrp: Optional[float] = 0.0
    discount: Optional[float] = 0.0
    description: Optional[str] = None
    unit: str
    image: str
    category_id: int
    subcategory_id: Optional[int] = None
    stock: Optional[int] = 0
    out_of_stock: Optional[bool] = False
    # Extended fields
    brand: Optional[str] = None
    catch: Optional[str] = None
    product_type: Optional[str] = None
    mfg_date: Optional[str] = None
    country_of_origin: Optional[str] = "India"
    specifications: Optional[dict] = None
    manufacturer_name: Optional[str] = None
    manufacturer_address: Optional[str] = None
    seller_name: Optional[str] = "AK Store Retail"
    customer_care_details: Optional[str] = None
    disclaimer: Optional[str] = None

class ProductUpdateInline(BaseModel):
    price: Optional[float] = None
    cost_price: Optional[float] = None
    mrp: Optional[float] = None
    stock: Optional[int] = None
    out_of_stock: Optional[bool] = None

class ReviewCreate(BaseModel):
    rating: int
    comment: str

class CouponCreate(BaseModel):
    code: str
    discount_value: float
    is_percentage: bool = False
    min_order_amount: float = 0.0
    user_id: Optional[int] = None

class CouponResponse(CouponCreate):
    id: int
    active: bool
    class Config:
        from_attributes = True

class DeliverySlotCreate(BaseModel):
    name: str
    start_time: str
    end_time: str

class DeliverySlotResponse(DeliverySlotCreate):
    id: int
    is_active: bool
    class Config:
        from_attributes = True

class PickupSlotBase(BaseModel):
    location_id: int
    name: str
    start_time: str
    end_time: str
    is_active: bool = True

class PickupSlotCreate(PickupSlotBase):
    pass

class PickupSlotResponse(PickupSlotBase):
    id: int
    class Config:
        from_attributes = True

class OrderItemSchema(BaseModel):
    id: int
    quantity: int
    price: float

class OrderCreate(BaseModel):
    items: List[OrderItemSchema]
    total: float
    address_id: Optional[int] = None
    coupon_id: Optional[int] = None
    delivery_slot_id: Optional[int] = None
    pickup_location_id: Optional[int] = None
    pickup_slot_id: Optional[int] = None
    order_type: str = "delivery"
    discount_amount: Optional[float] = 0.0
    delivery_fee: Optional[float] = 0.0
