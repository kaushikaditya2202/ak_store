import os
import time
from decimal import Decimal
from typing import Any, Optional
from urllib.parse import quote

import boto3
from boto3.dynamodb.conditions import Attr, Key
from dotenv import load_dotenv

load_dotenv()

REGION = os.getenv("AWS_REGION", "ap-south-1")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_SESSION_TOKEN = os.getenv("AWS_SESSION_TOKEN")

USERS_TABLE = "Users"
PRODUCTS_TABLE = "Products"
CATEGORIES_TABLE = "Categories"
ORDERS_TABLE = "Orders"
ADDRESSES_TABLE = "Addresses"
CART_ITEMS_TABLE = "CartItems"
REVIEWS_TABLE = "Reviews"
DELIVERY_SLOTS_TABLE = "DeliverySlots"
PICKUP_LOCATIONS_TABLE = "PickupLocations"
PICKUP_SLOTS_TABLE = "PickupSlots"
COUPONS_TABLE = "Coupons"

_CACHE_TTLS = {
    "users": 20,
    "products": 30,
    "categories": 120,
    "cart_counts": 10,
}
_CACHE: dict[str, dict[str, Any]] = {}


def _resource_kwargs(service_name: str) -> dict:
    kwargs = {"service_name": service_name, "region_name": REGION}
    if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
        kwargs["aws_access_key_id"] = AWS_ACCESS_KEY_ID
        kwargs["aws_secret_access_key"] = AWS_SECRET_ACCESS_KEY
        if AWS_SESSION_TOKEN:
            kwargs["aws_session_token"] = AWS_SESSION_TOKEN
    return kwargs


dynamodb = boto3.resource(**_resource_kwargs("dynamodb"))
dynamodb_client = boto3.client(**_resource_kwargs("dynamodb"))


def _table(name: str):
    return dynamodb.Table(name)


def _get_cached(key: str):
    entry = _CACHE.get(key)
    if not entry:
        return None
    if entry["expires_at"] < time.time():
        _CACHE.pop(key, None)
        return None
    return entry["value"]


def _set_cached(key: str, value: Any, ttl: int):
    _CACHE[key] = {"value": value, "expires_at": time.time() + ttl}
    return value


def _invalidate_cache(*keys: str) -> None:
    for key in keys:
        _CACHE.pop(key, None)


def _serialize(value: Any) -> Any:
    if isinstance(value, list):
        return [_serialize(v) for v in value]
    if isinstance(value, dict):
        return {k: _serialize(v) for k, v in value.items()}
    if isinstance(value, Decimal):
        if value % 1 == 0:
            return int(value)
        return float(value)
    return value


def _to_decimal(value: Any) -> Any:
    if isinstance(value, list):
        return [_to_decimal(v) for v in value]
    if isinstance(value, dict):
        return {k: _to_decimal(v) for k, v in value.items()}
    if isinstance(value, bool):
        return value
    if isinstance(value, float):
        return Decimal(str(value))
    if isinstance(value, int):
        return Decimal(str(value))
    return value


def _scan_all(table_name: str, **kwargs) -> list[dict]:
    table = _table(table_name)
    response = table.scan(**kwargs)
    items = response.get("Items", [])
    while "LastEvaluatedKey" in response:
        response = table.scan(ExclusiveStartKey=response["LastEvaluatedKey"], **kwargs)
        items.extend(response.get("Items", []))
    return items


def _query_all(table_name: str, **kwargs) -> list[dict]:
    table = _table(table_name)
    response = table.query(**kwargs)
    items = response.get("Items", [])
    while "LastEvaluatedKey" in response:
        response = table.query(ExclusiveStartKey=response["LastEvaluatedKey"], **kwargs)
        items.extend(response.get("Items", []))
    return items


