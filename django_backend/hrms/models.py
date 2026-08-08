from datetime import time

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        HR = "HR", "HR"
        EMPLOYEE = "EMPLOYEE", "Employee"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.EMPLOYEE)


class Employee(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="employee_profile", null=True, blank=True)
    employee_code = models.CharField(max_length=30, unique=True)
    name = models.CharField(max_length=120)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    department = models.CharField(max_length=80, blank=True)
    designation = models.CharField(max_length=80, blank=True)
    base_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    photo = models.ImageField(upload_to="employees/", blank=True, null=True)
    face_encoding = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee_code} - {self.name}"


class OfficePolicy(models.Model):
    name = models.CharField(max_length=80, default="Default Policy")
    office_start = models.TimeField(default=time(9, 30))
    office_end = models.TimeField(default=time(18, 30))
    late_after_minutes = models.PositiveIntegerField(default=10)
    half_day_after_minutes = models.PositiveIntegerField(default=240)
    min_half_day_work_minutes = models.PositiveIntegerField(default=240)
    overtime_after_minutes = models.PositiveIntegerField(default=540)
    is_default = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Attendance(models.Model):
    class Status(models.TextChoices):
        PRESENT = "PRESENT", "Present"
        LATE = "LATE", "Late"
        HALF_DAY = "HALF_DAY", "Half Day"
        ABSENT = "ABSENT", "Absent"

    class Source(models.TextChoices):
        FACE = "FACE", "Face"
        MANUAL = "MANUAL", "Manual"
        ESS = "ESS", "Employee Self Service"

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="attendance")
    date = models.DateField(default=timezone.localdate)
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PRESENT)
    source = models.CharField(max_length=20, choices=Source.choices, default=Source.FACE)
    late_minutes = models.PositiveIntegerField(default=0)
    work_minutes = models.PositiveIntegerField(default=0)
    overtime_minutes = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("employee", "date")
        ordering = ["-date", "-check_in"]


class Leave(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="leaves")
    leave_type = models.CharField(max_length=40, default="Casual")
    from_date = models.DateField()
    to_date = models.DateField()
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def days(self):
        return (self.to_date - self.from_date).days + 1


class SalarySlip(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="salary_slips")
    month = models.CharField(max_length=7)
    paid_days = models.PositiveIntegerField(default=0)
    absent_days = models.PositiveIntegerField(default=0)
    overtime_minutes = models.PositiveIntegerField(default=0)
    gross_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    pdf_file = models.FileField(upload_to="payslips/", blank=True, null=True)
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("employee", "month")


class UnknownFaceEvent(models.Model):
    image = models.ImageField(upload_to="unknown_faces/", blank=True, null=True)
    camera_name = models.CharField(max_length=80, default="Office Camera")
    detected_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
