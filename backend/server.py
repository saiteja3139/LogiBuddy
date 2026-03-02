from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from decimal import Decimal
from supabase import create_client, Client
from enum import Enum
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# DEVELOPMENT MODE: Using in-memory mock database
# This allows the app to work without Supabase setup
MOCK_DB = {
    'customers': [],
    'transporters': [],
    'trucks': [],
    'orders': [],
    'trips': [],
    'payments': [],
    'payment_allocations': [],
    'drivers': [],
    'documents': []
}

# Mock Supabase client for development
class MockSupabase:
    def table(self, table_name):
        return MockTable(table_name)
    
    class auth:
        @staticmethod
        def sign_in_with_password(credentials):
            raise HTTPException(status_code=501, detail="Auth disabled in demo mode")
        
        @staticmethod
        def sign_out():
            return {"message": "Logged out"}
        
        @staticmethod
        def get_user(token):
            return None
    
    class storage:
        @staticmethod
        def from_(bucket):
            return MockStorage()

class MockStorage:
    def upload(self, path, content, options):
        return {"path": path}
    
    def get_public_url(self, path):
        return f"https://mock-storage.com/{path}"

class MockTable:
    def __init__(self, table_name):
        self.table_name = table_name
        self.query = {}
        self.in_queries = {}
        
    def select(self, columns="*"):
        self.columns = columns
        return self
    
    def insert(self, data):
        if not isinstance(data, list):
            data = [data]
        for item in data:
            if 'id' not in item:
                item['id'] = str(uuid.uuid4())
            if 'created_at' not in item:
                item['created_at'] = datetime.now().isoformat()
            if 'updated_at' not in item:
                item['updated_at'] = datetime.now().isoformat()
            MOCK_DB[self.table_name].append(item)
        return self
    
    def update(self, data):
        self.update_data = data
        return self
    
    def delete(self):
        return self
    
    def eq(self, field, value):
        self.query[field] = value
        return self
    
    def in_(self, field, values):
        self.in_queries[field] = values
        return self
    
    def or_(self, condition):
        return self
    
    def order(self, field, desc=False):
        return self
    
    def limit(self, n):
        return self
    
    def execute(self):
        data = MOCK_DB[self.table_name].copy()
        
        # Apply filters
        for field, value in self.query.items():
            data = [item for item in data if item.get(field) == value]
        
        # Apply in_ filters
        for field, values in self.in_queries.items():
            data = [item for item in data if item.get(field) in values]
        
        # Apply updates
        if hasattr(self, 'update_data'):
            for item in data:
                item.update(self.update_data)
                item['updated_at'] = datetime.now().isoformat()
        
        class Response:
            pass
        response = Response()
        response.data = data
        return response

supabase = MockSupabase()

# Add seed data for demo
MOCK_DB['customers'] = [
    {
        'id': '1', 'name': 'ABC Logistics Pvt Ltd', 'phone': '9876543210',
        'email': 'abc@logistics.com', 'gstin': '27AABCU9603R1ZM',
        'payment_terms_days': 30, 'address': 'Mumbai, Maharashtra',
        'notes': None, 'is_deleted': False,
        'created_at': '2025-01-01T00:00:00', 'updated_at': '2025-01-01T00:00:00'
    },
    {
        'id': '2', 'name': 'XYZ Industries', 'phone': '9876543211',
        'email': 'xyz@industries.com', 'gstin': '29AABCU9603R1ZN',
        'payment_terms_days': 15, 'address': 'Bangalore, Karnataka',
        'notes': None, 'is_deleted': False,
        'created_at': '2025-01-01T00:00:00', 'updated_at': '2025-01-01T00:00:00'
    },
]

MOCK_DB['transporters'] = [
    {
        'id': '1', 'name': 'Sharma Transports', 'phone': '9988776655',
        'gstin': '27AAAFS1234F1Z5', 'pan': 'AAAFS1234F',
        'bank_account_name': 'Rajesh Sharma', 'bank_account_number': '123456789012',
        'ifsc': 'SBIN0001234', 'bank_name': 'State Bank of India',
        'address': 'Delhi', 'is_deleted': False,
        'kyc_pan_url': None, 'kyc_aadhaar_url': None, 'kyc_rc_url': None,
        'kyc_insurance_url': None, 'kyc_permit_url': None,
        'created_at': '2025-01-01T00:00:00', 'updated_at': '2025-01-01T00:00:00'
    },
]

MOCK_DB['trucks'] = [
    {
        'id': '1', 'transporter_id': '1', 'truck_number': 'MH02AB1234',
        'truck_type': 'Closed Container', 'capacity_mt': 20.0,
        'rc_expiry_date': '2026-12-31', 'insurance_expiry_date': '2026-06-30',
        'is_deleted': False,
        'created_at': '2025-01-01T00:00:00', 'updated_at': '2025-01-01T00:00:00'
    },
]

MOCK_DB['orders'] = [
    {
        'id': '1', 'order_number': 'ORD-2025-001', 'customer_id': '1',
        'origin': 'Mumbai', 'destination': 'Pune', 'material': 'Steel Coils',
        'total_qty_mt': 100.0, 'rate_type': 'PER_MT', 'customer_rate_value': 5000.0,
        'order_date': '2025-01-15', 'expected_end_date': None, 'status': 'ACTIVE',
        'is_deleted': False,
        'created_at': '2025-01-15T00:00:00', 'updated_at': '2025-01-15T00:00:00'
    },
]

MOCK_DB['trips'] = [
    {
        'id': '1', 'trip_number': 'TRP-2025-001', 'order_id': '1',
        'transporter_id': '1', 'truck_id': '1',
        'trip_date': '2025-01-16', 'delivered_date': '2025-01-17',
        'qty_mt': 20.0, 'payable_amount': 85000.0, 'customer_bill_amount': 100000.0,
        'status': 'DELIVERED', 'lr_copy_url': None, 'pod_url': None,
        'is_deleted': False,
        'created_at': '2025-01-16T00:00:00', 'updated_at': '2025-01-17T00:00:00'
    },
]

