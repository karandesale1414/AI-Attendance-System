$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "django_backend"
$frontend = Join-Path $root "frontend"

Write-Host "Starting Attend AI backend..." -ForegroundColor Cyan
Set-Location $backend
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
}

docker compose up -d
docker compose exec web python manage.py migrate
docker compose exec web python manage.py shell -c "from django.contrib.auth import get_user_model; User=get_user_model(); User.objects.filter(username='admin').exists() or User.objects.create_superuser(username='admin', email='admin@example.com', password='admin1234', role='ADMIN')"

Write-Host "Backend ready: http://127.0.0.1:8000/api/docs/" -ForegroundColor Green
Write-Host "Starting frontend..." -ForegroundColor Cyan
Set-Location $frontend
npm.cmd run dev -- --host 127.0.0.1
