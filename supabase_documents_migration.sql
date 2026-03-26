-- Document Management System Migration for FreightFlow
-- Run this in Supabase SQL Editor after running the main schema

-- Create enums for document management
CREATE TYPE doc_type AS ENUM ('KYC', 'VEHICLE', 'DRIVER', 'TRIP');
CREATE TYPE entity_type AS ENUM ('TRANSPORTER', 'TRUCK', 'DRIVER', 'TRIP');

-- Create drivers table
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transporter_id UUID REFERENCES transporters(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    license_number VARCHAR(50),
    license_expiry_date DATE,
    address TEXT,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_drivers_transporter ON drivers(transporter_id);
CREATE INDEX idx_drivers_phone ON drivers(phone);
CREATE INDEX idx_drivers_deleted ON drivers(is_deleted);
CREATE INDEX idx_drivers_license_expiry ON drivers(license_expiry_date);

-- Create documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doc_type doc_type NOT NULL,
    entity_type entity_type NOT NULL,
    entity_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT,
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    issue_date DATE,
    expiry_date DATE,
    notes TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX idx_documents_doc_type ON documents(doc_type);
CREATE INDEX idx_documents_expiry ON documents(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_documents_deleted ON documents(is_deleted);

-- Add updated_at trigger
CREATE TRIGGER update_drivers_updated_at 
    BEFORE UPDATE ON drivers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for drivers
CREATE POLICY "Allow all for authenticated users" ON drivers 
    FOR ALL 
    USING (auth.role() = 'authenticated');

-- RLS Policies for documents
CREATE POLICY "Allow read for authenticated users" ON documents 
    FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for authenticated users" ON documents 
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" ON documents 
    FOR UPDATE 
    USING (auth.role() = 'authenticated');

-- Only allow soft delete (set is_deleted = true)
CREATE POLICY "Allow delete for admins" ON documents 
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'ADMIN'
        )
    );

-- Create storage buckets (run these commands in Supabase Dashboard -> Storage)
-- Note: Execute these manually in Supabase Storage UI or via SQL:

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('kyc_docs', 'kyc_docs', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
    ('vehicle_docs', 'vehicle_docs', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
    ('driver_docs', 'driver_docs', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
    ('trip_docs', 'trip_docs', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for kyc_docs bucket
CREATE POLICY "Authenticated users can upload to kyc_docs" 
    ON storage.objects FOR INSERT 
    TO authenticated 
    WITH CHECK (bucket_id = 'kyc_docs');

CREATE POLICY "Authenticated users can read kyc_docs" 
    ON storage.objects FOR SELECT 
    TO authenticated 
    USING (bucket_id = 'kyc_docs');

CREATE POLICY "Authenticated users can update kyc_docs" 
    ON storage.objects FOR UPDATE 
    TO authenticated 
    USING (bucket_id = 'kyc_docs');

CREATE POLICY "Authenticated users can delete kyc_docs" 
    ON storage.objects FOR DELETE 
    TO authenticated 
    USING (bucket_id = 'kyc_docs');

-- Storage policies for vehicle_docs bucket
CREATE POLICY "Authenticated users can upload to vehicle_docs" 
    ON storage.objects FOR INSERT 
    TO authenticated 
    WITH CHECK (bucket_id = 'vehicle_docs');

CREATE POLICY "Authenticated users can read vehicle_docs" 
    ON storage.objects FOR SELECT 
    TO authenticated 
    USING (bucket_id = 'vehicle_docs');

CREATE POLICY "Authenticated users can update vehicle_docs" 
    ON storage.objects FOR UPDATE 
    TO authenticated 
    USING (bucket_id = 'vehicle_docs');

CREATE POLICY "Authenticated users can delete vehicle_docs" 
    ON storage.objects FOR DELETE 
    TO authenticated 
    USING (bucket_id = 'vehicle_docs');

-- Storage policies for driver_docs bucket
CREATE POLICY "Authenticated users can upload to driver_docs" 
    ON storage.objects FOR INSERT 
    TO authenticated 
    WITH CHECK (bucket_id = 'driver_docs');

CREATE POLICY "Authenticated users can read driver_docs" 
    ON storage.objects FOR SELECT 
    TO authenticated 
    USING (bucket_id = 'driver_docs');

CREATE POLICY "Authenticated users can update driver_docs" 
    ON storage.objects FOR UPDATE 
    TO authenticated 
    USING (bucket_id = 'driver_docs');

CREATE POLICY "Authenticated users can delete driver_docs" 
    ON storage.objects FOR DELETE 
    TO authenticated 
    USING (bucket_id = 'driver_docs');

-- Storage policies for trip_docs bucket
CREATE POLICY "Authenticated users can upload to trip_docs" 
    ON storage.objects FOR INSERT 
    TO authenticated 
    WITH CHECK (bucket_id = 'trip_docs');

CREATE POLICY "Authenticated users can read trip_docs" 
    ON storage.objects FOR SELECT 
    TO authenticated 
    USING (bucket_id = 'trip_docs');

CREATE POLICY "Authenticated users can update trip_docs" 
    ON storage.objects FOR UPDATE 
    TO authenticated 
    USING (bucket_id = 'trip_docs');

CREATE POLICY "Authenticated users can delete trip_docs" 
    ON storage.objects FOR DELETE 
    TO authenticated 
    USING (bucket_id = 'trip_docs');

-- Sample drivers data
INSERT INTO drivers (name, phone, transporter_id, license_number, license_expiry_date)
VALUES 
    ('Rajesh Kumar', '9876543220', (SELECT id FROM transporters LIMIT 1), 'DL1420110012345', '2026-12-31'),
    ('Amit Singh', '9876543221', (SELECT id FROM transporters LIMIT 1), 'MH0220110054321', '2025-06-30');

-- Sample document entries (without actual files for demo)
INSERT INTO documents (doc_type, entity_type, entity_id, title, file_name, file_path, mime_type, file_size, expiry_date)
VALUES 
    ('KYC', 'TRANSPORTER', (SELECT id FROM transporters LIMIT 1), 'PAN Card', 'pan_card.pdf', 'kyc_docs/transporter/xxx/pan_card.pdf', 'application/pdf', 102400, NULL),
    ('VEHICLE', 'TRUCK', (SELECT id FROM trucks LIMIT 1), 'RC Book', 'rc_book.pdf', 'vehicle_docs/truck/xxx/rc_book.pdf', 'application/pdf', 204800, '2026-12-31'),
    ('DRIVER', 'DRIVER', (SELECT id FROM drivers LIMIT 1), 'Driving License', 'dl_front.jpg', 'driver_docs/driver/xxx/dl_front.jpg', 'image/jpeg', 512000, '2026-12-31');

COMMENT ON TABLE documents IS 'Universal document storage tracker for all entities';
COMMENT ON TABLE drivers IS 'Driver master data linked to transporters';
