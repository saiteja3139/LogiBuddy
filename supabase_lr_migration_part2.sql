-- LR Workflow Migration PART 2 - Run this AFTER Part 1
-- This updates existing data with LR values

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
    dc_oa = 'DC-001',
    gp_do = 'GP-001',
    consignor_name = (SELECT name FROM customers WHERE id = (SELECT customer_id FROM orders WHERE id = trips.order_id LIMIT 1) LIMIT 1),
    consignee_name = 'Recipient Company',
    billing_pan = (SELECT pan FROM transporters WHERE id = trips.transporter_id LIMIT 1),
    billing_name = (SELECT name FROM transporters WHERE id = trips.transporter_id LIMIT 1),
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
WHERE lr_workflow_step IS NULL OR base_freight IS NULL;

-- Add sample LR documents for existing trips
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
FROM trips WHERE status IN ('DELIVERED', 'IN_TRANSIT')
ON CONFLICT DO NOTHING;

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
FROM trips WHERE status = 'DELIVERED'
ON CONFLICT DO NOTHING;

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
FROM trips WHERE status = 'DELIVERED'
ON CONFLICT DO NOTHING;
