<<<<<<< HEAD
from rest_framework import serializers
from .models import Attendance, Employee, Leave, OfficePolicy, SalarySlip, UnknownFaceEvent
from django.contrib.auth.models import User


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = '__all__'


class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.name', read_only=True)
    
    class Meta:
        model = Attendance
        fields = '__all__'


class LeaveSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.name', read_only=True)
    
    class Meta:
        model = Leave
        fields = '__all__'
=======
from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Attendance, Employee, Leave, OfficePolicy, SalarySlip, UnknownFaceEvent

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "role"]


class EmployeeSerializer(serializers.ModelSerializer):
    _id = serializers.IntegerField(source="id", read_only=True)
    user_detail = UserSerializer(source="user", read_only=True)
    role = serializers.CharField(source="designation", required=False, allow_blank=True)
    salary = serializers.DecimalField(source="base_salary", max_digits=12, decimal_places=2, required=False)
    photo = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Employee
        fields = [
            "id",
            "_id",
            "user",
            "user_detail",
            "employee_code",
            "name",
            "email",
            "phone",
            "department",
            "designation",
            "role",
            "base_salary",
            "salary",
            "photo",
            "face_encoding",
            "is_active",
        ]
        extra_kwargs = {
            "employee_code": {"required": False},
            "face_encoding": {"write_only": True, "required": False},
        }

    def create(self, validated_data):
        if not validated_data.get("employee_code"):
            validated_data["employee_code"] = f"EMP{Employee.objects.count() + 1:04d}"
        photo = validated_data.get("photo")
        if isinstance(photo, str) and photo.startswith("data:image"):
            validated_data["photo"] = ""
        return super().create(validated_data)

    def update(self, instance, validated_data):
        photo = validated_data.get("photo")
        if isinstance(photo, str) and photo.startswith("data:image"):
            validated_data.pop("photo", None)
        return super().update(instance, validated_data)
>>>>>>> 38eaefb (Production ready: Django backend configured for Render deployment, frontend deployed to Vercel)


class OfficePolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = OfficePolicy
<<<<<<< HEAD
        fields = '__all__'


class SalarySlipSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.name', read_only=True)
    
    class Meta:
        model = SalarySlip
        fields = '__all__'
=======
        fields = "__all__"


class AttendanceSerializer(serializers.ModelSerializer):
    _id = serializers.IntegerField(source="id", read_only=True)
    employeeId = serializers.IntegerField(source="employee_id", read_only=True)
    employee_name = serializers.CharField(source="employee.name", read_only=True)
    employee_code = serializers.CharField(source="employee.employee_code", read_only=True)
    name = serializers.CharField(source="employee.name", read_only=True)
    email = serializers.EmailField(source="employee.email", read_only=True)
    department = serializers.CharField(source="employee.department", read_only=True)
    role = serializers.CharField(source="employee.designation", read_only=True)
    time = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = "__all__"

    def get_time(self, obj):
        return obj.check_in.strftime("%H:%M:%S") if obj.check_in else ""


class LeaveSerializer(serializers.ModelSerializer):
    _id = serializers.IntegerField(source="id", read_only=True)
    employeeId = serializers.IntegerField(source="employee_id", read_only=True)
    employee_name = serializers.CharField(source="employee.name", read_only=True)
    name = serializers.CharField(source="employee.name", read_only=True)
    email = serializers.EmailField(source="employee.email", read_only=True)
    type = serializers.CharField(source="leave_type", required=False)
    fromDate = serializers.DateField(source="from_date", required=False)
    toDate = serializers.DateField(source="to_date", required=False)
    days = serializers.IntegerField(read_only=True)

    class Meta:
        model = Leave
        fields = "__all__"
        read_only_fields = ["reviewed_by"]


class SalarySlipSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.name", read_only=True)

    class Meta:
        model = SalarySlip
        fields = "__all__"
>>>>>>> 38eaefb (Production ready: Django backend configured for Render deployment, frontend deployed to Vercel)


class UnknownFaceEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnknownFaceEvent
<<<<<<< HEAD
        fields = '__all__'


class FaceScanSerializer(serializers.Serializer):
    photo = serializers.ImageField()
    employee_id = serializers.IntegerField(required=False)
=======
        fields = "__all__"


class FaceScanSerializer(serializers.Serializer):
    image_base64 = serializers.CharField()
    camera_name = serializers.CharField(required=False, default="Office Camera")
>>>>>>> 38eaefb (Production ready: Django backend configured for Render deployment, frontend deployed to Vercel)