def _build_update_expression(clean_updates: dict[str, Any]) -> tuple[str, dict[str, str], dict[str, Any]]:
    expr_names = {f"#f{i}": key for i, key in enumerate(clean_updates.keys())}
    expr_values = {f":v{i}": value for i, value in enumerate(clean_updates.values())}
    assignments = [
        f"{name_token} = {value_token}"
        for (name_token, _), (value_token, _) in zip(expr_names.items(), expr_values.items())
    ]
    return "SET " + ", ".join(assignments), expr_names, expr_values


def _next_numeric_id(table_name: str) -> int:
    items = _scan_all(table_name)
    max_id = 0
    for item in items:
        raw_id = _serialize(item.get("id", 0))
        if isinstance(raw_id, (int, float)):
            max_id = max(max_id, int(raw_id))
    return max_id + 1


def _ensure_table(name: str, key_schema: list[dict], attribute_definitions: list[dict]) -> None:
    try:
        dynamodb_client.describe_table(TableName=name)
        return
    except dynamodb_client.exceptions.ResourceNotFoundException:
        pass

    dynamodb_client.create_table(
        TableName=name,
        KeySchema=key_schema,
        AttributeDefinitions=attribute_definitions,
        BillingMode="PAY_PER_REQUEST",
    )
    waiter = dynamodb_client.get_waiter("table_exists")
    waiter.wait(TableName=name)


def ensure_tables_exist() -> None:
    _ensure_table(USERS_TABLE, [{"AttributeName": "phone", "KeyType": "HASH"}], [{"AttributeName": "phone", "AttributeType": "S"}])
    _ensure_table(PRODUCTS_TABLE, [{"AttributeName": "id", "KeyType": "HASH"}], [{"AttributeName": "id", "AttributeType": "N"}])
    _ensure_table(CATEGORIES_TABLE, [{"AttributeName": "id", "KeyType": "HASH"}], [{"AttributeName": "id", "AttributeType": "N"}])
    _ensure_table(
        ORDERS_TABLE,
        [{"AttributeName": "user_phone", "KeyType": "HASH"}, {"AttributeName": "order_id", "KeyType": "RANGE"}],
        [{"AttributeName": "user_phone", "AttributeType": "S"}, {"AttributeName": "order_id", "AttributeType": "S"}],
    )
    _ensure_table(ADDRESSES_TABLE, [{"AttributeName": "id", "KeyType": "HASH"}], [{"AttributeName": "id", "AttributeType": "S"}])
    _ensure_table(
        CART_ITEMS_TABLE,
        [{"AttributeName": "user_phone", "KeyType": "HASH"}, {"AttributeName": "product_id", "KeyType": "RANGE"}],
        [{"AttributeName": "user_phone", "AttributeType": "S"}, {"AttributeName": "product_id", "AttributeType": "N"}],
    )
    _ensure_table(
        REVIEWS_TABLE,
        [{"AttributeName": "product_id", "KeyType": "HASH"}, {"AttributeName": "id", "KeyType": "RANGE"}],
        [{"AttributeName": "product_id", "AttributeType": "N"}, {"AttributeName": "id", "AttributeType": "S"}],
    )
    _ensure_table(DELIVERY_SLOTS_TABLE, [{"AttributeName": "id", "KeyType": "HASH"}], [{"AttributeName": "id", "AttributeType": "N"}])
    _ensure_table(PICKUP_LOCATIONS_TABLE, [{"AttributeName": "id", "KeyType": "HASH"}], [{"AttributeName": "id", "AttributeType": "N"}])
    _ensure_table(PICKUP_SLOTS_TABLE, [{"AttributeName": "id", "KeyType": "HASH"}], [{"AttributeName": "id", "AttributeType": "N"}])
    _ensure_table(COUPONS_TABLE, [{"AttributeName": "id", "KeyType": "HASH"}], [{"AttributeName": "id", "AttributeType": "N"}])


def _placeholder_image(label: str) -> str:
    return f"https://placehold.co/600x600/png?text={quote(label[:32] or 'AK+Store')}"