MOCK_DB['payments'] = [
    {
        'id': '1', 'payment_direction': 'RECEIVED', 'party_type': 'CUSTOMER',
        'party_id': '1', 'amount': 100000.0, 'payment_date': '2025-01-25',
        'mode': 'NEFT', 'reference': 'UTR123456789', 'notes': None,
        'is_deleted': False,
        'created_at': '2025-01-25T00:00:00', 'updated_at': '2025-01-25T00:00:00'
    },
]

MOCK_DB['payment_allocations'] = [
    {
        'id': '1', 'payment_id': '1', 'allocate_to_type': 'TRIP',
        'allocate_to_id': '1', 'allocated_amount': 100000.0,
        'created_at': '2025-01-25T00:00:00', 'updated_at': '2025-01-25T00:00:00'
    },
]

# Add seed data for drivers
MOCK_DB['drivers'] = [
    {
        'id': '1', 'transporter_id': '1', 'name': 'Rajesh Kumar', 'phone': '9876543220',
        'license_number': 'DL1420110012345', 'license_expiry_date': '2026-12-31',
        'address': 'Delhi', 'notes': 'Experienced driver', 'is_deleted': False,
        'created_at': '2025-01-01T00:00:00', 'updated_at': '2025-01-01T00:00:00'
    },
    {
        'id': '2', 'transporter_id': '1', 'name': 'Amit Singh', 'phone': '9876543221',
        'license_number': 'MH0220110054321', 'license_expiry_date': '2025-06-30',
        'address': 'Mumbai', 'notes': None, 'is_deleted': False,
        'created_at': '2025-01-01T00:00:00', 'updated_at': '2025-01-01T00:00:00'
    },
]

# Add seed data for documents
MOCK_DB['documents'] = [
    {
        'id': '1', 'doc_type': 'KYC', 'entity_type': 'TRANSPORTER', 'entity_id': '1',
        'title': 'PAN Card', 'file_name': 'pan_card.pdf', 
        'file_path': 'kyc_docs/transporter/1/pan_card.pdf',
        'file_url': 'https://mock-storage.com/pan_card.pdf',
        'mime_type': 'application/pdf', 'file_size': 102400,
        'issue_date': '2020-01-15', 'expiry_date': None, 'notes': None,
        'uploaded_by': 'demo-user', 'is_deleted': False,
        'created_at': '2025-01-01T00:00:00', 'updated_at': '2025-01-01T00:00:00'
    },
    {
        'id': '2', 'doc_type': 'VEHICLE', 'entity_type': 'TRUCK', 'entity_id': '1',
        'title': 'RC Book', 'file_name': 'rc_book.pdf',
        'file_path': 'vehicle_docs/truck/1/rc_book.pdf',
        'file_url': 'https://mock-storage.com/rc_book.pdf',
        'mime_type': 'application/pdf', 'file_size': 204800,
        'issue_date': '2020-03-20', 'expiry_date': '2026-12-31', 'notes': 'Valid RC',
        'uploaded_by': 'demo-user', 'is_deleted': False,
        'created_at': '2025-01-01T00:00:00', 'updated_at': '2025-01-01T00:00:00'
    },
    {
        'id': '3', 'doc_type': 'DRIVER', 'entity_type': 'DRIVER', 'entity_id': '1',
        'title': 'Driving License', 'file_name': 'dl_front.jpg',
        'file_path': 'driver_docs/driver/1/dl_front.jpg',
        'file_url': 'https://mock-storage.com/dl_front.jpg',
        'mime_type': 'image/jpeg', 'file_size': 512000,
        'issue_date': '2021-01-10', 'expiry_date': '2026-12-31', 'notes': 'Heavy vehicle license',
        'uploaded_by': 'demo-user', 'is_deleted': False,
        'created_at': '2025-01-01T00:00:00', 'updated_at': '2025-01-01T00:00:00'
    },
    {
        'id': '4', 'doc_type': 'TRIP', 'entity_type': 'TRIP', 'entity_id': '1',
        'title': 'POD Image', 'file_name': 'pod_delivered.jpg',
        'file_path': 'trip_docs/trip/1/pod_delivered.jpg',
        'file_url': 'https://mock-storage.com/pod_delivered.jpg',
        'mime_type': 'image/jpeg', 'file_size': 768000,
        'issue_date': '2025-01-17', 'expiry_date': None, 'notes': 'Delivery proof',
        'uploaded_by': 'demo-user', 'is_deleted': False,
        'created_at': '2025-01-17T00:00:00', 'updated_at': '2025-01-17T00:00:00'
    },
]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer()

# Enums
class UserRole(str, Enum):
    ADMIN = "ADMIN"
    STAFF = "STAFF"

class OrderStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CLOSED = "CLOSED"

class TripStatus(str, Enum):
    PLANNED = "PLANNED"
    IN_TRANSIT = "IN_TRANSIT"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"

class RateType(str, Enum):
    PER_MT = "PER_MT"
    PER_TRIP = "PER_TRIP"
    LUMPSUM = "LUMPSUM"

class PaymentDirection(str, Enum):
    RECEIVED = "RECEIVED"
    PAID = "PAID"

class PartyType(str, Enum):
    CUSTOMER = "CUSTOMER"
    TRANSPORTER = "TRANSPORTER"

class PaymentMode(str, Enum):
    UPI = "UPI"
    NEFT = "NEFT"
    RTGS = "RTGS"
    CASH = "CASH"
    CHEQUE = "CHEQUE"

class AllocateToType(str, Enum):
    TRIP = "TRIP"
    ORDER = "ORDER"

class DocType(str, Enum):
    KYC = "KYC"
    VEHICLE = "VEHICLE"
    DRIVER = "DRIVER"
    TRIP = "TRIP"

class EntityType(str, Enum):
    TRANSPORTER = "TRANSPORTER"
    TRUCK = "TRUCK"
    DRIVER = "DRIVER"
    TRIP = "TRIP"

