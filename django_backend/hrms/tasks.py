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


@shared_task
def daily_absent_calculation():
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


@shared_task
def email_pending_leave_reminders():
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
