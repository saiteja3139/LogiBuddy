-- Logistics Broker Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('ADMIN', 'STAFF');
CREATE TYPE order_status AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CLOSED');
CREATE TYPE trip_status AS ENUM ('PLANNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');
CREATE TYPE rate_type AS ENUM ('PER_MT', 'PER_TRIP', 'LUMPSUM');
CREATE TYPE payment_direction AS ENUM ('RECEIVED', 'PAID');
CREATE TYPE party_type AS ENUM ('CUSTOMER', 'TRANSPORTER');
CREATE TYPE payment_mode AS ENUM ('UPI', 'NEFT', 'RTGS', 'CASH', 'CHEQUE');
CREATE TYPE allocate_to_type AS ENUM ('TRIP', 'ORDER');

-- User Roles table (extends Supabase auth.users)
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'STAFF',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    gstin VARCHAR(15),
    payment_terms_days INTEGER DEFAULT 0,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_deleted ON customers(is_deleted);

-- Transporters table
CREATE TABLE transporters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    gstin VARCHAR(15),
    pan VARCHAR(10),
    bank_account_name VARCHAR(255),
    bank_account_number VARCHAR(50),
    ifsc VARCHAR(11),
    bank_name VARCHAR(255),
    kyc_pan_url TEXT,
    kyc_aadhaar_url TEXT,
    kyc_rc_url TEXT,
    kyc_insurance_url TEXT,
    kyc_permit_url TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transporters_phone ON transporters(phone);
CREATE INDEX idx_transporters_name ON transporters(name);
CREATE INDEX idx_transporters_deleted ON transporters(is_deleted);

-- Trucks table
CREATE TABLE trucks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transporter_id UUID NOT NULL REFERENCES transporters(id) ON DELETE CASCADE,
    truck_number VARCHAR(20) NOT NULL UNIQUE,
    truck_type VARCHAR(50),
    capacity_mt DECIMAL(10, 2),
    rc_expiry_date DATE,
    insurance_expiry_date DATE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_trucks_transporter ON trucks(transporter_id);
CREATE INDEX idx_trucks_number ON trucks(truck_number);
CREATE INDEX idx_trucks_deleted ON trucks(is_deleted);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    origin VARCHAR(255),
    destination VARCHAR(255),
    material VARCHAR(255),
    total_qty_mt DECIMAL(10, 2) NOT NULL,
    rate_type rate_type NOT NULL,
    customer_rate_value DECIMAL(10, 2) NOT NULL,
    order_date DATE NOT NULL,
    expected_end_date DATE,
    status order_status DEFAULT 'DRAFT',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_deleted ON orders(is_deleted);

-- Trips table
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_number VARCHAR(50) NOT NULL UNIQUE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    transporter_id UUID NOT NULL REFERENCES transporters(id) ON DELETE RESTRICT,
    truck_id UUID NOT NULL REFERENCES trucks(id) ON DELETE RESTRICT,
    trip_date DATE NOT NULL,
    delivered_date DATE,
    qty_mt DECIMAL(10, 2) NOT NULL,
    payable_amount DECIMAL(10, 2) NOT NULL,
    customer_bill_amount DECIMAL(10, 2) NOT NULL,
    status trip_status DEFAULT 'PLANNED',
    lr_copy_url TEXT,
    pod_url TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_trips_order ON trips(order_id);
