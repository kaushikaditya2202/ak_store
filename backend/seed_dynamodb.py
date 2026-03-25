"""
Seed script to populate DynamoDB with initial data (users, products, categories)
Run this once to set up your production database
"""

import boto3
from decimal import Decimal
from dotenv import load_dotenv
import os
from datetime import datetime
import uuid

load_dotenv()

# DynamoDB Client
dynamodb = boto3.resource(
    'dynamodb',
    region_name='ap-south-1',
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
)

users_table = dynamodb.Table('Users')
products_table = dynamodb.Table('Products')
categories_table = dynamodb.Table('Categories')

def hash_password(password: str):
    """Hash password using SHA256"""
    import hashlib
    return hashlib.sha256(password.encode()).hexdigest()

def seed_users():
    """Seed test users"""
    print("🌱 Seeding Users...")
    
    test_users = [
        {
            "phone": "9999999999",
            "name": "Admin User",
            "email": "admin@akstore.in",
            "password": hash_password("admin123"),
            "role": "admin",
            "street_address": "123 Admin Street",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400001",
            "landmark": "Near Admin Tower",
            "created_at": datetime.now().isoformat()
        },
        {
            "phone": "8888888888",
            "name": "Executive User",
            "email": "delivery@akstore.in",
            "password": hash_password("exec123"),
            "role": "executive",
            "street_address": "456 Executive Avenue",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400002",
            "landmark": "Near Executive Plaza",
            "created_at": datetime.now().isoformat()
        },
        {
            "phone": "8210282102",
            "name": "Aditya Kaushik",
            "email": "kaushikaditya943@gmail.com",
            "password": hash_password("aditya123"),
            "role": "customer",
            "street_address": "789 Customer Lane",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400003",
            "landmark": "Near Customer Manor",
            "created_at": datetime.now().isoformat()
        }
    ]
    
    for user in test_users:
        try:
            users_table.put_item(Item=user)
            print(f"✓ Created user: {user['phone']} ({user['name']})")
        except Exception as e:
            print(f"✗ Error creating user {user['phone']}: {e}")

def seed_categories():
    """Seed product categories"""
    print("\n🌱 Seeding Categories...")
    
    categories = [
        {"id": Decimal("1"), "name": "Fresh Vegetables", "icon": "🥬", "display_order": 1, "is_active": True},
        {"id": Decimal("2"), "name": "Fresh Fruits", "icon": "🍎", "display_order": 2, "is_active": True},
        {"id": Decimal("3"), "name": "Dairy Products", "icon": "🥛", "display_order": 3, "is_active": True},
        {"id": Decimal("4"), "name": "Grains & Pulses", "icon": "🌾", "display_order": 4, "is_active": True},
        {"id": Decimal("5"), "name": "Spices", "icon": "🌶️", "display_order": 5, "is_active": True},
        {"id": Decimal("6"), "name": "Snacks", "icon": "🍿", "display_order": 6, "is_active": True},
        {"id": Decimal("7"), "name": "Beverages", "icon": "🥤", "display_order": 7, "is_active": True},
        {"id": Decimal("8"), "name": "Bakery", "icon": "🍞", "display_order": 8, "is_active": True},
        {"id": Decimal("9"), "name": "Meat & Fish", "icon": "🍗", "display_order": 9, "is_active": True},
        {"id": Decimal("10"), "name": "Personal Care", "icon": "🧴", "display_order": 10, "is_active": True}
    ]
    
    for category in categories:
        try:
            categories_table.put_item(Item=category)
            print(f"✓ Created category: {category['name']}")
        except Exception as e:
            print(f"✗ Error creating category {category['name']}: {e}")

