from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Attendance, Employee, Leave, OfficePolicy, SalarySlip, UnknownFaceEvent, User

admin.site.register(User, UserAdmin)
admin.site.register(Employee)
admin.site.register(OfficePolicy)
admin.site.register(Attendance)
admin.site.register(Leave)
admin.site.register(SalarySlip)
admin.site.register(UnknownFaceEvent)