def _normalize_product(item: dict) -> dict:
    product = _serialize(item)
    image = str(product.get("image") or "").strip()
    if not image:
        product["image"] = _placeholder_image(product.get("name", "Product"))
    elif not (image.startswith("http://") or image.startswith("https://") or image.startswith("/uploads/")):
        product["image"] = _placeholder_image(product.get("name", "Product"))
    return product


def _normalize_category(item: dict) -> dict:
    category = _serialize(item)
    image_url = str(category.get("image_url") or "").strip()
    if not image_url:
        category["image_url"] = _placeholder_image(category.get("name", "Category"))
    elif not (image_url.startswith("http://") or image_url.startswith("https://") or image_url.startswith("/uploads/")):
        category["image_url"] = _placeholder_image(category.get("name", "Category"))
    return category


def _user_id_from_phone(phone: str) -> int:
    try:
        return int(phone)
    except Exception:
        return abs(hash(phone)) % (10**9)


def _seed_defaults() -> None:
    if not _scan_all(DELIVERY_SLOTS_TABLE):
        for name, start, end in [
            ("Morning", "08:00", "11:00"),
            ("Afternoon", "12:00", "15:00"),
            ("Evening", "17:00", "20:00"),
        ]:
            create_delivery_slot({"name": name, "start_time": start, "end_time": end, "is_active": True})

    if not _scan_all(PICKUP_LOCATIONS_TABLE):
        location_id = create_pickup_location({
            "name": "AK Store Main Counter",
            "address": "Bank Road, Main Road",
            "city": "Raxaul",
            "pincode": "845305",
            "is_active": True,
        })
        create_pickup_slot({"location_id": location_id, "name": "Morning Pickup", "start_time": "09:00", "end_time": "12:00", "is_active": True})
        create_pickup_slot({"location_id": location_id, "name": "Evening Pickup", "start_time": "16:00", "end_time": "20:00", "is_active": True})

    if not _scan_all(COUPONS_TABLE):
        create_coupon({"code": "WELCOME10", "discount_value": 10, "is_percentage": True, "min_order_amount": 0, "active": True})
        create_coupon({"code": "SAVE50", "discount_value": 50, "is_percentage": False, "min_order_amount": 500, "active": True})


def get_user(phone: str):
    try:
        response = _table(USERS_TABLE).get_item(Key={"phone": phone})
        user = response.get("Item")
        return _serialize(user) if user else None
    except Exception as e:
        print(f"Error getting user: {e}")
        return None


def create_user(user_data: dict):
    try:
        _table(USERS_TABLE).put_item(Item=user_data)
        _invalidate_cache("users")
        return True
    except Exception as e:
        print(f"Error creating user: {e}")
        return False


def user_exists(email: str = None, phone: str = None):
    try:
        if email:
            matches = _scan_all(USERS_TABLE, FilterExpression=Attr("email").eq(email))
            if matches:
                return True
        if phone:
            return get_user(phone) is not None
        return False
    except Exception as e:
        print(f"Error checking user: {e}")
        return False


def update_user(phone: str, updates: dict):
    try:
        clean_updates = {k: _to_decimal(v) for k, v in updates.items() if k != "phone"}
        if not clean_updates:
            return True
        update_expr, expr_names, expr_values = _build_update_expression(clean_updates)
        _table(USERS_TABLE).update_item(
            Key={"phone": phone},
            UpdateExpression=update_expr,
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_values,
        )
        _invalidate_cache("users")
        return True
    except Exception as e:
        print(f"Error updating user: {e}")
        return False


def delete_user(phone: str):
    try:
        _table(USERS_TABLE).delete_item(Key={"phone": phone})
        for address in get_user_addresses(phone):
            delete_address(address["id"])
        clear_user_cart(phone)
        _invalidate_cache("users")
        return True
    except Exception as e:
        print(f"Error deleting user: {e}")
        return False


