# AI Attendance System - Deployment Guide

## Production Deployment Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL (recommended for production)
- Nginx (recommended for serving static files)
- Domain name (optional)

### Backend Deployment (Django)

#### 1. Server Setup
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Python and dependencies
sudo apt install python3 python3-pip python3-venv postgresql postgresql-contrib nginx -y
```

#### 2. Deploy Django Backend
```bash
cd django_backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Create superuser (if needed)
python manage.py createsuperuser
```

#### 3. Configure Environment Variables
Create `.env` file in `django_backend/`:
```env
DEBUG=False
SECRET_KEY=your-production-secret-key-here
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_URL=postgresql://user:password@localhost:5432/attend_ai
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

#### 4. Configure Gunicorn
```bash
pip install gunicorn
```

Create systemd service file `/etc/systemd/system/attendai-backend.service`:
```ini
[Unit]
Description=Attend AI Backend
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/path/to/django_backend
Environment="PATH=/path/to/django_backend/venv/bin"
ExecStart=/path/to/django_backend/venv/bin/gunicorn hrms_project.wsgi:application --workers 3 --bind unix:/tmp/attendai.sock

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable attendai-backend
sudo systemctl start attendai-backend
```

### Frontend Deployment (React)

#### 1. Build for Production
```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build
```

#### 2. Serve with Nginx
Configure Nginx `/etc/nginx/sites-available/attendai`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend static files
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://unix:/tmp/attendai.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django admin
    location /admin/ {
        proxy_pass http://unix:/tmp/attendai.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Django static files
    location /static/ {
        alias /path/to/django_backend/staticfiles/;
    }

    # Django media files
    location /media/ {
        alias /path/to/django_backend/media/;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/attendai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### SSL/HTTPS Setup (Recommended)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Database Setup (PostgreSQL)

```bash
# Create database
sudo -u postgres psql
CREATE DATABASE attend_ai;
CREATE USER attend_ai_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE attend_ai TO attend_ai_user;
\q
```

Update `.env` file with PostgreSQL credentials.

### Final Steps

1. **Start Services**
```bash
sudo systemctl start attendai-backend
sudo systemctl start nginx
```

2. **Enable Services on Boot**
```bash
sudo systemctl enable attendai-backend
sudo systemctl enable nginx
```

3. **Check Status**
```bash
sudo systemctl status attendai-backend
sudo systemctl status nginx
```

### Access Your Application

- **Frontend:** https://yourdomain.com
- **Backend API:** https://yourdomain.com/api
- **Admin Panel:** https://yourdomain.com/admin

### Default Login

- **Username:** admin
- **Password:** admin1234 (change this immediately after first login)

### Monitoring & Maintenance

#### View Logs
```bash
# Backend logs
sudo journalctl -u attendai-backend -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log
```

#### Update Application
```bash
# Backend
cd django_backend
git pull
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart attendai-backend

# Frontend
cd frontend
git pull
npm install
npm run build
sudo systemctl restart nginx
```

### Security Recommendations

1. Change default admin password immediately
2. Use strong SECRET_KEY in production
3. Enable HTTPS with SSL certificate
4. Configure firewall rules
5. Regular security updates
6. Database backups
7. Monitor logs for suspicious activity

### Troubleshooting

#### Backend not starting
```bash
sudo journalctl -u attendai-backend -n 50
```

#### Nginx errors
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

#### Database connection issues
```bash
sudo -u postgres psql -d attend_ai
```

### Cloud Deployment Options

#### Vercel (Frontend)
```bash
cd frontend
npm install -g vercel
vercel
```

#### Railway/Render (Backend)
- Connect GitHub repository
- Configure build command: `cd django_backend && pip install -r requirements.txt && python manage.py migrate`
- Configure start command: `gunicorn hrms_project.wsgi:application --port $PORT`

#### AWS/Google Cloud
- Use EC2/Compute Engine for backend
- Use S3/Cloud Storage for static files
- Use RDS/Cloud SQL for database
- Use CloudFront/Cloud CDN for CDN

### Support

For deployment issues, check:
- Django logs: `sudo journalctl -u attendai-backend`
- Nginx logs: `/var/log/nginx/`
- Application logs in Django admin panel
