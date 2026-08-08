# Attend AI Django Backend

Production-style Django REST backend for AI attendance and HRMS.

## Features

- JWT authentication with Admin, HR and Employee roles
- Employee CRUD APIs
- Attendance APIs with office timing, late, half-day and overtime calculation
- Employee Self Service: profile, attendance, leaves and payslip list
- Leave apply, approve and reject flow
- Payroll salary-slip generation and PDF download
- Face recognition attendance with unknown person detection
- Real-time camera monitoring stats
- Excel attendance export
- Celery + Redis background jobs for daily absent calculation, salary generation and email reminders
- Swagger API docs at `/api/docs/`
- Docker Compose with PostgreSQL, Redis, web, Celery worker and Celery beat
- PyTest examples for attendance rules

## Run Locally

```powershell
cd django_backend
copy .env.example .env
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

For local AI face recognition packages, run this after the base install:

```powershell
pip install -r requirements-ai.txt
```

Open API docs:

```text
http://127.0.0.1:8000/api/docs/
```

## Docker

```powershell
cd django_backend
copy .env.example .env
docker compose up --build
```

## Main Endpoints

- `POST /api/auth/login/` JWT login
- `POST /api/auth/refresh/` token refresh
- `GET/POST /api/employees/`
- `POST /api/employees/{id}/register_face/`
- `GET/POST /api/attendance/`
- `POST /api/attendance/{id}/checkout/`
- `GET /api/attendance/export_excel/`
- `GET/POST /api/leaves/`
- `POST /api/leaves/{id}/approve/`
- `POST /api/leaves/{id}/reject/`
- `GET /api/payroll/`
- `POST /api/payroll/generate/`
- `GET /api/payroll/{id}/download/`
- `POST /api/face/attendance/`
- `GET /api/camera/monitoring/`
- `GET/PATCH /api/ess/me/`
- `GET /api/analytics/monthly/`

## Face Attendance Payload

```json
{
  "image_base64": "data:image/jpeg;base64,...",
  "camera_name": "Front Gate"
}
```

If the face matches a registered employee, attendance is marked automatically. If it does not match, an unknown-face event is stored for review.
