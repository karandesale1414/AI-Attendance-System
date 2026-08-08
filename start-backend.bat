@echo off
echo Starting Django Backend...
cd /d "c:\Users\karan\OneDrive\Desktop\attend ai\django_backend"
echo Current directory: %CD%
echo.
echo Installing Django and dependencies...
python -m pip install Django djangorestframework djangorestframework-simplejwt django-cors-headers
python -m pip install -r requirements.txt
echo.
echo Running migrations...
python manage.py migrate
echo.
echo Starting Django server on http://127.0.0.1:8000
echo Press CTRL+C to stop the server
echo.
python manage.py runserver
pause
