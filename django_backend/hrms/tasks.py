from calendar import monthrange
from decimal import Decimal

from celery import shared_task
from django.core.mail import send_mail
from django.utils import timezone

from .models import Attendance, Employee, Leave, SalarySlip
from .services.alerts import notify_absent
from .services.reports import payslip_pdf


@shared_task
def daily_absent_calculation():
    today = timezone.localdate()
    present_ids = Attendance.objects.filter(date=today).values_list("employee_id", flat=True)
    for employee in Employee.objects.filter(is_active=True).exclude(id__in=present_ids):
        _, created = Attendance.objects.get_or_create(employee=employee, date=today, defaults={"status": Attendance.Status.ABSENT})
        if created:
            notify_absent(employee, today)
    return True


@shared_task
def generate_salary_for_month(month=None):
    month = month or timezone.localdate().strftime("%Y-%m")
    year, month_number = [int(value) for value in month.split("-")]
    total_days = monthrange(year, month_number)[1]
    for employee in Employee.objects.filter(is_active=True):
        records = Attendance.objects.filter(employee=employee, date__startswith=month)
        absent_days = records.filter(status=Attendance.Status.ABSENT).count()
        paid_days = max(total_days - absent_days, 0)
        gross = Decimal(employee.base_salary)
        deductions = gross * Decimal(absent_days) / Decimal(total_days)
        slip, _ = SalarySlip.objects.update_or_create(
            employee=employee,
            month=month,
            defaults={
                "paid_days": paid_days,
                "absent_days": absent_days,
                "overtime_minutes": sum(item.overtime_minutes for item in records),
                "gross_salary": gross,
                "deductions": deductions,
                "net_salary": gross - deductions,
            },
        )
        slip.pdf_file.save(slip.pdf_file.name or f"payslip-{employee.employee_code}-{month}.pdf", payslip_pdf(slip), save=True)
    return True


@shared_task
def email_pending_leave_reminders():
    pending = Leave.objects.filter(status=Leave.Status.PENDING).select_related("employee")
    if not pending.exists():
        return 0
    send_mail(
        "Pending leave approvals",
        f"{pending.count()} leave request(s) pending approval.",
        None,
        [employee.email for employee in Employee.objects.filter(user__role__in=["ADMIN", "HR"]).exclude(email="")],
        fail_silently=True,
    )
    return pending.count()
