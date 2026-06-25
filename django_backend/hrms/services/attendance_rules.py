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