def seed_products():
    """Seed product data"""
    print("\n🌱 Seeding Products...")
    
    products = [
        {"id": Decimal("1"), "name": "Tomato", "category_id": Decimal("1"), "price": Decimal("40"), "cost_price": Decimal("25"), "mrp": Decimal("50"), "unit": "kg", "stock": Decimal("100"), "image": "tomato.jpg"},
        {"id": Decimal("2"), "name": "Onion", "category_id": Decimal("1"), "price": Decimal("30"), "cost_price": Decimal("15"), "mrp": Decimal("45"), "unit": "kg", "stock": Decimal("150"), "image": "onion.jpg"},
        {"id": Decimal("3"), "name": "Potato", "category_id": Decimal("1"), "price": Decimal("25"), "cost_price": Decimal("12"), "mrp": Decimal("35"), "unit": "kg", "stock": Decimal("200"), "image": "potato.jpg"},
        {"id": Decimal("4"), "name": "Carrot", "category_id": Decimal("1"), "price": Decimal("50"), "cost_price": Decimal("30"), "mrp": Decimal("60"), "unit": "kg", "stock": Decimal("80"), "image": "carrot.jpg"},
        {"id": Decimal("5"), "name": "Cucumber", "category_id": Decimal("1"), "price": Decimal("35"), "cost_price": Decimal("20"), "mrp": Decimal("45"), "unit": "kg", "stock": Decimal("120"), "image": "cucumber.jpg"},
        
        {"id": Decimal("6"), "name": "Apple", "category_id": Decimal("2"), "price": Decimal("100"), "cost_price": Decimal("60"), "mrp": Decimal("120"), "unit": "kg", "stock": Decimal("50"), "image": "apple.jpg"},
        {"id": Decimal("7"), "name": "Banana", "category_id": Decimal("2"), "price": Decimal("60"), "cost_price": Decimal("30"), "mrp": Decimal("80"), "unit": "dozen", "stock": Decimal("100"), "image": "banana.jpg"},
        {"id": Decimal("8"), "name": "Orange", "category_id": Decimal("2"), "price": Decimal("80"), "cost_price": Decimal("45"), "mrp": Decimal("100"), "unit": "kg", "stock": Decimal("70"), "image": "orange.jpg"},
        {"id": Decimal("9"), "name": "Mango", "category_id": Decimal("2"), "price": Decimal("120"), "cost_price": Decimal("70"), "mrp": Decimal("150"), "unit": "kg", "stock": Decimal("40"), "image": "mango.jpg"},
        {"id": Decimal("10"), "name": "Grapes", "category_id": Decimal("2"), "price": Decimal("150"), "cost_price": Decimal("90"), "mrp": Decimal("180"), "unit": "kg", "stock": Decimal("30"), "image": "grapes.jpg"},
        
        {"id": Decimal("11"), "name": "Milk", "category_id": Decimal("3"), "price": Decimal("60"), "cost_price": Decimal("40"), "mrp": Decimal("70"), "unit": "liter", "stock": Decimal("200"), "image": "milk.jpg"},
        {"id": Decimal("12"), "name": "Yogurt", "category_id": Decimal("3"), "price": Decimal("50"), "cost_price": Decimal("30"), "mrp": Decimal("60"), "unit": "500ml", "stock": Decimal("150"), "image": "yogurt.jpg"},
        {"id": Decimal("13"), "name": "Cheese", "category_id": Decimal("3"), "price": Decimal("200"), "cost_price": Decimal("120"), "mrp": Decimal("250"), "unit": "250g", "stock": Decimal("40"), "image": "cheese.jpg"},
        {"id": Decimal("14"), "name": "Butter", "category_id": Decimal("3"), "price": Decimal("350"), "cost_price": Decimal("200"), "mrp": Decimal("400"), "unit": "500g", "stock": Decimal("60"), "image": "butter.jpg"},
        {"id": Decimal("15"), "name": "Paneer", "category_id": Decimal("3"), "price": Decimal("250"), "cost_price": Decimal("150"), "mrp": Decimal("300"), "unit": "500g", "stock": Decimal("80"), "image": "paneer.jpg"},
        
        {"id": Decimal("16"), "name": "Rice", "category_id": Decimal("4"), "price": Decimal("80"), "cost_price": Decimal("50"), "mrp": Decimal("100"), "unit": "kg", "stock": Decimal("300"), "image": "rice.jpg"},
        {"id": Decimal("17"), "name": "Wheat Flour", "category_id": Decimal("4"), "price": Decimal("50"), "cost_price": Decimal("30"), "mrp": Decimal("60"), "unit": "kg", "stock": Decimal("200"), "image": "wheat.jpg"},
        {"id": Decimal("18"), "name": "Dal", "category_id": Decimal("4"), "price": Decimal("120"), "cost_price": Decimal("70"), "mrp": Decimal("150"), "unit": "kg", "stock": Decimal("150"), "image": "dal.jpg"},
        {"id": Decimal("19"), "name": "Sugar", "category_id": Decimal("4"), "price": Decimal("40"), "cost_price": Decimal("25"), "mrp": Decimal("50"), "unit": "kg", "stock": Decimal("250"), "image": "sugar.jpg"},
        {"id": Decimal("20"), "name": "Salt", "category_id": Decimal("4"), "price": Decimal("25"), "cost_price": Decimal("12"), "mrp": Decimal("30"), "unit": "kg", "stock": Decimal("300"), "image": "salt.jpg"},
        
        {"id": Decimal("21"), "name": "Turmeric", "category_id": Decimal("5"), "price": Decimal("200"), "cost_price": Decimal("100"), "mrp": Decimal("250"), "unit": "500g", "stock": Decimal("50"), "image": "turmeric.jpg"},
        {"id": Decimal("22"), "name": "Cumin", "category_id": Decimal("5"), "price": Decimal("150"), "cost_price": Decimal("80"), "mrp": Decimal("200"), "unit": "500g", "stock": Decimal("60"), "image": "cumin.jpg"},
        {"id": Decimal("23"), "name": "Coriander", "category_id": Decimal("5"), "price": Decimal("180"), "cost_price": Decimal("100"), "mrp": Decimal("220"), "unit": "500g", "stock": Decimal("70"), "image": "coriander.jpg"},
        {"id": Decimal("24"), "name": "Red Chilli Powder", "category_id": Decimal("5"), "price": Decimal("250"), "cost_price": Decimal("150"), "mrp": Decimal("300"), "unit": "500g", "stock": Decimal("40"), "image": "chilli.jpg"},
        {"id": Decimal("25"), "name": "Garam Masala", "category_id": Decimal("5"), "price": Decimal("300"), "cost_price": Decimal("180"), "mrp": Decimal("350"), "unit": "500g", "stock": Decimal("35"), "image": "masala.jpg"}
    ]
    
    for product in products:
        try:
            products_table.put_item(Item=product)
            print(f"✓ Created product: {product['name']}")
        except Exception as e:
            print(f"✗ Error creating product {product['name']}: {e}")

if __name__ == "__main__":
    print("=" * 50)
    print("🚀 DYNAMODB SEED SCRIPT")
    print("=" * 50)
    
    try:
        seed_users()
        seed_categories()
        seed_products()
        
        print("\n" + "=" * 50)
        print("✅ SEEDING COMPLETE!")
        print("=" * 50)
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
