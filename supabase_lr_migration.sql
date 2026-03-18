-- LR Workflow Migration for FreightFlow
-- Run this in Supabase SQL Editor after the previous migrations

-- Add new enum types for LR workflow
CREATE TYPE lr_workflow_step AS ENUM ('LR_CREATION', 'DOCUMENT_VERIFICATION', 'TRIP_ADVANCES', 'POD_UPLOAD', 'COMPLETED');
CREATE TYPE tds_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Add new doc types for LR documents
ALTER TYPE doc_type ADD VALUE 'LR';
ALTER TYPE doc_type ADD VALUE 'INVOICE';
ALTER TYPE doc_type ADD VALUE 'POD';

-- Add new columns to trips table for LR tracking
ALTER TABLE trips ADD COLUMN lr_number VARCHAR(50) UNIQUE;
ALTER TABLE trips ADD COLUMN driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL;

-- LR/Consignment Details
ALTER TABLE trips ADD COLUMN loading_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE trips ADD COLUMN description_of_goods VARCHAR(255);
ALTER TABLE trips ADD COLUMN gross_weight_mt DECIMAL(10, 2);
ALTER TABLE trips ADD COLUMN tare_weight_mt DECIMAL(10, 2);
ALTER TABLE trips ADD COLUMN net_weight_mt DECIMAL(10, 2);

-- Invoice Details
ALTER TABLE trips ADD COLUMN eway_bill VARCHAR(50);
ALTER TABLE trips ADD COLUMN seal_number VARCHAR(50);
ALTER TABLE trips ADD COLUMN invoice_number VARCHAR(50);

-- Basic Details
ALTER TABLE trips ADD COLUMN dc_oa VARCHAR(50);
ALTER TABLE trips ADD COLUMN gp_do VARCHAR(50);
ALTER TABLE trips ADD COLUMN consignor_name VARCHAR(255);
ALTER TABLE trips ADD COLUMN consignor_address TEXT;
ALTER TABLE trips ADD COLUMN consignee_name VARCHAR(255);
ALTER TABLE trips ADD COLUMN consignee_address TEXT;

-- Billing Entity
ALTER TABLE trips ADD COLUMN billing_pan VARCHAR(10);
ALTER TABLE trips ADD COLUMN billing_name VARCHAR(255);
ALTER TABLE trips ADD COLUMN tds_category VARCHAR(50);
ALTER TABLE trips ADD COLUMN tds_status tds_status DEFAULT 'PENDING';

-- Vendor Bill (Simplified)
ALTER TABLE trips ADD COLUMN base_freight DECIMAL(10, 2);
ALTER TABLE trips ADD COLUMN additionals DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE trips ADD COLUMN deductibles DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE trips ADD COLUMN advance_paid DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE trips ADD COLUMN outstanding_amount DECIMAL(10, 2);

-- LR Workflow
ALTER TABLE trips ADD COLUMN lr_workflow_step lr_workflow_step DEFAULT 'LR_CREATION';

-- Create index on lr_number for faster lookups
CREATE INDEX idx_trips_lr_number ON trips(lr_number);
CREATE INDEX idx_trips_driver ON trips(driver_id);
CREATE INDEX idx_trips_workflow_step ON trips(lr_workflow_step);

-- Function to generate LR number
CREATE OR REPLACE FUNCTION generate_lr_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    new_lr_number VARCHAR(50);
    year_part VARCHAR(4);
    random_part VARCHAR(6);
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');
    random_part := UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 6));
    new_lr_number := 'LR-' || year_part || '-' || random_part;
    RETURN new_lr_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate LR number on insert
CREATE OR REPLACE FUNCTION set_lr_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.lr_number IS NULL THEN
        NEW.lr_number := generate_lr_number();
    END IF;
    
    -- Set base_freight from payable_amount if not provided
    IF NEW.base_freight IS NULL THEN
        NEW.base_freight := NEW.payable_amount;
    END IF;
    
    -- Calculate outstanding amount
    NEW.outstanding_amount := COALESCE(NEW.base_freight, 0) + COALESCE(NEW.additionals, 0) - COALESCE(NEW.deductibles, 0) - COALESCE(NEW.advance_paid, 0);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trips_set_lr_number
    BEFORE INSERT ON trips
    FOR EACH ROW
    EXECUTE FUNCTION set_lr_number();

