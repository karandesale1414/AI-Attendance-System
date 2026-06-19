from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AnalyticsAPIView,
    AttendanceViewSet,
    CameraMonitoringAPIView,
    DashboardAPIView,
    EmployeeViewSet,
    ESSAPIView,
    FaceAttendanceAPIView,
    LeaveViewSet,
    LoginAPIView,
    MonthlyReportAPIView,
    OfficePolicyViewSet,
    PayrollCompatAPIView,
    RegisterAPIView,
    SalarySlipViewSet,
)

router = DefaultRouter(trailing_slash=False)
router.register("employees", EmployeeViewSet)
router.register("office-policy", OfficePolicyViewSet)
router.register("attendance", AttendanceViewSet)
router.register("leaves", LeaveViewSet)
router.register("payroll", SalarySlipViewSet)

urlpatterns = [
    path("login", LoginAPIView.as_view(), name="compat-login"),
    path("register", RegisterAPIView.as_view(), name="compat-register"),
    path("dashboard", DashboardAPIView.as_view(), name="compat-dashboard"),
    path("reports/monthly", MonthlyReportAPIView.as_view(), name="compat-monthly-report"),
    path("payroll/employee/<int:employee_id>", PayrollCompatAPIView.as_view(), name="compat-payroll"),
    path("payroll/employee/<int:employee_id>/export/pdf", PayrollCompatAPIView.as_view(), name="compat-payroll-pdf"),
    path("", include(router.urls)),
    path("face/attendance/", FaceAttendanceAPIView.as_view(), name="face-attendance"),
    path("camera/monitoring/", CameraMonitoringAPIView.as_view(), name="camera-monitoring"),
    path("ess/me/", ESSAPIView.as_view(), name="ess-me"),
    path("analytics/monthly/", AnalyticsAPIView.as_view(), name="analytics-monthly"),
]
