from datetime import date, time, timedelta

import pytest
from django.utils import timezone

from hrms.models import Attendance, OfficePolicy
from hrms.services.attendance_rules import calculate_attendance, combine_local


@pytest.mark.django_db
def test_late_after_configured_minutes():
    policy = OfficePolicy.objects.create(office_start=time(9, 30), late_after_minutes=10)
    check_in = combine_local(date(2026, 6, 18), time(9, 45))

    result = calculate_attendance(check_in, policy=policy)

    assert result["status"] == Attendance.Status.LATE
    assert result["late_minutes"] == 5


@pytest.mark.django_db
def test_half_day_when_work_minutes_are_low():
    policy = OfficePolicy.objects.create(min_half_day_work_minutes=240)
    check_in = timezone.now()
    check_out = check_in + timedelta(hours=3)

    result = calculate_attendance(check_in, check_out, policy=policy)

    assert result["status"] == Attendance.Status.HALF_DAY


@pytest.mark.django_db
def test_overtime_after_configured_minutes():
    policy = OfficePolicy.objects.create(overtime_after_minutes=540)
    check_in = timezone.now()
    check_out = check_in + timedelta(hours=10)

    result = calculate_attendance(check_in, check_out, policy=policy)

    assert result["overtime_minutes"] == 60
