# AI Attendance System - Production Ready

A modern, production-ready AI-powered attendance system built with Django (backend) and React (frontend) using face-api.js for client-side face recognition.

## Tech Stack

### Backend
- **Django 5.2** - Web framework
- **Django REST Framework** - API layer
- **SQLite** - Database (production-ready, can be switched to PostgreSQL)
- **SimpleJWT** - JWT authentication
- **Celery + Redis** - Background task processing (optional)

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **face-api.js** - Client-side face recognition
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Recharts** - Data visualization

## Features

- ✅ AI-powered face recognition attendance
- ✅ Enhanced low-light face detection
- ✅ Multi-angle face recognition support
- ✅ Premium professional dashboard UI
- ✅ Fully responsive design
- ✅ Employee management
- ✅ Attendance tracking with status (Present, Late, Absent, Half Day)
- ✅ Leave management system
- ✅ Payroll calculation
- ✅ Monthly reports
- ✅ JWT authentication
- ✅ Role-based access control (Admin, HR, Viewer)

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup

**Navigate to the project directory first:**
```bash
cd "c:\Users\karan\OneDrive\Desktop\attend ai\django_backend"
```

**Then run these commands:**
```bash
# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser (if not already created)
python manage.py createsuperuser

# Start Django server
python manage.py runserver
```

Backend will run on: `http://127.0.0.1:8000`

### Frontend Setup

**Navigate to the frontend directory:**
```bash
cd "c:\Users\karan\OneDrive\Desktop\attend ai\frontend"
```

**Then run these commands:**
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on: `http://localhost:5177` (or 5173, 5174, 5175, 5176 if available)

## Default Login Credentials

- **Username:** admin
- **Password:** admin1234

## Project Structure

```
attend ai/
├── django_backend/          # Django backend
│   ├── hrms/                # Main HRMS app
│   │   ├── models.py        # Database models
│   │   ├── views.py         # API views
│   │   ├── serializers.py   # Data serializers
│   │   ├── services/        # Business logic
│   │   └── urls.py          # API routes
│   ├── hrms_project/        # Django project settings
│   └── manage.py            # Django management script
├── frontend/                # React frontend
│   ├── src/
│   │   ├── App.jsx         # Main application
│   │   └── main.jsx        # Entry point
│   └── public/
│       └── models/          # face-api.js models
└── README.md                # This file
```

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/register` - User registration

### Employees
- `GET /api/employees` - List all employees
- `POST /api/employees` - Create new employee
- `PUT /api/employees/{id}` - Update employee
- `DELETE /api/employees/{id}` - Delete employee
- `POST /api/employees/{id}/register_face` - Register face encoding

### Attendance
- `GET /api/attendance` - List attendance records
- `POST /api/attendance` - Mark attendance
- `POST /api/attendance/{id}/checkout` - Check out

### Leaves
- `GET /api/leaves` - List leave requests
- `POST /api/leaves` - Apply for leave
- `PUT /api/leaves/{id}` - Update leave request
- `POST /api/leaves/{id}/approve` - Approve leave
- `POST /api/leaves/{id}/reject` - Reject leave

### Dashboard & Reports
- `GET /api/dashboard` - Dashboard statistics
- `GET /api/reports/monthly` - Monthly attendance report
- `GET /api/payroll/employee/{id}` - Employee payroll

## Face Recognition

The system uses face-api.js for client-side face recognition with:

- **Enhanced low-light detection** - Automatic brightness and contrast adjustment
- **Multi-angle support** - Works with various face orientations
- **Real-time feedback** - Guidance for optimal face positioning
- **Confidence scoring** - Reliable matching with threshold-based validation

## Production Deployment

### Backend
1. Set `DEBUG=False` in `django_backend/hrms_project/settings.py`
2. Configure production database (PostgreSQL recommended)
3. Set up production WSGI server (Gunicorn recommended)
4. Configure static files serving
5. Set up Celery worker for background tasks
6. Configure email settings for notifications

### Frontend
1. Build the production bundle: `npm run build`
2. Serve static files using Nginx or similar
3. Configure API URL in environment variables
4. Enable HTTPS

## Database Models

- **User** - Authentication and authorization
- **Employee** - Employee information and face encodings
- **Attendance** - Attendance records with status tracking
- **Leave** - Leave requests and approvals
- **OfficePolicy** - Attendance rules and policies
- **SalarySlip** - Payroll records
- **UnknownFaceEvent** - Unknown face detection logs

## Security Features

- JWT token-based authentication
- Role-based access control
- CORS configuration
- Secure password hashing
- SQL injection protection (Django ORM)
- XSS protection (React)

## Troubleshooting

### Backend won't start
- Check if port 8000 is available
- Ensure Python dependencies are installed
- Verify database migrations are run

### Frontend won't start
- Check if port 5173 is available
- Ensure Node.js dependencies are installed
- Clear browser cache if needed

### Face recognition not working
- Ensure face-api.js models are present in `frontend/public/models/`
- Check camera permissions in browser
- Verify lighting conditions are adequate

## License

This project is proprietary software. All rights reserved.

## Support

For issues and questions, contact the development team.