def get_all_users():
    try:
        cached = _get_cached("users")
        if cached is not None:
            return cached
        users = [_serialize(item) for item in _scan_all(USERS_TABLE)]
        return _set_cached("users", users, _CACHE_TTLS["users"])
    except Exception as e:
        print(f"Error getting users: {e}")
        return []


def get_users_page(limit: int = 200, start_phone: str | None = None):
    try:
        kwargs: dict = {"Limit": int(limit)}
        if start_phone:
            kwargs["ExclusiveStartKey"] = {"phone": start_phone}
        response = _table(USERS_TABLE).scan(**kwargs)
        items = [_serialize(item) for item in response.get("Items", [])]
        lek = response.get("LastEvaluatedKey") or None
        next_start_phone = lek.get("phone") if isinstance(lek, dict) else None
        return items, next_start_phone
    except Exception as e:
        print(f"Error getting users page: {e}")
        return [], None


def get_product(product_id: int):
    try:
        response = _table(PRODUCTS_TABLE).get_item(Key={"id": Decimal(str(product_id))})
        item = response.get("Item")
        return _normalize_product(item) if item else None
    except Exception as e:
        print(f"Error getting product: {e}")
        return None


def get_all_products():
    try:
        cached = _get_cached("products")
        if cached is not None:
            return cached
        products = [_normalize_product(item) for item in _scan_all(PRODUCTS_TABLE)]
        return _set_cached("products", products, _CACHE_TTLS["products"])
    except Exception as e:
        print(f"Error getting products: {e}")
        return []


def create_product(product_data: dict):
    try:
        payload = dict(product_data)
        payload["id"] = Decimal(str(payload.get("id") or _next_numeric_id(PRODUCTS_TABLE)))
        payload.setdefault("stock", 0)
        payload.setdefault("out_of_stock", False)
        _table(PRODUCTS_TABLE).put_item(Item=_to_decimal(payload))
        _invalidate_cache("products")
        return _serialize(payload["id"])
    except Exception as e:
        print(f"Error creating product: {e}")
        return None


def update_product(product_id: int, updates: dict):
    try:
        clean_updates = {k: _to_decimal(v) for k, v in updates.items() if k != "id"}
        if not clean_updates:
            return True
        update_expr, expr_names, expr_values = _build_update_expression(clean_updates)
        _table(PRODUCTS_TABLE).update_item(
            Key={"id": Decimal(str(product_id))},
            UpdateExpression=update_expr,
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_values,
        )
        _invalidate_cache("products")
        return True
    except Exception as e:
        print(f"Error updating product: {e}")
        return False


def delete_product(product_id: int):
    try:
        _table(PRODUCTS_TABLE).delete_item(Key={"id": Decimal(str(product_id))})
        _invalidate_cache("products")
        return True
    except Exception as e:
        print(f"Error deleting product: {e}")
        return False


def get_all_categories():
    try:
        cached = _get_cached("categories")
        if cached is not None:
            return cached
        categories = [_normalize_category(item) for item in _scan_all(CATEGORIES_TABLE)]
        return _set_cached("categories", categories, _CACHE_TTLS["categories"])
    except Exception as e:
        print(f"Error getting categories: {e}")
        return []


def create_category(category_data: dict):
    try:
        payload = dict(category_data)
        payload["id"] = Decimal(str(payload.get("id") or _next_numeric_id(CATEGORIES_TABLE)))
        _table(CATEGORIES_TABLE).put_item(Item=_to_decimal(payload))
        _invalidate_cache("categories")
        return _serialize(payload["id"])
    except Exception as e:
        print(f"Error creating category: {e}")
        return None


def delete_category(category_id: int):
    try:
        _table(CATEGORIES_TABLE).delete_item(Key={"id": Decimal(str(category_id))})
        _invalidate_cache("categories")
        return True
    except Exception as e:
        print(f"Error deleting category: {e}")
        return False


