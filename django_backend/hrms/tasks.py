<<<<<<< HEAD
from celery import shared_task
from .models import SalarySlip, Employee
from django.utils import timezone
from datetime import datetime
from decimal import Decimal


@shared_task
def generate_salary_for_month(month):
    """
    Generate salary slips for all employees for a given month.
    month format: YYYY-MM
    """
    try:
        year, month_num = map(int, month.split('-'))
        employees = Employee.objects.filter(is_active=True)
        
        for employee in employees:
            # Calculate salary based on attendance (simplified logic)
            basic_salary = employee.salary
            net_salary = basic_salary  # Can be adjusted based on attendance
            
            SalarySlip.objects.create(
                employee=employee,
                month=month,
                basic_salary=basic_salary,
                allowances=Decimal('0'),
                deductions=Decimal('0'),
                net_salary=net_salary,
                present_days=22,  # Placeholder
                absent_days=0,    # Placeholder
                late_days=0       # Placeholder
            )
        
        return {'status': 'success', 'month': month, 'employees_count': employees.count()}
    except Exception as e:
        return {'status': 'error', 'message': str(e)}
=======
from calendar import monthrange
from decimal import Decimal

from celery import shared_task
from django.core.mail import send_mail
from django.utils import timezone

from .models import Attendance, Employee, Leave, SalarySlip
from .services.alerts import notify_absent
from .services.reports import payslip_pdf
>>>>>>> 38eaefb (Production ready: Django backend configured for Render deployment, frontend deployed to Vercel)


@shared_task
def daily_absent_calculation():
<<<<<<< HEAD
    """
    Mark absent employees who didn't check in today.
    """
    from .models import Attendance, Employee
    from django.utils import timezone
    
    today = timezone.now().date()
    employees = Employee.objects.filter(is_active=True)
    
    for employee in employees:
        attendance = Attendance.objects.filter(employee=employee, date=today).first()
        if not attendance:
            Attendance.objects.create(
                employee=employee,
                date=today,
                status='ABSENT'
            )
    
    return {'status': 'success', 'date': today}
=======
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
>>>>>>> 38eaefb (Production ready: Django backend configured for Render deployment, frontend deployed to Vercel)


@shared_task
def email_pending_leave_reminders():
<<<<<<< HEAD
    """
    Send email reminders for pending leave requests.
    """
    from .models import Leave
    from django.core.mail import send_mail
    
    pending_leaves = Leave.objects.filter(status='PENDING')
    
    for leave in pending_leaves:
        # Send email reminder (placeholder)
        # send_mail(
        #     'Pending Leave Request',
        #     f'You have a pending leave request from {leave.employee.name}',
        #     'noreply@company.com',
        #     ['hr@company.com'],
        #     fail_silently=True,
        # )
        pass
    
    return {'status': 'success', 'pending_count': pending_leaves.count()}
=======
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
>>>>>>> 38eaefb (Production ready: Django backend configured for Render deployment, frontend deployed to Vercel)
