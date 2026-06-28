from django.http import FileResponse, HttpResponse
from django.contrib.auth import authenticate, get_user_model
from django.utils import timezone
from calendar import monthrange
from decimal import Decimal
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Attendance, Employee, Leave, OfficePolicy, SalarySlip, UnknownFaceEvent
from .permissions import IsAdminOrHR
from .serializers import (
    AttendanceSerializer,
    EmployeeSerializer,
    FaceScanSerializer,
    LeaveSerializer,
    OfficePolicySerializer,
    SalarySlipSerializer,
    UnknownFaceEventSerializer,
)
from .services.analytics import monthly_attendance_summary
from .services.attendance_rules import mark_face_attendance, update_checkout
from .services.face_recognition_service import detect_unknown_face, register_employee_face
from .services.reports import attendance_excel
from .tasks import generate_salary_for_month

User = get_user_model()


class LoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username") or request.data.get("email")
        password = request.data.get("password")
        
        if not username or not password:
            return Response({"message": "Username and password are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(username=username, password=password)
        if not user:
            return Response({"message": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
<<<<<<< HEAD
=======
        
        if user.is_superuser and user.role != User.Role.ADMIN:
            user.role = User.Role.ADMIN
            user.save(update_fields=["role"])
>>>>>>> 38eaefb (Production ready: Django backend configured for Render deployment, frontend deployed to Vercel)

        refresh = RefreshToken.for_user(user)
        return Response({
            "success": True,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "admin": {
                "_id": user.id,
                "name": user.get_full_name() or user.username,
                "email": user.email,
<<<<<<< HEAD
                "role": "ADMIN" if user.is_superuser else "HR",
=======
                "role": user.role,
>>>>>>> 38eaefb (Production ready: Django backend configured for Render deployment, frontend deployed to Vercel)
            },
        })


class RegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        name = request.data.get("name", "").strip()
        email = request.data.get("email", "").strip()
        password = request.data.get("password", "")
<<<<<<< HEAD
=======
        role = request.data.get("role", "HR").upper().replace(" ", "_")
>>>>>>> 38eaefb (Production ready: Django backend configured for Render deployment, frontend deployed to Vercel)
        if not name or not email or not password:
            return Response({"message": "Fill all fields"}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=email).exists() or User.objects.filter(email=email).exists():
            return Response({"message": "Admin already exists"}, status=status.HTTP_400_BAD_REQUEST)
<<<<<<< HEAD
        user = User.objects.create_user(username=email, email=email, password=password, first_name=name, is_staff=True)
        return Response({"success": True, "admin": {"_id": user.id, "name": name, "email": email, "role": "ADMIN" if user.is_superuser else "HR"}})
=======
        mapped_role = User.Role.ADMIN if "ADMIN" in role else User.Role.HR
        user = User.objects.create_user(username=email, email=email, password=password, first_name=name, role=mapped_role)
        return Response({"success": True, "admin": {"_id": user.id, "name": name, "email": email, "role": user.role}})
>>>>>>> 38eaefb (Production ready: Django backend configured for Render deployment, frontend deployed to Vercel)


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.select_related("user").all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAdminOrHR]

    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def register_face(self, request, pk=None):
        employee = self.get_object()
        image_base64 = request.data.get("image_base64")
        if not image_base64:
            return Response({"detail": "image_base64 required"}, status=status.HTTP_400_BAD_REQUEST)
        register_employee_face(employee, image_base64)
        return Response({"detail": "Face registered"})

    @action(detail=True, methods=["get"])
    def profile(self, request, pk=None):
        employee = self.get_object()
        return Response({
            "success": True,
            "data": {
                "employee": EmployeeSerializer(employee).data,
                "attendance": AttendanceSerializer(Attendance.objects.filter(employee=employee)[:20], many=True).data,
                "leaves": LeaveSerializer(Leave.objects.filter(employee=employee)[:20], many=True).data,
            },
        })


class OfficePolicyViewSet(viewsets.ModelViewSet):
    queryset = OfficePolicy.objects.all()
    serializer_class = OfficePolicySerializer
    permission_classes = [IsAdminOrHR]


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related("employee").all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAdminOrHR]

    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response({"success": True, "data": serializer.data})

    def create(self, request, *args, **kwargs):
        employee_id = request.data.get("employeeId") or request.data.get("employee")
        employee = Employee.objects.filter(id=employee_id).first() or Employee.objects.filter(employee_code=employee_id).first()
        if not employee:
            return Response({"message": "Employee missing"}, status=status.HTTP_400_BAD_REQUEST)
        attendance, created = Attendance.objects.get_or_create(
            employee=employee,
            date=request.data.get("date") or timezone.localdate(),
            defaults={
                "check_in": timezone.now(),
                "status": request.data.get("status", Attendance.Status.PRESENT).upper().replace(" ", "_"),
                "source": request.data.get("source", Attendance.Source.MANUAL).upper(),
            },
        )
        if not created:
            return Response({"message": "Attendance already marked today"}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"success": True, "data": AttendanceSerializer(attendance).data, "email": {"sent": False}})

    def get_queryset(self):
        queryset = super().get_queryset()
        date = self.request.query_params.get("date")
        employee_id = self.request.query_params.get("employee")
        if date:
            queryset = queryset.filter(date=date)
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        return queryset

    @action(detail=True, methods=["post"])
    def checkout(self, request, pk=None):
        attendance = update_checkout(self.get_object())
        return Response(AttendanceSerializer(attendance).data)

    @action(detail=False, methods=["get"])
    def export_excel(self, request):
        stream = attendance_excel(self.get_queryset())
        response = HttpResponse(
            stream.read(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = "attachment; filename=attendance.xlsx"
        return response


class LeaveViewSet(viewsets.ModelViewSet):
    queryset = Leave.objects.select_related("employee").all()
    serializer_class = LeaveSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response({"success": True, "data": serializer.data})

    def get_queryset(self):
<<<<<<< HEAD
        if self.request.user.is_superuser or self.request.user.is_staff:
=======
        if self.request.user.is_superuser or self.request.user.is_staff or self.request.user.role in {"ADMIN", "HR"}:
>>>>>>> 38eaefb (Production ready: Django backend configured for Render deployment, frontend deployed to Vercel)
            return self.queryset
        return self.queryset.filter(employee__user=self.request.user)

    def perform_create(self, serializer):
        employee = serializer.validated_data.get("employee")
<<<<<<< HEAD
=======
        if self.request.user.role == "EMPLOYEE":
            employee = self.request.user.employee_profile
>>>>>>> 38eaefb (Production ready: Django backend configured for Render deployment, frontend deployed to Vercel)
        serializer.save(employee=employee)

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        if "employeeId" in data:
            data["employee"] = data["employeeId"]
        if "type" in data:
            data["leave_type"] = data["type"]
        if "fromDate" in data:
            data["from_date"] = data["fromDate"]
        if "toDate" in data:
            data["to_date"] = data["toDate"]
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({"success": True, "data": serializer.data}, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        data = request.data.copy()
        if data.get("status") in {"Approved", "Rejected", "Pending"}:
            data["status"] = data["status"].upper()
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"success": True, "data": serializer.data})

    @action(detail=True, methods=["post"], permission_classes=[IsAdminOrHR])
    def approve(self, request, pk=None):
        leave = self.get_object()
        leave.status = Leave.Status.APPROVED
        leave.reviewed_by = request.user
        leave.save(update_fields=["status", "reviewed_by"])
        return Response(LeaveSerializer(leave).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAdminOrHR])
    def reject(self, request, pk=None):
        leave = self.get_object()
        leave.status = Leave.Status.REJECTED
        leave.reviewed_by = request.user
        leave.save(update_fields=["status", "reviewed_by"])
        return Response(LeaveSerializer(leave).data)


class SalarySlipViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SalarySlip.objects.select_related("employee").all()
    serializer_class = SalarySlipSerializer

    def get_queryset(self):
<<<<<<< HEAD
        if self.request.user.is_superuser or self.request.user.is_staff:
=======
        if self.request.user.is_superuser or self.request.user.is_staff or self.request.user.role in {"ADMIN", "HR"}:
>>>>>>> 38eaefb (Production ready: Django backend configured for Render deployment, frontend deployed to Vercel)
            return self.queryset
        return self.queryset.filter(employee__user=self.request.user)

    @action(detail=False, methods=["post"], permission_classes=[IsAdminOrHR])
    def generate(self, request):
        month = request.data.get("month") or timezone.localdate().strftime("%Y-%m")
        generate_salary_for_month.delay(month)
        return Response({"detail": "Salary generation queued", "month": month})

    @action(detail=True, methods=["get"])
    def download(self, request, pk=None):
        slip = self.get_object()
        if not slip.pdf_file:
            return Response({"detail": "Payslip PDF not generated yet"}, status=status.HTTP_404_NOT_FOUND)
        return FileResponse(slip.pdf_file.open("rb"), as_attachment=True, filename=slip.pdf_file.name.split("/")[-1])


class FaceAttendanceAPIView(APIView):
    permission_classes = [IsAdminOrHR]

    def post(self, request):
        serializer = FaceScanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result, distance = detect_unknown_face(
            serializer.validated_data["image_base64"],
            serializer.validated_data["camera_name"],
        )
        if isinstance(result, Employee):
            attendance, created = mark_face_attendance(result)
            return Response({
                "matched": True,
                "created": created,
                "distance": distance,
                "employee": EmployeeSerializer(result).data,
                "attendance": AttendanceSerializer(attendance).data,
            })
        if isinstance(result, UnknownFaceEvent):
            return Response({
                "matched": False,
                "unknown": UnknownFaceEventSerializer(result).data,
                "distance": distance,
            }, status=status.HTTP_202_ACCEPTED)
        return Response({"matched": False, "detail": "No face detected"}, status=status.HTTP_400_BAD_REQUEST)


class CameraMonitoringAPIView(APIView):
    permission_classes = [IsAdminOrHR]

    def get(self, request):
        today = timezone.localdate()
        return Response({
            "present_count": Attendance.objects.filter(date=today).exclude(status=Attendance.Status.ABSENT).count(),
            "unknown_count": UnknownFaceEvent.objects.filter(detected_at__date=today).count(),
            "last_unknown": UnknownFaceEventSerializer(UnknownFaceEvent.objects.order_by("-detected_at").first()).data
            if UnknownFaceEvent.objects.exists()
            else None,
        })


class ESSAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        employee = request.user.employee_profile
        month = request.query_params.get("month") or timezone.localdate().strftime("%Y-%m")
        return Response({
            "profile": EmployeeSerializer(employee).data,
            "attendance": AttendanceSerializer(Attendance.objects.filter(employee=employee, date__startswith=month), many=True).data,
            "leaves": LeaveSerializer(Leave.objects.filter(employee=employee), many=True).data,
            "payslips": SalarySlipSerializer(SalarySlip.objects.filter(employee=employee), many=True).data,
        })

    def patch(self, request):
        employee = request.user.employee_profile
        serializer = EmployeeSerializer(employee, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class AnalyticsAPIView(APIView):
    permission_classes = [IsAdminOrHR]

    def get(self, request):
        month = request.query_params.get("month") or timezone.localdate().strftime("%Y-%m")
        return Response(monthly_attendance_summary(Attendance.objects.filter(date__startswith=month)))


class PayrollCompatAPIView(APIView):
    permission_classes = [IsAdminOrHR]

    def get(self, request, employee_id):
        month = request.query_params.get("month") or timezone.localdate().strftime("%Y-%m")
        employee = Employee.objects.get(id=employee_id)
        year, month_number = [int(value) for value in month.split("-")]
        total_days = monthrange(year, month_number)[1]
        records = Attendance.objects.filter(employee=employee, date__startswith=month)
        present = records.filter(status=Attendance.Status.PRESENT).count()
        late = records.filter(status=Attendance.Status.LATE).count()
        absent = records.filter(status=Attendance.Status.ABSENT).count()
        paid_days = max(present + late, 0)
        base = Decimal(employee.base_salary or 0)
        deduction = base * Decimal(absent) / Decimal(total_days)
        payroll = {
            "month": month,
            "monthDays": total_days,
            "paidDays": paid_days,
            "baseSalary": float(base),
            "deduction": float(deduction),
            "netSalary": float(base - deduction),
        }
        return Response({"success": True, "data": {"employee": EmployeeSerializer(employee).data, "payroll": payroll}})


class DashboardAPIView(APIView):
    permission_classes = [IsAdminOrHR]

    def get(self, request):
        date = request.query_params.get("date") or timezone.localdate()
        total = Employee.objects.filter(is_active=True).count()
        present = Attendance.objects.filter(date=date, status=Attendance.Status.PRESENT).count()
        late = Attendance.objects.filter(date=date, status=Attendance.Status.LATE).count()
        leaves = Leave.objects.filter(status=Leave.Status.APPROVED, from_date__lte=date, to_date__gte=date).count()
        absent = max(total - present - late - leaves, 0)
        return Response({
            "success": True,
            "data": {
                "totalEmployees": total,
                "present": present,
                "absent": absent,
                "late": late,
                "leaves": leaves,
            },
        })


class MonthlyReportAPIView(APIView):
    permission_classes = [IsAdminOrHR]

    def get(self, request):
        month = request.query_params.get("month") or timezone.localdate().strftime("%Y-%m")
        rows = []
        for employee in Employee.objects.filter(is_active=True).order_by("name"):
            records = Attendance.objects.filter(employee=employee, date__startswith=month)
            rows.append({
                "employeeId": employee.id,
                "name": employee.name,
                "email": employee.email,
                "department": employee.department,
                "role": employee.designation,
                "present": records.filter(status=Attendance.Status.PRESENT).count(),
                "late": records.filter(status=Attendance.Status.LATE).count(),
                "leaveDays": Leave.objects.filter(
                    employee=employee,
                    status=Leave.Status.APPROVED,
                    from_date__startswith=month,
                ).count(),
                "absent": records.filter(status=Attendance.Status.ABSENT).count(),
            })
        return Response({"success": True, "month": month, "data": rows})
