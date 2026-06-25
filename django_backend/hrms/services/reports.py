from ..models import Attendance, Employee
from django.http import HttpResponse
from openpyxl import Workbook
from datetime import datetime
import io


def attendance_excel(employee_id, month):
    """
    Generate Excel report for employee attendance.
    month format: YYYY-MM
    """
    try:
        employee = Employee.objects.get(id=employee_id)
        year, month_num = map(int, month.split('-'))
        
        attendances = Attendance.objects.filter(
            employee=employee,
            date__year=year,
            date__month=month_num
        ).order_by('date')
        
        wb = Workbook()
        ws = wb.active
        ws.title = "Attendance Report"
        
        # Headers
        ws['A1'] = 'Date'
        ws['B1'] = 'Check In'
        ws['C1'] = 'Check Out'
        ws['D1'] = 'Status'
        ws['E1'] = 'Location'
        
        # Data
        row = 2
        for attendance in attendances:
            ws[f'A{row}'] = attendance.date
            ws[f'B{row}'] = attendance.check_in.strftime('%H:%M:%S') if attendance.check_in else ''
            ws[f'C{row}'] = attendance.check_out.strftime('%H:%M:%S') if attendance.check_out else ''
            ws[f'D{row}'] = attendance.status
            ws[f'E{row}'] = attendance.location
            row += 1
        
        # Save to memory
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        
        response = HttpResponse(
            output,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename=attendance_{employee.name}_{month}.xlsx'
        return response
        
    except Employee.DoesNotExist:
        return None
    except Exception as e:
        return None