# Auth Models
class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    user: Dict[str, Any]
    role: Optional[UserRole]

# Customer Models
class CustomerCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    gstin: Optional[str] = None
    payment_terms_days: int = 0
    notes: Optional[str] = None

class CustomerResponse(BaseModel):
    id: str
    name: str
    phone: str
    email: Optional[str]
    address: Optional[str]
    gstin: Optional[str]
    payment_terms_days: int
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

# Transporter Models
class TransporterCreate(BaseModel):
    name: str
    phone: str
    address: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None
    bank_account_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    ifsc: Optional[str] = None
    bank_name: Optional[str] = None

class TransporterResponse(BaseModel):
    id: str
    name: str
    phone: str
    address: Optional[str]
    gstin: Optional[str]
    pan: Optional[str]
    bank_account_name: Optional[str]
    bank_account_number: Optional[str]
    ifsc: Optional[str]
    bank_name: Optional[str]
    kyc_pan_url: Optional[str]
    kyc_aadhaar_url: Optional[str]
    kyc_rc_url: Optional[str]
    kyc_insurance_url: Optional[str]
    kyc_permit_url: Optional[str]
    created_at: datetime
    updated_at: datetime

# Truck Models
class TruckCreate(BaseModel):
    transporter_id: str
    truck_number: str
    truck_type: Optional[str] = None
    capacity_mt: Optional[float] = None
    rc_expiry_date: Optional[date] = None
    insurance_expiry_date: Optional[date] = None

class TruckResponse(BaseModel):
    id: str
    transporter_id: str
    truck_number: str
    truck_type: Optional[str]
    capacity_mt: Optional[float]
    rc_expiry_date: Optional[date]
    insurance_expiry_date: Optional[date]
    created_at: datetime
    updated_at: datetime

# Order Models
class OrderCreate(BaseModel):
    customer_id: str
    origin: Optional[str] = None
    destination: Optional[str] = None
    material: Optional[str] = None
    total_qty_mt: float
    rate_type: RateType
    customer_rate_value: float
    order_date: date
    expected_end_date: Optional[date] = None
    status: OrderStatus = OrderStatus.DRAFT

class OrderResponse(BaseModel):
    id: str
    order_number: str
    customer_id: str
    origin: Optional[str]
    destination: Optional[str]
    material: Optional[str]
    total_qty_mt: float
    rate_type: RateType
    customer_rate_value: float
    order_date: date
    expected_end_date: Optional[date]
    status: OrderStatus
    transported_qty_mt: Optional[float] = 0
    pending_qty_mt: Optional[float] = 0
    created_at: datetime
    updated_at: datetime

# Trip Models
class TripCreate(BaseModel):
    order_id: str
    transporter_id: str
    truck_id: str
    trip_date: date
    delivered_date: Optional[date] = None
    qty_mt: float
    payable_amount: float
    customer_bill_amount: float
    status: TripStatus = TripStatus.PLANNED

class TripResponse(BaseModel):
    id: str
    trip_number: str
    order_id: str
    transporter_id: str
    truck_id: str
    trip_date: date
    delivered_date: Optional[date]
    qty_mt: float
    payable_amount: float
    customer_bill_amount: float
    status: TripStatus
    lr_copy_url: Optional[str]
    pod_url: Optional[str]
    created_at: datetime
    updated_at: datetime

# Payment Models
class PaymentCreate(BaseModel):
    payment_direction: PaymentDirection
    party_type: PartyType
    party_id: str
    amount: float
    payment_date: date
    mode: PaymentMode
    reference: Optional[str] = None
    notes: Optional[str] = None

class PaymentResponse(BaseModel):
    id: str
    payment_direction: PaymentDirection
    party_type: PartyType
    party_id: str
    amount: float
    payment_date: date
    mode: PaymentMode
    reference: Optional[str]
    notes: Optional[str]
    unallocated_amount: Optional[float] = 0
    created_at: datetime
    updated_at: datetime

# Payment Allocation Models
class AllocationCreate(BaseModel):
    allocate_to_type: AllocateToType
    allocate_to_id: str
    allocated_amount: float

class AllocationResponse(BaseModel):
    id: str
    payment_id: str
    allocate_to_type: AllocateToType
    allocate_to_id: str
    allocated_amount: float
    created_at: datetime

# Driver Models
class DriverCreate(BaseModel):
    transporter_id: Optional[str] = None
    name: str
    phone: str
    license_number: Optional[str] = None
    license_expiry_date: Optional[date] = None
    address: Optional[str] = None
    notes: Optional[str] = None

class DriverResponse(BaseModel):
    id: str
    transporter_id: Optional[str]
    name: str
    phone: str
    license_number: Optional[str]
    license_expiry_date: Optional[date]
    address: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

# Document Models
class DocumentCreate(BaseModel):
    doc_type: DocType
    entity_type: EntityType
    entity_id: str
    title: str
    file_name: str
    file_path: str
    file_url: Optional[str] = None
    mime_type: str
    file_size: int
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    notes: Optional[str] = None

class DocumentResponse(BaseModel):
    id: str
    doc_type: DocType
    entity_type: EntityType
    entity_id: str
    title: str
    file_name: str
    file_path: str
    file_url: Optional[str]
    mime_type: str
    file_size: int
    issue_date: Optional[date]
    expiry_date: Optional[date]
    notes: Optional[str]
    uploaded_by: Optional[str]
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

# Dashboard Models
class DashboardStats(BaseModel):
    total_outstanding_receivables: float
    total_outstanding_payables: float
    pending_orders_count: int
    overdue_customers_count: int

# Helper function to verify auth token - BYPASSED FOR DEVELOPMENT
def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    # Return a mock user for development - no authentication required
    class MockUser:
        class User:
            id = "dev-user-123"
            email = "dev@example.com"
        user = User()
    return MockUser()

# Make auth optional for all endpoints
from typing import Optional
async def optional_auth(authorization: Optional[str] = None):
    return {"user_id": "demo-user"}

