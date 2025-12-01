# create_test_supplier.py
from database import SessionLocal, SupplierUser
# import bcrypt

db = SessionLocal()

# Hash password
# password_hash = bcrypt.hashpw("test123".encode(), bcrypt.gensalt()).decode()

user = SupplierUser(
    supplier_id="CANVAS_001",  # Must match existing supplier
    email="igntayyab@gmail.com",
    password_hash='password_hash',
    full_name="Canvas Supplier Representative",
    role="supplier_representative",
    is_active=True,
    is_verified=True
)

db.add(user)
db.commit()
print("✅ Test supplier user created!")