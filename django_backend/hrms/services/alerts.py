from django.conf import settings
from django.core.mail import send_mail

try:
    import requests
except ImportError:
    requests = None


def send_employee_email(employee, subject, message):
    if not employee.email or not settings.EMAIL_HOST_USER:
        return {"sent": False, "reason": "SMTP is not configured or employee email is missing"}
    send_mail(subject, message, None, [employee.email], fail_silently=False)
    return {"sent": True}


def send_employee_whatsapp(employee, message):
    if requests is None:
        return {"sent": False, "reason": "requests package is not installed"}
    if not employee.phone or not settings.WHATSAPP_API_URL or not settings.WHATSAPP_API_TOKEN:
        return {"sent": False, "reason": "WhatsApp provider is not configured or employee phone is missing"}
    response = requests.post(
        settings.WHATSAPP_API_URL,
        headers={"Authorization": f"Bearer {settings.WHATSAPP_API_TOKEN}"},
        json={"from": settings.WHATSAPP_FROM, "to": employee.phone, "message": message},
        timeout=10,
    )
    response.raise_for_status()
    return {"sent": True}


def notify_absent(employee, date):
    message = f"Attendance alert: You are marked absent on {date}. Please contact HR if this is incorrect."
    return {
        "email": send_employee_email(employee, f"Absent alert - {date}", message),
        "whatsapp": safe_whatsapp(employee, message),
    }


def notify_late(employee, attendance):
    message = (
        f"Attendance alert: Your check-in on {attendance.date} was late by "
        f"{attendance.late_minutes} minute(s)."
    )
    return {
        "email": send_employee_email(employee, f"Late attendance alert - {attendance.date}", message),
        "whatsapp": safe_whatsapp(employee, message),
    }


def safe_whatsapp(employee, message):
    try:
        return send_employee_whatsapp(employee, message)
    except Exception as error:
        return {"sent": False, "reason": str(error)}
