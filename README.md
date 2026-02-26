# FreightFlow - Logistics Broker MVP

A comprehensive web application for Indian logistics brokers to manage customers, transporters, orders, trips, and payments.

## 🚀 Setup Instructions

### 1. Supabase Database Setup

**IMPORTANT:** You must run the SQL schema in your Supabase project before using the application.

1. Go to your Supabase project dashboard: https://wyyvwpwkpmsgeybendjd.supabase.co
2. Navigate to the **SQL Editor** in the left sidebar
3. Create a new query
4. Copy the entire contents of `/app/supabase_schema.sql`
5. Paste and execute the SQL script

This will create:
- All database tables (customers, transporters, trucks, orders, trips, payments, payment_allocations)
- Required indexes and relationships
- Row Level Security (RLS) policies
- Storage bucket for documents
- Sample seed data for testing

### 2. Create User Account

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user" → "Create new user"
3. Enter:
   - Email: your@email.com
   - Password: (create a secure password)
   - Email confirmation: OFF (for testing)
4. Click "Create user"
5. Copy the user ID from the users table

### 3. Assign Admin Role

After creating your user, assign the admin role:

1. Go to SQL Editor
2. Run this query (replace `YOUR_USER_ID` with the actual user ID from step 2):

```sql
INSERT INTO user_roles (user_id, role) VALUES ('YOUR_USER_ID', 'ADMIN');
```

### 4. Login to Application

1. Open https://freight-mvp-1.preview.emergentagent.com/login
2. Use the email and password you created in Supabase
3. Click "Sign in"

## 📋 Features

### Core Entities
- **Customers**: Manage customer database with payment terms, GSTIN, contact details
- **Transporters**: Track transporter/vendor information, bank details, KYC documents
- **Trucks**: Register and manage truck fleet with RC/insurance tracking
- **Orders**: Create and track customer load orders with quantity management
- **Trips**: Execute orders with trip-level tracking and document uploads (LR, POD)
- **Payments**: Record and allocate payments (receivables & payables)

### Key Capabilities
✅ Role-based access (Admin and Staff)
✅ Real-time outstanding calculations (receivables & payables)
✅ Customer aging analysis (0-7, 8-15, 16-30, 30+ days)
✅ Partial payment allocation across trips and orders
✅ Document storage for KYC and proof of delivery
✅ Fast search by phone number and name
✅ Comprehensive reports with CSV export
✅ Indian formatting (₹ currency, date formats)

### Dashboard Metrics
- Total Outstanding Receivables
- Total Outstanding Payables
- Pending Orders Count
- Overdue Customers Count

### Business Logic
- Transported quantity = sum of DELIVERED trips
- Outstanding receivable = total billed - total received payments
- Outstanding payable = total payable - total paid payments
- Payment allocations with validation (cannot exceed amounts)
- Aging buckets based on order date + payment terms

## 🗂️ Database Schema

### Key Tables
- `customers` - Customer master data
- `transporters` - Transporter/vendor master
- `trucks` - Truck registration and details
- `orders` - Customer load orders
- `trips` - Trip execution records
- `payments` - Payment records (received/paid)
- `payment_allocations` - Payment-to-trip/order allocation
- `user_roles` - User role management

All tables include:
- Soft delete support (`is_deleted`)
- Automatic timestamps (`created_at`, `updated_at`)
- Proper foreign key relationships
- Row Level Security policies

## 🎨 Design System

**Theme:** "Logistic Swiss" - Modern, data-dense, professional

**Colors:**
- Primary: Deep Slate (#0f172a)
- Secondary: Vibrant Orange (#f97316)
- Accent: Sky Blue (#0ea5e9)
- Background: Light (#f8fafc)

**Typography:**
- Headings: Manrope (bold, modern)
- Body: Inter (clean, readable)
- Numbers: JetBrains Mono (for data tables)

## 📱 Pages

1. **Login** - Supabase auth with hero image
2. **Dashboard** - Metrics overview and quick actions
3. **Customers** - List, create, view detail with aging
4. **Transporters** - List, create, view detail with outstanding
5. **Trucks** - List and manage truck fleet
6. **Orders** - Create orders, track qty (total/transported/pending)
7. **Trips** - Create trips, upload documents
8. **Payments** - Record payments, allocate to trips/orders
9. **Reports** - Customer outstanding, transporter outstanding, order summary

## 🔐 Authentication

Using Supabase Auth with email/password:
- JWT token-based authentication
- Automatic token refresh
- Role-based access control (Admin/Staff)

## 📊 Sample Data

The schema includes sample seed data:
- 3 customers (ABC Logistics, XYZ Industries, Quick Transport)
- 3 transporters (Sharma Transports, Kumar Logistics, Singh Roadways)
- 4 trucks with different types and capacities
- 3 orders in various statuses
- 3 trips (2 delivered, 1 in-transit)
- 2 payments with allocations

## 🛠️ Tech Stack

**Frontend:**
- React 19
- React Router DOM
- Tailwind CSS (Logistic Swiss theme)
- Shadcn/UI components
- Axios for API calls
- Supabase JS client

**Backend:**
- FastAPI (Python)
- Supabase (Postgres + Auth + Storage)
- Pydantic models
- JWT authentication

## 📝 Next Steps / Future Enhancements

- [ ] Add order and trip edit functionality
- [ ] Implement bulk payment import
- [ ] Add email notifications for overdue payments
- [ ] Create mobile app version
- [ ] Add GPS tracking integration for trips
- [ ] Implement advanced reporting with charts
- [ ] Add WhatsApp integration for notifications
- [ ] Create transporter mobile app for trip updates
- [ ] Implement e-way bill generation
- [ ] Add fuel cost tracking
- [ ] Create invoice generation module
- [ ] Add multi-currency support
- [ ] Implement advanced analytics dashboard

## 🚨 Important Notes

1. **Run SQL Schema First:** The application will not work until you execute the SQL schema in Supabase
2. **Create User Account:** You must create a user in Supabase Auth before logging in
3. **Assign Role:** Don't forget to insert a role in the `user_roles` table
4. **Storage Bucket:** Document uploads require the 'documents' storage bucket (created by schema)
5. **Environment Variables:** All Supabase credentials are already configured in .env files

## 🐛 Troubleshooting

**Cannot login:**
- Verify user exists in Supabase Auth → Users
- Check that user has a role in `user_roles` table
- Verify Supabase credentials in `/app/frontend/.env` and `/app/backend/.env`

**Database errors:**
- Ensure SQL schema has been executed completely
- Check table structure in Supabase → Table Editor
- Verify RLS policies are enabled

**Document upload fails:**
- Check storage bucket 'documents' exists
- Verify storage policies in Supabase → Storage

## 📧 Support

For issues or questions, please refer to the setup instructions above or check the Supabase project logs.

---

**Built with ❤️ for the Indian Logistics Industry**