CREATE INDEX idx_trips_transporter ON trips(transporter_id);
CREATE INDEX idx_trips_truck ON trips(truck_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_number ON trips(trip_number);
CREATE INDEX idx_trips_deleted ON trips(is_deleted);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_direction payment_direction NOT NULL,
    party_type party_type NOT NULL,
    party_id UUID NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATE NOT NULL,
    mode payment_mode NOT NULL,
    reference VARCHAR(255),
    notes TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_party ON payments(party_type, party_id);
CREATE INDEX idx_payments_direction ON payments(payment_direction);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_deleted ON payments(is_deleted);

-- Payment Allocations table
CREATE TABLE payment_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    allocate_to_type allocate_to_type NOT NULL,
    allocate_to_id UUID NOT NULL,
    allocated_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_allocations_payment ON payment_allocations(payment_id);
CREATE INDEX idx_allocations_target ON payment_allocations(allocate_to_type, allocate_to_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transporters_updated_at BEFORE UPDATE ON transporters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trucks_updated_at BEFORE UPDATE ON trucks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transporters ENABLE ROW LEVEL SECURITY;
ALTER TABLE trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users (Admin and Staff)
CREATE POLICY "Allow read for authenticated users" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow all for authenticated users" ON customers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON transporters FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON trucks FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON trips FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON payments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON payment_allocations FOR ALL USING (auth.role() = 'authenticated');

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage policies for documents bucket
CREATE POLICY "Authenticated users can upload documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Authenticated users can read documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents');
CREATE POLICY "Authenticated users can update documents" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'documents');
CREATE POLICY "Authenticated users can delete documents" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documents');

-- Seed data for demo
-- Insert a demo admin user role (replace with your actual user ID after signup)
-- You'll need to sign up first, then get the user ID from auth.users table
-- Example: INSERT INTO user_roles (user_id, role) VALUES ('YOUR_USER_ID_HERE', 'ADMIN');

-- Sample customers
INSERT INTO customers (name, phone, email, gstin, payment_terms_days, address)
VALUES 
    ('ABC Logistics Pvt Ltd', '9876543210', 'abc@logistics.com', '27AABCU9603R1ZM', 30, 'Mumbai, Maharashtra'),
    ('XYZ Industries', '9876543211', 'xyz@industries.com', '29AABCU9603R1ZN', 15, 'Bangalore, Karnataka'),
    ('Quick Transport Co', '9876543212', 'quick@transport.com', NULL, 7, 'Delhi');

-- Sample transporters
INSERT INTO transporters (name, phone, gstin, pan, bank_account_name, bank_account_number, ifsc, bank_name)
VALUES 
    ('Sharma Transports', '9988776655', '27AAAFS1234F1Z5', 'AAAFS1234F', 'Rajesh Sharma', '123456789012', 'SBIN0001234', 'State Bank of India'),
    ('Kumar Logistics', '9988776656', '29BBBFS5678F1Z6', 'BBBFS5678F', 'Vijay Kumar', '234567890123', 'HDFC0001235', 'HDFC Bank'),
    ('Singh Roadways', '9988776657', NULL, 'CCCFS9012F', 'Harpreet Singh', '345678901234', 'ICIC0001236', 'ICICI Bank');

-- Sample trucks
INSERT INTO trucks (transporter_id, truck_number, truck_type, capacity_mt)
VALUES 
    ((SELECT id FROM transporters WHERE phone = '9988776655'), 'MH02AB1234', 'Closed Container', 20.00),
    ((SELECT id FROM transporters WHERE phone = '9988776655'), 'MH12CD5678', 'Open', 15.00),
    ((SELECT id FROM transporters WHERE phone = '9988776656'), 'KA03EF9012', 'Closed Container', 25.00),
    ((SELECT id FROM transporters WHERE phone = '9988776657'), 'DL01GH3456', 'Open', 18.00);

-- Sample orders
INSERT INTO orders (order_number, customer_id, origin, destination, material, total_qty_mt, rate_type, customer_rate_value, order_date, status)
VALUES 
    ('ORD-2025-001', (SELECT id FROM customers WHERE phone = '9876543210'), 'Mumbai', 'Pune', 'Steel Coils', 100.00, 'PER_MT', 5000.00, '2025-01-15', 'ACTIVE'),
    ('ORD-2025-002', (SELECT id FROM customers WHERE phone = '9876543211'), 'Bangalore', 'Chennai', 'Electronics', 50.00, 'PER_TRIP', 45000.00, '2025-01-20', 'ACTIVE'),
    ('ORD-2025-003', (SELECT id FROM customers WHERE phone = '9876543212'), 'Delhi', 'Jaipur', 'Textiles', 75.00, 'PER_MT', 3500.00, '2025-01-10', 'COMPLETED');

-- Sample trips
INSERT INTO trips (trip_number, order_id, transporter_id, truck_id, trip_date, delivered_date, qty_mt, payable_amount, customer_bill_amount, status)
VALUES 
    ('TRP-2025-001', 
     (SELECT id FROM orders WHERE order_number = 'ORD-2025-001'),
     (SELECT id FROM transporters WHERE phone = '9988776655'),
     (SELECT id FROM trucks WHERE truck_number = 'MH02AB1234'),
     '2025-01-16', '2025-01-17', 20.00, 85000.00, 100000.00, 'DELIVERED'),
    ('TRP-2025-002', 
     (SELECT id FROM orders WHERE order_number = 'ORD-2025-001'),
     (SELECT id FROM transporters WHERE phone = '9988776656'),
     (SELECT id FROM trucks WHERE truck_number = 'KA03EF9012'),
     '2025-01-18', '2025-01-19', 25.00, 105000.00, 125000.00, 'DELIVERED'),
    ('TRP-2025-003', 
     (SELECT id FROM orders WHERE order_number = 'ORD-2025-002'),
     (SELECT id FROM transporters WHERE phone = '9988776657'),
     (SELECT id FROM trucks WHERE truck_number = 'DL01GH3456'),
     '2025-01-21', NULL, 18.00, 40000.00, 45000.00, 'IN_TRANSIT');

-- Sample payments
INSERT INTO payments (payment_direction, party_type, party_id, amount, payment_date, mode, reference)
VALUES 
    ('RECEIVED', 'CUSTOMER', (SELECT id FROM customers WHERE phone = '9876543210'), 150000.00, '2025-01-25', 'NEFT', 'UTR123456789'),
    ('PAID', 'TRANSPORTER', (SELECT id FROM transporters WHERE phone = '9988776655'), 80000.00, '2025-01-26', 'NEFT', 'UTR987654321');

-- Sample payment allocations
INSERT INTO payment_allocations (payment_id, allocate_to_type, allocate_to_id, allocated_amount)
VALUES 
    ((SELECT id FROM payments WHERE reference = 'UTR123456789'), 'TRIP', (SELECT id FROM trips WHERE trip_number = 'TRP-2025-001'), 100000.00),
    ((SELECT id FROM payments WHERE reference = 'UTR123456789'), 'TRIP', (SELECT id FROM trips WHERE trip_number = 'TRP-2025-002'), 50000.00),
    ((SELECT id FROM payments WHERE reference = 'UTR987654321'), 'TRIP', (SELECT id FROM trips WHERE trip_number = 'TRP-2025-001'), 80000.00);
