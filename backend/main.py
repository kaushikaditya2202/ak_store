import os
import random
import hashlib
import smtplib
import json
from dotenv import load_dotenv
from datetime import datetime, timedelta
from typing import List, Optional
import uuid
from email.mime.text import MIMEText
import boto3

from fastapi import FastAPI, Depends, HTTPException, Header, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from jose import JWTError, jwt
import shutil

# Import DynamoDB database functions
from .database_dynamodb import (
    add_review,
    clear_user_cart,
    create_address,
    create_category,
    create_coupon,
    create_delivery_slot,
    create_order,
    create_pickup_location,
    create_pickup_slot,
    create_product,
    create_user,
    delete_address,
    delete_category,
    delete_coupon,
    delete_delivery_slot,
    delete_order,
    delete_pickup_location,
    delete_pickup_slot,
    delete_product,
    delete_user,
    enrich_order,
    get_all_cart_counts,
    get_all_categories,
    get_all_orders,
    get_all_products,
    get_all_users,
    get_users_page,
    get_coupon_by_code,
    get_coupons,
    get_delivery_slots,
    get_pickup_locations,
    get_pickup_slots,
    get_product,
    get_reviews,
    get_user,
    get_user_addresses,
    get_user_cart,
    get_user_orders,
    replace_user_cart,
    toggle_pickup_location,
    toggle_pickup_slot,
    update_order,
    update_order_by_id,
    update_order_item_checked,
    update_product,
    update_user,
    user_exists,
    _user_id_from_phone,
)
from .storage import get_s3_bucket_name, upload_file_to_s3
from . import schemas
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()
app = FastAPI()

def get_allowed_origins() -> List[str]:
    origins = os.getenv("CORS_ORIGINS", "").strip()
    if origins:
        return [origin.strip() for origin in origins.split(",") if origin.strip()]
    return [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://ak-store.vercel.app",
        "https://ak-store-rxl.vercel.app",
    ]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Security & JWT Configuration ----
SECRET_KEY = os.getenv("SECRET_KEY", "7b6b3e1c0a5d4f2e8c9a1b3d5f7e90123fabc4d5e6f7a8b9c0d1e2f3a4b5c")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days for better UX

def hash_password(password: str):
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str):
    return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ---- Email Service ----
def send_otp_email_via_smtp(email: str, otp: str) -> bool:
    smtp_host = os.getenv("SMTP_HOST", "").strip() or "smtp.gmail.com"
    smtp_user = os.getenv("SMTP_EMAIL", "").strip()
    smtp_pass = os.getenv("SMTP_PASSWORD", "").strip()
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_use_ssl = os.getenv("SMTP_USE_SSL", "false").strip().lower() == "true"
    smtp_from = os.getenv("SMTP_FROM_EMAIL", "").strip() or smtp_user

    if not smtp_user or not smtp_pass or not smtp_from:
        return False

    message = MIMEText(f"Your OTP for login is: {otp}. It is valid for 10 minutes.", "plain")
    message["Subject"] = "Your AK Store Login OTP"
    message["From"] = smtp_from
    message["To"] = email

    attempts = []
    primary_mode = "ssl" if smtp_use_ssl else "starttls"
    attempts.append((smtp_port, primary_mode))
    if (smtp_port, "starttls") not in attempts:
        attempts.append((587, "starttls"))
    if (smtp_port, "ssl") not in attempts:
        attempts.append((465, "ssl"))

    for port, mode in attempts:
        try:
            if mode == "ssl":
                with smtplib.SMTP_SSL(smtp_host, port, timeout=20) as server:
                    server.login(smtp_user, smtp_pass)
                    server.send_message(message)
            else:
                with smtplib.SMTP(smtp_host, port, timeout=20) as server:
                    server.ehlo()
                    server.starttls()
                    server.ehlo()
                    server.login(smtp_user, smtp_pass)
                    server.send_message(message)
            return True
        except Exception as e:
            print(f"SMTP OTP send error on port {port} ({mode}): {e}")

    return False


def send_otp_email(email: str, otp: str) -> bool:
    return send_otp_email_via_smtp(email, otp)


