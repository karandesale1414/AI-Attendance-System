<<<<<<< HEAD
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
=======
import pandas as pd
from sklearn.linear_model import LinearRegression


def monthly_attendance_summary(attendance_queryset):
    rows = list(attendance_queryset.values("employee__name", "status", "late_minutes", "overtime_minutes"))
    if not rows:
        return {"rows": [], "performance_score": 0, "prediction": "No data"}

    frame = pd.DataFrame(rows)
    status_counts = frame.groupby(["employee__name", "status"]).size().reset_index(name="count")
    score = max(100 - int(frame["late_minutes"].mean() or 0), 0)
    return {
        "rows": status_counts.to_dict("records"),
        "performance_score": score,
        "prediction": predict_next_month_presence(frame),
    }


def predict_next_month_presence(frame):
    daily = frame.reset_index().groupby("index").size().reset_index(name="present")
    if len(daily) < 2:
        return "Need more data"
    model = LinearRegression()
    model.fit(daily[["index"]], daily["present"])
    next_value = model.predict([[len(daily) + 1]])[0]
    return round(float(next_value), 2)
>>>>>>> 38eaefb (Production ready: Django backend configured for Render deployment, frontend deployed to Vercel)
