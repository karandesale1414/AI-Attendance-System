# Deployment Guide - Attend AI

## Root Cause Analysis

The login API was returning 500 Internal Server Error due to:

1. **Frontend Runtime Error**: `setIsInitialLoad` was called but never defined as a state variable in `App.jsx`, causing JavaScript errors during login
2. **Backend Database Configuration**: Duplicate `DATABASES` configuration in `settings.py` - first SQLite, then PostgreSQL override, causing conflicts
3. **CORS Configuration**: Invalid CORS settings with wildcard `*` in CSV format, causing Django system check errors
4. **Missing Environment Variables**: No `.env` files for local development configuration

## Files Changed

### Backend (Django)
- `django_backend/hrms_project/settings.py` - Fixed database configuration, removed duplicate DATABASES, fixed CORS settings
- `django_backend/render.yaml` - Updated CORS origins for production, added `--noinput` to migrate command
- `django_backend/.env` - Created local development environment variables

### Frontend (React)
- `frontend/src/App.jsx` - Removed undefined `setIsInitialLoad(true)` call
- `frontend/.env` - Created local development environment variables
- `frontend/.env.production` - Updated to point to Render backend URL
- `frontend/vercel.json` - Created Vercel deployment configuration

## Backend Deployment (Render)

### Prerequisites
- Render account (https://render.com)
- GitHub repository with this code

### Steps

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Fix login API and deployment configuration"
   git push origin main
   ```

2. **Deploy to Render**
   - Go to https://dashboard.render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select `django_backend` as root directory
   - Build Command: `pip install -r requirements.txt && python manage.py migrate "--noinput"`
   - Start Command: `gunicorn hrms_project.wsgi:application --workers 3 --bind 0.0.0.0:$PORT --timeout 120`
   - Or use the provided `render.yaml` for automatic deployment

3. **Add Environment Variables** (if not using render.yaml)
   - `DEBUG`: `False`
   - `SECRET_KEY`: (generate a secure key)
   - `ALLOWED_HOSTS`: `*`
   - `CORS_ALLOWED_ORIGINS`: `https://*.vercel.app,https://attend-ai-frontend.vercel.app`
   - `CORS_ALLOW_ALL_ORIGINS`: `True`

4. **Create PostgreSQL Database**
   - In Render, create a new PostgreSQL database
   - Note the connection string
   - Add `DATABASE_URL` environment variable with the connection string

5. **Create Superuser** (after deployment)
   ```bash
   # Access Render shell
   python manage.py createsuperuser
   # Or use Django Admin at /admin/
   ```

## Frontend Deployment (Vercel)

### Steps

1. **Push code to GitHub** (if not already done)

2. **Deploy to Vercel**
   - Go to https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repository
   - Select `frontend` as root directory
   - Framework Preset: Vite
   - Environment Variables:
     - `VITE_API_URL`: `https://attend-ai-backend.onrender.com/api`
   - Click "Deploy"

3. **Or use Vercel CLI**
   ```bash
   cd frontend
   npm install -g vercel
   vercel
   ```

## Local Development

### Backend
```bash
cd django_backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Verification

### 1. Test Login API Locally

**Backend running on http://localhost:8000**

```bash
python -c "import requests; r = requests.post('http://localhost:8000/api/login', json={'username': 'admin', 'password': 'admin1234'}); print(f'Status: {r.status_code}'); print(f'Response: {r.json()}')"
```

Expected response:
```json
{
  "success": true,
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "_id": 1,
    "name": "admin",
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

### 2. Test Frontend Login

1. Open http://localhost:5173
2. Use credentials:
   - Email: `admin`
   - Password: `admin1234`
3. Should successfully login and redirect to dashboard

### 3. Test Production Deployment

**Backend (Render)**
```bash
curl -X POST https://attend-ai-backend.onrender.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin1234"}'
```

**Frontend (Vercel)**
1. Open your Vercel deployment URL
2. Test login with admin credentials
3. Verify dashboard loads correctly

## Default Credentials

- **Username**: `admin`
- **Password**: `admin1234`
- **Email**: `admin@example.com`

## Troubleshooting

### Login returns 500 error
- Check backend logs on Render
- Verify database migrations ran successfully
- Check CORS configuration matches frontend URL

### CORS errors
- Verify `CORS_ALLOWED_ORIGINS` includes your frontend URL
- Check `CORS_ALLOW_ALL_ORIGINS` is set to `True` for development

### Database connection errors
- Verify `DATABASE_URL` environment variable is set correctly on Render
- Check PostgreSQL database is running and accessible

### Frontend cannot connect to backend
- Verify `VITE_API_URL` is set correctly in Vercel environment variables
- Check backend is deployed and accessible
- Verify CORS settings allow frontend origin
