from ..models import Attendance
from django.db.models import Count, Q
from datetime import datetime


def monthly_attendance_summary(employee_id, month):
    """
    Generate monthly attendance summary for an employee.
    month format: YYYY-MM
    """
    try:
        year, month_num = map(int, month.split('-'))
        attendances = Attendance.objects.filter(
            employee_id=employee_id,
            date__year=year,
            date__month=month_num
        )
        
        summary = {
            'present': attendances.filter(status='PRESENT').count(),
            'absent': attendances.filter(status='ABSENT').count(),
            'late': attendances.filter(status='LATE').count(),
            'half_day': attendances.filter(status='HALF_DAY').count(),
            'total_days': attendances.count()
        }
        return summary
    except Exception as e:
        return {'error': str(e)}
