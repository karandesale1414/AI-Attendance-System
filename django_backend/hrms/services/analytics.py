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
