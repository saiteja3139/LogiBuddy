# FreightFlow - Local Development Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download](https://www.python.org/)
- **Yarn** package manager - Install via: `npm install -g yarn`
- **Git** (optional, for version control)

## Step 1: Download the Code

You have two options:

### Option A: Download as ZIP (Easiest)
```bash
# Contact support to download the project as a ZIP file
# Extract it to your desired location
```

### Option B: Copy from Current Environment
If you have access to the current deployment, you can copy the entire `/app` directory.

## Step 2: Backend Setup

### 2.1 Navigate to Backend Directory
```bash
cd /path/to/your/project/backend
```

### 2.2 Create Python Virtual Environment (Recommended)
```bash
# Create virtual environment
python -m venv venv

# Activate it
# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate
```

### 2.3 Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 2.4 Configure Backend Environment
Create or edit `.env` file in the `backend` folder:

```env
# For demo mode (uses in-memory mock database)
CORS_ORIGINS="http://localhost:3000"

# If you want to use real Supabase (optional):
SUPABASE_URL=https://wyyvwpwkpmsgeybendjd.supabase.co
SUPABASE_KEY=sb_publishable_oe-goaz7Mn-mEGHrnqMaxg_9vExq2Q1
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5eXZ3cHdrcG1zZ2V5YmVuZGpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjA4MDMyNiwiZXhwIjoyMDg3NjU2MzI2fQ.xGgAEp3OgGcV8JieBNUlinnm3ygBecttMNYuUChYz1Y

# Legacy (not needed for current mock setup)
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
```

### 2.5 Start Backend Server
```bash
# Make sure you're in the backend directory
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Application startup complete.
```

**Keep this terminal open!**

## Step 3: Frontend Setup

### 3.1 Open New Terminal
Open a new terminal window/tab (keep backend running in the first one)

### 3.2 Navigate to Frontend Directory
```bash
cd /path/to/your/project/frontend
```

### 3.3 Install Node Dependencies
```bash
yarn install
# or
npm install
```

This will install all required packages (React, Tailwind, Shadcn UI, etc.)

### 3.4 Configure Frontend Environment
Create or edit `.env` file in the `frontend` folder:

```env
# Point to your local backend
REACT_APP_BACKEND_URL=http://localhost:8001

# Supabase credentials (if using real Supabase)
REACT_APP_SUPABASE_URL=https://wyyvwpwkpmsgeybendjd.supabase.co
REACT_APP_SUPABASE_KEY=sb_publishable_oe-goaz7Mn-mEGHrnqMaxg_9vExq2Q1
```

### 3.5 Start Frontend Development Server
```bash
yarn start
# or
npm start
```

The app will automatically open in your browser at:
```
http://localhost:3000
```

You should see:
```
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

## Step 4: Verify Everything is Working

1. **Backend Check**: Visit http://localhost:8001/api/ 
   - You should see: `{"message": "Hello World"}`

2. **Frontend Check**: Visit http://localhost:3000
   - You should see the FreightFlow dashboard

3. **Test CRUD Operations**:
   - Click on Customers → Add Customer
   - Fill in details and create
   - Verify it appears in the table

## Project Structure

```
your-project/
├── backend/
│   ├── server.py          # FastAPI application
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Backend environment variables
│
├── frontend/
│   ├── src/
│   │   ├── App.js        # Main React component
│   │   ├── pages/        # All page components
│   │   ├── components/   # Reusable components
│   │   └── lib/          # Utilities (API, utils)
│   ├── package.json      # Node dependencies
│   ├── tailwind.config.js
│   └── .env              # Frontend environment variables
│
├── supabase_schema.sql   # Database schema (for production)
└── README.md             # Project documentation
```

## Common Issues & Solutions

### Issue 1: "Port 8001 already in use"
```bash
# Find and kill the process using port 8001
# On Windows:
netstat -ano | findstr :8001
taskkill /PID <PID> /F

# On macOS/Linux:
lsof -ti:8001 | xargs kill -9
```

### Issue 2: "Port 3000 already in use"
```bash
# The terminal will ask if you want to use another port
# Type 'y' to use port 3001 instead
```

### Issue 3: Module Not Found Errors
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
yarn install
# or delete node_modules and reinstall
rm -rf node_modules
yarn install
```

### Issue 4: CORS Errors
Make sure your backend `.env` has:
```env
CORS_ORIGINS="http://localhost:3000"
```

### Issue 5: API Calls Failing
Check that `REACT_APP_BACKEND_URL` in frontend `.env` is:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

## Development Workflow

### Making Changes

**Backend Changes:**
1. Edit `backend/server.py`
2. Changes auto-reload (thanks to `--reload` flag)
3. Refresh browser to see changes

**Frontend Changes:**
1. Edit files in `frontend/src/`
2. Hot reload happens automatically
3. Browser updates instantly

### Adding New Dependencies

**Backend:**
```bash
cd backend
pip install <package-name>
pip freeze > requirements.txt
```

**Frontend:**
```bash
cd frontend
yarn add <package-name>
# package.json updates automatically
```

## Production Mode (Optional)

### Build Frontend for Production
```bash
cd frontend
yarn build
# Creates optimized build in 'build' folder
```

### Run Backend in Production Mode
```bash
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001
# Remove --reload flag for production
```

## Using Real Supabase Database

If you want to use real Supabase instead of mock data:

1. **Run SQL Schema**: Execute `/app/supabase_schema.sql` in your Supabase SQL Editor

2. **Update Backend**: Edit `backend/server.py` and replace the mock database code with real Supabase client

3. **Enable Auth**: Uncomment authentication code in frontend

4. **Create User**: Sign up through Supabase dashboard and assign role

See `README.md` for detailed Supabase setup instructions.

## Stopping the Servers

**Stop Backend:**
- Press `Ctrl+C` in the backend terminal

**Stop Frontend:**
- Press `Ctrl+C` in the frontend terminal

## Need Help?

- Check browser console for frontend errors (F12 → Console)
- Check backend terminal for API errors
- Review the main `README.md` for feature documentation
- Check logs: Backend shows all API requests and errors

## Quick Start Commands (Summary)

```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn server:app --reload --host 0.0.0.0 --port 8001

# Terminal 2 - Frontend
cd frontend
yarn start

# Access app at: http://localhost:3000
```

---

**Enjoy building with FreightFlow! 🚚**
