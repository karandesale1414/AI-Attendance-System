@echo off
echo ========================================
echo AI Attendance System - Startup Script
echo ========================================
echo.

echo [1/2] Installing Django dependencies and starting Backend...
start "Django Backend" cmd /k "cd /d c:\Users\karan\OneDrive\Desktop\attend ai\django_backend && python -m pip install Django djangorestframework djangorestframework-simplejwt django-cors-headers && python -m pip install -r requirements.txt && python manage.py migrate && python manage.py runserver"

echo Waiting for Django backend to start...
timeout /t 8 /nobreak >nul

echo.
echo [2/2] Starting React Frontend...
start "React Frontend" cmd /k "cd /d c:\Users\karan\OneDrive\Desktop\attend ai\frontend && npm install && npm run dev"

echo.
echo ========================================
echo Both servers are starting...
echo.
echo Django Backend: http://127.0.0.1:8000
echo React Frontend: http://localhost:5177 (or 5173, 5174, 5175, 5176 if available)
echo.
echo Default Login:
echo Username: admin
echo Password: admin1234
echo ========================================
echo.
pause