def create_order(order_data: dict):
    try:
        _table(ORDERS_TABLE).put_item(Item=_to_decimal(order_data))
        return True
    except Exception as e:
        print(f"Error creating order: {e}")
        return False


def get_user_orders(user_phone: str):
    try:
        items = _query_all(
            ORDERS_TABLE,
            KeyConditionExpression=Key("user_phone").eq(user_phone),
        )
        items = [_serialize(item) for item in items]
        items.sort(key=lambda item: item.get("created_at", ""), reverse=True)
        return items
    except Exception as e:
        print(f"Error getting user orders: {e}")
        return []


def get_all_orders():
    try:
        items = [_serialize(item) for item in _scan_all(ORDERS_TABLE)]
        items.sort(key=lambda item: item.get("created_at", ""), reverse=True)
        return items
    except Exception as e:
        print(f"Error getting all orders: {e}")
        return []


def find_order_by_id(order_id: str):
    for order in get_all_orders():
        if str(order.get("order_id")) == str(order_id):
            return order
    return None


def update_order(user_phone: str, order_id: str, updates: dict):
    try:
        clean_updates = {k: _to_decimal(v) for k, v in updates.items() if k not in {"user_phone", "order_id"}}
        if not clean_updates:
            return True
        update_expr, expr_names, expr_values = _build_update_expression(clean_updates)
        _table(ORDERS_TABLE).update_item(
            Key={"user_phone": user_phone, "order_id": order_id},
            UpdateExpression=update_expr,
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_values,
        )
        return True
    except Exception as e:
        print(f"Error updating order: {e}")
        return False


def update_order_by_id(order_id: str, updates: dict):
    order = find_order_by_id(order_id)
    if not order:
        return False
    return update_order(order["user_phone"], order["order_id"], updates)


def delete_order(order_id: str):
    order = find_order_by_id(order_id)
    if not order:
        return False
    try:
        _table(ORDERS_TABLE).delete_item(Key={"user_phone": order["user_phone"], "order_id": order["order_id"]})
        return True
    except Exception as e:
        print(f"Error deleting order: {e}")
        return False


def create_address(address_data: dict):
    try:
        _table(ADDRESSES_TABLE).put_item(Item=address_data)
        return True
    except Exception as e:
        print(f"Error creating address: {e}")
        return False


def get_user_addresses(user_phone: str):
    try:
        items = _scan_all(ADDRESSES_TABLE, FilterExpression=Attr("user_phone").eq(user_phone))
        return [_serialize(item) for item in items]
    except Exception as e:
        print(f"Error getting addresses: {e}")
        return []


def update_address(address_id: str, updates: dict):
    try:
        clean_updates = {k: _to_decimal(v) for k, v in updates.items() if k != "id"}
        if not clean_updates:
            return True
        update_expr, expr_names, expr_values = _build_update_expression(clean_updates)
        _table(ADDRESSES_TABLE).update_item(
            Key={"id": address_id},
            UpdateExpression=update_expr,
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_values,
        )
        return True
    except Exception as e:
        print(f"Error updating address: {e}")
        return False


def delete_address(address_id: str):
    try:
        _table(ADDRESSES_TABLE).delete_item(Key={"id": address_id})
        return True
    except Exception as e:
        print(f"Error deleting address: {e}")
        return False


def clear_user_cart(user_phone: str):
    try:
        items = _query_all(CART_ITEMS_TABLE, KeyConditionExpression=Key("user_phone").eq(user_phone))
        if not items:
            return True
        with _table(CART_ITEMS_TABLE).batch_writer() as batch:
            for item in items:
                batch.delete_item(Key={"user_phone": user_phone, "product_id": item["product_id"]})
        _invalidate_cache("cart_counts")
        return True
    except Exception as e:
        print(f"Error clearing cart: {e}")
        return False


