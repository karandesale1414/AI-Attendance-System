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


class OfficePolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = OfficePolicy
        fields = '__all__'


class SalarySlipSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.name', read_only=True)
    
    class Meta:
        model = SalarySlip
        fields = '__all__'


class UnknownFaceEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnknownFaceEvent
        fields = '__all__'


class FaceScanSerializer(serializers.Serializer):
    photo = serializers.ImageField()
    employee_id = serializers.IntegerField(required=False)
