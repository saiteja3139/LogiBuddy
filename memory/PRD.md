# FreightFlow - Indian Logistics Broker MVP

## Original Problem Statement
Build a lean web app MVP for an Indian logistics broker (freight brokerage). The application should connect customers with transporters, track orders, trips, quantities, and manage payments (receivables and payables). It also requires document storage for KYC, vehicle documents, and Proof of Delivery (POD).

## Core Requirements
- **Tech Stack:** React Frontend + FastAPI Backend + Supabase (PostgreSQL, Auth, Storage)
- **Entities:** Customers, Transporters, Trucks, Orders, Trips, Payments, Payment Allocations, Documents, Drivers
- **Features:** Role-based access (Admin/Staff), soft deletes, payment ledgers with partial allocation, document management with uploads, reporting with CSV export
- **UI/UX:** Clean, simple. Fast search and filtering capabilities

## Current Status (March 2026)

### ✅ SUPABASE INTEGRATION COMPLETE
- Connected to real Supabase PostgreSQL database
- All data persists across server restarts
- 100% test pass rate verified

### What's Implemented
- Full frontend with React, Tailwind CSS, Shadcn UI
- FastAPI backend connected to **Supabase PostgreSQL**
- Core pages: Dashboard, Customers, Transporters, Orders, Trips, Trucks, Drivers, Payments, Reports
- Detail pages for all entities
- Document management feature (upload, view, delete)
- CRUD functionality for all entities
- **LR (Lorry Receipt) Tracking Feature** with step-based workflow

### LR Tracking Feature (Completed)
**Workflow Steps:**
1. LR Creation - Auto-generated when trip is created (format: LR-YYYY-XXXXXX)
2. Document Verification - Upload/verify trip documents
3. Trip Advances - Record advance payments and deductibles
4. POD Upload - Proof of Delivery completion

**Trip/LR Fields:**
- Vehicle Details: Vehicle No, Transporter (Broker), Phones, Vendor PAN
- Basic Details: From/To, Consignor/Consignee, Loading Date, DC/OA, GP/DO
- Consignment Details: Description of Goods, Gross/Tare/Net Weight (MT)
- Invoice Details: E-way Bill, Seal Number, Invoice Number
- Billing Entity: PAN Card, Name on PAN, TDS Category, TDS Status
- Vendor Bill: Base Freight, Additionals, Deductibles, Advance Paid, Outstanding (auto-calculated)

### Architecture
```
/app/
├── backend/
│   ├── server.py         # FastAPI app with Supabase client
│   ├── tests/            # Pytest test files
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components for each route
│   │   └── lib/api.js    # API client
└── supabase_*.sql        # Database migration files
```

### Supabase Configuration
- **Project:** wyyvwpwkpmsgeybendjd.supabase.co
- **Database:** PostgreSQL with UUID primary keys
- **Tables:** customers, transporters, trucks, orders, trips, payments, payment_allocations, documents, drivers
- **Migrations:** 
  - supabase_schema.sql (base tables)
  - supabase_documents_migration.sql (documents & drivers)
  - supabase_lr_migration_part1.sql (LR fields & triggers)
  - supabase_lr_migration_part2.sql (LR seed data)

## Prioritized Backlog

### P0 - Critical (Completed ✅)
- [x] Supabase database integration
- [x] LR tracking feature

### P1 - High Priority  
- [ ] Supabase Auth integration (currently using mock token)
- [ ] Document file upload to Supabase Storage (currently file_url is null)
- [ ] Complete CRUD for Payments with allocations

### P2 - Medium Priority
- [ ] Payment Allocations feature (assign payments to trips/orders)
- [ ] Business logic & validation (prevent over-allocation)
- [ ] Reports page with CSV export

## API Endpoints
All endpoints in `backend/server.py`:
- `/api/dashboard` - Dashboard stats (receivables, payables, pending orders)
- `/api/customers`, `/api/orders`, `/api/transporters`, `/api/trucks`, `/api/trips`, `/api/drivers`
- `/api/trips/{trip_id}/lr` (PATCH) - Update LR workflow fields
- `/api/documents`, `/api/documents/upload`
- `/api/payments`, `/api/payment_allocations`
- `/api/reports/*`

## Test Reports
- `/app/test_reports/iteration_2.json` - Supabase integration tests (100% pass rate)
- `/app/backend/tests/test_supabase_integration.py` - Backend pytest tests