def replace_user_cart(user_phone: str, items: list[dict]):
    try:
        clear_user_cart(user_phone)
        with _table(CART_ITEMS_TABLE).batch_writer() as batch:
            for item in items:
                batch.put_item(
                    Item={
                        "user_phone": user_phone,
                        "product_id": Decimal(str(item["product_id"])),
                        "quantity": Decimal(str(item["quantity"])),
                    }
                )
        _invalidate_cache("cart_counts")
        return True
    except Exception as e:
        print(f"Error replacing cart: {e}")
        return False


def get_user_cart(user_phone: str):
    try:
        items = _query_all(CART_ITEMS_TABLE, KeyConditionExpression=Key("user_phone").eq(user_phone))
        cart_items = []
        for item in items:
            product = get_product(int(item["product_id"]))
            if not product:
                continue
            cart_items.append(
                {
                    "id": product["id"],
                    "product_id": product["id"],
                    "product_name": product["name"],
                    "product_image": product["image"],
                    "product_price": product["price"],
                    "quantity": int(_serialize(item["quantity"])),
                }
            )
        return cart_items
    except Exception as e:
        print(f"Error getting user cart: {e}")
        return []


def get_all_cart_counts() -> dict[str, list[dict]]:
    cached = _get_cached("cart_counts")
    if cached is not None:
        return cached
    grouped: dict[str, list[dict]] = {}
    for item in _scan_all(CART_ITEMS_TABLE):
        phone = item["user_phone"]
        grouped.setdefault(phone, []).append(_serialize(item))
    return _set_cached("cart_counts", grouped, _CACHE_TTLS["cart_counts"])


def get_reviews(product_id: int):
    try:
        items = _query_all(REVIEWS_TABLE, KeyConditionExpression=Key("product_id").eq(Decimal(str(product_id))))
        reviews = [_serialize(item) for item in items]
        reviews.sort(key=lambda item: item.get("created_at", ""), reverse=True)
        return reviews
    except Exception as e:
        print(f"Error getting reviews: {e}")
        return []


def add_review(product_id: int, user_phone: str, user_name: str, rating: int, comment: str):
    try:
        review = {
            "product_id": Decimal(str(product_id)),
            "id": os.urandom(8).hex(),
            "user_phone": user_phone,
            "user_name": user_name,
            "rating": Decimal(str(rating)),
            "comment": comment,
            "created_at": __import__("datetime").datetime.now().isoformat(),
        }
        _table(REVIEWS_TABLE).put_item(Item=review)
        return _serialize(review)
    except Exception as e:
        print(f"Error creating review: {e}")
        return None


def create_delivery_slot(slot_data: dict):
    try:
        payload = dict(slot_data)
        payload["id"] = Decimal(str(payload.get("id") or _next_numeric_id(DELIVERY_SLOTS_TABLE)))
        _table(DELIVERY_SLOTS_TABLE).put_item(Item=_to_decimal(payload))
        return _serialize(payload["id"])
    except Exception as e:
        print(f"Error creating delivery slot: {e}")
        return None


def get_delivery_slots(all_slots: bool = False):
    try:
        items = [_serialize(item) for item in _scan_all(DELIVERY_SLOTS_TABLE)]
        if not all_slots:
            items = [item for item in items if item.get("is_active", True)]
        items.sort(key=lambda item: item.get("id", 0))
        return items
    except Exception as e:
        print(f"Error getting delivery slots: {e}")
        return []


def delete_delivery_slot(slot_id: int):
    try:
        _table(DELIVERY_SLOTS_TABLE).delete_item(Key={"id": Decimal(str(slot_id))})
        return True
    except Exception as e:
        print(f"Error deleting delivery slot: {e}")
        return False


def create_pickup_location(location_data: dict):
    try:
        payload = dict(location_data)
        payload["id"] = Decimal(str(payload.get("id") or _next_numeric_id(PICKUP_LOCATIONS_TABLE)))
        _table(PICKUP_LOCATIONS_TABLE).put_item(Item=_to_decimal(payload))
        return _serialize(payload["id"])
    except Exception as e:
        print(f"Error creating pickup location: {e}")
        return None