-- Trigger to recalculate outstanding on update
CREATE OR REPLACE FUNCTION recalculate_outstanding()
RETURNS TRIGGER AS $$
BEGIN
    NEW.outstanding_amount := COALESCE(NEW.base_freight, NEW.payable_amount, 0) + COALESCE(NEW.additionals, 0) - COALESCE(NEW.deductibles, 0) - COALESCE(NEW.advance_paid, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trips_recalculate_outstanding
    BEFORE UPDATE ON trips
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_outstanding();

-- Update existing trips with LR numbers
UPDATE trips SET lr_number = generate_lr_number() WHERE lr_number IS NULL;

-- Update sample data with LR fields
UPDATE trips 
SET 
    driver_id = (SELECT id FROM drivers LIMIT 1),
    loading_date = trip_date::timestamp with time zone,
    description_of_goods = 'Steel Coils',
    gross_weight_mt = qty_mt + 1.5,
    tare_weight_mt = 1.5,
    net_weight_mt = qty_mt,
    eway_bill = '192345678901234',
    seal_number = 'SEAL-001',
    invoice_number = 'INV-' || trip_number,
    dc_oa = 'DC-' || SUBSTR(trip_number, -3),
    gp_do = 'GP-' || SUBSTR(trip_number, -3),
    consignor_name = (SELECT name FROM customers WHERE id = (SELECT customer_id FROM orders WHERE id = trips.order_id)),
    consignee_name = 'Recipient Company',
    billing_pan = (SELECT pan FROM transporters WHERE id = trips.transporter_id),
    billing_name = (SELECT name FROM transporters WHERE id = trips.transporter_id),
    tds_category = '194C',
    tds_status = 'APPROVED',
    base_freight = payable_amount,
    additionals = 2000,
    deductibles = 500,
    advance_paid = payable_amount * 0.6,
    lr_workflow_step = CASE 
        WHEN status = 'DELIVERED' THEN 'TRIP_ADVANCES'::lr_workflow_step
        WHEN status = 'IN_TRANSIT' THEN 'DOCUMENT_VERIFICATION'::lr_workflow_step
        ELSE 'LR_CREATION'::lr_workflow_step
    END
WHERE lr_number IS NOT NULL;

-- Add sample LR documents
INSERT INTO documents (doc_type, entity_type, entity_id, title, file_name, file_path, mime_type, file_size)
SELECT 
    'LR'::doc_type, 
    'TRIP'::entity_type, 
    id, 
    'Lorry Receipt Copy', 
    'lr_copy_' || trip_number || '.pdf',
    'trip_docs/trip/' || id || '/lr_copy.pdf',
    'application/pdf',
    256000
FROM trips WHERE status IN ('DELIVERED', 'IN_TRANSIT');

INSERT INTO documents (doc_type, entity_type, entity_id, title, file_name, file_path, mime_type, file_size)
SELECT 
    'INVOICE'::doc_type, 
    'TRIP'::entity_type, 
    id, 
    'Trip Invoice', 
    'invoice_' || trip_number || '.pdf',
    'trip_docs/trip/' || id || '/invoice.pdf',
    'application/pdf',
    128000
FROM trips WHERE status = 'DELIVERED';

INSERT INTO documents (doc_type, entity_type, entity_id, title, file_name, file_path, mime_type, file_size)
SELECT 
    'POD'::doc_type, 
    'TRIP'::entity_type, 
    id, 
    'Proof of Delivery', 
    'pod_' || trip_number || '.jpg',
    'trip_docs/trip/' || id || '/pod.jpg',
    'image/jpeg',
    512000
FROM trips WHERE status = 'DELIVERED';

COMMENT ON COLUMN trips.lr_number IS 'Auto-generated Lorry Receipt number';
COMMENT ON COLUMN trips.lr_workflow_step IS 'Current step in the LR workflow process';
COMMENT ON COLUMN trips.outstanding_amount IS 'Auto-calculated: base_freight + additionals - deductibles - advance_paid';
