-- LR Workflow Migration PART 1 - Run this first
-- This adds the enum types and columns

-- Add new enum types for LR workflow
CREATE TYPE lr_workflow_step AS ENUM ('LR_CREATION', 'DOCUMENT_VERIFICATION', 'TRIP_ADVANCES', 'POD_UPLOAD', 'COMPLETED');
CREATE TYPE tds_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Add new doc types for LR documents
ALTER TYPE doc_type ADD VALUE 'LR';
ALTER TYPE doc_type ADD VALUE 'INVOICE';
ALTER TYPE doc_type ADD VALUE 'POD';

-- Add new columns to trips table for LR tracking
ALTER TABLE trips ADD COLUMN IF NOT EXISTS lr_number VARCHAR(50) UNIQUE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL;

-- LR/Consignment Details
ALTER TABLE trips ADD COLUMN IF NOT EXISTS loading_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS description_of_goods VARCHAR(255);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS gross_weight_mt DECIMAL(10, 2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS tare_weight_mt DECIMAL(10, 2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS net_weight_mt DECIMAL(10, 2);

-- Invoice Details
ALTER TABLE trips ADD COLUMN IF NOT EXISTS eway_bill VARCHAR(50);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS seal_number VARCHAR(50);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50);

-- Basic Details
ALTER TABLE trips ADD COLUMN IF NOT EXISTS dc_oa VARCHAR(50);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS gp_do VARCHAR(50);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS consignor_name VARCHAR(255);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS consignor_address TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS consignee_name VARCHAR(255);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS consignee_address TEXT;

-- Billing Entity
ALTER TABLE trips ADD COLUMN IF NOT EXISTS billing_pan VARCHAR(10);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS billing_name VARCHAR(255);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS tds_category VARCHAR(50);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS tds_status tds_status DEFAULT 'PENDING';

-- Vendor Bill (Simplified)
ALTER TABLE trips ADD COLUMN IF NOT EXISTS base_freight DECIMAL(10, 2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS additionals DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS deductibles DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS advance_paid DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS outstanding_amount DECIMAL(10, 2);

-- LR Workflow
ALTER TABLE trips ADD COLUMN IF NOT EXISTS lr_workflow_step lr_workflow_step DEFAULT 'LR_CREATION';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trips_lr_number ON trips(lr_number);
CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_workflow_step ON trips(lr_workflow_step);

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

DROP TRIGGER IF EXISTS trips_set_lr_number ON trips;
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

DROP TRIGGER IF EXISTS trips_recalculate_outstanding ON trips;
CREATE TRIGGER trips_recalculate_outstanding
    BEFORE UPDATE ON trips
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_outstanding();

COMMENT ON COLUMN trips.lr_number IS 'Auto-generated Lorry Receipt number';
COMMENT ON COLUMN trips.lr_workflow_step IS 'Current step in the LR workflow process';
COMMENT ON COLUMN trips.outstanding_amount IS 'Auto-calculated: base_freight + additionals - deductibles - advance_paid';