def get_pickup_locations(all_locations: bool = False):
    try:
        items = [_serialize(item) for item in _scan_all(PICKUP_LOCATIONS_TABLE)]
        if not all_locations:
            items = [item for item in items if item.get("is_active", True)]
        items.sort(key=lambda item: item.get("id", 0))
        return items
    except Exception as e:
        print(f"Error getting pickup locations: {e}")
        return []


def toggle_pickup_location(location_id: int):
    location = next((item for item in get_pickup_locations(True) if item["id"] == location_id), None)
    if not location:
        return None
    new_state = not bool(location.get("is_active", True))
    update_generic_item(PICKUP_LOCATIONS_TABLE, location_id, {"is_active": new_state})
    return new_state


def delete_pickup_location(location_id: int):
    try:
        _table(PICKUP_LOCATIONS_TABLE).delete_item(Key={"id": Decimal(str(location_id))})
        return True
    except Exception as e:
        print(f"Error deleting pickup location: {e}")
        return False


def create_pickup_slot(slot_data: dict):
    try:
        payload = dict(slot_data)
        payload["id"] = Decimal(str(payload.get("id") or _next_numeric_id(PICKUP_SLOTS_TABLE)))
        _table(PICKUP_SLOTS_TABLE).put_item(Item=_to_decimal(payload))
        return _serialize(payload["id"])
    except Exception as e:
        print(f"Error creating pickup slot: {e}")
        return None


def get_pickup_slots(location_id: Optional[int] = None, all_slots: bool = False):
    try:
        items = [_serialize(item) for item in _scan_all(PICKUP_SLOTS_TABLE)]
        if location_id is not None:
            items = [item for item in items if int(item.get("location_id", 0)) == int(location_id)]
        if not all_slots:
            items = [item for item in items if item.get("is_active", True)]
        items.sort(key=lambda item: item.get("id", 0))
        return items
    except Exception as e:
        print(f"Error getting pickup slots: {e}")
        return []


def toggle_pickup_slot(slot_id: int):
    slot = next((item for item in get_pickup_slots(all_slots=True) if item["id"] == slot_id), None)
    if not slot:
        return None
    new_state = not bool(slot.get("is_active", True))
    update_generic_item(PICKUP_SLOTS_TABLE, slot_id, {"is_active": new_state})
    return new_state


def delete_pickup_slot(slot_id: int):
    try:
        _table(PICKUP_SLOTS_TABLE).delete_item(Key={"id": Decimal(str(slot_id))})
        return True
    except Exception as e:
        print(f"Error deleting pickup slot: {e}")
        return False


def create_coupon(coupon_data: dict):
    try:
        payload = dict(coupon_data)
        payload["id"] = Decimal(str(payload.get("id") or _next_numeric_id(COUPONS_TABLE)))
        payload.setdefault("active", True)
        _table(COUPONS_TABLE).put_item(Item=_to_decimal(payload))
        return _serialize(payload["id"])
    except Exception as e:
        print(f"Error creating coupon: {e}")
        return None


def get_coupons():
    try:
        items = [_serialize(item) for item in _scan_all(COUPONS_TABLE)]
        items.sort(key=lambda item: item.get("id", 0))
        return items
    except Exception as e:
        print(f"Error getting coupons: {e}")
        return []


def get_coupon_by_code(code: str):
    code = code.strip().upper()
    return next((item for item in get_coupons() if item.get("code", "").upper() == code and item.get("active", True)), None)


def delete_coupon(coupon_id: int):
    try:
        _table(COUPONS_TABLE).delete_item(Key={"id": Decimal(str(coupon_id))})
        return True
    except Exception as e:
        print(f"Error deleting coupon: {e}")
        return False


