<<<<<<< HEAD
from ..models import Attendance, Employee
from django.utils import timezone
from datetime import datetime, time


def mark_face_attendance(employee_id, photo=None, location=None):
    """
    Mark attendance for an employee using face recognition.
    """
    try:
        employee = Employee.objects.get(id=employee_id)
        today = timezone.now().date()
        
        # Check if attendance already exists for today
        attendance = Attendance.objects.filter(employee=employee, date=today).first()
        
        if attendance:
            # Update check-out if check-in exists
            if attendance.check_in and not attendance.check_out:
                attendance.check_out = timezone.now()
                attendance.save()
                return {'status': 'checked_out', 'attendance_id': attendance.id}
            else:
                return {'status': 'already_present', 'attendance_id': attendance.id}
        else:
            # Create new attendance record
            current_time = timezone.now().time()
            attendance = Attendance.objects.create(
                employee=employee,
                date=today,
                check_in=timezone.now(),
                status='PRESENT',
                photo=photo,
                location=location
            )
            return {'status': 'checked_in', 'attendance_id': attendance.id}
    except Employee.DoesNotExist:
        return {'error': 'Employee not found'}
    except Exception as e:
        return {'error': str(e)}


def update_checkout(attendance_id):
    """
    Update check-out time for an attendance record.
    """
    try:
        attendance = Attendance.objects.get(id=attendance_id)
        if attendance.check_in and not attendance.check_out:
            attendance.check_out = timezone.now()
            attendance.save()
            return {'status': 'success'}
        else:
            return {'error': 'Invalid attendance record'}
    except Attendance.DoesNotExist:
        return {'error': 'Attendance not found'}
    except Exception as e:
        return {'error': str(e)}
=======
from datetime import datetime

from django.utils import timezone

from hrms.models import Attendance, OfficePolicy
from hrms.services.alerts import notify_late


def get_default_policy():
    return OfficePolicy.objects.filter(is_default=True).first() or OfficePolicy.objects.create()


def minutes_between(start, end):
    return max(int((end - start).total_seconds() // 60), 0)


def combine_local(date_value, time_value):
    naive = datetime.combine(date_value, time_value)
    return timezone.make_aware(naive, timezone.get_current_timezone())


def calculate_attendance(check_in, check_out=None, policy=None):
    policy = policy or get_default_policy()
    office_start = combine_local(check_in.date(), policy.office_start)
    late_minutes = max(minutes_between(office_start, check_in) - policy.late_after_minutes, 0)
    work_minutes = minutes_between(check_in, check_out) if check_out else 0
    overtime_minutes = max(work_minutes - policy.overtime_after_minutes, 0)

    if late_minutes >= policy.half_day_after_minutes:
        status = Attendance.Status.HALF_DAY
    elif work_minutes and work_minutes < policy.min_half_day_work_minutes:
        status = Attendance.Status.HALF_DAY
    elif late_minutes > 0:
        status = Attendance.Status.LATE
    else:
        status = Attendance.Status.PRESENT

    return {
        "status": status,
        "late_minutes": late_minutes,
        "work_minutes": work_minutes,
        "overtime_minutes": overtime_minutes,
    }


def mark_face_attendance(employee, source=Attendance.Source.FACE, when=None):
    when = when or timezone.now()
    policy = get_default_policy()
    values = calculate_attendance(when, policy=policy)
    attendance, created = Attendance.objects.get_or_create(
        employee=employee,
        date=timezone.localdate(when),
        defaults={"check_in": when, "source": source, **values},
    )
    if created and attendance.status == Attendance.Status.LATE:
        notify_late(employee, attendance)
    return attendance, created


def update_checkout(attendance, check_out=None):
    check_out = check_out or timezone.now()
    values = calculate_attendance(attendance.check_in, check_out)
    for key, value in values.items():
        setattr(attendance, key, value)
    attendance.check_out = check_out
    attendance.save(update_fields=["check_out", "status", "late_minutes", "work_minutes", "overtime_minutes", "updated_at"])
    return attendance
>>>>>>> 38eaefb (Production ready: Django backend configured for Render deployment, frontend deployed to Vercel)