def trigger_otp_lambda(phone: str, email: str) -> dict:
    function_name = os.getenv("OTP_LAMBDA_FUNCTION", "").strip()
    if not function_name:
        return {"invoked": False, "success": False, "otp_stored": False, "email_sent": False}

    try:
        payload = json.dumps({"phone": phone, "email": email}).encode("utf-8")
        response = boto3.client("lambda", region_name=os.getenv("AWS_REGION", "ap-south-1")).invoke(
            FunctionName=function_name,
            InvocationType="RequestResponse",
            Payload=payload,
        )
        response_payload = json.loads(response["Payload"].read().decode("utf-8") or "{}")
        if response.get("FunctionError"):
            print(f"OTP Lambda function error: {response_payload}")
            return {"invoked": True, "success": False, "otp_stored": False, "email_sent": False}

        body = response_payload.get("body")
        if isinstance(body, str):
            try:
                body = json.loads(body)
            except Exception:
                body = {"raw": body}
        elif body is None:
            body = response_payload

        if not isinstance(body, dict):
            body = {}

        return {
            "invoked": True,
            "success": bool(response_payload.get("statusCode", 500) < 300 and body.get("success") is True),
            "otp_stored": bool(body.get("otp_stored")),
            "email_sent": bool(body.get("email_sent", body.get("success"))),
            "message": body.get("message") or body.get("error") or "OTP request failed",
        }
    except Exception as e:
        print(f"OTP Lambda invoke error: {e}")
        return {"invoked": False, "success": False, "otp_stored": False, "email_sent": False}

# ---- Authentication Functions ----
def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization header provided")
    
    token = authorization.split(" ")[-1] if " " in authorization else authorization
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_phone: str = payload.get("sub")
        if user_phone is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token has expired or is invalid")

    user = get_user(user_phone)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def get_current_admin(user: dict = Depends(get_current_user)):
    role = (user.get("role") or "").strip().lower()
    if role != "admin":
        raise HTTPException(status_code=403, detail=f"Requires Admin role. Current role: {user.get('role')}")
    return user

def get_current_executive(user: dict = Depends(get_current_user)):
    role = (user.get("role") or "").strip().lower()
    if role not in ["executive", "admin"]:
        raise HTTPException(status_code=403, detail=f"Requires Admin or Executive role. Current role: {user.get('role')}")
    return user