def update_generic_item(table_name: str, item_id: int, updates: dict):
    clean_updates = {k: _to_decimal(v) for k, v in updates.items() if k != "id"}
    update_expr, expr_names, expr_values = _build_update_expression(clean_updates)
    _table(table_name).update_item(
        Key={"id": Decimal(str(item_id))},
        UpdateExpression=update_expr,
        ExpressionAttributeNames=expr_names,
        ExpressionAttributeValues=expr_values,
    )
    return True


def update_order_item_checked(item_id: str, is_checked: bool):
    for order in get_all_orders():
        items = order.get("items", [])
        updated = False
        for item in items:
            if str(item.get("id")) == str(item_id):
                item["is_checked"] = bool(is_checked)
                updated = True
        if updated:
            update_order(order["user_phone"], order["order_id"], {"items": items})
            return True
    return False


def resolve_address(address_id: Optional[str], user_phone: str) -> Optional[str]:
    if not address_id:
        user = get_user(user_phone) or {}
        if user.get("street_address"):
            return f"{user.get('street_address', '')}, {user.get('city', '')}, {user.get('state', '')} - {user.get('pincode', '')}"
        return None
    response = _table(ADDRESSES_TABLE).get_item(Key={"id": str(address_id)})
    address = _serialize(response.get("Item"))
    if not address:
        return None
    return f"{address.get('name', 'Address')}: {address.get('street_address', '')}, {address.get('city', '')}, {address.get('state', '')} - {address.get('pincode', '')}"


def resolve_slot_info(order: dict) -> str:
    if order.get("order_type") == "pickup":
        slot_id = order.get("pickup_slot_id")
        if slot_id:
            slot = next((item for item in get_pickup_slots(all_slots=True) if str(item["id"]) == str(slot_id)), None)
            if slot:
                return f"{slot['name']} ({slot['start_time']}-{slot['end_time']})"
    else:
        slot_id = order.get("delivery_slot_id")
        if slot_id:
            slot = next((item for item in get_delivery_slots(True) if str(item["id"]) == str(slot_id)), None)
            if slot:
                return f"{slot['name']} ({slot['start_time']}-{slot['end_time']})"
    return "Anytime"


def enrich_order(order: dict, include_admin_fields: bool = False, executive_shape: bool = False) -> dict:
    user = get_user(order["user_phone"]) or {}
    items = []
    for raw_item in order.get("items", []):
        product = get_product(int(raw_item.get("product_id") or raw_item.get("id") or 0))
        product_name = raw_item.get("name") or (product or {}).get("name") or "Unknown Product"
        item_id = str(raw_item.get("id"))
        item = {
            "id": item_id,
            "product_id": raw_item.get("product_id") or raw_item.get("id"),
            "product_name": product_name,
            "quantity": int(raw_item.get("quantity", 0)),
            "price": float(raw_item.get("price", 0)),
            "is_checked": bool(raw_item.get("is_checked", False)),
        }
        items.append(item)

    payload = {
        "id": order["order_id"],
        "order_id": order["order_id"],
        "user_id": _user_id_from_phone(order["user_phone"]),
        "user_name": user.get("name", "Unknown Customer"),
        "user_phone": order["user_phone"],
        "total": float(order.get("total", 0)),
        "status": order.get("status", "pending"),
        "created_at": order.get("created_at"),
        "address_id": order.get("address_id"),
        "address": resolve_address(order.get("address_id"), order["user_phone"]),
        "slot_info": resolve_slot_info(order),
        "discount_amount": float(order.get("discount_amount", 0)),
        "delivery_fee": float(order.get("delivery_fee", 0)),
        "order_type": order.get("order_type", "delivery"),
        "pickup_location_id": order.get("pickup_location_id"),
        "pickup_slot_id": order.get("pickup_slot_id"),
    }
    if executive_shape:
        payload["items"] = items
    else:
        payload["order_items"] = items
    if include_admin_fields:
        payload["items"] = items
    return payload


ensure_tables_exist()
_seed_defaults()
