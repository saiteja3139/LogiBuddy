# FreightFlow Deployment Guide
## Vercel (Frontend) + Railway (Backend)

---

## Step 1: Deploy Backend to Railway

### 1.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub

### 1.2 Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository
4. **Important:** Set the root directory to `/backend`

### 1.3 Configure Environment Variables
In Railway dashboard → Your service → **Variables** tab, add:

```
SUPABASE_URL=https://wyyvwpwkpmsgeybendjd.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5eXZ3cHdrcG1zZ2V5YmVuZGpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjA4MDMyNiwiZXhwIjoyMDg3NjU2MzI2fQ.xGgAEp3OgGcV8JieBNUlinnm3ygBecttMNYuUChYz1Y
USE_MOCK_DB=false
CORS_ORIGINS=https://your-app.vercel.app,http://localhost:3000
```

### 1.4 Deploy
Railway will automatically:
- Detect Python from `requirements.txt`
- Install dependencies
- Run the `Procfile` command

### 1.5 Get Your Backend URL
After deployment, Railway provides a URL like:
```
https://freightflow-backend-production.up.railway.app
```
**Save this URL** - you'll need it for the frontend.

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub

### 2.2 Import Project
1. Click **"Add New Project"**
2. Import your GitHub repository
3. **Configure Project:**
   - **Framework Preset:** Create React App
   - **Root Directory:** `frontend`

### 2.3 Configure Environment Variables
In Vercel dashboard → Settings → Environment Variables, add:

```
REACT_APP_BACKEND_URL=https://your-railway-backend.up.railway.app
```

Replace with your actual Railway backend URL from Step 1.5.

### 2.4 Update vercel.json (Optional)
If you want API calls to proxy through Vercel, update `frontend/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-railway-backend.up.railway.app/api/:path*"
    }
  ]
}
```

### 2.5 Deploy
Click **"Deploy"** - Vercel will build and deploy automatically.

---

## Step 3: Update CORS (Important!)

After both are deployed, update Railway's `CORS_ORIGINS` variable:

```
CORS_ORIGINS=https://your-app.vercel.app
```

---

## Step 4: Verify Deployment

1. **Backend Health Check:**
   ```
   curl https://your-railway-backend.up.railway.app/api/health
   ```
   Should return: `{"status": "healthy", "database": "supabase"}`

2. **Frontend:**
   Visit your Vercel URL and verify:
   - Dashboard loads with data
   - Customers, Trips, Orders pages work
   - Creating new trips generates LR numbers

---

## Troubleshooting

### Backend not starting?
- Check Railway logs for errors
- Verify all environment variables are set
- Ensure `requirements.txt` is in `/backend` folder

### Frontend API calls failing?
- Verify `REACT_APP_BACKEND_URL` is correct
- Check browser console for CORS errors
- Update `CORS_ORIGINS` on Railway

### Database connection issues?
- Verify Supabase project is not paused
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are correct

---

## Cost Estimates

| Service | Free Tier | Paid |
|---------|-----------|------|
| Railway | 500 hours/month | $5/month |
| Vercel | 100GB bandwidth | $20/month |
| Supabase | 500MB DB, 1GB storage | $25/month |

**Total for MVP:** Free tier should be sufficient for testing/demo.

---

## Files Created for Deployment

```
/backend/
├── Procfile          # Railway start command
├── railway.json      # Railway configuration
└── requirements.txt  # Python dependencies

/frontend/
├── vercel.json       # Vercel configuration
└── package.json      # Node dependencies
```

---

## Next Steps After Deployment

1. **Custom Domain:** Add your domain in Vercel/Railway settings
2. **SSL:** Both platforms provide free SSL certificates
3. **Monitoring:** Railway has built-in metrics, or add Sentry for error tracking
4. **CI/CD:** Both platforms auto-deploy on git push to main branch