def user_public_payload(user: dict) -> dict:
    return {
        "id": _user_id_from_phone(user["phone"]),
        "phone": user["phone"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "token": None,
        "street_address": user.get("street_address", ""),
        "city": user.get("city", ""),
        "state": user.get("state", ""),
        "pincode": user.get("pincode", ""),
        "landmark": user.get("landmark", ""),
    }


def phone_from_user_id(user_id: str) -> str:
    return str(user_id)

# ---- API ROUTES ----

@app.get("/")
def root():
    return {
        "service": "ak-store-api",
        "status": "ok",
        "health": "/api/health"
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok", "database": "DynamoDB", "region": "ap-south-1"}

# ---- AUTHENTICATION ROUTES ----

@app.post("/api/auth/signup")
def signup(user: schemas.UserCreate):
    # Check if user already exists
    if user_exists(email=user.email, phone=user.phone):
        return JSONResponse(status_code=400, content={"error": "Email or Phone already exists"})
    
    # Create new user
    user_data = {
        "phone": user.phone,
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
        "role": user.role or "customer",
        "street_address": user.street_address,
        "city": user.city,
        "state": user.state,
        "pincode": user.pincode,
        "landmark": user.landmark,
        "created_at": datetime.now().isoformat()
    }
    
    if create_user(user_data):
        # Create default address
        address_data = {
            "id": str(uuid.uuid4()),
            "user_phone": user.phone,
            "name": "Home (Default)",
            "street_address": user.street_address,
            "city": user.city,
            "state": user.state,
            "pincode": user.pincode,
            "landmark": user.landmark,
            "is_default": True
        }
        create_address(address_data)
        return {"success": True}
    
    return JSONResponse(status_code=500, content={"error": "Failed to create user"})

@app.post("/api/auth/login")
def login(creds: schemas.AuthLogin):
    user = get_user(creds.phone)
    if user and verify_password(creds.password, user.get("password", "")):
        token = create_access_token(data={"sub": user["phone"]})
        payload = user_public_payload(user)
        payload["token"] = token
        return payload
    return JSONResponse(status_code=401, content={"error": "Invalid phone number or password"})

@app.post("/api/auth/request-otp")
def request_otp(creds: schemas.AuthOtp):
    user = get_user(creds.phone)
    if not user:
        return JSONResponse(status_code=404, content={"error": "User not found"})

    lambda_result = trigger_otp_lambda(creds.phone, user["email"])
    if lambda_result.get("invoked"):
        if lambda_result.get("success"):
            return {"success": True, "message": "OTP sent to registered email", "email_sent": True}
        if lambda_result.get("otp_stored"):
            return {
                "success": True,
                "message": "OTP generated. Email delivery failed. Ask admin to check the Users dashboard.",
                "email_sent": False,
            }

    otp = str(random.randint(100000, 999999))
    expiry = (datetime.now() + timedelta(minutes=10)).isoformat()

    update_user(creds.phone, {"otp": otp, "otp_expiry": expiry, "otp_delivery_status": "pending"})
    if not send_otp_email(user["email"], otp):
        update_user(creds.phone, {"otp_delivery_status": "failed"})
        return {
            "success": True,
            "message": "OTP generated. Email delivery failed. Ask admin to check the Users dashboard.",
            "email_sent": False,
        }

    update_user(creds.phone, {"otp_delivery_status": "sent"})

    return {"success": True, "message": "OTP sent to registered email", "email_sent": True}

@app.post("/api/auth/verify-otp")
def verify_otp(creds: schemas.VerifyOtp):
    user = get_user(creds.phone)
    if not user:
        return JSONResponse(status_code=404, content={"error": "User not found"})
    
    if user.get("otp") != creds.otp:
        return JSONResponse(status_code=400, content={"error": "Invalid OTP"})
    
    otp_expiry = user.get("otp_expiry")
    if otp_expiry:
        try:
            if datetime.fromisoformat(otp_expiry) < datetime.now():
                return JSONResponse(status_code=400, content={"error": "OTP expired"})
        except:
            pass
    
    # Clear OTP
    update_user(creds.phone, {"otp": None, "otp_expiry": None})
    
    # Create token
    token = create_access_token(data={"sub": creds.phone})
    payload = user_public_payload(user)
    payload["token"] = token
    return payload

@app.post("/api/auth/admin-login")
def admin_login(creds: schemas.AuthLogin):
    user = get_user(creds.phone)
    if user and user.get("role") == "admin" and verify_password(creds.password, user.get("password", "")):
        token = create_access_token(data={"sub": user["phone"]})
        payload = user_public_payload(user)
        payload["token"] = token
        return payload
    return JSONResponse(status_code=401, content={"error": "Invalid admin credentials"})

# ---- PRODUCTS ROUTES ----

@app.get("/api/products")
def get_products(category: Optional[int] = None):
    products = get_all_products()
    
    if category:
        categories = get_all_categories()
        child_category_ids = {
            c.get("id")
            for c in categories
            if c.get("parent_id") == category
        }
        allowed_category_ids = child_category_ids | {category}
        products = [p for p in products if p.get("category_id") in allowed_category_ids]
    
    return products

@app.get("/api/products/search")
def search_products(q: str = ""):
    products = get_all_products()
    if q:
        products = [p for p in products if q.lower() in p.get("name", "").lower()]
    return products

@app.post("/api/admin/products")
def add_product(prod: schemas.ProductCreate, admin: dict = Depends(get_current_admin)):
    product_data = prod.dict()
    product_data["created_at"] = datetime.now().isoformat()
    
    product_id = create_product(product_data)
    if product_id:
        return {"success": True, "id": product_id}
    
    return JSONResponse(status_code=500, content={"error": "Failed to create product"})


class ProductUpdateInline(BaseModel):
    price: Optional[float] = None
    cost_price: Optional[float] = None
    mrp: Optional[float] = None
    stock: Optional[int] = None
    out_of_stock: Optional[bool] = None


@app.patch("/api/admin/products/{product_id}/inline")
def update_product_inline(product_id: int, prod: ProductUpdateInline, admin: dict = Depends(get_current_admin)):
    updates = prod.dict(exclude_unset=True)
    if "stock" in updates and "out_of_stock" not in updates:
        updates["out_of_stock"] = updates["stock"] <= 0
    updates["updated_at"] = datetime.now().isoformat()
    if update_product(product_id, updates):
        return {"success": True}
    return JSONResponse(status_code=404, content={"error": "Product not found"})

@app.put("/api/admin/products/{product_id}")
def update_product_endpoint(product_id: int, prod: schemas.ProductCreate, admin: dict = Depends(get_current_admin)):
    updates = prod.dict()
    updates["updated_at"] = datetime.now().isoformat()
    
    if update_product(product_id, updates):
        return {"success": True}
    
    return JSONResponse(status_code=404, content={"error": "Product not found"})


@app.delete("/api/admin/products/{product_id}")
def delete_product_endpoint(product_id: int, password: str = "", admin: dict = Depends(get_current_admin)):
    if not verify_password(password, admin.get("password", "")):
        return JSONResponse(status_code=403, content={"error": "Invalid password"})
    if delete_product(product_id):
        return {"success": True}
    return JSONResponse(status_code=404, content={"error": "Product not found"})

# ---- CATEGORIES ROUTES ----

@app.get("/api/categories")
def get_categories():
    return get_all_categories()

@app.post("/api/admin/categories")
def add_category(cat: schemas.CategoryCreate, admin: dict = Depends(get_current_admin)):
    category_data = cat.dict()
    category_data["created_at"] = datetime.now().isoformat()
    
    if create_category(category_data):
        return {"success": True}
    
    return JSONResponse(status_code=500, content={"error": "Failed to create category"})


@app.delete("/api/admin/categories/{category_id}")
def delete_category_endpoint(category_id: int, admin: dict = Depends(get_current_admin)):
    if delete_category(category_id):
        return {"success": True}
    return JSONResponse(status_code=404, content={"error": "Category not found"})

# ---- USER MANAGEMENT ROUTES ----

@app.get("/api/admin/users")
def get_users(limit: int = 100, start_phone: Optional[str] = None, include_cart: bool = False, admin: dict = Depends(get_current_admin)):
    users, next_start_phone = get_users_page(limit=limit, start_phone=start_phone)
    cart_counts = get_all_cart_counts() if include_cart else {}
    product_prices = (
        {
            int(product["id"]): float(product.get("price", 0))
            for product in get_all_products()
            if product.get("id") is not None
        }
        if include_cart
        else {}
    )
    items = [{
        "id": _user_id_from_phone(u["phone"]),
        "phone": u["phone"],
        "name": (u.get("name") or "").strip() or "Not available",
        "email": (u.get("email") or "").strip() or "Not available",
        "role": u.get("role", "customer"),
        "address": (
            f"{u.get('street_address', '')}, {u.get('city', '')}, {u.get('state', '')} - {u.get('pincode', '')}"
        ).strip(" ,-_") or "Not available",
        "otp": u.get("otp"),
        "otp_expiry": u.get("otp_expiry"),
        "otp_delivery_status": u.get("otp_delivery_status"),
        "cart_count": sum(int(item.get("quantity", 0)) for item in cart_counts.get(u["phone"], [])) if include_cart else 0,
        "cart_total": round(sum(product_prices.get(int(item["product_id"]), 0) * int(item.get("quantity", 0)) for item in cart_counts.get(u["phone"], [])), 2) if include_cart else 0,
    } for u in users]
    return {"items": items, "next_start_phone": next_start_phone}

class UserUpdate(BaseModel):
    name: str
    phone: str
    email: str
    role: str

@app.put("/api/admin/users/{phone}")
def update_user_endpoint(phone: str, user_data: UserUpdate, admin: dict = Depends(get_current_admin)):
    updates = user_data.dict()
    updates["updated_at"] = datetime.now().isoformat()
    
    if update_user(phone, updates):
        return {"success": True}
    
    return JSONResponse(status_code=404, content={"error": "User not found"})


class UserRoleUpdate(BaseModel):
    role: str


@app.put("/api/admin/users/{user_id}/role")
def update_user_role(user_id: str, data: UserRoleUpdate, admin: dict = Depends(get_current_admin)):
    phone = phone_from_user_id(user_id)
    if update_user(phone, {"role": data.role, "updated_at": datetime.now().isoformat()}):
        return {"success": True}
    return JSONResponse(status_code=404, content={"error": "User not found"})


@app.get("/api/admin/users/{user_id}/cart")
def get_admin_user_cart(user_id: str, admin: dict = Depends(get_current_admin)):
    return get_user_cart(phone_from_user_id(user_id))


@app.delete("/api/admin/users/{user_id}")
def delete_user_endpoint(user_id: str, admin: dict = Depends(get_current_admin)):
    if delete_user(phone_from_user_id(user_id)):
        return {"success": True}
    return JSONResponse(status_code=404, content={"error": "User not found"})

# ---- ADDRESS ROUTES ----

@app.get("/api/user/addresses")
def get_user_addresses_endpoint(user: dict = Depends(get_current_user)):
    return get_user_addresses(user["phone"])

@app.post("/api/user/addresses")
def add_user_address(address: schemas.UserAddressCreate, user: dict = Depends(get_current_user)):
    address_data = address.dict()
    address_data["id"] = str(uuid.uuid4())
    address_data["user_phone"] = user["phone"]
    address_data["created_at"] = datetime.now().isoformat()
    
    if create_address(address_data):
        return {"success": True, **address_data}
    
    return JSONResponse(status_code=500, content={"error": "Failed to create address"})

@app.delete("/api/user/addresses/{address_id}")
def delete_user_address_endpoint(address_id: str, user: dict = Depends(get_current_user)):
    if delete_address(address_id):
        return {"success": True}
    
    return JSONResponse(status_code=404, content={"error": "Address not found"})


@app.get("/api/user/cart")
def get_user_cart_endpoint(user: dict = Depends(get_current_user)):
    return get_user_cart(user["phone"])


class CartSyncItem(BaseModel):
    product_id: int
    quantity: int


@app.post("/api/user/cart/sync")
def sync_user_cart(items: List[CartSyncItem], user: dict = Depends(get_current_user)):
    if replace_user_cart(user["phone"], [item.dict() for item in items]):
        return {"success": True}
    return JSONResponse(status_code=500, content={"error": "Failed to sync cart"})

# ---- ORDERS ROUTES ----

@app.get("/api/orders")
def get_orders(user: dict = Depends(get_current_user)):
    orders = get_user_orders(user["phone"])
    return [enrich_order(order) for order in orders]

class OrderCreate(BaseModel):
    items: List[dict]
    total: float
    address_id: Optional[str] = None
    coupon_id: Optional[int] = None
    delivery_slot_id: Optional[int] = None
    pickup_location_id: Optional[int] = None
    pickup_slot_id: Optional[int] = None
    order_type: str = "delivery"  # delivery or pickup
    discount_amount: Optional[float] = 0.0
    delivery_fee: Optional[float] = 0.0

@app.post("/api/orders")
def create_order_endpoint(order: OrderCreate, user: dict = Depends(get_current_user)):
    try:
        normalized_items = []
        for item in order.items:
            product = get_product(int(item.get("id") or item.get("product_id") or 0)) or {}
            normalized_items.append({
                "id": str(uuid.uuid4()),
                "product_id": int(item.get("id") or item.get("product_id")),
                "name": product.get("name") or item.get("name", "Unknown Product"),
                "price": float(item.get("price", 0)),
                "quantity": int(item.get("quantity", 0)),
                "is_checked": False,
            })

        order_data = {
            "user_phone": user["phone"],
            "order_id": str(uuid.uuid4()),
            "items": normalized_items,
            "total": order.total,
            "address_id": order.address_id,
            "coupon_id": order.coupon_id,
            "delivery_slot_id": order.delivery_slot_id,
            "pickup_location_id": order.pickup_location_id,
            "pickup_slot_id": order.pickup_slot_id,
            "order_type": order.order_type,
            "discount_amount": order.discount_amount or 0.0,
            "delivery_fee": order.delivery_fee or 0.0,
            "status": "pending",
            "created_at": datetime.now().isoformat()
        }
        
        if create_order(order_data):
            clear_user_cart(user["phone"])
            return {"success": True, "order_id": order_data["order_id"]}
        
        return JSONResponse(status_code=500, content={"error": "Failed to create order"})
    except Exception as e:
        print(f"ORDER ERROR: {str(e)}")
        return JSONResponse(status_code=500, content={"error": f"Internal Server Error: {str(e)}"})


class OrderStatusUpdate(BaseModel):
    status: str


@app.get("/api/admin/stats")
def get_admin_stats(admin: dict = Depends(get_current_admin)):
    orders = get_all_orders()
    products = get_all_products()
    users = get_all_users()
    return {
        "revenue": round(sum(float(order.get("total", 0)) for order in orders), 2),
        "total_orders": len(orders),
        "total_users": len(users),
        "low_stock": len([product for product in products if int(product.get("stock", 0)) <= 10]),
    }


@app.get("/api/admin/orders")
def get_admin_orders(admin: dict = Depends(get_current_admin)):
    return [enrich_order(order, include_admin_fields=True) for order in get_all_orders()]


@app.put("/api/admin/orders/{order_id}/status")
def update_order_status(order_id: str, data: OrderStatusUpdate, staff: dict = Depends(get_current_executive)):
    if update_order_by_id(order_id, {"status": data.status, "updated_at": datetime.now().isoformat()}):
        return {"success": True}
    return JSONResponse(status_code=404, content={"error": "Order not found"})


@app.delete("/api/admin/orders/{order_id}")
def delete_order_endpoint(order_id: str, password: str = "", admin: dict = Depends(get_current_admin)):
    if not verify_password(password, admin.get("password", "")):
        return JSONResponse(status_code=403, content={"error": "Invalid password"})
    if delete_order(order_id):
        return {"success": True}
    return JSONResponse(status_code=404, content={"error": "Order not found"})


@app.get("/api/executive/orders")
def get_executive_orders(executive: dict = Depends(get_current_executive)):
    return [enrich_order(order, executive_shape=True) for order in get_all_orders()]


class PickItemStatus(BaseModel):
    is_checked: bool


@app.put("/api/executive/items/{item_id}/pick")
def pick_item(item_id: str, data: PickItemStatus, staff: dict = Depends(get_current_executive)):
    if update_order_item_checked(item_id, data.is_checked):
        return {"success": True}
    return JSONResponse(status_code=404, content={"error": "Order item not found"})

# ---- FILE UPLOAD ----

@app.post("/api/admin/upload")
def upload_file(file: UploadFile = File(...), admin: dict = Depends(get_current_admin)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing file name")

    bucket_name = get_s3_bucket_name()
    if bucket_name:
        try:
            file_url = upload_file_to_s3(file.file, file.filename, file.content_type, folder="uploads")
            return {"url": file_url, "storage": "s3", "bucket": bucket_name}
        except Exception as e:
            print(f"S3 upload error: {e}")
            return JSONResponse(status_code=500, content={"error": "Failed to upload file to S3"})

    upload_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    
    file_ext = os.path.splitext(file.filename)[1]
    file_name = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(upload_dir, file_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"url": f"/uploads/{file_name}", "storage": "local"}


@app.get("/api/delivery-slots")
def list_delivery_slots():
    return get_delivery_slots()


@app.post("/api/admin/delivery-slots")
def add_delivery_slot(slot: schemas.DeliverySlotCreate, admin: dict = Depends(get_current_admin)):
    slot_id = create_delivery_slot(slot.dict())
    if slot_id:
        return {"success": True, "id": slot_id}
    return JSONResponse(status_code=500, content={"error": "Failed to create delivery slot"})


@app.delete("/api/admin/delivery-slots/{slot_id}")
def remove_delivery_slot(slot_id: int, admin: dict = Depends(get_current_admin)):
    if delete_delivery_slot(slot_id):
        return {"success": True}
    return JSONResponse(status_code=404, content={"error": "Slot not found"})


@app.get("/api/pickup-locations")
def list_pickup_locations(all: bool = False):
    return get_pickup_locations(all_locations=all)


@app.post("/api/admin/pickup-locations")
def add_pickup_location(location: schemas.PickupLocationCreate, admin: dict = Depends(get_current_admin)):
    location_id = create_pickup_location(location.dict())
    if location_id:
        return {"success": True, "id": location_id}
    return JSONResponse(status_code=500, content={"error": "Failed to create pickup location"})


@app.patch("/api/admin/pickup-locations/{location_id}/toggle")
def switch_pickup_location(location_id: int, admin: dict = Depends(get_current_admin)):
    new_state = toggle_pickup_location(location_id)
    if new_state is None:
        return JSONResponse(status_code=404, content={"error": "Location not found"})
    return {"success": True, "is_active": new_state}


@app.delete("/api/admin/pickup-locations/{location_id}")
def remove_pickup_location(location_id: int, admin: dict = Depends(get_current_admin)):
    if delete_pickup_location(location_id):
        return {"success": True}
    return JSONResponse(status_code=404, content={"error": "Location not found"})


@app.get("/api/pickup-slots")
def list_pickup_slots(location_id: Optional[int] = None, all: bool = False):
    return get_pickup_slots(location_id=location_id, all_slots=all)


@app.post("/api/admin/pickup-slots")
def add_pickup_slot(slot: schemas.PickupSlotCreate, admin: dict = Depends(get_current_admin)):
    slot_id = create_pickup_slot(slot.dict())
    if slot_id:
        return {"success": True, "id": slot_id}
    return JSONResponse(status_code=500, content={"error": "Failed to create pickup slot"})


@app.patch("/api/admin/pickup-slots/{slot_id}/toggle")
def switch_pickup_slot(slot_id: int, admin: dict = Depends(get_current_admin)):
    new_state = toggle_pickup_slot(slot_id)
    if new_state is None:
        return JSONResponse(status_code=404, content={"error": "Slot not found"})
    return {"success": True, "is_active": new_state}


@app.delete("/api/admin/pickup-slots/{slot_id}")
def remove_pickup_slot(slot_id: int, admin: dict = Depends(get_current_admin)):
    if delete_pickup_slot(slot_id):
        return {"success": True}
    return JSONResponse(status_code=404, content={"error": "Slot not found"})


@app.get("/api/admin/coupons")
def list_coupons(admin: dict = Depends(get_current_admin)):
    return get_coupons()


@app.post("/api/admin/coupons")
def add_coupon_endpoint(coupon: schemas.CouponCreate, admin: dict = Depends(get_current_admin)):
    coupon_id = create_coupon(coupon.dict())
    if coupon_id:
        return {"success": True, "id": coupon_id}
    return JSONResponse(status_code=500, content={"error": "Failed to create coupon"})


@app.delete("/api/admin/coupons/{coupon_id}")
def remove_coupon(coupon_id: int, admin: dict = Depends(get_current_admin)):
    if delete_coupon(coupon_id):
        return {"success": True}
    return JSONResponse(status_code=404, content={"error": "Coupon not found"})


class CouponValidateRequest(BaseModel):
    code: str
    cart_total: float


@app.post("/api/coupons/validate")
def validate_coupon(req: CouponValidateRequest, user: dict = Depends(get_current_user)):
    coupon = get_coupon_by_code(req.code)
    if not coupon:
        return JSONResponse(status_code=400, content={"error": "Invalid or expired coupon code"})

    if coupon.get("min_order_amount", 0) and req.cart_total < float(coupon.get("min_order_amount", 0)):
        return JSONResponse(status_code=400, content={"error": f"Minimum order amount is ₹{coupon['min_order_amount']}"})

    coupon_user = coupon.get("user_id")
    if coupon_user and str(coupon_user) != str(_user_id_from_phone(user["phone"])):
        return JSONResponse(status_code=400, content={"error": "This coupon is not applicable to your account"})

    discount = float(coupon.get("discount_value", 0))
    if coupon.get("is_percentage"):
        discount = round((discount / 100) * req.cart_total, 2)

    return {"success": True, "discount_amount": discount, "coupon_id": coupon["id"]}


@app.get("/api/products/{product_id}/reviews")
def list_reviews(product_id: int):
    return get_reviews(product_id)


@app.post("/api/products/{product_id}/reviews")
def create_review(product_id: int, review: schemas.ReviewCreate, user: dict = Depends(get_current_user)):
    created = add_review(product_id, user["phone"], user["name"], review.rating, review.comment)
    if created:
        return {"success": True, "id": created["id"]}
    return JSONResponse(status_code=500, content={"error": "Failed to create review"})

# ---- STATIC FILES ----

upload_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