# Auth endpoints
@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        # Get user role
        user_id = response.user.id
        role_data = supabase.table("user_roles").select("role").eq("user_id", user_id).execute()
        role = role_data.data[0]["role"] if role_data.data else "STAFF"
        
        return LoginResponse(
            access_token=response.session.access_token,
            user=response.user.model_dump(),
            role=role
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@api_router.post("/auth/logout")
async def logout(user = Depends(verify_token)):
    try:
        supabase.auth.sign_out()
        return {"message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/auth/session")
async def get_session(user = Depends(verify_token)):
    return {"user": user.user.model_dump()}

# Customer endpoints
@api_router.get("/customers", response_model=List[CustomerResponse])
async def get_customers(search: Optional[str] = None):
    query = supabase.table("customers").select("*").eq("is_deleted", False).order("created_at", desc=True)
    
    if search:
        query = query.or_(f"name.ilike.%{search}%,phone.ilike.%{search}%")
    
    result = query.execute()
    return result.data

@api_router.post("/customers", response_model=CustomerResponse)
async def create_customer(customer: CustomerCreate):
    result = supabase.table("customers").insert(customer.model_dump()).execute()
    return result.data[0]

@api_router.get("/customers/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: str):
    result = supabase.table("customers").select("*").eq("id", customer_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Customer not found")
    return result.data[0]

@api_router.put("/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(customer_id: str, customer: CustomerCreate):
    result = supabase.table("customers").update(customer.model_dump()).eq("id", customer_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Customer not found")
    return result.data[0]

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str):
    result = supabase.table("customers").update({"is_deleted": True}).eq("id", customer_id).execute()
    return {"message": "Customer deleted successfully"}

@api_router.get("/customers/{customer_id}/detail")
async def get_customer_detail(customer_id: str):
    customer = supabase.table("customers").select("*").eq("id", customer_id).execute()
    if not customer.data:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get orders
    orders = supabase.table("orders").select("*").eq("customer_id", customer_id).eq("is_deleted", False).execute()
    
    # Calculate outstanding and aging
    total_billed = 0
    total_received = 0
    aging_buckets = {"0-7": 0, "8-15": 0, "16-30": 0, "30+": 0}
    
    for order in orders.data:
        # Get delivered trips
        trips = supabase.table("trips").select("*").eq("order_id", order["id"]).eq("status", "DELIVERED").execute()
        for trip in trips.data:
            total_billed += float(trip["customer_bill_amount"])
            
            # Calculate aging
            order_date = datetime.fromisoformat(order["order_date"].replace('Z', '+00:00')).date() if isinstance(order["order_date"], str) else order["order_date"]
            payment_terms_days = customer.data[0]["payment_terms_days"]
            due_date = order_date + timedelta(days=payment_terms_days)
            days_overdue = (datetime.now().date() - due_date).days
            
            # Get allocations for this trip
            allocations = supabase.table("payment_allocations").select("allocated_amount").eq("allocate_to_type", "TRIP").eq("allocate_to_id", trip["id"]).execute()
            trip_received = sum(float(a["allocated_amount"]) for a in allocations.data)
            trip_outstanding = float(trip["customer_bill_amount"]) - trip_received
            
            if days_overdue > 0 and trip_outstanding > 0:
                if days_overdue <= 7:
                    aging_buckets["0-7"] += trip_outstanding
                elif days_overdue <= 15:
                    aging_buckets["8-15"] += trip_outstanding
                elif days_overdue <= 30:
                    aging_buckets["16-30"] += trip_outstanding
                else:
                    aging_buckets["30+"] += trip_outstanding
    
    # Get all received payments
    payments = supabase.table("payments").select("id, amount").eq("party_type", "CUSTOMER").eq("party_id", customer_id).eq("payment_direction", "RECEIVED").execute()
    for payment in payments.data:
        total_received += float(payment["amount"])
    
    outstanding = total_billed - total_received
    
    return {
        "customer": customer.data[0],
        "orders": orders.data,
        "total_billed": total_billed,
        "total_received": total_received,
        "outstanding": outstanding,
        "aging_buckets": aging_buckets
    }

# Transporter endpoints
@api_router.get("/transporters", response_model=List[TransporterResponse])
async def get_transporters(search: Optional[str] = None):
    query = supabase.table("transporters").select("*").eq("is_deleted", False).order("created_at", desc=True)
    
    if search:
        query = query.or_(f"name.ilike.%{search}%,phone.ilike.%{search}%")
    
    result = query.execute()
    return result.data

@api_router.post("/transporters", response_model=TransporterResponse)
async def create_transporter(transporter: TransporterCreate):
    result = supabase.table("transporters").insert(transporter.model_dump()).execute()
    return result.data[0]

@api_router.get("/transporters/{transporter_id}", response_model=TransporterResponse)
async def get_transporter(transporter_id: str):
    result = supabase.table("transporters").select("*").eq("id", transporter_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Transporter not found")
    return result.data[0]

@api_router.put("/transporters/{transporter_id}", response_model=TransporterResponse)
async def update_transporter(transporter_id: str, transporter: TransporterCreate):
    result = supabase.table("transporters").update(transporter.model_dump()).eq("id", transporter_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Transporter not found")
    return result.data[0]

@api_router.delete("/transporters/{transporter_id}")
async def delete_transporter(transporter_id: str):
    result = supabase.table("transporters").update({"is_deleted": True}).eq("id", transporter_id).execute()
    return {"message": "Transporter deleted successfully"}

@api_router.get("/transporters/{transporter_id}/detail")
async def get_transporter_detail(transporter_id: str):
    transporter = supabase.table("transporters").select("*").eq("id", transporter_id).execute()
    if not transporter.data:
        raise HTTPException(status_code=404, detail="Transporter not found")
    
    # Get trucks
    trucks = supabase.table("trucks").select("*").eq("transporter_id", transporter_id).eq("is_deleted", False).execute()
    
    # Get trips
    trips = supabase.table("trips").select("*").eq("transporter_id", transporter_id).eq("is_deleted", False).execute()
    
    # Calculate outstanding
    total_payable = 0
    total_paid = 0
    
    for trip in trips.data:
        if trip["status"] == "DELIVERED":
            total_payable += float(trip["payable_amount"])
    
    # Get all paid payments
    payments = supabase.table("payments").select("id, amount").eq("party_type", "TRANSPORTER").eq("party_id", transporter_id).eq("payment_direction", "PAID").execute()
    for payment in payments.data:
        total_paid += float(payment["amount"])
    
    outstanding = total_payable - total_paid
    
    return {
        "transporter": transporter.data[0],
        "trucks": trucks.data,
        "trips": trips.data,
        "total_payable": total_payable,
        "total_paid": total_paid,
        "outstanding": outstanding
    }

# Truck endpoints
@api_router.get("/trucks", response_model=List[TruckResponse])
async def get_trucks(transporter_id: Optional[str] = None):
    query = supabase.table("trucks").select("*").eq("is_deleted", False).order("created_at", desc=True)
    
    if transporter_id:
        query = query.eq("transporter_id", transporter_id)
    
    result = query.execute()
    return result.data

@api_router.post("/trucks", response_model=TruckResponse)
async def create_truck(truck: TruckCreate):
    result = supabase.table("trucks").insert(truck.model_dump()).execute()
    return result.data[0]

@api_router.get("/trucks/{truck_id}", response_model=TruckResponse)
async def get_truck(truck_id: str):
    result = supabase.table("trucks").select("*").eq("id", truck_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Truck not found")
    return result.data[0]

@api_router.put("/trucks/{truck_id}", response_model=TruckResponse)
async def update_truck(truck_id: str, truck: TruckCreate):
    result = supabase.table("trucks").update(truck.model_dump()).eq("id", truck_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Truck not found")
    return result.data[0]

@api_router.delete("/trucks/{truck_id}")
async def delete_truck(truck_id: str):
    result = supabase.table("trucks").update({"is_deleted": True}).eq("id", truck_id).execute()
    return {"message": "Truck deleted successfully"}

# Order endpoints
def generate_order_number():
    return f"ORD-{datetime.now().year}-{str(uuid.uuid4())[:8].upper()}"

@api_router.get("/orders", response_model=List[OrderResponse])
async def get_orders(customer_id: Optional[str] = None, status: Optional[OrderStatus] = None):
    query = supabase.table("orders").select("*").eq("is_deleted", False).order("created_at", desc=True)
    
    if customer_id:
        query = query.eq("customer_id", customer_id)
    if status:
        query = query.eq("status", status.value)
    
    result = query.execute()
    
    # Calculate transported and pending qty
    for order in result.data:
        trips = supabase.table("trips").select("qty_mt, status").eq("order_id", order["id"]).eq("status", "DELIVERED").execute()
        transported_qty = sum(float(t["qty_mt"]) for t in trips.data)
        order["transported_qty_mt"] = transported_qty
        order["pending_qty_mt"] = float(order["total_qty_mt"]) - transported_qty
    
    return result.data

@api_router.post("/orders", response_model=OrderResponse)
async def create_order(order: OrderCreate):
    order_data = order.model_dump()
    order_data["order_number"] = generate_order_number()
    result = supabase.table("orders").insert(order_data).execute()
    response = result.data[0]
    response["transported_qty_mt"] = 0
    response["pending_qty_mt"] = float(response["total_qty_mt"])
    return response

@api_router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str):
    result = supabase.table("orders").select("*").eq("id", order_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order = result.data[0]
    trips = supabase.table("trips").select("qty_mt").eq("order_id", order_id).eq("status", "DELIVERED").execute()
    transported_qty = sum(float(t["qty_mt"]) for t in trips.data)
    order["transported_qty_mt"] = transported_qty
    order["pending_qty_mt"] = float(order["total_qty_mt"]) - transported_qty
    
    return order

@api_router.put("/orders/{order_id}", response_model=OrderResponse)
async def update_order(order_id: str, order: OrderCreate):
    result = supabase.table("orders").update(order.model_dump()).eq("id", order_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Order not found")
    
    response = result.data[0]
    trips = supabase.table("trips").select("qty_mt").eq("order_id", order_id).eq("status", "DELIVERED").execute()
    transported_qty = sum(float(t["qty_mt"]) for t in trips.data)
    response["transported_qty_mt"] = transported_qty
    response["pending_qty_mt"] = float(response["total_qty_mt"]) - transported_qty
    
    return response

@api_router.delete("/orders/{order_id}")
async def delete_order(order_id: str):
    result = supabase.table("orders").update({"is_deleted": True}).eq("id", order_id).execute()
    return {"message": "Order deleted successfully"}

@api_router.get("/orders/{order_id}/detail")
async def get_order_detail(order_id: str):
    order = supabase.table("orders").select("*").eq("id", order_id).execute()
    if not order.data:
        raise HTTPException(status_code=404, detail="Order not found")
    
    trips = supabase.table("trips").select("*").eq("order_id", order_id).eq("is_deleted", False).execute()
    
    transported_qty = sum(float(t["qty_mt"]) for t in trips.data if t["status"] == "DELIVERED")
    pending_qty = float(order.data[0]["total_qty_mt"]) - transported_qty
    
    return {
        "order": order.data[0],
        "trips": trips.data,
        "transported_qty_mt": transported_qty,
        "pending_qty_mt": pending_qty
    }

# Trip endpoints
def generate_trip_number():
    return f"TRP-{datetime.now().year}-{str(uuid.uuid4())[:8].upper()}"

@api_router.get("/trips", response_model=List[TripResponse])
async def get_trips(order_id: Optional[str] = None, transporter_id: Optional[str] = None, status: Optional[TripStatus] = None):
    query = supabase.table("trips").select("*").eq("is_deleted", False).order("created_at", desc=True)
    
    if order_id:
        query = query.eq("order_id", order_id)
    if transporter_id:
        query = query.eq("transporter_id", transporter_id)
    if status:
        query = query.eq("status", status.value)
    
    result = query.execute()
    return result.data

@api_router.post("/trips", response_model=TripResponse)
async def create_trip(trip: TripCreate):
    trip_data = trip.model_dump()
    trip_data["trip_number"] = generate_trip_number()
    result = supabase.table("trips").insert(trip_data).execute()
    return result.data[0]

@api_router.get("/trips/{trip_id}", response_model=TripResponse)
async def get_trip(trip_id: str):
    result = supabase.table("trips").select("*").eq("id", trip_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Trip not found")
    return result.data[0]

@api_router.put("/trips/{trip_id}", response_model=TripResponse)
async def update_trip(trip_id: str, trip: TripCreate):
    result = supabase.table("trips").update(trip.model_dump()).eq("id", trip_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Trip not found")
    return result.data[0]

@api_router.delete("/trips/{trip_id}")
async def delete_trip(trip_id: str):
    result = supabase.table("trips").update({"is_deleted": True}).eq("id", trip_id).execute()
    return {"message": "Trip deleted successfully"}

# Payment endpoints
@api_router.get("/payments", response_model=List[PaymentResponse])
async def get_payments(party_type: Optional[PartyType] = None, party_id: Optional[str] = None):
    query = supabase.table("payments").select("*").eq("is_deleted", False).order("created_at", desc=True)
    
    if party_type:
        query = query.eq("party_type", party_type.value)
    if party_id:
        query = query.eq("party_id", party_id)
    
    result = query.execute()
    
    # Calculate unallocated amount
    for payment in result.data:
        allocations = supabase.table("payment_allocations").select("allocated_amount").eq("payment_id", payment["id"]).execute()
        allocated_total = sum(float(a["allocated_amount"]) for a in allocations.data)
        payment["unallocated_amount"] = float(payment["amount"]) - allocated_total
    
    return result.data

@api_router.post("/payments", response_model=PaymentResponse)
async def create_payment(payment: PaymentCreate):
    result = supabase.table("payments").insert(payment.model_dump()).execute()
    response = result.data[0]
    response["unallocated_amount"] = float(response["amount"])
    return response

@api_router.get("/payments/{payment_id}", response_model=PaymentResponse)
async def get_payment(payment_id: str):
    result = supabase.table("payments").select("*").eq("id", payment_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    payment = result.data[0]
    allocations = supabase.table("payment_allocations").select("allocated_amount").eq("payment_id", payment_id).execute()
    allocated_total = sum(float(a["allocated_amount"]) for a in allocations.data)
    payment["unallocated_amount"] = float(payment["amount"]) - allocated_total
    
    return payment

@api_router.delete("/payments/{payment_id}")
async def delete_payment(payment_id: str):
    result = supabase.table("payments").update({"is_deleted": True}).eq("id", payment_id).execute()
    return {"message": "Payment deleted successfully"}

# Payment Allocation endpoints
@api_router.get("/payments/{payment_id}/allocations", response_model=List[AllocationResponse])
async def get_payment_allocations(payment_id: str):
    result = supabase.table("payment_allocations").select("*").eq("payment_id", payment_id).execute()
    return result.data

@api_router.post("/payments/{payment_id}/allocations", response_model=AllocationResponse)
async def create_allocation(payment_id: str, allocation: AllocationCreate):
    # Validate payment exists
    payment = supabase.table("payments").select("amount").eq("id", payment_id).execute()
    if not payment.data:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Check total allocated doesn't exceed payment amount
    existing_allocations = supabase.table("payment_allocations").select("allocated_amount").eq("payment_id", payment_id).execute()
    total_allocated = sum(float(a["allocated_amount"]) for a in existing_allocations.data)
    
    if total_allocated + allocation.allocated_amount > float(payment.data[0]["amount"]):
        raise HTTPException(status_code=400, detail="Allocation exceeds payment amount")
    
    allocation_data = allocation.model_dump()
    allocation_data["payment_id"] = payment_id
    result = supabase.table("payment_allocations").insert(allocation_data).execute()
    return result.data[0]

@api_router.delete("/allocations/{allocation_id}")
async def delete_allocation(allocation_id: str):
    result = supabase.table("payment_allocations").delete().eq("id", allocation_id).execute()
    return {"message": "Allocation deleted successfully"}

# Dashboard endpoint
@api_router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard(user = Depends(verify_token)):
    # Calculate outstanding receivables
    all_trips = supabase.table("trips").select("id, customer_bill_amount, status").eq("status", "DELIVERED").execute()
    total_billed = sum(float(t["customer_bill_amount"]) for t in all_trips.data)
    
    all_received_payments = supabase.table("payments").select("amount").eq("payment_direction", "RECEIVED").eq("party_type", "CUSTOMER").execute()
    total_received = sum(float(p["amount"]) for p in all_received_payments.data)
    
    outstanding_receivables = total_billed - total_received
    
    # Calculate outstanding payables
    total_payable = sum(float(t["payable_amount"]) for t in all_trips.data)
    
    all_paid_payments = supabase.table("payments").select("amount").eq("payment_direction", "PAID").eq("party_type", "TRANSPORTER").execute()
    total_paid = sum(float(p["amount"]) for p in all_paid_payments.data)
    
    outstanding_payables = total_payable - total_paid
    
    # Count pending orders
    orders = supabase.table("orders").select("id, total_qty_mt").eq("is_deleted", False).in_("status", ["ACTIVE", "DRAFT"]).execute()
    pending_orders = []
    for order in orders.data:
        trips = supabase.table("trips").select("qty_mt").eq("order_id", order["id"]).eq("status", "DELIVERED").execute()
        transported = sum(float(t["qty_mt"]) for t in trips.data)
        if transported < float(order["total_qty_mt"]):
            pending_orders.append(order["id"])
    
    # Count overdue customers
    customers = supabase.table("customers").select("id, payment_terms_days").eq("is_deleted", False).execute()
    overdue_count = 0
    
    for customer in customers.data:
        customer_orders = supabase.table("orders").select("id, order_date").eq("customer_id", customer["id"]).execute()
        
        for order in customer_orders.data:
            order_date = datetime.fromisoformat(order["order_date"].replace('Z', '+00:00')).date() if isinstance(order["order_date"], str) else order["order_date"]
            due_date = order_date + timedelta(days=customer["payment_terms_days"])
            
            if datetime.now().date() > due_date:
                order_trips = supabase.table("trips").select("id, customer_bill_amount").eq("order_id", order["id"]).eq("status", "DELIVERED").execute()
                
                for trip in order_trips.data:
                    allocations = supabase.table("payment_allocations").select("allocated_amount").eq("allocate_to_type", "TRIP").eq("allocate_to_id", trip["id"]).execute()
                    allocated = sum(float(a["allocated_amount"]) for a in allocations.data)
                    
                    if allocated < float(trip["customer_bill_amount"]):
                        overdue_count += 1
                        break
    
    return DashboardStats(
        total_outstanding_receivables=outstanding_receivables,
        total_outstanding_payables=outstanding_payables,
        pending_orders_count=len(pending_orders),
        overdue_customers_count=overdue_count
    )

# Upload endpoint
@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), folder: str = Form("documents")):
    try:
        file_content = await file.read()
        file_name = f"{folder}/{uuid.uuid4()}_{file.filename}"
        
        result = supabase.storage.from_("documents").upload(file_name, file_content, {"content-type": file.content_type})
        
        public_url = supabase.storage.from_("documents").get_public_url(file_name)
        
        return {"url": public_url, "path": file_name}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Reports endpoints
@api_router.get("/reports/customer-outstanding")
async def get_customer_outstanding_report(user = Depends(verify_token)):
    customers = supabase.table("customers").select("*").eq("is_deleted", False).execute()
    
    report = []
    for customer in customers.data:
        # Calculate total billed
        orders = supabase.table("orders").select("id").eq("customer_id", customer["id"]).execute()
        total_billed = 0
        
        for order in orders.data:
            trips = supabase.table("trips").select("customer_bill_amount").eq("order_id", order["id"]).eq("status", "DELIVERED").execute()
            total_billed += sum(float(t["customer_bill_amount"]) for t in trips.data)
        
        # Calculate total received
        payments = supabase.table("payments").select("amount").eq("party_type", "CUSTOMER").eq("party_id", customer["id"]).eq("payment_direction", "RECEIVED").execute()
        total_received = sum(float(p["amount"]) for p in payments.data)
        
        outstanding = total_billed - total_received
        
        report.append({
            "customer_name": customer["name"],
            "customer_phone": customer["phone"],
            "total_billed": total_billed,
            "total_received": total_received,
            "outstanding": outstanding
        })
    
    return report

@api_router.get("/reports/transporter-outstanding")
async def get_transporter_outstanding_report(user = Depends(verify_token)):
    transporters = supabase.table("transporters").select("*").eq("is_deleted", False).execute()
    
    report = []
    for transporter in transporters.data:
        trips = supabase.table("trips").select("payable_amount").eq("transporter_id", transporter["id"]).eq("status", "DELIVERED").execute()
        total_payable = sum(float(t["payable_amount"]) for t in trips.data)
        
        payments = supabase.table("payments").select("amount").eq("party_type", "TRANSPORTER").eq("party_id", transporter["id"]).eq("payment_direction", "PAID").execute()
        total_paid = sum(float(p["amount"]) for p in payments.data)
        
        outstanding = total_payable - total_paid
        
        report.append({
            "transporter_name": transporter["name"],
            "transporter_phone": transporter["phone"],
            "total_payable": total_payable,
            "total_paid": total_paid,
            "outstanding": outstanding
        })
    
    return report

@api_router.get("/reports/order-summary")
async def get_order_summary_report(user = Depends(verify_token)):
    orders = supabase.table("orders").select("*").eq("is_deleted", False).execute()
    
    report = []
    for order in orders.data:
        trips = supabase.table("trips").select("*").eq("order_id", order["id"]).execute()
        
        total_billed = sum(float(t["customer_bill_amount"]) for t in trips.data if t["status"] == "DELIVERED")
        total_payable = sum(float(t["payable_amount"]) for t in trips.data if t["status"] == "DELIVERED")
        transported_qty = sum(float(t["qty_mt"]) for t in trips.data if t["status"] == "DELIVERED")
        
        margin = total_billed - total_payable
        pending_qty = float(order["total_qty_mt"]) - transported_qty
        
        report.append({
            "order_number": order["order_number"],
            "customer_id": order["customer_id"],
            "origin": order["origin"],
            "destination": order["destination"],
            "total_qty_mt": float(order["total_qty_mt"]),
            "transported_qty_mt": transported_qty,
            "pending_qty_mt": pending_qty,
            "total_billed": total_billed,
            "total_payable": total_payable,
            "margin": margin,
            "status": order["status"]
        })
    
    return report

# Driver endpoints
@api_router.get("/drivers", response_model=List[DriverResponse])
async def get_drivers(transporter_id: Optional[str] = None, search: Optional[str] = None):
    query = supabase.table("drivers").select("*").eq("is_deleted", False).order("created_at", desc=True)
    
    if transporter_id:
        query = query.eq("transporter_id", transporter_id)
    
    result = query.execute()
    
    if search:
        result.data = [d for d in result.data if search.lower() in d['name'].lower() or search in d['phone']]
    
    return result.data

@api_router.post("/drivers", response_model=DriverResponse)
async def create_driver(driver: DriverCreate):
    result = supabase.table("drivers").insert(driver.model_dump()).execute()
    return result.data[0]

@api_router.get("/drivers/{driver_id}", response_model=DriverResponse)
async def get_driver(driver_id: str):
    result = supabase.table("drivers").select("*").eq("id", driver_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Driver not found")
    return result.data[0]

@api_router.put("/drivers/{driver_id}", response_model=DriverResponse)
async def update_driver(driver_id: str, driver: DriverCreate):
    result = supabase.table("drivers").update(driver.model_dump()).eq("id", driver_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Driver not found")
    return result.data[0]

@api_router.delete("/drivers/{driver_id}")
async def delete_driver(driver_id: str):
    result = supabase.table("drivers").update({"is_deleted": True}).eq("id", driver_id).execute()
    return {"message": "Driver deleted successfully"}

@api_router.get("/drivers/{driver_id}/detail")
async def get_driver_detail(driver_id: str):
    driver = supabase.table("drivers").select("*").eq("id", driver_id).execute()
    if not driver.data:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    # Get documents
    documents = supabase.table("documents").select("*").eq("entity_type", "DRIVER").eq("entity_id", driver_id).eq("is_deleted", False).execute()
    
    # Get trips (if trips have driver_id - would need schema update for this)
    # For now, return empty trips list
    trips = []
    
    return {
        "driver": driver.data[0],
        "documents": documents.data,
        "trips": trips
    }

# Document endpoints
@api_router.get("/documents", response_model=List[DocumentResponse])
async def get_documents(
    entity_type: Optional[EntityType] = None,
    entity_id: Optional[str] = None,
    doc_type: Optional[DocType] = None
):
    query = supabase.table("documents").select("*").eq("is_deleted", False).order("created_at", desc=True)
    
    if entity_type:
        query = query.eq("entity_type", entity_type.value)
    if entity_id:
        query = query.eq("entity_id", entity_id)
    if doc_type:
        query = query.eq("doc_type", doc_type.value)
    
    result = query.execute()
    return result.data

@api_router.post("/documents", response_model=DocumentResponse)
async def create_document(document: DocumentCreate):
    doc_data = document.model_dump()
    doc_data['uploaded_by'] = 'demo-user'  # In real app, get from auth
    result = supabase.table("documents").insert(doc_data).execute()
    return result.data[0]

@api_router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: str):
    result = supabase.table("documents").select("*").eq("id", document_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Document not found")
    return result.data[0]

@api_router.put("/documents/{document_id}", response_model=DocumentResponse)
async def update_document(document_id: str, document: DocumentCreate):
    result = supabase.table("documents").update(document.model_dump()).eq("id", document_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Document not found")
    return result.data[0]

@api_router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    result = supabase.table("documents").update({"is_deleted": True}).eq("id", document_id).execute()
    return {"message": "Document deleted successfully"}

# Document upload endpoint
@api_router.post("/upload/document")
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form(...),
    entity_type: str = Form(...),
    entity_id: str = Form(...),
    title: str = Form(...),
    issue_date: Optional[str] = Form(None),
    expiry_date: Optional[str] = Form(None),
    notes: Optional[str] = Form(None)
):
    try:
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail=f"File type {file.content_type} not allowed")
        
        # Validate file size (10MB max)
        file_content = await file.read()
        file_size = len(file_content)
        if file_size > 10 * 1024 * 1024:  # 10MB
            raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
        
        # Determine bucket based on doc_type
        bucket_map = {
            'KYC': 'kyc_docs',
            'VEHICLE': 'vehicle_docs',
            'DRIVER': 'driver_docs',
            'TRIP': 'trip_docs'
        }
        bucket = bucket_map.get(doc_type, 'documents')
        
        # Create folder path based on entity
        folder_map = {
            'TRANSPORTER': 'transporter',
            'TRUCK': 'truck',
            'DRIVER': 'driver',
            'TRIP': 'trip'
        }
        folder = folder_map.get(entity_type, 'other')
        
        # Create file path
        file_extension = file.filename.split('.')[-1]
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = f"{bucket}/{folder}/{entity_id}/{unique_filename}"
        
        # Upload to storage
        storage_result = supabase.storage.from_(bucket).upload(file_path, file_content, {"content-type": file.content_type})
        
        # Get public/signed URL
        file_url = supabase.storage.from_(bucket).get_public_url(file_path)
        
        # Create document record
        doc_data = {
            'doc_type': doc_type,
            'entity_type': entity_type,
            'entity_id': entity_id,
            'title': title,
            'file_name': file.filename,
            'file_path': file_path,
            'file_url': file_url,
            'mime_type': file.content_type,
            'file_size': file_size,
            'issue_date': issue_date,
            'expiry_date': expiry_date,
            'notes': notes,
            'uploaded_by': 'demo-user'
        }
        
        result = supabase.table("documents").insert(doc_data).execute()
        
        return {
            "message": "Document uploaded successfully",
            "document": result.data[0]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# Get signed URL for document
@api_router.get("/documents/{document_id}/signed-url")
async def get_document_signed_url(document_id: str):
    try:
        # Get document from DB
        result = supabase.table("documents").select("*").eq("id", document_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Document not found")
        
        document = result.data[0]
        
        # Determine bucket from doc_type
        bucket_map = {
            'KYC': 'kyc_docs',
            'VEHICLE': 'vehicle_docs',
            'DRIVER': 'driver_docs',
            'TRIP': 'trip_docs'
        }
        bucket = bucket_map.get(document['doc_type'], 'documents')
        
        # Generate signed URL (valid for 1 hour)
        signed_url = supabase.storage.from_(bucket).create_signed_url(document['file_path'], 3600)
        
        return {
            "signed_url": signed_url,
            "file_name": document['file_name'],
            "mime_type": document['mime_type']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate signed URL: {str(e)}")

# Get expiring documents
@api_router.get("/documents/expiring/soon")
async def get_expiring_documents(days: int = 30):
    today = datetime.now().date()
    future_date = today + timedelta(days=days)
    
    all_docs = supabase.table("documents").select("*").eq("is_deleted", False).execute()
    
    expiring = []
    expired = []
    
    for doc in all_docs.data:
        if doc.get('expiry_date'):
            expiry = datetime.fromisoformat(str(doc['expiry_date'])).date() if isinstance(doc['expiry_date'], str) else doc['expiry_date']
            
            if expiry < today:
                expired.append(doc)
            elif expiry <= future_date:
                expiring.append(doc)
    
    return {
        "expiring_soon": expiring,
        "expired": expired,
        "total_expiring": len(expiring),
        "total_expired": len(expired)
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
