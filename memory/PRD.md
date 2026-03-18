# FreightFlow - Indian Logistics Broker MVP

## Original Problem Statement
Build a lean web app MVP for an Indian logistics broker (freight brokerage). The application should connect customers with transporters, track orders, trips, quantities, and manage payments (receivables and payables). It also requires document storage for KYC, vehicle documents, and Proof of Delivery (POD).

## Core Requirements
- **Tech Stack:** React Frontend + FastAPI Backend (Supabase for Postgres, Auth, and Storage - currently using mock)
- **Entities:** Customers, Transporters, Trucks, Orders, Trips, Payments, Payment Allocations, Documents, Drivers
- **Features:** Role-based access (Admin/Staff), soft deletes, payment ledgers with partial allocation, document management with uploads, reporting with CSV export
- **UI/UX:** Clean, simple. Fast search and filtering capabilities

## Current Status (March 2026)

### What's Implemented
- Full frontend with React, Tailwind CSS, Shadcn UI
- FastAPI backend with mock in-memory database
- Core pages: Dashboard, Customers, Transporters, Orders, Trips, Trucks, Drivers, Payments, Reports
- Detail pages for all entities
- Document management feature (upload, view, delete) using mock storage
- CRUD functionality for Customers, Orders, Transporters
- Local setup documentation
- **LR (Lorry Receipt) Tracking Feature** (NEW - March 2026)

### LR Tracking Feature (Completed)
Based on competitor analysis, implemented comprehensive LR tracking:

**Workflow Steps:**
1. LR Creation - Auto-generated when trip is created
2. Document Verification - Upload/verify trip documents
3. Trip Advances - Record advance payments and deductibles
4. POD Upload - Proof of Delivery completion

**New Trip/LR Fields:**
- Vehicle Details: Vehicle No, Transporter (Broker), Phones, Vendor PAN
- Basic Details: From/To, Consignor/Consignee, Loading Date, DC/OA, GP/DO
- Consignment Details: Description of Goods, Gross/Tare/Net Weight (MT)
- Invoice Details: E-way Bill, Seal Number, Invoice Number
- Billing Entity: PAN Card, Name on PAN, TDS Category, TDS Status
- Vendor Bill: Base Freight, Additionals, Deductibles, Advance Paid, Outstanding

**New API Endpoints:**
- `PATCH /api/trips/{trip_id}/lr` - Update LR-specific fields
- Auto-generated LR number format: `LR-YYYY-XXXXXX`

### Architecture
```
/app/
├── backend/
│   ├── server.py         # Monolithic FastAPI app with mock DB
│   ├── tests/            # Pytest test files
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable components (Layout, DocumentUpload, etc.)
│   │   ├── pages/        # Page components for each route
│   │   └── lib/api.js    # API client with mock token
└── migrations/
    └── 001_initial_schema.sql  # Supabase DB schema
```

### Key Technical Details
- Backend runs on port 8001 (via supervisor)
- Frontend runs on port 3000 (via supervisor)
- All API routes prefixed with `/api`
- Currently using in-memory mock database (MOCK_DB in server.py)
- Authentication bypassed with mock token

## Prioritized Backlog

### P0 - Critical
- [ ] Re-integrate Supabase (database, auth, storage) - Debug original login issue
  - Phase 1: DB & Auth - Remove mock, restore Supabase client
  - Phase 2: Storage - Connect document uploads to Supabase Storage

### P1 - High Priority  
- [ ] Complete CRUD for Trucks, Payments, Drivers
- [ ] Full Driver Management pages with CRUD and documents

### P2 - Medium Priority
- [ ] Payment Allocations feature (assign payments to trips/orders)
- [ ] Business logic & validation (prevent over-allocation)
- [ ] Reports page with CSV export
- [ ] Supabase seed data for testing

### Dropped Tasks
- Mobile responsiveness (dropped per user request)

## API Endpoints
All endpoints in `backend/server.py`, require mock auth token:
- `/api/dashboard`
- `/api/customers`, `/api/orders`, `/api/transporters`, `/api/trucks`, `/api/trips`, `/api/drivers`
- `/api/trips/{trip_id}/lr` (PATCH) - Update LR workflow fields
- `/api/documents`, `/api/documents/upload`
- `/api/reports/*`

## Database Schema
See `/app/migrations/001_initial_schema.sql` for full schema.

Core entities: customers, transporters, trucks, orders, trips, payments, payment_allocations, documents, drivers

## Test Reports
- `/app/test_reports/iteration_1.json` - LR workflow feature tests (100% pass rate)
- `/app/backend/tests/test_lr_workflow.py` - Backend pytest tests
